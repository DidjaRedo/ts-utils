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

import { Result, fail, succeed } from '../result';
import { ValidatorBase, ValidatorFunc, ValidatorOptions } from './baseValidator';

import { ValidatorTraits } from './traits';

export interface StringValidatorConstructorParams<T, TC> {
    options?: ValidatorOptions<TC>,
    traits?: Partial<ValidatorTraits>,
    validator?: ValidatorFunc<T, TC>
}

export class StringValidator<T extends string = string, TC = unknown> extends ValidatorBase<T, TC> {
    public constructor(params?: StringValidatorConstructorParams<T, TC>) {
        super(
            params?.validator ?? StringValidator.validateString,
            params?.options,
            params?.traits,
        );
    }

    public static validateString<T extends string>(from: unknown): Result<T> {
        if (typeof from === 'string') {
            return succeed(from as T);
        }
        return fail(`"${from}": not a string`);
    }
}
