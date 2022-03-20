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

import { FieldValidators, ObjectValidator, ObjectValidatorConstructorParams } from './object';

import { BooleanValidator } from './boolean';
import { NumberValidator } from './number';
import { StringValidator } from './string';

/**
 * A {@link Validation.StringValidator | StringValidator} which validates a string in place.
 * @public
 */
export const string = new StringValidator();

/**
 * A {@link Validation.NumberValidator | NumberValidator} which validates a number in place.
 * @public
 */
export const number = new NumberValidator();

/**
 * A {@link Validation.BooleanValidator | BooleanValidator} which validates a boolean in place.
 * @public
 */
export const boolean = new BooleanValidator();

/**
 * Helper function to create a {@link Validation.ObjectValidator | ObjectValidator} which validates
 * an object in place.
 * @param fields - A {@link Validation.FieldValidators | field validator definition}
 * describing the validations to be applied.
 * @param params - Optional {@link Validation.ObjectValidatorConstructorParams | parameters}
 * to refine the behavior of the resulting {@link Validation.Validator | validator}.
 * @returns A new {@link Validation.Validator | Validator} which validates the desired
 * object in place.
 * @public
 */
export function object<T, TC>(
    fields: FieldValidators<T, TC>,
    params?: Omit<ObjectValidatorConstructorParams<T, TC>, 'fields'>,
): ObjectValidator<T, TC> {
    return new ObjectValidator({ fields, ...(params ?? {}) });
}
