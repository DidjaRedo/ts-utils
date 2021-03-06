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

export interface RangeOfProperties<T> {
    readonly min?: T;
    readonly max?: T;
}

export interface RangeOfFormats {
    minOnly: string;
    maxOnly: string;
    minMax: string;
}

export const DEFAULT_RANGEOF_FORMATS = {
    minOnly: '{{min}}-',
    maxOnly: '-{{max}}',
    minMax: '{{min}}-{{max}}',
};

export class RangeOf<T> implements RangeOfProperties<T> {
    public readonly min?: T;
    public readonly max?: T;

    public constructor(min?: T, max?: T) {
        if (((min !== undefined) && (max !== undefined)) &&
            this._compare(min, max) === 'greater') {
            throw new Error(`Inverted range - ${JSON.stringify(min)} must be <= ${JSON.stringify(max)}.`);
        }
        this.min = min;
        this.max = max;
    }

    public static createRange<T>(init?: RangeOfProperties<T>): Result<RangeOf<T>> {
        return captureResult(() => new RangeOf<T>(init?.min, init?.max));
    }

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

    protected static _defaultCompare<T>(t1: T, t2: T): 'less'|'equal'|'greater' {
        if (t1 < t2) {
            return 'less';
        }
        else if (t1 > t2) {
            return 'greater';
        }
        return 'equal';
    }

    public check(t: T): 'less'|'included'|'greater' {
        if ((this.min !== undefined) && (this._compare(t, this.min) === 'less')) {
            return 'less';
        }
        if ((this.max !== undefined) && (this._compare(t, this.max) !== 'less')) {
            return 'greater';
        }
        return 'included';
    }

    public includes(t: T): boolean {
        return this.check(t) === 'included';
    }

    public findTransition(t: T): T|undefined {
        switch (this.check(t)) {
            case 'less':
                return this.min;
            case 'included':
                return this.max;
        }
        return undefined;
    }

    public toFormattedProperties(format: (value: T) => string|undefined): RangeOfProperties<string> {
        return {
            min: (this.min !== undefined) ? format(this.min) : undefined,
            max: (this.max !== undefined) ? format(this.max) : undefined,
        };
    }

    public format(format: (value: T) => string|undefined, formats?: RangeOfFormats): string|undefined {
        return RangeOf.propertiesToString(this.toFormattedProperties(format), formats);
    }

    protected _compare(t1: T, t2: T): 'less'|'equal'|'greater' {
        return RangeOf._defaultCompare(t1, t2);
    }
}
