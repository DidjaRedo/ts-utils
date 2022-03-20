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

/**
 * An experimental array template which extend built-in `Array` to include a handful
 * of predicates which return {@link Result | Result<T>}.
 * @beta
 */
export class ExtendedArray<T> extends Array<T> {
    public readonly itemDescription: string;

    /**
     * Constructs an {@link ExtendedArray}.
     * @param itemDescription - Brief description of the type of each item in this array.
     * @param items - The initial contents of the array.
     */
    public constructor(itemDescription: string, ...items: T[]) {
        super(...items);
        this.itemDescription = itemDescription;
    }

    /**
     * Type guard to determine if some arbitrary array is an
     * {@link ExtendedArray}
     * @param a - The `Array` to be tested.
     * @returns Returns `true` if `a` is an {@link ExtendedArray},
     * `false` otherwise.
     */
    public static isExtendedArray<T>(a?: T[]): a is ExtendedArray<T> {
        return a instanceof ExtendedArray;
    }

    /**
     * Determines if this array contains exactly one element which matches
     * a supplied predicate.
     * @param predicate - The predicate function to be applied.
     * @returns Returns {@link Success | Success<T>} with the single matching
     * result if exactly one item matches `predicate`.  Returns {@link Failure}
     * with an error message if there are no matches or more than one match.
     */
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

    /**
     * Returns the first element of an {@link ExtendedArray}. Fails with an
     * error message if the array is empty.
     * @param failMessage - Optional message to be displayed in the event of failure.
     * @returns Returns {@link Success | Success<T>} with the value of the first element
     * in the array, or {@link Failure} with an error message if the array is empty.
     */
    public first(failMessage?: string): Result<T> {
        if (this.length > 0) {
            return succeed(this[0]);
        }
        return fail(failMessage ?? `${this.itemDescription} not found`);
    }

    /**
     * Returns an array containing all elements of an {@link ExtendedArray}. Fails with
     * an error message if the array is empty.
     * @param failMessage - Optional message to be displayed in the event of failure.
     * @returns Returns {@link Success | Success<T[]>} with a new (non-extended) `Array`
     * containing the elements of this array, or {@link Failure} with an error message
     * if the array is empty.
     */
    public atLeastOne(failMessage?: string): Result<T[]> {
        if (this.length > 0) {
            return succeed(Array.from(this));
        }
        return fail(failMessage ?? `${this.itemDescription} not found`);
    }

    /**
     * Gets a new (non-extended) `Array` containing all of the elements from this
     * {@link ExtendedArray}.
     * @returns A new (non-extended) `Array<T>`.
     */
    public all(): T[] {
        return Array.from(this);
    }
}
