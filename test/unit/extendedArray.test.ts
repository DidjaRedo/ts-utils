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
    ExtendedArray,
} from '../../src';

describe('ExtendedArray class', () => {
    const strings0: string[] = [];
    const strings1 = ['s1'];
    const strings2 = ['s1', 's2'];
    const strings3 = ['s1', 's2', 's3'];

    describe('constructor', () => {
        test('constructs from valid input', () => {
            let a: ExtendedArray<string>|undefined;
            expect(() => {
                a = new ExtendedArray('strings', ...strings3);
            }).not.toThrow();
            expect(a).toBeDefined();
            expect(a?.itemDescription).toBe('strings');
            expect(a?.length).toBe(3);
        });

        test('constructs an empty array', () => {
            let a: ExtendedArray<string>|undefined;
            expect(() => {
                a = new ExtendedArray('strings', ...strings0);
            }).not.toThrowError();
            expect(a).toBeDefined();
            expect(ExtendedArray.isExtendedArray(a)).toBe(true);
        });
    });

    describe('isExtendedArray static method', () => {
        test('returns true for an extended array', () => {
            expect(ExtendedArray.isExtendedArray(new ExtendedArray('items', ...strings3))).toBe(true);
        });

        test('returns false for a normal arary', () => {
            expect(ExtendedArray.isExtendedArray(strings3)).toBe(false);
        });
    });

    describe('single method', () => {
        test('succeeds with the value of the only item in a length 1 list', () => {
            expect(new ExtendedArray('strings', ...strings1).single()).toSucceedWith('s1');
        });

        test('fails for a list with more than 1 item', () => {
            expect(new ExtendedArray('strings', ...strings2).single()).toFailWith(/matches 2 items/i);
        });

        test('fails for a list with no items', () => {
            expect(new ExtendedArray('strings', ...strings0).single()).toFailWith(/not found/i);
        });

        test('succeeds with the only value if the supplied predicate filters the list to 1 item', () => {
            const a = new ExtendedArray('strings', ...strings3);
            const predicate = jest.fn((s: string): boolean => s === 's1');
            expect(a.single(predicate)).toSucceedWith('s1');
            expect(predicate).toHaveBeenCalledTimes(strings3.length);
        });

        test('fails if the predicate filters the list to more than 1 item', () => {
            const a = new ExtendedArray('strings', ...strings3);
            const predicate = jest.fn((s: string): boolean => s !== 's1');
            expect(a.single(predicate)).toFailWith(/matches 2 items/i);
            expect(predicate).toHaveBeenCalledTimes(strings3.length);
        });

        test('fails if the predicate filters the list to no items', () => {
            const a = new ExtendedArray('strings', ...strings3);
            const predicate = jest.fn((s: string): boolean => s === 'whatever');
            expect(a.single(predicate)).toFailWith(/not found/i);
            expect(predicate).toHaveBeenCalledTimes(strings3.length);
        });
    });

    describe('first method', () => {
        test('succeeds with the value of the first item in a length 1 list', () => {
            expect(new ExtendedArray('strings', ...strings1).first()).toSucceedWith('s1');
        });

        test('succeeds with the value of the first item from a list with more than 1 item', () => {
            expect(new ExtendedArray('strings', ...strings2).first()).toSucceedWith('s1');
        });

        test('fails for a list with no items', () => {
            expect(new ExtendedArray('strings', ...strings0).first()).toFailWith(/not found/i);
        });

        test('reports a supplied message on failure', () => {
            expect(new ExtendedArray('strings', ...strings0).first('I got nothin'))
                .toFailWith('I got nothin');
        });
    });

    describe('atLeastOne method', () => {
        test('succeeds with values in the list for any list with at least on item', () => {
            expect(new ExtendedArray('strings', ...strings1).atLeastOne()).toSucceedWith(strings1);
            expect(new ExtendedArray('strings', ...strings3).atLeastOne()).toSucceedWith(strings3);
        });

        test('fails for a list with no items', () => {
            expect(new ExtendedArray('strings', ...strings0).atLeastOne()).toFailWith(/not found/i);
        });

        test('reports a supplied message on failure', () => {
            expect(new ExtendedArray('strings', ...strings0).atLeastOne('I got nothin'))
                .toFailWith('I got nothin');
        });
    });

    describe('all', () => {
        test('returns a normal array containing all values for any list including empty', () => {
            expect(new ExtendedArray('strings', ...strings0).all()).toEqual(strings0);
            expect(new ExtendedArray('strings', ...strings1).all()).toEqual(strings1);
            expect(new ExtendedArray('strings', ...strings3).all()).toEqual(strings3);
        });
    });
});
