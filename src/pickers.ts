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

import { Result, fail, succeed } from './result';
import { TypeGuard } from './utils';

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
 * Options for the {@link pickWithType | pickWithType} function.
 * @public
 */
export interface IPickWithTypeOptions {
    /**
     * Indicates behavior for a requested property that has a
     * mismatched type.  Default is `'error'`.
     */
    onTypeMismatch: 'error' | 'ignore';

    /**
     * Indicates behavior for a requested property that is missing
     * or is `undefined`.  Default is `'ignore'`.
     */
    onUndefined: 'error' | 'ignore';
}

/**
 * Default {@link IPickWithTypeOptions | options} for {@link pickWithType | pickWithType}.
 * @public
 */
export const defaultPickWithTypeOptions: IPickWithTypeOptions = {
    onTypeMismatch: 'error',
    onUndefined: 'ignore',
};

/**
 * Strongly-typed pick function which picks properties of a single specified type
 * from a supplied object, with {@link IPickWithTypeOptions | options} to either
 * fail or ignore if properties are `undefined` or have an unexpected type.
 *
 * @param from - The object from which properties are to be picked.
 * @param include - The properties to be picked.
 * @param isAMatchingType - A {@link TypeGuard | TypeGuard} used to validate property values.
 * @param options - Optional {@link IPickWithTypeOptions | options} defining behavior
 * for missing or mismatched properties.
 * @returns {@link Success | Success} with a partial object containing any matching properties
 * that were present, or {@link Failure | Failure} with a message if errors occur.
 * @public
 */
export function pickWithType<TOBJ extends object, TPROP>(
    from: TOBJ,
    include: string[],
    isAMatchingType: TypeGuard<TPROP>,
    options?: Partial<IPickWithTypeOptions>,
): Result<Partial<Pick<TOBJ, TKEY>>> {
    const errors: string[] = [];
    const rtrn: Partial<Pick<TOBJ, TKEY>> = {};
    const o = { ...defaultPickWithTypeOptions, ...options };

    for (const key of include) {
        if (key in from) {
            const val = from[key];
            if (isAMatchingType(val)) {
                rtrn[key] = val;
            }
            else if (o.onTypeMismatch === 'error') {
                errors.push(`Property ${String(key)} has unexpected type.`);
            }
        }
        else if (o.onUndefined === 'error') {
            errors.push(`Expected property ${String(key)} not found.`);
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(rtrn);
}
