/*
 * Copyright (c) 2023 Erik Fortune
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

import { Validators } from '../../../src/validation';

describe('validators', () => {
    describe('enumeratedValue validator', () => {
        type Values = 'aval' | 'bval' | 'zval';
        const allValues: Values[] = ['aval', 'bval', 'zval'];

        const validator = Validators.enumeratedValue<Values>(allValues);
        test('succeeds for values in the enumerated type', () => {
            expect(validator.validate('aval')).toSucceedWith('aval');
            expect(validator.validate('bval')).toSucceedWith('bval');
            expect(validator.validate('zval')).toSucceedWith('zval');
        });

        test('fails for values not in the enumerated type', () => {
            expect(validator.validate('Aval')).toFailWith(/invalid enumerated value/i);
            expect(validator.validate('val')).toFailWith(/invalid enumerated value/i);
            expect(validator.validate('xval')).toFailWith(/invalid enumerated value/i);
            expect(validator.validate('aval1')).toFailWith(/invalid enumerated value/i);
            expect(validator.validate(true)).toFailWith(/not a string/i);
            expect(validator.validate({})).toFailWith(/not a string/i);
        });

        test('uses a context, if supplied', () => {
            expect(validator.validate('aval', ['aval', 'zval'])).toSucceedWith('aval');
            expect(validator.validate('bval', ['aval', 'zval'])).toFailWith(/invalid enumerated value/i);
            expect(validator.validate('zval', ['aval', 'zval'])).toSucceedWith('zval');
        });
    });

    describe('literal validator', () => {
        test.each([undefined, 'hello', 10, true, null, undefined, Symbol(10)])('succeeds for %p', (v) => {
            expect(Validators.literal(v).guard(v)).toBe(true);
        });

        test.each([
            [10, 11],
            ['hello', 'Hello'],
            [null, undefined],
            [false, true],
            [false, undefined],
        ])('fails to validate %p against %p', (v1, v2) => {
            expect(Validators.literal(v1).validate(v2)).toFailWith(/expected literal/i);
        });

        test('fails for non-literal', () => {
            expect(Validators.literal(10).validate({})).toFailWith(/expected literal/i);
        });
    });
});
