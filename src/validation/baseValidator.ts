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

import { Constraint, Validator } from './validator';
import { ConstraintTrait, ValidatorTraits } from './traits';
import { Result, fail, succeed } from '../result';

import { Brand } from '../brand';

export interface ValidatorOptions<TC> {
    verifyInPlace?: boolean;
    defaultContext?: TC;
}

export type ValidatorFunc<T, TC> = (from: unknown, context?: TC) => Result<T>;

/**
 * In-place validation that a supplied unknown matches a requested
 * schema.
 */
export class ValidatorBase<T, TC = undefined> implements Validator<T, TC> {
    public readonly traits: ValidatorTraits;

    protected readonly _validator: ValidatorFunc<T, TC>;
    protected readonly _options: ValidatorOptions<TC>;

    public constructor(
        validator: ValidatorFunc<T, TC>,
        options?: ValidatorOptions<TC>,
        traits?: Partial<ValidatorTraits>,
    ) {
        this._validator = validator;
        this._options = options ?? {};
        this.traits = new ValidatorTraits(traits);
    }

    /**
     * Indicates whether this element is explicitly optional
     */
    public get isOptional(): boolean {
        return this.traits.isOptional;
    }

    /**
     * Returns the brand for a branded type
     */
    public get brand(): string | undefined {
        return this.traits.brand;
    }

    /**
     * Tests to see if a supplied unknown value matches this
     * validation.
     * @param from The unknown to be tested
     * @param context optional context used for validation
     */
    public validate(from: unknown, context?: TC): Result<T> {
        return this._validator(from, context ?? this._options?.defaultContext).onSuccess((v) => {
            if ((this._options.verifyInPlace === true) && (v !== from)) {
                return fail(`Validator mutated value "${JSON.stringify(v)}"`);
            }
            return succeed(v);
        });
    }

    /**
     * Tests to see if a supplied unknown value matches this
     * validation.  Accepts undefined.
     * @param from The unknown to be tested
     * @param context optional context used for validation
     */
    public validateOptional(from: unknown, context?: TC): Result<T | undefined> {
        return (from === undefined) ? succeed(undefined) : this.validate(from, context);
    }

    /**
     * Non-throwing type guard
     * @param from The value to be tested
     * @param context Optional context for the test
     */
    public guard(from: unknown, context?: TC): from is T {
        return this.validate(from, context).isSuccess();
    }

    /**
     * Creates an in-place validator for an optional value.
     */
    public optional(): Validator<T | undefined, TC> {
        return new ValidatorBase((from: unknown, context?: TC) => {
            return this.validateOptional(from, context ?? this._options?.defaultContext);
        },
        undefined,
        { isOptional: true });
    }

    /**
     * Creates a validator which applies additional constraints.
     * @param constraint the constraint to be applied
     * @param trait optional trait to be applied to this constraint
     */
    public withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC> {
        trait = trait ?? { type: 'function' };
        return new ValidatorBase((from: unknown, context?: TC) => {
            return this._validator(from, context ?? this._options?.defaultContext).onSuccess((v) => {
                const constraintResult = constraint(v);
                if (typeof constraintResult === 'boolean') {
                    return constraintResult
                        ? succeed(v)
                        : fail(`Value ${JSON.stringify(v)} does not meet constraint.`);
                }
                return constraintResult.isSuccess()
                    ? succeed(v)
                    : fail(constraintResult.message);
            });
        },
        undefined,
        { constraints: [trait] });
    }

    /**
     * Creates a validator which produces a branded result on successful
     * conversion.
     * @param brand The brand to be applied
     */
    public withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC> {
        if (this.brand) {
            throw new Error(`Cannot replace existing brand "${this.brand}" with "${brand}".`);
        }

        return new ValidatorBase<Brand<T, B>, TC>((from: unknown, context?: TC) => {
            return this._validator(from, context ?? this._options.defaultContext).onSuccess((v) => {
                return succeed(v as Brand<T, B>);
            });
        },
        undefined,
        { brand });
    }
}
