/*
 * Copyright (c) 2021 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Failure, fail } from '../result';
import { Validator, ValidatorOptions } from './validator';
import { ValidatorBase, ValidatorBaseConstructorParams } from './validatorBase';

import { FieldValidator } from './field';

/**
 * Per-property {@link Validation.Validator | validators} for each of the properties in `<T>`.
 * @public
 */
export type FieldValidators<T, TC=unknown> = { [key in keyof T]: Validator<T[key], TC> };

/**
 * Options for an {@link Validation.Classes.ObjectValidator | ObjectValidator}.
 * @public
 */
export interface ObjectValidatorOptions<T, TC> extends ValidatorOptions<TC> {
    /**
     * If present, lists optional fields. Missing non-optional fields cause an error.
     */
    optionalFields?: (keyof T)[];
    /**
     * If true, unrecognized fields yield an error.  If false or undefined (default),
     * unrecognized fields are ignored.
     */
    strict?: boolean;
}

/**
 * Options for the {@link Validation.Classes.ObjectValidator | ObjectValidator} constructor.
 * @public
 */
export interface ObjectValidatorConstructorParams<T, TC> extends ValidatorBaseConstructorParams<T, TC> {
    /**
     * A {@link Validation.Classes.FieldValidators | FieldValidators} object specifying a
     * {@link Validation.Validator | Validator} for each of the expected properties
     * of a result object.
     */
    fields: FieldValidators<T>,
    /**
     * Optional additional {@link Validation.Classes.ObjectValidatorOptions | ValidatorOptions} to
     * configure validation.
     */
    options?: ObjectValidatorOptions<T, TC>;
}

/**
 * In-place {@link Validation.Validator | Validator} for an object of type `<T>`.
 * @remarks
 * By default, succeeds if all of the required fields exist and are validate, and fails if
 * any required fields do not exist or are invalid.  See {@link Validation.Classes.ObjectValidatorOptions}
 * for other validation options.
 * @public
 */
export class ObjectValidator<T, TC=unknown> extends ValidatorBase<T, TC> {
    /**
     * A {@link Validation.Classes.FieldValidators | FieldValidators} object specifying a
     * {@link Validation.Validator | Validator} for each of the expected properties
     */
    public readonly fields: FieldValidators<T>;
    /**
     * {@link Validation.Classes.ObjectValidatorOptions | Options} which apply to this
     * validator.
     */
    public readonly options: ObjectValidatorOptions<T, TC>;
    /**
     * @internal
     */
    protected readonly _innerValidators: FieldValidators<T>;
    /**
     * @internal
     */
    protected readonly _allowedFields?: Set<keyof T>;

    /**
     * Constructs a new {@link Validation.Classes.ObjectValidator | ObjectValidator<T>}.
     * @param fields - A {@link Validation.Classes.FieldValidators | FieldValidators<T>} containing
     * a {@link Validation.Validator | Validator} for each field.
     * @param options - An optional {@link Validation.Classes.ObjectValidatorOptions} to configure
     * validation.
     */
    public constructor(params: ObjectValidatorConstructorParams<T, TC>) {
        super(params);

        this.fields = params.fields;
        this.options = params.options ?? {};
        this._innerValidators = ObjectValidator._resolveValidators(this.fields, this.options);
        this._allowedFields = (this.options.strict === true)
            ? new Set(Object.keys(this.fields) as (keyof T)[])
            : undefined;
    }

    /**
     * Creates the actual {@link Validation.Classes.FieldValidators | FieldValidators<T>} to be
     * used by this converter by applying any options or traits defined in the options
     * to the field converters passed to the constructor.
     * @param fields - The base {@link Validation.Classes.FieldValidators | FieldValidators<T>} passed
     * in to the constructor.
     * @param options - The {@link Validation.Classes.ObjectValidatorOptions | object validator options}
     * passed in to the constructor.
     * @returns A new {@link Validation.Classes.FieldValidators | FieldValidators} with the fully-configured
     * individual {@link Validation.Validator | field validators} to be applied.
     * @internal
     */
    protected static _resolveValidators<T, TC>(
        fields: FieldValidators<T, TC>,
        options?: ObjectValidatorOptions<T, TC>,
    ): FieldValidators<T, TC> {
        const resolved: Partial<FieldValidators<T, TC>> = {};
        for (const key in fields) {
            if (fields[key]) {
                // istanbul ignore next
                const optional = fields[key].isOptional || options?.optionalFields?.includes(key);
                resolved[key] = new FieldValidator(key, fields[key], { optional });
            }
        }
        return resolved as FieldValidators<T, TC>;
    }

    /**
     * Creates a new {@link Validation.Classes.ObjectValidator | ObjectValidator} derived from this one but with
     * new optional properties as specified by a supplied
     * {@link Validation.Classes.ObjectValidatorOptions | ObjectValidatorOptions<T>}.
     * @param options - The {@link Validation.Classes.ObjectValidatorOptions | options} to be applied to the new
     * {@link Validation.Classes.ObjectValidator | validator}.
     * @returns A new {@link Validation.Classes.ObjectValidator | ObjectValidator} with the additional optional
     * source properties.
     */
    public partial(options?: ObjectValidatorOptions<T, TC>): ObjectValidator<Partial<T>, TC> {
        // istanbul ignore next
        options = options ?? {};
        return new ObjectValidator<Partial<T>, TC>({
            fields: this.fields as FieldValidators<Partial<T>, TC>,
            options: {
                ...this.options,
                ...options,
            },
            traits: this.traits,
        });
    }

    /**
     * Creates a new {@link Validation.Classes.ObjectValidator | ObjectValidator} derived from this one but with
     * new optional properties as specified by a supplied array of `keyof T`.
     * @param addOptionalProperties - The keys to be made optional.
     * @returns A new {@link Validation.Classes.ObjectValidator | ObjectValidator} with the additional optional
     * source properties.
     */
    public addPartial(addOptionalFields: (keyof T)[]): ObjectValidator<Partial<T>, TC> {
        return this.partial({
            optionalFields: [...(this.options.optionalFields ?? []), ...addOptionalFields],
        });
    }

    /**
     * {@inheritdoc Validation.ValidatorBase._validate}
     * @internal
     */
    protected _validate(from: unknown, context?: TC): boolean | Failure<T> {
        if ((typeof from !== 'object') || (from === null) || Array.isArray(from)) {
            return fail('source is not an object');
        }

        // eslint bug thinks key is used before defined
        // eslint-disable-next-line no-use-before-define
        const converted = {} as { [key in keyof T]: T[key] };
        const errors: string[] = [];
        for (const key in this._innerValidators) {
            if (this._innerValidators[key]) {
                const result = this._innerValidators[key].validate(from, context);
                if (result.success && (result.value !== undefined)) {
                    converted[key] = result.value;
                }
                else if (result.isFailure()) {
                    errors.push(result.message);
                }
            }
        }

        if (this._allowedFields) {
            const invalid = Object.keys(from).filter((k) => !this._allowedFields!.has(k as keyof T));
            invalid.forEach((key) => errors.push((`${key}: unexpected field in source object.`)));
        }
        return (errors.length === 0) ? true : fail(errors.join('\n'));
    }
}
