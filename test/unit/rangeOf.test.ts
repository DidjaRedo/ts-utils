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
import {
    RangeOf,
    RangeOfFormats,
    RangeOfProperties,
    Result,
} from '../../src';

describe('RangeOf class', () => {
    describe('constructor', () => {
        test('throws if min is greater than max', () => {
            const min = 0;
            const max = 1000;
            expect(() => {
                return new RangeOf<number>(max, min);
            }).toThrowError(/inverted range/i);
        });
    });

    describe('create static method', () => {
        test('fails if end is greater than end', () => {
            const min = 0;
            const max = 1000;
            let result: Result<RangeOf<number>>|undefined;
            expect(() => {
                result = RangeOf.createRange({ min: max, max: min });
            }).not.toThrow();
            expect(result?.isFailure()).toBe(true);
            if (result?.isFailure()) {
                expect(result?.message).toMatch(/inverted range/i);
            }
        });

        test('succeeds for open-ended ranges', () => {
            expect(RangeOf.createRange({ min: 0 })).toSucceed();
            expect(RangeOf.createRange({ max: 100 })).toSucceed();
        });

        test('creates an open-ended range if nothing is specified', () => {
            expect(RangeOf.createRange()).toSucceedAndSatisfy((r: RangeOf<number>) => {
                expect(r.min).toBeUndefined();
                expect(r.max).toBeUndefined();
            });
        });
    });

    describe('includes method', () => {
        test('succeeds for an empty range', () => {
            const range = new RangeOf<number>();
            expect(range.includes(-1)).toBe(true);
        });

        test('succeeds for an item equal to or later than the start of an endless range', () => {
            const min = 0;
            const max = undefined;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(min)).toBe(true);
            expect(range.includes(100000000)).toBe(true);
        });

        test('succeeds for an item before the end of an startless range', () => {
            const min = undefined;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(-1000)).toBe(true);
            expect(range.includes(max - 1)).toBe(true);
            expect(range.includes(max)).toBe(false);
        });

        test('succeeds for an item within the range min <= i < max', () => {
            const min = -1000;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(min)).toBe(true);
            expect(range.includes(0)).toBe(true);
            expect(range.includes(max - 1)).toBe(true);
            expect(range.includes(max)).toBe(false);
        });

        test('fails for an item before the start of an endless range', () => {
            const min = 0;
            const max = undefined;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(-1000)).toBe(false);
        });

        test('fails for an item after the end of a startless range', () => {
            const min = undefined;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(10000)).toBe(false);
        });

        test('fails for an item outside of a range', () => {
            const min = -1000;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.includes(-1001)).toBe(false);
            expect(range.includes(1001)).toBe(false);
        });
    });

    describe('findTransition method', () => {
        test('returns min for a value before the start of a range', () => {
            const min = -1000;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.findTransition(-2000)).toBe(min);
        });

        test('returns max for a value inside of a range inclusive of start', () => {
            const min = -1000;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.findTransition(0)).toBe(max);
            expect(range.findTransition(min)).toBe(max);
        });

        test('returns max for a value inside of a startless range exclusive of end', () => {
            const min = undefined;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.findTransition(0)).toBe(max);
            expect(range.findTransition(max)).toBeUndefined();
        });

        test('returns min for a value before the start of an endless range', () => {
            const min = -1000;
            const max = undefined;
            const range = new RangeOf<number>(min, max);
            expect(range.findTransition(-2000)).toBe(min);
            expect(range.findTransition(min)).toBeUndefined();
        });

        test('returns undefined for a value after the end of a range exclusive', () => {
            const min = -1000;
            const max = 1000;
            const range = new RangeOf<number>(min, max);
            expect(range.findTransition(2000)).toBeUndefined();
            expect(range.findTransition(max)).toBeUndefined();
        });
    });

    describe('toFormattedProperties method', () => {
        function fakeFormat(value: number): string|undefined {
            return (value === 0) ? undefined : `(${value})`;
        }
        test('formats all range combinations', () => {
            type TestCase = [number|undefined, number|undefined, { min?: string, max?: string }]
            const tests: TestCase[] = [
                [10, undefined, { min: '(10)', max: undefined }],
                [-10, 0, { min: '(-10)', max: undefined }],
                [undefined, 999, { min: undefined, max: '(999)' }],
                [0, 999, { min: undefined, max: '(999)' }],
                [10, 20, { min: '(10)', max: '(20)' }],
                [0, 0, { min: undefined, max: undefined }],
            ];

            for (const t of tests) {
                const range = new RangeOf<number>(t[0], t[1]);
                expect(range.toFormattedProperties(fakeFormat)).toEqual(t[2]);
            }
        });
    });

    describe('propertiesToString static method', () => {
        test('formats all range combinations with default formats and no empty value', () => {
            type TestCase = [RangeOfProperties<number>, string|undefined];
            const tests: TestCase[] = [
                [{ min: 10, max: undefined }, '10-'],
                [{ min: 10, max: 0 }, '10-0'],
                [{ min: undefined, max: 999 }, '-999'],
                [{ min: 0, max: 999 }, '0-999'],
                [{ min: 10, max: 20 }, '10-20'],
                [{ min: undefined, max: undefined }, undefined],
                [{ min: 0, max: 0 }, '0-0'],
            ];

            for (const t of tests) {
                expect(RangeOf.propertiesToString(t[0])).toEqual(t[1]);
            }
        });

        test('formats all range combinations with default formats and an empty value', () => {
            type TestCase = [RangeOfProperties<number>, string|undefined];
            const tests: TestCase[] = [
                [{ min: 10, max: undefined }, '10-'],
                [{ min: 10, max: 0 }, '10-'],
                [{ min: undefined, max: 999 }, '-999'],
                [{ min: 0, max: 999 }, '-999'],
                [{ min: 10, max: 20 }, '10-20'],
                [{ min: undefined, max: undefined }, undefined],
                [{ min: 0, max: 0 }, undefined],
            ];

            for (const t of tests) {
                expect(RangeOf.propertiesToString(t[0], undefined, 0)).toEqual(t[1]);
            }
        });

        test('formats all range combinations with custom formats and an empty value', () => {
            type TestCase = [RangeOfProperties<number>, string|undefined];
            const tests: TestCase[] = [
                [{ min: 10, max: undefined }, '10..'],
                [{ min: 10, max: 0 }, '10..'],
                [{ min: undefined, max: 999 }, '..999'],
                [{ min: 0, max: 999 }, '..999'],
                [{ min: 10, max: 20 }, '10..20'],
                [{ min: undefined, max: undefined }, undefined],
                [{ min: 0, max: 0 }, undefined],
            ];
            const customFormats: RangeOfFormats = {
                minOnly: '{{min}}..',
                maxOnly: '..{{max}}',
                minMax: '{{min}}..{{max}}',
            };

            for (const t of tests) {
                expect(RangeOf.propertiesToString(t[0], customFormats, 0)).toEqual(t[1]);
            }
        });
    });

    describe('format method', () => {
        function fakeFormat(value: number): string|undefined {
            return (value === 0) ? undefined : `(${value})`;
        }

        test('formats all range combinations', () => {
            type TestCase = [number|undefined, number|undefined, string|undefined]
            const tests: TestCase[] = [
                [10, undefined, '(10)-'],
                [-10, 0, '(-10)-'],
                [undefined, 999, '-(999)'],
                [0, 999, '-(999)'],
                [10, 20, '(10)-(20)'],
                [undefined, undefined, undefined],
                [0, 0, undefined],
            ];

            for (const t of tests) {
                const range = new RangeOf(t[0], t[1]);
                expect(range.format(fakeFormat)).toEqual(t[2]);
            }
        });

        test('formats all range combinations with custom formatters', () => {
            type TestCase = [number|undefined, number|undefined, string|undefined]
            const tests: TestCase[] = [
                [10, undefined, '(10) -'],
                [-10, 0, '(-10) -'],
                [undefined, 999, '- (999)'],
                [0, 999, '- (999)'],
                [10, 20, '(10) - (20)'],
                [undefined, undefined, undefined],
                [0, 0, undefined],
            ];
            const customFormats: RangeOfFormats = {
                minOnly: '{{min}} -',
                maxOnly: '- {{max}}',
                minMax: '{{min}} - {{max}}',
            };

            for (const t of tests) {
                const range = new RangeOf(t[0], t[1]);
                expect(range.format(fakeFormat, customFormats)).toEqual(t[2]);
            }
        });
    });
});
