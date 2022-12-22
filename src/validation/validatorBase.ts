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

import { GenericValidator, GenericValidatorConstructorParams } from './genericValidator';

import { Failure } from '../result';

/**
 * @internal
 */
export type ValidatorBaseConstructorParams<T, TC> = Omit<GenericValidatorConstructorParams<T, TC>, 'validator'>;

/**
 * Abstract base helper class for specific validator implementations
 * @internal
 */
export abstract class ValidatorBase<T, TC = undefined> extends GenericValidator<T, TC> {
    /**
     * Inner constructor
     * @param params - Initialization params.
     * @internal
     */
    protected constructor(params: Partial<ValidatorBaseConstructorParams<T, TC>>) {
        super({
            validator: (from, context) => this._validate(from, context),
            ...params,
        });
    }

    /**
     * Abstract validation method to me implemented by derived classes.
     * @param from - Value to be converted.
     * @param context - Optional validation context.
     * @returns `true` if `from` is valid, {@link Failure | Failure<T>}
     * with an error message if `from` is invalid.
     * @internal
     */
    protected abstract _validate(from: unknown, context?: TC): boolean | Failure<T>;
}
