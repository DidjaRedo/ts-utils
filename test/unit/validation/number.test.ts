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
import { Failure, fail } from '../../../src';
import { NumberValidator, NumberValidatorConstructorParams } from '../../../src/validation/number';

import { ValidatorOptions } from '../../../src/validation';
import { Validators } from '../../../src/validation';

class TestNumberValidator<T extends number = number, TC = unknown> extends NumberValidator<T, TC> {
    constructor(params?: NumberValidatorConstructorParams<T, TC>) {
        super(params);
    }

    public get options(): ValidatorOptions<TC> {
        return this._options;
    }

    public static testValidate<T extends number = number>(from: unknown): boolean | Failure<T> {
        if (from === 42) {
            return fail('custom error message goes here');
        }
        return NumberValidator.validateNumber(from);
    }
}

describe('NumberValidator class', () => {
    describe('constructor', () => {
        test('constructs a NumberValidator with no params', () => {
            expect(() => new NumberValidator()).not.toThrow();
        });

        test('uses options supplied via the constructor', () => {
            const trueContext = new TestNumberValidator({ options: { defaultContext: true } });
            const falseContext = new TestNumberValidator({ options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses traits supplied via the constructor', () => {
            const optional = new NumberValidator({ traits: { isOptional: true } });
            const notOptional = new NumberValidator({ traits: { isOptional: false } });
            expect(optional.isOptional).toBe(true);
            expect(notOptional.isOptional).toBe(false);
        });

        test('uses validator passed via the constructor', () => {
            const custom = new NumberValidator({ validator: TestNumberValidator.testValidate });
            expect(custom.validate(42)).toFailWith('custom error message goes here');
        });
    });

    describe('validation', () => {
        test('validates valid numbers', () => {
            [
                -1,
                0,
                1,
                22 / 7,
            ].forEach((t) => {
                expect(Validators.number.validate(t)).toSucceedWith(t);
            });
        });

        test('fails for non-numbers', () => {
            [
                null,
                undefined,
                () => 'hello',
                '10',
                { str: 'hello' },
                new Date(),
                ['hello'],
            ].forEach((t) => {
                expect(Validators.number.validate(t)).toFailWith(/not a number/i);
            });
        });
    });
});
