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
import { GenericValidator, GenericValidatorConstructorParams } from './genericValidator';

/**
 * Parameters used to construct a {@link Validation.Classes.StringValidator | StringValidator}.
 * @public
 */
export type StringValidatorConstructorParams<T extends string = string, TC = unknown> = GenericValidatorConstructorParams<T, TC>;

/**
 * An in-place {@link Validation.Validator | Validator} for `string` values.
 * @public
 */
export class StringValidator<T extends string = string, TC = unknown> extends GenericValidator<T, TC> {
    /**
     * Constructs a new {@link Validation.Classes.StringValidator | StringValidator}.
     * @param params - Optional {@link Validation.Classes.StringValidatorConstructorParams | init params}
     * for the new {@link Validation.Classes.StringValidator | StringValidator}.
     */
    public constructor(params?: StringValidatorConstructorParams<T, TC>) {
        super({
            validator: StringValidator.validateString,
            ...(params ?? {}),
        });
    }

    /**
     * Static method which validates that a supplied `unknown` value is a `string`.
     * @param from - The `unknown` value to be tested.
     * @returns Returns `true` if `from` is a `string`, or {@link Failure} with an error
     * message if not.
     */
    public static validateString<T extends string>(from: unknown): boolean | Failure<T> {
        if (typeof from === 'string') {
            return true;
        }
        return fail<T>(`"${from}": not a string`);
    }
}
