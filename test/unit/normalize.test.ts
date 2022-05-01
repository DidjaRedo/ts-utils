/*
 * Copyright (c) 2020 Erik Fortune
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

import '../helpers/jest';
import { Normalizer } from '../../src';

describe('Normalizer', () => {
    describe('Normalizer class', () => {
        const normalizer = new Normalizer();
        const now = Date.now();
        test.each([
            ['strings', 'hello', 'hello'],
            ['numbers', 123456, 123456],
            ['booleans', false, false],
            ['undefined', undefined, undefined],
            ['null', null, null],
            ['Date values', new Date(now), new Date(now)],
            ['RegExp values', /^.*test.*$/i, /^.*test.*$/i],
            ['arrays', ['this', 'is', 10, true], ['this', 'is', 10, true]],
            ['objects', { a: 'hello', b: 'goodbye' }, { b: 'goodbye', a: 'hello' }],
            [
                'maps',
                new Map([['a', 'hello'], ['b', 'goodbye']]),
                new Map([['b', 'goodbye'], ['a', 'hello']]),
            ],
            [
                'sets',
                new Set(['hello', 10, true]),
                new Set([true, 'hello', 10]),
            ],
        ])('computes the same ha %p', (_desc, v1, v2) => {
            expect(normalizer.normalize(v1)).toSucceedWith(v2);
        });

        test('BigInt', () => {
            // eslint-disable-next-line no-undef
            const bi = BigInt('0x1ffffffffffffffffffffffffffffff');
            expect(normalizer.normalize(bi)).toSucceedWith(bi);
        });

        test('normalizes a deeply nested object', () => {
            const v1 = {
                str: 'hello',
                arr: [1, 'string', true, { a: 'a', b: 'b' }],
                child: {
                    p1: 'prop1',
                    p2: 2,
                    p3: /^.*$/i,
                    p4: [1, 2, 3, 4],
                    p5: 'test',
                },
            };
            const v2 = {
                arr: [1, 'string', true, { b: 'b', a: 'a' }],
                child: {
                    p4: [1, 2, 3, 4],
                    p2: 2,
                    p5: 'test',
                    p1: 'prop1',
                    p3: /^.*$/i,
                },
                str: 'hello',
            };
            expect(normalizer.normalize(v1)).toEqual(normalizer.normalize(v2));
        });

        test('does not normalize array order', () => {
            expect(normalizer.normalize([2, 3, 1])).toSucceedAndSatisfy((n) => {
                expect(n).toEqual([2, 3, 1]);
            });
        });

        test('fails for a non-normalizable function', () => {
            expect(normalizer.normalize(() => 'hello')).toFailWith(/unexpected type/i);
        });
    });
});
