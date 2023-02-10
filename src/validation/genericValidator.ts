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

/**
 * Type for a validation function, which validates that a supplied `unknown`
 * value is a valid value of type `<T>`, possibly as influenced by
 * an optionally-supplied validation context of type `<TC>`.
 * @public
 */
export type ValidatorFunc<T, TC> = (from: unknown, context?: TC) => boolean | Failure<T>;

/**
 * Options used to initialize a {@link Validation.Base.GenericValidator | GenericValidator}.
 * @public
 */
export interface GenericValidatorConstructorParams<T, TC> {
    options?: ValidatorOptions<TC>,
    traits?: Partial<ValidatorTraits>,
    validator?: ValidatorFunc<T, TC>
}

/**
 * Generic base implementation for an in-place {@link Validation.Validator | Validator}.
 * @public
 */
export class GenericValidator<T, TC = undefined> implements Validator<T, TC> {
    /**
     * {@inheritdoc Validation.Validator.traits}
     */
    public readonly traits: ValidatorTraits;

    /**
     * @internal
     */
    protected readonly _validator: ValidatorFunc<T, TC>;
    /**
     * @internal
     */
    protected readonly _options: ValidatorOptions<TC>;

    /**
     * Constructs a new {@link Validation.Base.GenericValidator | GenericValidator<T>}.
     * @param params - The {@link Validation.Base.GenericValidatorConstructorParams | constructor params}
     * used to configure validation.
     */
    public constructor(params: Partial<GenericValidatorConstructorParams<T, TC>>) {
        if (!params.validator) {
            throw new Error('No validator function supplied');
        }
        this._validator = params.validator;
        this._options = params.options ?? {};
        this.traits = new ValidatorTraits(params.traits);
    }

    /**
     * {@inheritdoc Validation.Validator.isOptional}
     */
    public get isOptional(): boolean {
        return this.traits.isOptional;
    }

    /**
     * {@inheritdoc Validation.Validator.brand}
     */
    public get brand(): string | undefined {
        return this.traits.brand;
    }

    /**
     * {@inheritdoc Validation.Validator.validate}
     */
    public validate(from: unknown, context?: TC): Result<T> {
        const result = this._validator(from, this._context(context));
        if (typeof result === 'boolean') {
            return result ? succeed(from as T) : fail<T>('Invalid value');
        }
        return result;
    }

    /**
     * {@inheritdoc Validation.Validator.validateOptional}
     */
    public validateOptional(from: unknown, context?: TC): Result<T | undefined> {
        return (from === undefined) ? succeed(undefined) : this.validate(from, context);
    }

    /**
     * {@inheritdoc Validation.Validator.guard}
     */
    public guard(from: unknown, context?: TC): from is T {
        return (this._validator(from, this._context(context)) === true);
    }

    /**
     * {@inheritdoc Validation.Validator.optional}
     */
    public optional(): Validator<T | undefined, TC> {
        return new GenericValidator({
            validator: (from: unknown, context?: TC) => {
                return (from === undefined)
                    || this._validator(from, this._context(context));
            },
            traits: { isOptional: true },
        });
    }

    /**
     * {@inheritdoc Validation.Validator.withConstraint}
     */
    public withConstraint(constraint: Constraint<T>, trait?: ConstraintTrait): Validator<T, TC> {
        trait = trait ?? { type: 'function' };
        return new GenericValidator({
            validator: (from: unknown, context?: TC): boolean | Failure<T> => {
                if (this._validator(from, this._context(context)) === true) {
                    const constraintResult = constraint(from as T);
                    if (typeof constraintResult === 'boolean') {
                        return constraintResult
                            ? true
                            : fail(`Invalid value "${JSON.stringify(from)}":  does not meet constraint.`);
                    }
                    return constraintResult;
                }
                return false;
            },
            traits: { constraints: [trait] },
        });
    }

    /**
     * {@inheritdoc Validation.Validator.brand}
     */
    public withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC> {
        if (this.brand) {
            throw new Error(`Cannot replace existing brand "${this.brand}" with "${brand}".`);
        }

        return new GenericValidator<Brand<T, B>, TC>({
            validator: (from: unknown, context?: TC) => {
                return this._validator(from, this._context(context)) as boolean | Failure<Brand<T, B>>;
            },
            traits: { brand },
        });
    }

    /**
     * Gets a default or explicit context.
     * @param explicitContext - Optional explicit context.
     * @returns The appropriate context to use.
     * @internal
     */
    protected _context(explicitContext?: TC): TC | undefined {
        return explicitContext ?? this._options.defaultContext;
    }
}
