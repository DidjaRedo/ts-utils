/*
 * Copyright (c) 2023 Erik Fortune
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

import { ArrayValidator, ArrayValidatorConstructorParams } from './array';
import { Failure, fail } from '../result';
import { FieldValidators, ObjectValidator, ObjectValidatorConstructorParams } from './object';
import { TypeGuardValidator, TypeGuardValidatorConstructorParams } from './typeGuard';

import { BooleanValidator } from './boolean';
import { GenericValidator } from './genericValidator';
import { NumberValidator } from './number';
import { StringValidator } from './string';
import { TypeGuardWithContext } from './common';
import { Validator } from './validator';

/**
 * A {@link Validation.Classes.StringValidator | StringValidator} which validates a string in place.
 * @public
 */
export const string = new StringValidator();

/**
 * A {@link Validation.Classes.NumberValidator | NumberValidator} which validates a number in place.
 * @public
 */
export const number = new NumberValidator();

/**
 * A {@link Validation.Classes.BooleanValidator | BooleanValidator} which validates a boolean in place.
 * @public
 */
export const boolean = new BooleanValidator();

/**
 * Helper function to create a {@link Validation.Classes.ObjectValidator | ObjectValidator} which validates
 * an object in place.
 * @param fields - A {@link Validation.Classes.FieldValidators | field validator definition}
 * describing the validations to be applied.
 * @param params - Optional {@link Validation.Classes.ObjectValidatorConstructorParams | parameters}
 * to refine the behavior of the resulting {@link Validation.Validator | validator}.
 * @returns A new {@link Validation.Validator | Validator} which validates the desired
 * object in place.
 * @public
 */
export function object<T, TC = unknown>(
    fields: FieldValidators<T, TC>,
    params?: Omit<ObjectValidatorConstructorParams<T, TC>, 'fields'>,
): ObjectValidator<T, TC> {
    return new ObjectValidator({ fields, ...(params ?? {}) });
}

/**
 * Helper function to create a {@link Validation.Classes.ArrayValidator | ArrayValidator} which
 * validates an array in place.
 * @param validateElement - A {@link Validation.Validator | validator} which validates each element.
 * @returns A new {@link Validation.Classes.ArrayValidator | ArrayValidator } which validates the desired
 * array in place.
 * @public
 */
export function arrayOf<T, TC>(
    validateElement: Validator<T, TC>,
    params?: Omit<ArrayValidatorConstructorParams<T, TC>, 'validateElement'>
): ArrayValidator<T, TC> {
    return new ArrayValidator({ validateElement, ...(params ?? {}) });
}

/**
 * Helper function to create a {@link Validation.Validator} which validates an enumerated
 * value in place.
 * @public
 */
export function enumeratedValue<T extends string>(values: T[]): Validator<T, T[]> {
    return new GenericValidator({
        validator: (from: unknown, context?: T[]): boolean | Failure<T> => {
            if (typeof from === 'string') {
                const v = context ?? values;
                const index = v.indexOf(from as T);
                return index >= 0 ? true : fail(`Invalid enumerated value "${from}"  - expected: (${v.join(', ')})`);
            }
            return fail(`Not a string: "${JSON.stringify(from, undefined, 2)}`);
        },
    });
}

/**
 * Helper function to create a {@link Validation.Validator} which validates a literal value.
 * @param value - the literal value to be validated
 * @public
 */
export function literal<T extends string | number | boolean | symbol | null | undefined>(value: T): Validator<T> {
    return new GenericValidator({
        validator: (from: unknown): boolean | Failure<T> => {
            return from === value ? true : fail(`Expected literal ${String(value)}, found "${JSON.stringify(from, undefined, 2)}`);
        },
    });
}

/**
 * Helper function to create a {@link Validation.Classes.TypeGuardValidator | TypeGuardValidator} which
 * validates a value or object in place.
 * @param description - a description of the thing to be validated for use in error messages
 * @param guard - a {@link Validation.TypeGuardWithContext} which performs the validation.
 * @returns A new {@link Validation.Classes.TypeGuardValidator | TypeGuardValidator } which validates
 * the values using the supplied type guard.
 * @public
 */
export function isA<T, TC>(
    description: string,
    guard: TypeGuardWithContext<T, TC>,
    params?: Omit<TypeGuardValidatorConstructorParams<T, TC>, 'description' | 'guard'>
): TypeGuardValidator<T, TC> {
    return new TypeGuardValidator({ description, guard, ...(params ?? {}) });
}
