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

import { Brand } from '../brand';
import { Result } from '../result';

export type Constraint<T> = (val: T) => boolean | Result<boolean>;

/**
 * In-place validation that a supplied unknown matches a requested
 * schema.
 */
export interface Validator<T, TC=undefined> {
        /**
         * Traits describing this validation
         */
        readonly traits: ValidatorTraits;

        /**
         * Indicates whether this element is explicitly optional
         */
         readonly isOptional: boolean;

        /**
         * Returns the brand for a branded type.
         */
        readonly brand: string | undefined;

         /**
          * Tests to see if a supplied unknown value matches this
          * validation.
          * @param from The unknown to be tested
          * @param context optional context used for validation
          */
         validate(from: unknown, context?: TC): Result<T>;

        /**
          * Tests to see if a supplied unknown value matches this
          * validation.  Accepts undefined.
          * @param from The unknown to be tested
          * @param context optional context used for validation
          */
        validateOptional(from: unknown, context?: TC): Result<T | undefined>;

        /**
         * Non-throwing type guard
         * @param from The value to be tested
         * @param context Optional context for the test
         */
        guard(from: unknown, context?: TC): from is T;

         /**
          * Creates an in-place validator for an optional value.
          */
         optional(): Validator<T|undefined, TC>;

         /**
          * Creates a validator which applies additional constraints.
          * @param constraint the constraint to be applied
          * @param trait optional trait to be applied to this constraint
          */
         withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC>;

         /**
          * Creates a validator which produces a branded result on successful
          * conversion.
          * @param brand The brand to be applied
          */
         withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC>;
}
