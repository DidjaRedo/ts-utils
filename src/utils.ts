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
 * Helper type-guard function to report whether a specified key is present in
 * a supplied object.
 * @param key - The key to be tested.
 * @param item - The object to be tested.
 * @returns Returns `true` if the key is present, `false` otherwise.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isKeyOf<T extends object>(key: string|number|symbol, item: T): key is keyof T {
    return item.hasOwnProperty(key);
}


/**
 * Simple implicit pick function, which picks a set of properties from a supplied
 * object.  Ignores picked properties that do not exist regardless of type signature.
 * @param from - The object from which keys are to be picked.
 * @param include - The keys of the properties to be picked from `from`.
 * @returns A new object containing the requested properties from `from`, where present.
 * @public
 */
export function pick<T extends object, K extends keyof T>(from: T, include: K[]): Pick<T, K> {
    const rtrn: Partial<Pick<T, K>> = {};
    for (const key of include) {
        if (key in from) {
            rtrn[key] = from[key];
        }
    }
    return rtrn as Pick<T, K>;
}

/**
 * Simple implicit omit function, which picks all of the properties from a supplied
 * object except those specified for exclusion.
 * @param from - The object from which keys are to be picked.
 * @param exclude - The keys of the properties to be excluded from the returned object.
 * @returns A new object containing all of the properties from `from` that were not
 * explicitly excluded.
 * @public
 */
export function omit<T extends object, K extends keyof T>(from: T, exclude: K[]): Omit<T, K> {
    const rtrn: Partial<Omit<T, K>> = {};
    for (const entry of Object.entries(from).filter((e) => !exclude.includes(e[0] as keyof T as K))) {
        rtrn[entry[0] as unknown as keyof Omit<T, K>] = entry[1];
    }

    return rtrn as Omit<T, K>;
}

/**
 * Gets the value of a property specified by key from an arbitrary object,
 * or a default value if the property does not exist.
 * @param key - The key specifying the property to be retrieved.
 * @param item - The object from which the property is to be retrieved.
 * @param defaultValue - An optional default value to be returned if the property
 * is not present (default `undefined`).
 * @returns The value of the requested property, or the default value if the
 * requested property does not exist.
 * @public
 */
export function getValueOfPropertyOrDefault<T extends object>(
    key: string|number|symbol,
    item: T,
    defaultValue?: unknown
): unknown | undefined {
    return isKeyOf(key, item) ? item[key] : defaultValue;
}

/**
 * Gets the type of a property specified by key from an arbitrary object.
 * @param key - The key specifying the property to be tested.
 * @param item - The object from which the property is to be tested.
 * @returns The type of the requested property, or `undefined` if the
 * property does not exist.
 * @example
 * Returns `'undefined'` (a string) if the property exists but has the value
 * undefined but `undefined` (the literal) if the property does not exist.
 * @public
 */
export function getTypeOfProperty<T extends object>(
    key: string|number|symbol,
    item: T): 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'undefined' | 'object' | 'function' | undefined {
    return isKeyOf(key, item) ? typeof item[key] : undefined;
}

/**
 * Type for factory methods which convert a key-value pair to a new unique value.
 * @public
 */
type KeyedThingFactory<TS, TD, TK extends string = string> = (key: TK, thing: TS) => Result<TD>;

/**
 * Applies a factory method to convert a `Record<TK, TS>` into a `Map<TK, TD>`.
 * @param src - The `Record` to be converted.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting map on success, or {@link Failure} with a
 * message if an error occurs.
 * @public
 */
export function recordToMap<TS, TD, TK extends string = string>(src: Record<TK, TS>, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD>> {
    const map = new Map<TK, TD>();
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
 * Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`, or `undefined`.
 * @param src - The `Record` to be converted, or undefined.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting map if conversion succeeds, or {@link Success} with `undefined`
 * if `src` is `undefined`. Returns {@link Failure} with a message if an error occurs.
 * @public
 */
export function optionalRecordToMap<TS, TD, TK extends string = string>(src: Record<TK, TS>|undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD>|undefined> {
    return (src === undefined) ? succeed(undefined) : recordToMap(src, factory);
}

/**
 * Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`
 * @param src - The `Record` to be converted, or `undefined`.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting map (empty if `src` is `undefined`) if conversion succeeds.
 * Returns {@link Failure} with a message if an error occurs.
 * @public
 */
export function optionalRecordToPossiblyEmptyMap<TS, TD, TK extends string = string>(src: Record<TK, TS>|undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD>> {
    return (src === undefined) ? succeed(new Map<TK, TD>()) : recordToMap(src, factory);
}

/**
 * Applies a factory method to convert a `Map<TK, TS>` into a `Record<TK, TD>`.
 * @param src - The `Map` object to be converted.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting `Record<TK, TD>` if conversion succeeds, or
 * {@link Failure} with an error message if an error occurs.
 * @public
 */
export function mapToRecord<TS, TD, TK extends string = string>(src: Map<TK, TS>, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>> {
    const record: Record<TK, TD> = {} as Record<TK, TD>;
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
 * Applies a factory method to convert an optional `Map<string, TS>` into a `Record<string, TD>` or `undefined`.
 * @param src - The `Map` object to be converted, or `undefined`.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting record if conversion succeeds, or {@link Success} with `undefined` if
 * `src` is `undefined`. Returns {@link Failure} with a message if an error occurs.
 * @public
 */
export function optionalMapToRecord<TS, TD, TK extends string = string>(src: Map<TK, TS>|undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>|undefined> {
    return (src === undefined) ? succeed(undefined) : mapToRecord(src, factory);
}

/**
 * Applies a factory method to convert an optional `Map<string, TS>` into a `Record<string, TD>`
 * @param src - The `Map` object to be converted, or `undefined`.
 * @param factory - The factory method used to convert elements.
 * @returns {@link Success} with the resulting record (empty if `src` is `undefined`) if conversion succeeds.
 * Returns {@link Failure} with a message if an error occurs.
 * @public
 */
export function optionalMapToPossiblyEmptyRecord<TS, TD, TK extends string = string>(src: Map<TK, TS>|undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>> {
    return (src === undefined) ? succeed({} as Record<TK, TD>) : mapToRecord(src, factory);
}
