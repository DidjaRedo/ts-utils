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

/**
 * A {@link Validation.ConstraintTrait | ConstraintTrait} indicating that
 * a {@link Validation.Constraint | Constraint<T>} function provides an
 * additional constraint implementation.
 * @public
 */
export interface FunctionConstraintTrait {
    type: 'function';
}

/**
 * Union of all supported constraint traits.
 * @public
 */
export type ConstraintTrait = FunctionConstraintTrait;

/**
 * Interface describing the supported validator traits.
 * @public
 */
export interface ValidatorTraitValues {
    /**
     * Indicates whether the validator accepts `undefined` as
     * a valid value.
     */
    readonly isOptional: boolean;

    /**
     * If present, indicates that the result will be branded
     * with the corresponding brand.
     */
    readonly brand?: string;

    /**
     * Zero or more additional {@link Validation.ConstraintTrait | ConstraintTrait}s
     * describing additional constraints applied by this {@link Validation.Validator | Validator}.
     */
    readonly constraints: ConstraintTrait[];
}

/**
 * Default {@link Validation.ValidatorTraitValues | validation traits}.
 * @public
 */
export const defaultValidatorTraits: ValidatorTraitValues = {
    isOptional: false,
    constraints: [],
};

/**
 * Generic implementation of {@link Validation.ValidatorTraitValues | ValidatorTraitValues}.
 * @public
 */
export class ValidatorTraits implements ValidatorTraitValues {
    /**
     * {@inheritdoc Validation.ValidatorTraitValues.isOptional}
     */
    public readonly isOptional: boolean;

    /**
     * {@inheritdoc Validation.ValidatorTraitValues.brand}
     */
    public readonly brand?: string;

    /**
     * {@inheritdoc Validation.ValidatorTraitValues.constraints}
     */
    public readonly constraints: ConstraintTrait[];

    /**
     * Constructs a new {@link Validation.ValidatorTraits | ValidatorTraits} optionally
     * initialized with the supplied base and initial values.
     * @remarks
     * Initial values take priority over base values, which fall back to the global default values.
     * @param init - Partial initial values to be set in the resulting {@link Validation.Validator | Validator}.
     * @param base - Base values to be used when no initial values are present.
     */
    public constructor(
        init?: Partial<ValidatorTraitValues>,
        base?: ValidatorTraitValues,
    ) {
        this.isOptional = init?.isOptional ?? base?.isOptional ?? defaultValidatorTraits.isOptional;
        this.brand = init?.brand ?? base?.brand ?? defaultValidatorTraits.brand;
        this.constraints = [
            ...defaultValidatorTraits.constraints,
            ...(base?.constraints ?? []),
            ...(init?.constraints ?? []),
        ];
    }
}
