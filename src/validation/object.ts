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
 * Per-property validators for each of the properties in type T
 */
export type FieldValidators<T, TC=unknown> = { [key in keyof T]: Validator<T[key], TC> };

/**
 * Options for an @see ObjectValidator.
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

export interface ObjectValidatorConstructorParams<T, TC> extends ValidatorBaseConstructorParams<T, TC> {
    fields: FieldValidators<T>,
    options?: ObjectValidatorOptions<T, TC>;
}

/**
 * In-place validation for an object of type T, given a @see FieldValidators<T>.
 * If all of the required fields exist and ar valid, returns a strongly typed reference
 * to the object.  If any required fields do not exist or are invalid, returns @see Failure
 * with an error description.  See @see ObjectValidatorOptions for other validatiorion options.
 */
export class ObjectValidator<T, TC=unknown> extends ValidatorBase<T, TC> {
    public readonly fields: FieldValidators<T>;
    public readonly options: ObjectValidatorOptions<T, TC>;
    protected readonly _innerValidators: FieldValidators<T>;
    protected readonly _allowedFields?: Set<keyof T>;

    /**
     * Constructs a new @see ObjectValidator<T> using options supplied in an
     * optional @see ObjectValidatorOptions<T>.
     * @param fields A @see FieldValidators<T> containing converters for each field
     * @param options An optional @see ObjectValidatorOptions to configure the conversion
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

    public addPartial(addOptionalFields: (keyof T)[]): ObjectValidator<Partial<T>, TC> {
        return this.partial({
            optionalFields: [...(this.options.optionalFields ?? []), ...addOptionalFields],
        });
    }

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
