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

import { ConstraintTrait, ValidatorTraits } from './traits';
import { Failure, Result } from '../result';

import { Brand } from '../brand';

/**
 * Options that apply to any {@link Validation.Validator | Validator}.
 * @public
 */
export interface ValidatorOptions<TC> {
    defaultContext?: TC;
}

/**
 * A {@link Validation.Constraint | Constraint<T>} function returns
 * `true` if the supplied value meets the constraint. Can return
 * {@link Failure} with an error message or simply return `false`
 * for a default message.
 * @public
 */
export type Constraint<T> = (val: T) => boolean | Failure<T>;

/**
 * In-place validation that a supplied unknown matches some
 * required characteristics (type, values, etc).
 * @public
 */
export interface Validator<T, TC=undefined> {
        /**
         * {@link Validation.ValidatorTraits | Traits} describing this validation.
         */
        readonly traits: ValidatorTraits;

        /**
         * Indicates whether this element is explicitly optional.
         */
         readonly isOptional: boolean;

        /**
         * The brand for a branded type.
         */
        readonly brand: string | undefined;

        /**
          * Tests to see if a supplied `unknown` value matches this
          * validation.
          * @param from - The `unknown` value to be tested.
          * @param context - Optional validation context.
          * @returns {@link Success} with the typed, validated value,
          * or {@link Failure} with an error message if validation fails.
          */
         validate(from: unknown, context?: TC): Result<T>;

        /**
          * Tests to see if a supplied `unknown` value matches this
          * validation.  Accepts `undefined`.
          * @param from - The `unknown` value to be tested.
          * @param context - Optional validation context.
          * @returns {@link Success} with the typed, validated value,
          * or {@link Failure} with an error message if validation fails.
          */
        validateOptional(from: unknown, context?: TC): Result<T | undefined>;

        /**
         * Non-throwing type guard
         * @param from - The value to be tested.
         * @param context - Optional validation context.
         */
        guard(from: unknown, context?: TC): from is T;

         /**
          * Creates an {@link Validation.Validator | in-place validator}
          * which is derived from this one but which also matches `undefined`.
          */
         optional(): Validator<T|undefined, TC>;

         /**
          * Creates an {@link Validation.Validator | in-place validator}
          * which is derived from this one but which applies additional constraints.
          * @param constraint - the constraint to be applied
          * @param trait - As optional {@link Validation.ConstraintTrait | ConstraintTrait}
          * to be applied to the resulting {@link Validation.Validator | Validator}.
          * @returns A new {@link Validation.Validator | Validator}.
          */
         withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC>;

         /**
          * Creates a new {@link Validation.Validator | in-place validator} which
          * is derived from this one but which matches a branded result.
          * @param brand - The brand to be applied.
          */
         withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC>;
}
