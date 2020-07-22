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

import { Result, fail, succeed } from './result';

export class ExtendedArray<T> extends Array<T> {
    public readonly itemDescription: string;

    public constructor(itemDescription: string, ...items: T[]) {
        super(...items);
        this.itemDescription = itemDescription;
    }

    public static isExtendedArray<T>(a?: T[]): a is ExtendedArray<T> {
        return a instanceof ExtendedArray;
    }

    public single(predicate?: (item: T) => boolean): Result<T> {
        const match = (predicate ? this.filter(predicate) : this);
        if (match.length === 1) {
            return succeed(match[0]);
        }
        if (match.length === 0) {
            return fail(`${this.itemDescription} not found`);
        }
        return fail(`${this.itemDescription} matches ${match.length} items`);
    }

    public first(failMessage?: string): Result<T> {
        if (this.length > 0) {
            return succeed(this[0]);
        }
        return fail(failMessage ?? `${this.itemDescription} not found`);
    }

    public atLeastOne(failMessage?: string): Result<T[]> {
        if (this.length > 0) {
            return succeed(Array.from(this));
        }
        return fail(failMessage ?? `${this.itemDescription} not found`);
    }

    public all(): T[] {
        return Array.from(this);
    }
}
