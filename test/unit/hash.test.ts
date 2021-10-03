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
import { Normalizer, computeHash } from '../../src/hash';

describe('Hash module', () => {
    describe('computeHash function', () => {
        test('computes the same hash value for equivalent inputs', () => {
            [
                [['hello'], ['hello']],
                [['this', 'is', 'a', 'test'], ['this', 'is', 'a', 'test']],
            ].forEach((t) => {
                expect(computeHash(t[0])).toEqual(computeHash(t[1]));
            });
        });

        test('computes different hash values for different inputs', () => {
            [
                [['hello'], ['Hello']],
                [['this', 'is', 'a', 'test'], ['this', 'a', 'is', 'test']],
            ].forEach((t) => {
                expect(computeHash(t[0])).not.toEqual(computeHash(t[1]));
            });
        });
    });

    describe('Normalizer class', () => {
        const normalizer = new Normalizer();
        const now = Date.now();
        test.each([
            ['like strings', 'hello', 'hello'],
            ['like numbers', 123456, 123456],
            [
                'like BigInt',
                // eslint-disable-next-line no-undef
                BigInt('0x1ffffffffffffffffffffffffffffff'),
                // eslint-disable-next-line no-undef
                BigInt('0x1ffffffffffffffffffffffffffffff'),
            ],
            ['like booleans', false, false],
            ['undefined', undefined, undefined],
            ['null', null, null],
            ['like Date values', new Date(now), new Date(now)],
            ['like RegExp values', /^.*test.*$/i, /^.*test.*$/i],
            ['like arrays', ['this', 'is', 10, true], ['this', 'is', 10, true]],
            ['like objects', { a: 'hello', b: 'goodbye' }, { b: 'goodbye', a: 'hello' }],
            [
                'like maps',
                new Map([['a', 'hello'], ['b', 'goodbye']]),
                new Map([['b', 'goodbye'], ['a', 'hello']]),
            ],
            [
                'like sets',
                new Set(['hello', 10, true]),
                new Set([true, 'hello', 10]),
            ],
        ])('computes the same hash for %p', (_desc, v1, v2) => {
            expect(normalizer.computeHash(v1)).toEqual(normalizer.computeHash(v2));
        });

        test.each([
            ['unlike strings', 'hello', 'Hello'],
            ['unlike numbers', 123456, 1234567],
            ['number and string', 123456, '123456'],
            [
                'unlike BigInt',
                // eslint-disable-next-line no-undef
                BigInt('0x1ffffffffffffffffffffffffffffff'),
                // eslint-disable-next-line no-undef
                BigInt('0x1fffffffffffffffffffffffffffffff'),
            ],
            [
                'BigInt and string',
                // eslint-disable-next-line no-undef
                BigInt('0x1ffffffffffffffffffffffffffffff'),
                '0x1ffffffffffffffffffffffffffffff',
            ],
            ['unlike booleans', false, true],
            ['boolean and string', false, 'false'],
            ['undefined and string', undefined, 'undefined'],
            ['null and string', null, 'null'],
            ['unlike Date values', new Date(now), new Date(now + 1)],
            ['unlike RegExp values', /^.*test.*$/i, /^.*test.*$/],
            ['unlike arrays', ['this', 'is', 10, true], ['this', 'is', true, 10]],
            ['unlike objects', { a: 'hello', b: 'goodbye' }, { b: 'hello', a: 'goodbye' }],
            [
                'unlike maps',
                new Map([['a', 'hello'], ['b', 'goodbye']]),
                new Map([['b', 'hello'], ['a', 'goodbye']]),
            ],
            [
                'unlike sets',
                new Set(['hello', 10, false]),
                new Set([true, 'hello', 10]),
            ],
        ])('computes a different hash for %p', (_desc, v1, v2) => {
            expect(normalizer.computeHash(v1)).not.toEqual(normalizer.computeHash(v2));
        });

        test('computes the same hash for a deeply nested object', () => {
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
            expect(normalizer.computeHash(v1)).toEqual(normalizer.computeHash(v2));
        });

        test('fails for a non-hashable function', () => {
            expect(normalizer.computeHash(() => 'hello')).toFailWith(/unexpected type/i);
        });
    });
});
