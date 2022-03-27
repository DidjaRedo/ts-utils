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

import * as crypto from 'crypto';
import { Result, captureResult, fail, mapResults, succeed } from './result';

/**
 * Computes an md5 hash from an array of strings. Not secure and not intended to be secure.
 * @param parts - The strings to be hashed
 * @returns An md5 hash of the parts
 * @public
 */
export function computeHash(parts: string[]): string {
    return crypto.createHash('md5').update(parts.join('|'), 'utf8').digest('hex');
}

/**
 * Computes a normalized hash for an arbitrary javascript value.
 * @public
 */
export class Normalizer {
    /**
     * Computes a normalized md5 hash from an arbitrary supplied object.  Not secure and not
     * intended to be secure.  Also not fast and not intended to be fast.
     *
     * Normalization just sorts Maps, Sets and object keys by hash so that differences in order
     * do not affect the hash.
     *
     * @param from - The arbitrary `unknown` to be hashed.
     * @returns A normalized md5 hash for the supplied value.
     */
    public computeHash(from: unknown): Result<string> {
        switch (typeof from) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return this._normalizeLiteral(from).onSuccess((v) => {
                    return captureResult(() => computeHash([v]));
                });
            case 'object':
                if ((from === null) || (from instanceof Date) || (from instanceof RegExp)) {
                    return this._normalizeLiteral(from).onSuccess((v) => {
                        return captureResult(() => computeHash([v]));
                    });
                }
                else if (Array.isArray(from)) {
                    return mapResults(from.map((e) => this.computeHash(e))).onSuccess((a) => {
                        return captureResult(() => computeHash(a));
                    });
                }
                else if ((from instanceof Map) || (from instanceof Set)) {
                    return this.computeHash(this._normalizeEntries(from.entries()));
                }
                return this.computeHash(this._normalizeEntries(Object.entries(from)));
        }
        return fail(`computeHash: Unexpected type - cannot hash '${typeof from}'`);
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
    protected _normalizeEntries(entries: Iterable<[unknown, unknown]>): [unknown, unknown][] {
        return Array.from(entries).sort((e1, e2) => this._compareKeys(e1[0], e2[0]));
    }

    /**
     * Constructs a normalized string representation of some literal value.
     * @param from - The literal value to be normalized.
     * @returns A normalized string representation of the literal.
     * @internal
     */
    protected _normalizeLiteral(from: string|number|bigint|boolean|symbol|undefined|Date|RegExp|null): Result<string> {
        switch (typeof from) {
            case 'string':
                return succeed(from);
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return succeed(`${typeof from}:[[[${String(from)}]]]`);
        }
        if (from === null) {
            return succeed('object:[[[null]]');
        }
        if (from instanceof Date) {
            return succeed(`Date:[[[${String(from.valueOf())}]]]`);
        }
        // istanbul ignore else
        if (from instanceof RegExp) {
            return succeed(`RegExp:[[[${from.toString()}]]]`);
        }
        // istanbul ignore next
        return fail(`cannot normalize ${JSON.stringify(from)}`);
    }
}
