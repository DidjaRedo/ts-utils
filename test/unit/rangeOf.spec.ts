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
        it('should fail if end is greater than end', () => {
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
                return true;
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
});
