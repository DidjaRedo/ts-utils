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

import { Result, fail, mapResults, succeed } from './result';

export type Entry<T> = [string | number | symbol, T];
export type ResultEntry<T> = [string | number | symbol, Result<T>];

/**
 * Normalizes an arbitrary JSON object
 * @public
 */
export class Normalizer {
    /**
     * Normalizes the supplied value
     *
     * @param from - The value to be normalized
     * @returns A normalized version of the value
     */
    public normalize<T>(from: T): Result<T> {
        switch (typeof from) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return this._normalizeLiteral(from);
            case 'object':
                if ((from === null) || (from instanceof Date) || (from instanceof RegExp)) {
                    return this._normalizeLiteral(from);
                }
                else if (Array.isArray(from)) {
                    return this._normalizeArray(from) as unknown as Result<T>;
                }
                else if (from instanceof Map) {
                    return succeed(new Map(this._normalizeEntries(from.entries())) as unknown as T);
                }
                else if (from instanceof Set) {
                    return succeed(new Set(this._normalizeEntries(from.entries())) as unknown as T);
                }
                const obj: { [key in number | string | symbol]: unknown } = {};
                for (const e of this._normalizeEntries(Object.entries(from as unknown as object))) {
                    obj[e[0]] = e[1];
                }
                return succeed(obj as T);
        }
        return fail(`normalize: Unexpected type - cannot normalize '${typeof from}'`);
    }

    /**
     * Compares two property names from some object being normalized.
     * @param k1 - First key to be compared.
     * @param k2 - Second key to be compared.
     * @returns `1` if `k1` is greater, `-1` if `k2` is greater and
     * `0` if they are equal.
     * @internal
     */
    protected _compareKeys(k1: unknown, k2: unknown): number {
        const cs1 = String(k1);
        const cs2 = String(k2);
        if (cs1 > cs2) {
            return 1;
        }
        // istanbul ignore else
        if (cs2 > cs1) {
            return -1;
        }

        // istanbul ignore next
        return 0;
    }

    /**
     * Normalizes an array of object property entries (e.g. as returned by `Object.entries()`).
     * @remarks
     * Converts property names (entry key) to string and then sorts as string.
     * @param entries - The entries to be normalized.
     * @returns A normalized sorted array of entries.
     * @internal
     */
    protected _normalizeEntries<T = unknown>(entries: Iterable<Entry<T>>): Entry<T>[] {
        return Array.from(entries)
            .sort((e1, e2) => this._compareKeys(e1[0], e2[0]))
            .map((e) => [e[0], this.normalize(e[1])] as ResultEntry<T>)
            .filter((e) => e[1].isSuccess())
            .map((e) => [e[0], e[1].orThrow()]);
    }

    protected _normalizeArray(from: unknown[]): Result<unknown[]> {
        return mapResults(from.map((v) => this.normalize(v)));
    }

    /**
     * Normalizes the supplied literal value
     * @param from - The literal value to be normalized.
     * @returns A normalized value for the literal.
     * @internal
     */
    protected _normalizeLiteral<T>(from: T): Result<T> {
        // TODO: Apply configurable normalization rules
        switch (typeof from) {
            case 'string':
                return succeed(from);
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return succeed(from);
        }
        if (from === null) {
            return succeed(from);
        }
        if (from instanceof Date) {
            return succeed(from);
        }
        // istanbul ignore else
        if (from instanceof RegExp) {
            return succeed(from);
        }
        // istanbul ignore next
        return fail(`cannot normalize ${JSON.stringify(from)}`);
    }
}
