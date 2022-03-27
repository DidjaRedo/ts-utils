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

import { FunctionConstraintTrait, ValidatorTraits } from '../../../src/validation';

describe('ValidatorTraits class', () => {
    test('constructs with expected defaults', () => {
        expect(new ValidatorTraits()).toEqual({
            isOptional: false,
            constraints: [],
        });
    });

    const c1 = { type: 'function', name: 'c1' } as FunctionConstraintTrait;
    const c2 = { type: 'function', name: 'c2' } as FunctionConstraintTrait;
    const c3 = { type: 'function', name: 'c3' } as FunctionConstraintTrait;

    test.each([
        [
            'prefers supplied isOptional to base', {
                init: { isOptional: false },
                base: { isOptional: true, constraints: [] },
                expected: { isOptional: false, constraints: [] },
            },
        ],
        [
            'prefers supplied isOptional to default', {
                init: { isOptional: true },
                base: undefined,
                expected: { isOptional: true, constraints: [] },
            },
        ],
        [
            'prefers base isOptional to default if init is undefined', {
                init: undefined,
                base: { isOptional: true, constraints: [] },
                expected: { isOptional: true, constraints: [] },
            },
        ],
        [
            'prefers base isOptional to default if init is empty', {
                init: undefined,
                base: { isOptional: true, constraints: [] },
                expected: { isOptional: true, constraints: [] },
            },
        ],
        [
            'prefers supplied brand to base', {
                init: { isOptional: false, brand: 'INIT' },
                base: { isOptional: true, brand: 'BASE', constraints: [] },
                expected: { isOptional: false, brand: 'INIT', constraints: [] },
            },
        ],
        [
            'prefers supplied brand to default', {
                init: { isOptional: true, brand: 'INIT' },
                base: undefined,
                expected: { isOptional: true, brand: 'INIT', constraints: [] },
            },
        ],
        [
            'prefers base brand to default if init is undefined', {
                init: undefined,
                base: { isOptional: true, brand: 'BASE', constraints: [] },
                expected: { isOptional: true, brand: 'BASE', constraints: [] },
            },
        ],
        [
            'prefers base brand to default if init is empty', {
                init: undefined,
                base: { isOptional: true, brand: 'BASE', constraints: [] },
                expected: { isOptional: true, brand: 'BASE', constraints: [] },
            },
        ],
        [
            'adds supplied constraints', {
                init: { constraints: [c1] },
                base: { isOptional: false, constraints: [] },
                expected: { isOptional: false, constraints: [c1] },
            },
        ],
        [
            'preserves base constraints', {
                init: { constraints: [] },
                base: { isOptional: false, constraints: [c1] },
                expected: { isOptional: false, constraints: [c1] },
            },
        ],
        [
            'combines supplied and base constraints', {
                init: { constraints: [c3] },
                base: { isOptional: false, constraints: [c1, c2] },
                expected: { isOptional: false, constraints: [c1, c2, c3] },
            },
        ],
    ])('%p', (_msg, test) => {
        expect(new ValidatorTraits(test.init, test.base)).toEqual(test.expected);
    });
});
