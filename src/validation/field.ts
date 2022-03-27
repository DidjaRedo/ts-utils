
/*
 * Copyright (c) 2020 Erik Fortune
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
import { ValidatorBase } from './validatorBase';
import { isKeyOf } from '../utils';

/**
 * Parameters used to construct a {@link Validation.FieldValidator | FieldValidator}.
 * @public
 */
export interface FieldValidatorOptions<TC> extends ValidatorOptions<TC> {
    optional?: boolean;
}

/**
 * An in-place {@link Validation.Validator | Validator} for properties
 * an an object.
 * @public
 */
export class FieldValidator<T, TC=undefined> extends ValidatorBase<T, TC> {
    /**
     * The name of the property that this validator should validate.
     */
    public readonly fieldName: string;
    /**
     * The {@link Validation.Validator | Validator} to be applied against the named property.
     */
    public readonly fieldValidator: Validator<T, TC>;
    /**
     * @internal
     */
    protected readonly _fieldOptions: FieldValidatorOptions<TC>;

    /**
     * Constructs a new {@link Validation.FieldValidator | FieldValidator.}.
     * @param fieldName - The name of the property that this validator should validate.
     * @param fieldValidator - The {@link Validation.Validator | Validator} to be applied
     * against the named property.
     * @param options - Additional {@link Validation.FieldValidatorOptions | options} to be
     * applied to this validation.
     */
    public constructor(
        fieldName: string,
        fieldValidator: Validator<T, TC>,
        options?: FieldValidatorOptions<TC>,
    ) {
        super({ options });
        this.fieldName = fieldName;
        this.fieldValidator = fieldValidator;
        // istanbul ignore next
        this._fieldOptions = options ?? {};
    }

    /**
     * {@inheritdoc Validation.ValidatorBase._validate}
     */
    protected _validate(from: unknown, context?: TC): boolean | Failure<T> {
        if (typeof from === 'object' && !Array.isArray(from) && from !== null) {
            const optional = this._fieldOptions.optional === true;

            if (isKeyOf(this.fieldName, from)) {
                if ((!optional) || (from[this.fieldName] !== undefined)) {
                    const result = this.fieldValidator.validate(from[this.fieldName], context).onFailure((message: string) => {
                        return fail(`${this.fieldName}: ${message}`);
                    });

                    return result.success ? true : result;
                }
            }

            return optional
                ? true
                : fail(`"${this.fieldName}": Field not found in "${JSON.stringify(from)}`);
        }
        // istanbul ignore next -- defense in depth
        return fail(`Cannot validate field '${this.fieldName}' from non-object "${JSON.stringify(from)}"`);
    }
}
