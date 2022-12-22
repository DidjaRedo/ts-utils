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
import { TypeGuardValidator } from '../../../src/validation/typeGuard';
import { Validators } from '../../../src/validation';

describe('type guard validator', () => {
    describe('constructor', () => {
        const description = 'string';
        const guard = (from: unknown): from is string => typeof from === 'string';
        test('uses options supplied via the constructor', () => {
            const trueContext = new TypeGuardValidator({ guard, description, options: { defaultContext: true } });
            const falseContext = new TypeGuardValidator({ guard, description, options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses options supplied via the helper', () => {
            const trueContext = Validators.isA(description, guard, { options: { defaultContext: true } });
            const falseContext = Validators.isA(description, guard, { options: { defaultContext: false } });
            expect(trueContext.options.defaultContext).toBe(true);
            expect(falseContext.options.defaultContext).toBe(false);
        });

        test('uses traits supplied via the constructor', () => {
            const optional = new TypeGuardValidator({ description, guard, traits: { isOptional: true } });
            const notOptional = new TypeGuardValidator({ description, guard, traits: { isOptional: false } });
            expect(optional.isOptional).toBe(true);
            expect(notOptional.isOptional).toBe(false);
        });
    });

    describe('validations', () => {
        test('validates with the supplied type guard and description', () => {
            const validator = Validators.isA('number', (from): from is number => typeof from === 'number');
            expect(validator.validate(10)).toSucceedWith(10);
            expect(validator.validate({})).toFailWith(/invalid number/);
        });

        test('propagates context', () => {
            const guard = (from: unknown, context?: number[]): from is number => {
                return typeof from === 'number' && (context === undefined || context.includes(from));
            };

            const validator = Validators.isA('selected number', guard);
            expect(validator.validate(100)).toSucceedWith(100);
            expect(validator.validate(20, [10, 20, 30])).toSucceedWith(20);
            expect(validator.validate(25, [10, 20, 30])).toFailWith(/invalid selected number/);
        });
    });
});
