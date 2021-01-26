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

// eslint-disable-next-line @typescript-eslint/ban-types
export function isKeyOf<T extends object>(key: string|number|symbol, item: T): key is keyof T {
    return item.hasOwnProperty(key);
}

type KeyedThingFactory<TS, TD> = (key: string, thing: TS) => Result<TD>;

/**
 * Applies a factory method to convert a Record<string, TS> into a Map<string, TD>
 * @param src The Record object to be converted
 * @param factory The factory method used to convert elements
 * @returns Success with the resulting map, or Failure if an error occurs
 */
export function recordToMap<TS, TD>(src: Record<string, TS>, factory: KeyedThingFactory<TS, TD>): Result<Map<string, TD>> {
    const map = new Map<string, TD>();
    for (const key in src) {
        if (src[key] !== undefined) {
            const itemResult = factory(key, src[key]);
            if (itemResult.isSuccess()) {
                map.set(key, itemResult.value);
            }
            else {
                return fail(`${key}: ${itemResult.message}`);
            }
        }
    }
    return succeed(map);
}

/**
 * Applies a factory method to convert an optional Record<string, TS> into a Map<string, TD>
 * @param src The Record object to be converted or undefined
 * @param factory The factory method used to convert elements
 * @returns Success with the resulting map if conversion succeeds, or success with undefined if src is undefined. Returns Failure with
 * a message if an error occurs.
 */
export function optionalRecordToMap<TS, TD>(src: Record<string, TS>|undefined, factory: KeyedThingFactory<TS, TD>): Result<Map<string, TD>|undefined> {
    return (src === undefined) ? succeed(undefined) : recordToMap(src, factory);
}

/**
 * Applies a factory method to convert a Map<string, TS> into a Record<string, TD>
 * @param src The Map object to be converted
 * @param factory The factory method used to convert elements
 */
export function mapToRecord<TS, TD>(src: Map<string, TS>, factory: KeyedThingFactory<TS, TD>): Result<Record<string, TD>> {
    const record: Record<string, TD> = {};
    for (const kvp of src) {
        if (kvp[1] !== undefined) {
            const itemResult = factory(kvp[0], kvp[1]);
            if (itemResult.isSuccess()) {
                record[kvp[0]] = itemResult.value;
            }
            else {
                return fail(`${kvp[0]}: ${itemResult.message}`);
            }
        }
    }
    return succeed(record);
}

/**
 * Applies a factory method to convert an optional Map<string, TS> into a Record<string, TD>
 * @param src The Map object to be converted or undefined
 * @param factory The factory method used to convert elements
 * @returns Success with the resulting record if conversion succeeds, or success with undefined if src is undefined. Returns Failure with
 * a message if an error occurs.
 */
export function optionalMapToRecord<TS, TD>(src: Map<string, TS>|undefined, factory: KeyedThingFactory<TS, TD>): Result<Record<string, TD>|undefined> {
    return (src === undefined) ? succeed(undefined) : mapToRecord(src, factory);
}
