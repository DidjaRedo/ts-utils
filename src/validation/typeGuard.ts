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
import { ValidatorBase, ValidatorBaseConstructorParams } from './validatorBase';

import { TypeGuardWithContext } from './common';
import { ValidatorOptions } from './validator';

/**
 * Parameters used to construct a {@link Validation.Classes.TypeGuardValidator}.
 * @public
 */
export interface TypeGuardValidatorConstructorParams<T, TC = unknown> extends ValidatorBaseConstructorParams<T, TC> {
    guard: TypeGuardWithContext<T, TC>;
    description: string;
}

/**
 * An in-place {@link Validation.Validator | Validator} that can be instantiated using a type guard
 * function.
 * @public
 */
export class TypeGuardValidator<T, TC = unknown> extends ValidatorBase<T, TC> {
    /**
     * {@link Validation.ValidatorOptions | Options} which apply to this
     * validator.
     */
    public readonly options: ValidatorOptions<TC>;
    public readonly description: string;

    protected readonly _guard: TypeGuardWithContext<T, TC>;

    /**
     * Constructs a new {@link Validation.Classes.TypeGuardValidator | TypeGuardValidator}.
     * @param params - Optional {@link Validation.Classes.TypeGuardValidatorConstructorParams | init params} for the
     * new {@link Validation.Classes.TypeGuardValidator | TypeGuardValidator}.
     */
    public constructor(params: TypeGuardValidatorConstructorParams<T, TC>) {
        super(params);
        this.description = params.description;
        this._guard = params.guard;
        this.options = params.options ?? {};
    }

    /**
     * Static method which validates that a supplied `unknown` value matches the supplied
     * type guard, returning a `Failure<T>` containing more information about a failure.
     * @param from - Value to be converted.
     * @param context - Optional validation context.
     * @returns `true` if `from` is valid, {@link Failure | Failure<T>}
     * with an error message if `from` is invalid.
     * @internal
     */
    protected _validate(from: unknown, context?: TC): boolean | Failure<T> {
        if (this._guard(from, context)) {
            return true;
        }
        return fail(`invalid ${this.description} (${JSON.stringify(from)})`);
    }
}
