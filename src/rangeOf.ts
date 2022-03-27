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

import { Result, captureResult } from './result';
import Mustache from 'mustache';

/**
 * Represents a generic range of some comparable type `<T>`.
 * @public
 */
export interface RangeOfProperties<T> {
    readonly min?: T;
    readonly max?: T;
}

/**
 * Format strings (in mustache format) to
 * use for both open-ended and complete
 * {@link RangeOf | RangeOf<T>}.
 * @public
 */
export interface RangeOfFormats {
    minOnly: string;
    maxOnly: string;
    minMax: string;
}

/**
 * Default {@link RangeOfFormats | formats} to use for both
 * open-ended and complete {@link RangeOf | RangeOf<T>}.
 * @public
 */
export const DEFAULT_RANGEOF_FORMATS = {
    minOnly: '{{min}}-',
    maxOnly: '-{{max}}',
    minMax: '{{min}}-{{max}}',
};

/**
 * Simple implementation of a possibly open-ended range of some comparable
 * type `<T>` with test and formatting.
 * @public
 */
export class RangeOf<T> implements RangeOfProperties<T> {
    /**
     * Minimum extent of the range.
     */
    public readonly min?: T;
    /**
     * Maximum extent of the range.
     */
    public readonly max?: T;

    /**
     * Creates a new {@link RangeOf | RangeOf<T>}.
     * @param min - Optional mininum extent of the range.
     * @param max - Optional maximum extent of the range.
     */
    public constructor(min?: T, max?: T) {
        if (((min !== undefined) && (max !== undefined)) &&
            this._compare(min, max) === 'greater') {
            throw new Error(`Inverted range - ${JSON.stringify(min)} must be <= ${JSON.stringify(max)}.`);
        }
        this.min = min;
        this.max = max;
    }

    /**
     * Static constructor for a {@link RangeOf | RangeOf<T>}.
     * @param init - {@link RangeOfProperties | Range initializer}.
     * @returns A new {@link RangeOf | RangeOf<T>}.
     */
    public static createRange<T>(init?: RangeOfProperties<T>): Result<RangeOf<T>> {
        return captureResult(() => new RangeOf<T>(init?.min, init?.max));
    }

    /**
     * Gets a formatted description of a {@link RangeOfProperties | RangeOfProperties<T>} given an
     * optional set of formats and 'empty' value to use.
     * @param range - The {@link RangeOfProperties | RangeOfProperties<T>} to be formatted.
     * @param formats - Optionas {@link RangeOfFormats | formats} to use. Default is
     * {@link DEFAULT_RANGEOF_FORMATS | DEFAULT_RANGEOF_FORMATS}.
     * @param emptyValue - Value which represents unbounded minimum or maximum for this range. Default is `undefined`.
     * @returns A string representation of the range.
     */
    public static propertiesToString<T>(range: RangeOfProperties<T>, formats?: RangeOfFormats, emptyValue?: T): string|undefined {
        formats = formats ?? DEFAULT_RANGEOF_FORMATS;
        if ((range.min !== undefined) && (range.min !== emptyValue)) {
            if ((range.max !== undefined) && (range.max !== emptyValue)) {
                return Mustache.render(formats.minMax, range);
            }
            else {
                return Mustache.render(formats.minOnly, range);
            }
        }
        else if ((range.max !== undefined) && (range.max !== emptyValue)) {
            return Mustache.render(formats.maxOnly, range);
        }
        return undefined;
    }

    /**
     * Default comparison uses javascript built-in comparison.
     * @param t1 - First value to be compared.
     * @param t2 - Second value to be compared.
     * @returns `'less'` if `t1` is less than `t2`, `'greater'` if `t1` is larger
     * and `'equal'` if `t1` and `t2` are equal.
     * @internal
     */
    protected static _defaultCompare<T>(t1: T, t2: T): 'less'|'equal'|'greater' {
        if (t1 < t2) {
            return 'less';
        }
        else if (t1 > t2) {
            return 'greater';
        }
        return 'equal';
    }

    /**
     * Checks if a supplied value is within this range.
     * @param t - The value to be tested.
     * @returns `'included'` if `t` falls within the range, `'less'` if `t` falls
     * below the minimum extent of the range and `'greater'` if `t` is above the
     * maximum extent.
     */
    public check(t: T): 'less'|'included'|'greater' {
        if ((this.min !== undefined) && (this._compare(t, this.min) === 'less')) {
            return 'less';
        }
        if ((this.max !== undefined) && (this._compare(t, this.max) !== 'less')) {
            return 'greater';
        }
        return 'included';
    }

    /**
     * Determines if a supplied value is within this range.
     * @param t - The value to be tested.
     * @returns Returns `true` if `t` falls within the range, `false` otherwise.
     */
    public includes(t: T): boolean {
        return this.check(t) === 'included';
    }

    /**
     * Finds the transition value that would bring a supplied value `t` into
     * range.
     * @param t - The value to be tested.
     * @returns The minimum extent of the range if `t` is below the range or
     * the maximum extent of the range if `t` is above the range.  Returns
     * `undefined` if `t` already falls within the range.
     */
    public findTransition(t: T): T|undefined {
        switch (this.check(t)) {
            case 'less':
                return this.min;
            case 'included':
                return this.max;
        }
        return undefined;
    }

    /**
     * Formats the minimum and maximum values of this range.
     * @param format - A format function used to format the values.
     * @returns A {@link RangeOfProperties | RangeOfProperties<string>} contaning the
     * formatted representation of the {@link RangeOf.min | minimum} and {@link RangeOf.max | maximum}
     * extent of the range, or `undefined` for an extent that is not present.
     */
    public toFormattedProperties(format: (value: T) => string|undefined): RangeOfProperties<string> {
        return {
            min: (this.min !== undefined) ? format(this.min) : undefined,
            max: (this.max !== undefined) ? format(this.max) : undefined,
        };
    }

    /**
     * Formats this range using the supplied format function.
     * @param format - Format function used to format minimum and maxiumum extent values.
     * @param formats - The {@link RangeOfFormats | format strings} used to format the range
     * (default {@link DEFAULT_RANGEOF_FORMATS}).
     * @returns Returns a formatted representation of this range.
     */
    public format(format: (value: T) => string|undefined, formats?: RangeOfFormats): string|undefined {
        return RangeOf.propertiesToString(this.toFormattedProperties(format), formats);
    }

    /**
     * Inner compare method can be overriden by a derived class.
     * @param t1 - First value to compare.
     * @param t2 - Second value to compare.
     * @returns `'less'` if `t1` is less than `t2`, `'greater'` if `t1` is larger
     * and `'equal'` if `t1` and `t2` are equal.
     * @internal
     */
    protected _compare(t1: T, t2: T): 'less'|'equal'|'greater' {
        return RangeOf._defaultCompare(t1, t2);
    }
}
