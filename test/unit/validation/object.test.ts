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
import { ObjectValidator } from '../../../src/validation/object';

import { Validators } from '../../../src/validation';

describe('ObjectValidator class', () => {
    describe('constructor', () => {
        test('uses options supplied via the constructor', () => {
            const trueContext = new ObjectValidator({ fields: {}, options: { defaultContext: true } });
            const falseContext = new ObjectValidator({ fields: {}, options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses traits supplied via the constructor', () => {
            const optional = new ObjectValidator({ fields: {}, traits: { isOptional: true } });
            const notOptional = new ObjectValidator({ fields: {}, traits: { isOptional: false } });
            expect(optional.isOptional).toBe(true);
            expect(notOptional.isOptional).toBe(false);
        });
    });

    describe('validation', () => {
        const allRequired = Validators.object({
            s: Validators.string,
            n: Validators.number,
            b: Validators.boolean,
        });
        const strictAllRequired = Validators.object({
            s: Validators.string,
            n: Validators.number,
            b: Validators.boolean,
        }, { options: { strict: true } });
        const optionalString = Validators.object({
            s: Validators.string.optional(),
            n: Validators.number,
            b: Validators.boolean,
        });
        const optionalNumber = Validators.object({
            s: Validators.string,
            n: Validators.number,
            b: Validators.boolean,
        }, {
            options: { optionalFields: ['n'] },
        });

        test.each([
            [
                'all required fields present',
                allRequired,
                { s: 'hello', n: 10, b: true },
            ],
            [
                'optional fields present',
                optionalString,
                { s: 'hello', n: 10, b: true },
            ],
            [
                'extra fields present',
                allRequired,
                { s: 'hello', n: 10, b: true, extra: 'extra' },
            ],
            [
                'optional fields missing',
                optionalString,
                { n: 10, b: true },
            ],
            [
                'partial with added optional fields missing',
                allRequired.addPartial(['b']),
                { s: 'hello', n: 10 },
            ],
            [
                'addPartial with base optional fields missing',
                optionalNumber.addPartial(['s']),
                { b: false },
            ],
        ])('succeeds with %p', (_msg, validator, from) => {
            expect(validator.validate(from)).toSucceedWith(from);
        });

        test.each([
            [
                'extra fields present with strict',
                strictAllRequired,
                { s: 'hello', n: 10, b: true, extra: 'extra' },
                /unexpected field/i,
            ],
            [
                'extra fields present with strict after addPartial',
                strictAllRequired.addPartial(['n']),
                { s: 'hello', b: true, extra: 'extra' },
                /unexpected field/i,
            ],
            [
                'required field missing',
                allRequired,
                { s: 'hello', n: 10 },
                /field not found/i,
            ],
            [
                'mistyped field',
                allRequired,
                { s: 'hello', n: true },
                /not a number/i,
            ],
            [
                'non-object',
                optionalString,
                true,
                /not an object/i,
            ],
        ])('fails with %p', (_msg, validator, from, expected) => {
            expect(validator.validate(from)).toFailWith(expected);
        });
    });
});
