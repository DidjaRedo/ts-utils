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


import '../../helpers/jest';

import { ConstraintTrait, ValidatorOptions } from '../../../src/validation';
import { Failure, fail } from '../../../src';
import { GenericValidator, GenericValidatorConstructorParams } from '../../../src/validation/genericValidator';

class TestGenericValidator<T, TC = unknown> extends GenericValidator<T, TC> {
    constructor(params: GenericValidatorConstructorParams<T, TC>) {
        super({
            validator: TestGenericValidator.testValidateString,
            ...params,
        });
    }

    public get options(): ValidatorOptions<TC> {
        return this._options;
    }

    public static testValidateString<T>(from: unknown): boolean | Failure<T> {
        if (from === 'custom') {
            return fail('custom error message goes here');
        }
        return typeof from === 'string';
    }

    public static testValidateNumber<T>(from: unknown): boolean | Failure<T> {
        if (from === 42) {
            return fail('custom error message goes here');
        }
        return typeof from === 'number';
    }
}

describe('GenericValidator class', () => {
    describe('constructor', () => {
        test('constructs a GenericValidator if only a validator function is supplied', () => {
            expect(() => new GenericValidator({ validator: TestGenericValidator.testValidateString })).not.toThrow();
        });

        test('constructs a GenericValidator with no traits by default', () => {
            const tv = new GenericValidator({ validator: TestGenericValidator.testValidateString });
            expect(tv.traits).toEqual({
                isOptional: false,
                constraints: [],
            });

            expect(tv.isOptional).toBe(false);
            expect(tv.brand).toBe(undefined);
        });

        test('throws if no validator function is supplied', () => {
            expect(() => new GenericValidator({})).toThrow(/no validator function/i);
        });

        test('uses options supplied via the constructor', () => {
            const trueContext = new TestGenericValidator({ options: { defaultContext: true } });
            const falseContext = new TestGenericValidator({ options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses traits supplied via the constructor', () => {
            const optional = new TestGenericValidator({ traits: { isOptional: true } });
            const notOptional = new TestGenericValidator({ traits: { isOptional: false } });
            expect(optional.isOptional).toBe(true);
            expect(notOptional.isOptional).toBe(false);
        });

        test('uses validator passed via the constructor', () => {
            const custom = new TestGenericValidator({});
            expect(custom.validate('custom')).toFailWith('custom error message goes here');
        });
    });

    describe('validate and guard methods', () => {
        const testString = new TestGenericValidator({ validator: TestGenericValidator.testValidateString });
        const testNumber = new TestGenericValidator({ validator: TestGenericValidator.testValidateNumber });

        test('validates valid values', () => {
            [
                '',
                'this is a string',
            ].forEach((t) => {
                expect(testString.validate(t)).toSucceedWith(t);
                expect(testString.guard(t)).toBe(true);
            });

            [
                1,
                2,
                -10,
                100.11,
            ].forEach((t) => {
                expect(testNumber.validate(t)).toSucceedWith(t);
                expect(testNumber.guard(t)).toBe(true);
            });
        });

        test('fails for invalid values', () => {
            [
                null,
                undefined,
                () => 'hello',
                { str: 'hello' },
                new Date(),
                ['hello'],
            ].forEach((t) => {
                expect(testString.validate(t)).toFailWith(/invalid value/i);
                expect(testNumber.validate(t)).toFailWith(/invalid value/i);

                expect(testString.guard(t)).toBe(false);
                expect(testNumber.guard(t)).toBe(false);
            });

            expect(testString.validate(10)).toFailWith(/invalid value/i);
            expect(testString.guard(10)).toBe(false);

            expect(testNumber.validate('10')).toFailWith(/invalid value/i);
            expect(testNumber.guard('10')).toBe(false);
        });

        describe('with context', () => {
            type TestContext = { context: string };
            const defaultContext: TestContext = { context: 'default' };
            const explicitContext: TestContext = { context: 'explicit' };

            const tvv = jest.fn(() => true);
            const tv = new TestGenericValidator({ validator: tvv });

            const tvctxv = jest.fn(() => true);
            const tvctx = new TestGenericValidator({ validator: tvctxv, options: { defaultContext } });

            beforeEach(() => {
                tvv.mockClear();
                tvctxv.mockClear();
            });

            test('validate passes undefined context by default', () => {
                expect(tv.validate('foo')).toSucceedWith('foo');
                expect(tvv).toHaveBeenCalledWith('foo', undefined);
            });

            test('validate passes default context if present', () => {
                expect(tvctx.validate('foo')).toSucceedWith('foo');
                expect(tvctxv).toHaveBeenCalledWith('foo', defaultContext);
            });

            test('validate passes call site context if supplied', () => {
                expect(tv.validate('foo', explicitContext)).toSucceedWith('foo');
                expect(tvv).toHaveBeenCalledWith('foo', explicitContext);
            });

            test('validate passes call site context if supplied if default context is present', () => {
                expect(tvctx.validate('foo', explicitContext)).toSucceedWith('foo');
                expect(tvctxv).toHaveBeenCalledWith('foo', explicitContext);
            });

            test('guard passes undefined context by default', () => {
                expect(tv.guard('foo')).toBe(true);
                expect(tvv).toHaveBeenCalledWith('foo', undefined);
            });

            test('validate passes default context if present', () => {
                expect(tvctx.guard('foo')).toBe(true);
                expect(tvctxv).toHaveBeenCalledWith('foo', defaultContext);
            });

            test('validate passes call site context if supplied', () => {
                expect(tv.guard('foo', explicitContext)).toBe(true);
                expect(tvv).toHaveBeenCalledWith('foo', explicitContext);
            });

            test('validate passes call site context if supplied if default context is present', () => {
                expect(tvctx.validate('foo', explicitContext)).toSucceedWith('foo');
                expect(tvctxv).toHaveBeenCalledWith('foo', explicitContext);
            });
        });
    });

    describe('validateOptional method', () => {
        const testNumber = new TestGenericValidator({ validator: TestGenericValidator.testValidateNumber });
        test('validates valid values or undefined', () => {
            [
                1,
                2,
                -10,
                100.11,
                undefined,
            ].forEach((t) => {
                expect(testNumber.validateOptional(t)).toSucceedWith(t);
            });
        });

        test('fails for invalid values other than undefined', () => {
            expect(testNumber.validateOptional('hello')).toFailWith(/invalid value/i);
        });
    });

    describe('optional method', () => {
        const tv = new TestGenericValidator({});
        const ov = tv.optional();

        test('constructs an explicitly optional validator', () => {
            expect(tv.isOptional).toBe(false);
            expect(ov.isOptional).toBe(true);
        });

        test('constructs a validator that returns success for undefined', () => {
            expect(tv.validate(undefined)).toFailWith(/invalid value/i);
            expect(ov.validate(undefined)).toSucceedWith(undefined);
        });

        test('constructs a validator that behaves as usual for other than undefined', () => {
            expect(tv.validate('test')).toSucceedWith('test');
            expect(ov.validate('test')).toSucceedWith('test');

            expect(tv.validate('custom')).toFailWith(/goes here/i);
            expect(ov.validate('custom')).toFailWith(/goes here/i);
        });
    });

    describe('withConstraint method', () => {
        const tv = new TestGenericValidator({});
        const cv = tv.withConstraint((s) => s !== 'added');
        const cvc = tv.withConstraint((s) => (s === 'added') ? fail('BAD BAD BAD') : true);

        test('constructs a validator with a constraint trait', () => {
            expect(tv.traits.constraints).toEqual([]);
            expect(cv.traits.constraints).toHaveLength(1);
        });

        test('uses an explicit trait if supplied', () => {
            const trait = { type: 'function', tag: 'extra' } as ConstraintTrait;
            const cvce = tv.withConstraint((s) => s !== 'added', trait);
            expect(cvce.traits.constraints).toEqual([trait]);
        });

        test('constructs a validator that applies the constraint', () => {
            expect(tv.validate('added')).toSucceedWith('added');
            expect(cv.validate('added')).toFailWith(/does not meet constraint/i);
            expect(cvc.validate('added')).toFailWith('BAD BAD BAD');
        });

        test('still succeeds for otherwise valid values', () => {
            expect(tv.validate('whatever')).toSucceedWith('whatever');
            expect(cv.validate('whatever')).toSucceedWith('whatever');
            expect(cvc.validate('whatever')).toSucceedWith('whatever');
        });

        test('still fails with default message for invalid values', () => {
            expect(cvc.validate(10)).toFailWith(/invalid value/i);
        });
    });

    describe('withBrand method', () => {
        const tv = new TestGenericValidator({});
        const bv = tv.withBrand('BRAND');

        test('constructs a validator with a brand trait', () => {
            expect(tv.traits.brand).toBeUndefined();
            expect(bv.traits.brand).toBe('BRAND');
        });

        test('rejects an second brand', () => {
            expect(() => bv.withBrand('CONFLICT')).toThrow(/cannot replace existing brand/i);
        });

        test('produces branded values', () => {
            const tv = new TestGenericValidator({});
            const bv1 = tv.withBrand('BRAND1');
            const bv2 = tv.withBrand('BRAND2');

            const str1 = bv1.validate('test').orThrow();
            const str2 = bv2.validate('test').orThrow();

            // Uncomment the following to get a type error and see branded types in action
            // expect(str1 === str2).toBe(true);

            // but this still works because they're just strings after all
            expect(str1).toEqual(str2);
        });
    });
});
