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

import '../helpers/jest';

import { ArrayTypeGuard, BooleanTypeGuard, NumberTypeGuard, ObjectTypeGuard, StringTypeGuard, omit, pick, pickWithType } from '../../src/pickers';

describe('pickers module', () => {
    describe('pick function', () => {
        test('it picks the requested properties', () => {
            expect(pick({
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            }, ['prop1', 'prop3'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });

        test('it silently ignores missing properties', () => {
            interface PickMe {
                prop1: number;
                prop2: string;
                prop3: boolean;
                prop4?: string;
            }
            const pickMe: PickMe = {
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            };

            expect(pick(pickMe, ['prop1', 'prop3', 'prop4'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });
    });

    describe('omit function', () => {
        test('it omits the requested properties', () => {
            expect(omit({
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            }, ['prop2'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });

        test('it silently ignores missing properties', () => {
            interface PickMe {
                prop1: number;
                prop2: string;
                prop3: boolean;
                prop4?: string;
            }
            const pickMe: PickMe = {
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            };

            expect(omit(pickMe, ['prop2', 'prop4'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });
    });

    describe('pickWithType function', () => {
        interface IPickMe {
            num1: number;
            num2?: number;
            str1: string;
            str2?: string;
            str3?: string;
            bool1: boolean;
            bool2?: boolean;
            obj1: object;
            obj2?: object;
            null1: object | null;
            null2?: object | null;
            arr1: unknown[],
            arr2?: unknown[],
        }
        const pickMe: IPickMe = {
            num1: 1,
            str1: 'str1',
            bool1: true,
            str2: 'str2',
            obj1: {
                str1: 'hello',
            },
            null1: null,
            arr1: ['item1', 'item2'],
        };

        test('picks the requested properties if present with matching type', () => {
            expect(pickWithType(pickMe, ['str1'], StringTypeGuard)).toSucceedWith({
                str1: 'str1',
            });

            expect(pickWithType(pickMe, ['str1', 'str2'], StringTypeGuard)).toSucceedWith({
                str1: 'str1',
                str2: 'str2',
            });

            expect(pickWithType(pickMe, ['num1'], NumberTypeGuard)).toSucceedWith({
                num1: 1,
            });

            expect(pickWithType(pickMe, ['bool1'], BooleanTypeGuard)).toSucceedWith({
                bool1: true,
            });

            expect(pickWithType(pickMe, ['obj1'], ObjectTypeGuard)).toSucceedWith({
                obj1: pickMe.obj1,
            });

            expect(pickWithType(pickMe, ['obj1'], ObjectTypeGuard)).toSucceedWith({
                obj1: pickMe.obj1,
            });

            expect(pickWithType(pickMe, ['arr1'], ArrayTypeGuard)).toSucceedWith({
                arr1: pickMe.arr1,
            });
        });

        test('picks from weakly-typed objects', () => {
            const weak: object = pickMe;
            expect(pickWithType(weak, ['str1'], StringTypeGuard)).toSucceedWith({
                str1: 'str1',
            });

            expect(pickWithType(weak, ['str1', 'str2'], StringTypeGuard)).toSucceedWith({
                str1: 'str1',
                str2: 'str2',
            });

            expect(pickWithType(weak, ['num1'], NumberTypeGuard)).toSucceedWith({
                num1: 1,
            });

            expect(pickWithType(weak, ['bool1'], BooleanTypeGuard)).toSucceedWith({
                bool1: true,
            });

            expect(pickWithType(weak, ['obj1'], ObjectTypeGuard)).toSucceedWith({
                obj1: pickMe.obj1,
            });

            expect(pickWithType(weak, ['obj1'], ObjectTypeGuard)).toSucceedWith({
                obj1: pickMe.obj1,
            });

            expect(pickWithType(weak, ['arr1'], ArrayTypeGuard)).toSucceedWith({
                arr1: pickMe.arr1,
            });
        });

        test('silently ignores missing properties by default', () => {
            expect(pickWithType(pickMe, ['str1', 'str2', 'str3'], StringTypeGuard)).toSucceedWith({
                str1: 'str1',
                str2: 'str2',
            });
        });

        test
    });
});
