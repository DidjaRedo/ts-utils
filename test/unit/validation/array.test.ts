/*
 * Copyright (c) 2022 Erik Fortune
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
import { ArrayValidator } from '../../../src/validation/array';
import { Validators } from '../../../src/validation';

describe('ArrayValidator class', () => {
    describe('constructor', () => {
        test('uses options supplied via the constructor', () => {
            const validateElement = Validators.string;
            const trueContext = new ArrayValidator({ validateElement, options: { defaultContext: true } });
            const falseContext = new ArrayValidator({ validateElement, options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses options supplied via the helper', () => {
            const validateElement = Validators.string;
            const trueContext = Validators.arrayOf(validateElement, { options: { defaultContext: true } });
            const falseContext = Validators.arrayOf(validateElement, { options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses traits supplied via the constructor', () => {
            const validateElement = Validators.string;
            const optional = new ArrayValidator({ validateElement, traits: { isOptional: true } });
            const notOptional = new ArrayValidator({ validateElement, traits: { isOptional: false } });
            expect(optional.isOptional).toBe(true);
            expect(notOptional.isOptional).toBe(false);
        });
    });

    describe('validation', () => {
        test.each([
            [
                'empty array',
                [],
            ],
            [
                'array of string',
                ['string', 'string2'],
            ],
        ])('succeeds for %p', (_desc, from) => {
            expect(Validators.arrayOf(Validators.string).validate(from)).toSucceed();
        });

        test.each([
            [
                'non-array',
                {},
                /not an array/i,
            ],
            [
                'mistyped array',
                [1, 2, 3],
                /not a string/i,
            ],
        ])('fails for %p', (_desc, from, expected) => {
            expect(Validators.arrayOf(Validators.string).validate(from)).toFailWith(expected);
        });
    });
});
