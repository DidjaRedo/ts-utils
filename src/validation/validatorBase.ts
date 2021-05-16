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

import { Constraint, Validator, ValidatorOptions } from './validator';
import { ConstraintTrait, ValidatorTraits } from './traits';
import { Failure, Result, fail, succeed } from '../result';

import { Brand } from '../brand';

export type ValidatorFunc<T, TC> = (from: unknown, context?: TC) => boolean | Failure<T>;

export interface ValidatorBaseConstructorParams<T, TC> {
    options?: ValidatorOptions<TC>,
    traits?: Partial<ValidatorTraits>,
    validator?: ValidatorFunc<T, TC>
}

/**
 * In-place validation that a supplied unknown matches a requested
 * schema.
 */
export class ValidatorBase<T, TC = undefined> implements Validator<T, TC> {
    public readonly traits: ValidatorTraits;

    protected readonly _validator: ValidatorFunc<T, TC>;
    protected readonly _options: ValidatorOptions<TC>;

    public constructor(params: Partial<ValidatorBaseConstructorParams<T, TC>>) {
        if (!params.validator) {
            throw new Error('No validator function supplied');
        }
        this._validator = params.validator;
        this._options = params.options ?? {};
        this.traits = new ValidatorTraits(params.traits);
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
        const result = this._validator(from, this._context(context));
        if (typeof result === 'boolean') {
            return result ? succeed(from as T) : fail<T>('Invalid value');
        }
        return result;
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
        return (this._validator(from, this._context(context)) === true);
    }

    /**
     * Creates an in-place validator for an optional value.
     */
    public optional(): Validator<T | undefined, TC> {
        return new ValidatorBase({
            validator: (from: unknown, context?: TC) => {
                return (from === undefined)
                    || this._validator(from, this._context(context));
            },
            traits: { isOptional: true },
        });
    }

    /**
     * Creates a validator which applies additional constraints.
     * @param constraint the constraint to be applied
     * @param trait optional trait to be applied to this constraint
     */
    public withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC> {
        trait = trait ?? { type: 'function' };
        return new ValidatorBase({
            validator: (from: unknown, context?: TC): boolean | Failure<T> => {
                if (this._validator(from, this._context(context)) === true) {
                    const constraintResult = constraint(from as T);
                    if (typeof constraintResult === 'boolean') {
                        return constraintResult
                            ? true
                            : fail(`Value ${JSON.stringify(from)} does not meet constraint.`);
                    }
                    return constraintResult;
                }
                return false;
            },
            traits: { constraints: [trait] },
        });
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

        return new ValidatorBase<Brand<T, B>, TC>({
            validator: (from: unknown, context?: TC) => {
                return this._validator(from, this._context(context)) as boolean | Failure<Brand<T, B>>;
            },
            traits: { brand },
        });
    }

    protected _context(explicitContext?: TC): TC | undefined {
        return explicitContext ?? this._options.defaultContext;
    }
}
