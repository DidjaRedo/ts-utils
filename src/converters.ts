
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
import { BaseConverter, Converter, ConverterTraits } from './converter';
import { RangeOf, RangeOfProperties } from './rangeOf';
import { Result, captureResult, fail, succeed } from './result';
import { TypeGuardWithContext, Validator } from './validation';

import { DateTime } from 'luxon';
import { ExtendedArray } from './extendedArray';
import Mustache from 'mustache';
import { isKeyOf } from './utils';

type OnError = 'failOnError' | 'ignoreErrors';

/**
 * Options for {@link Converters.StringConverter | StringConverter}
 * matching method
 * @public
 */
export interface StringMatchOptions {
    /**
     * An optional message to be displayed if a non-matching string
     * is encountered.
     */
    message?: string;
}

/**
 * The {@link Converters.StringConverter | StringConverter} class extends {@link BaseConverter}
 * to provide string-specific helper methods.
 * @public
 */
export class StringConverter<T extends string = string, TC = unknown> extends BaseConverter<T, TC> {
    /**
     * Construct a new {@link Converters.StringConverter | StringConverter}.
     * @param defaultContext - Optional context used by the conversion.
     * @param traits - Optional traits to be applied to the conversion.
     * @param converter - Optional conversion function to be used for the conversion.
     */
    public constructor(
        defaultContext?: TC,
        traits?: ConverterTraits,
        converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T> = StringConverter._convert,
    ) {
        super(converter, defaultContext, traits);
    }

    /**
     * @internal
     */
    protected static _convert<T extends string>(from: unknown): Result<T> {
        return typeof from === 'string'
            ? succeed(from as T)
            : fail(`Not a string: ${JSON.stringify(from)}`);
    }

    /**
     * @internal
     */
    protected static _wrap<T extends string, TC>(
        wrapped: StringConverter<T, TC>,
        converter: (from: T) => Result<T>,
        traits?: ConverterTraits
    ): StringConverter<T, TC> {
        return new StringConverter<T, TC>(undefined, undefined, (from: unknown) => {
            return wrapped.convert(from).onSuccess(converter);
        })._with(wrapped._traits(traits));
    }

    /**
     * Returns a {@link Converters.StringConverter | StringConverter} which constrains the result to match
     * a supplied string.
     * @param match - The string to be matched
     * @param options - Optional {@link Converters.StringMatchOptions} for this conversion.
     * @returns {@link Success} with a matching string or {@link Failure} with an informative
     * error if the string does not match.
     * {@label string}
     */
    public matching(match: string, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a {@link Converters.StringConverter | StringConverter} which constrains the result to match
     * one of a supplied array of strings.
     * @param match - The array of allowed strings.
     * @param options - Optional {@link Converters.StringMatchOptions} for this conversion.
     * @returns {@link Success} with a matching string or {@link Failure} with an informative
     * error if the string does not match.
     * {@label array}
     */
    public matching(match: string[], options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a {@link Converters.StringConverter | StringConverter} which constrains the result to match
     * one of a supplied `Set` of strings.
     * @param match - The `Set` of allowed strings.
     * @param options - Optional {@link Converters.StringMatchOptions} for this conversion.
     * @returns {@link Success} with a matching string or {@link Failure} with an informative
     * error if the string does not match.
     * {@label set}
     */
    public matching(match: Set<T>, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a {@link Converters.StringConverter | StringConverter} which constrains the result to match
     * a supplied regular expression.
     * @param match - The regular expression to be used as a constraint.
     * @param options - Optional {@link Converters.StringMatchOptions} for this conversion
     * @returns {@link Success} with a matching string or {@link Failure} with an informative
     * error if the string does not match.
     * {@label regexp}
     */
    public matching(match: RegExp, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Concrete implementation of {@link Converters.StringConverter.(matching#string) | StringConverter.matching(string)},
     * {@link Converters.StringConverter.(matching#array) | StringConverter.matching(string[])},
     * {@link Converters.StringConverter.(matching#set) | StringConverter.matching(Set<string>)}, and
     * {@link Converters.StringConverter.(matching#regexp) | StringConverter.matching(RegExp)}.
     * @internal
     */
    public matching(match: string | string[] | Set<T> | RegExp, options?: Partial<StringMatchOptions>): StringConverter<T, TC> {
        const message = options?.message;
        if (typeof match === 'string') {
            return StringConverter._wrap<T, TC>(this, (from: T) => {
                return (match === from)
                    ? succeed(from as T)
                    : fail(message
                        ? `"${from}": ${message}`
                        : `"${from}": does not match "${match}"`);
            });
        }
        else if (match instanceof RegExp) {
            return StringConverter._wrap<T, TC>(this, (from: T) => {
                return (match.test(from))
                    ? succeed(from as T)
                    : fail(message
                        ? `"${from}": ${message}`
                        : `"${from}": does not match "${match}"`);
            });
        }
        else if (match instanceof Set) {
            return StringConverter._wrap<T, TC>(this, (from: T) => {
                return (match.has(from))
                    ? succeed(from as T)
                    : fail(message
                        ? `"${from}": ${message}`
                        : `"${from}": not found in set`);
            });
        }
        else {
            return StringConverter._wrap<T, TC>(this, (from: T) => {
                return (match.includes(from))
                    ? succeed(from as T)
                    : fail(message
                        ? `"${from}": ${message}`
                        : `"${from}": not found in [${match.join(',')}]`);
            });
        }
    }
}

/**
 * A converter to convert unknown to string. Values of type
 * string succeed.  Anything else fails.
 * @public
 */
export const string = new StringConverter();

/**
 * Helper function to create a {@link Converters.StringConverter | StringConverter} which converts
 * `unknown` to `string`, applying template conversions supplied at construction time or at
 * runtime as context.
 * @remarks
 * Template conversions are applied using `mustache` syntax.
 * @param defaultContext - Optional default context to use for template values.
 * @returns A new {@link Converter} returning `string`.
 * @public
 */
export function templateString(defaultContext?: unknown): StringConverter<string, unknown> {
    return new StringConverter<string, unknown>(defaultContext, undefined, (from: unknown, _self: Converter<string, unknown>, context?: unknown) => {
        if (typeof from !== 'string') {
            return fail(`Not a string: ${JSON.stringify(from)}`);
        }
        return captureResult(() => Mustache.render(from, context));
    });
}

/**
 * Helper function to create a {@link Converter} which converts `unknown` to one of a set of supplied
 * enumerated values. Anything else fails.
 *
 * @remarks
 * Allowed enumerated values can also be supplied as context at conversion time.
 * @param values - Array of allowed values.
 * @returns A new {@link Converter} returning `<T>`.
 * @public
 */
export function enumeratedValue<T>(values: T[]): Converter<T, T[]> {
    return new BaseConverter((from: unknown, _self: Converter<T, T[]>, context?: T[]): Result<T> => {
        const v = context ?? values;
        const index = v.indexOf(from as T);
        return (index >= 0 ? succeed(v[index]) : fail(`Invalid enumerated value ${JSON.stringify(from)}`));
    });
}

/**
 * Helper function to create a {@link Converter} which converts `unknown` to one of a set of supplied enumerated
 * values, mapping any of multiple supplied values to the enumeration.
 * @remarks
 * Enables mapping of multiple input values to a consistent internal representation (so e.g. `'y'`, `'yes'`,
 * `'true'`, `1` and `true` can all map to boolean `true`)
 * @param map - An array of tuples describing the mapping. The first element of each tuple is the result
 * value, the second is the set of values that map to the result.  Tuples are evaluated in the order
 * supplied and are not checked for duplicates.
 * @param message - An optional error message.
 * @returns A {@link Converter} which applies the mapping and yields `<T>` on success.
 * @public
 */
export function mappedEnumeratedValue<T>(map: [T, unknown[]][], message?: string): Converter<T, undefined> {
    return new BaseConverter((from: unknown, _self: Converter<T, undefined>, _context?: unknown) => {
        for (const item of map) {
            if (item[1].includes(from)) {
                return succeed(item[0]);
            }
        }
        return fail(message ? `${JSON.stringify(from)}: ${message}` : `Cannot map '${JSON.stringify(from)}' to a supported value`);
    });
}

/**
 * Helper function to create a {@link Converter} which converts `unknown` to some supplied literal value. Succeeds with
 * the supplied value if an identity comparison succeeds, fails otherwise.
 * @param value - The value to be compared.
 * @returns A {@link Converter} which returns the supplied value on success.
 * @public
 */
export function literal<T>(value: T): Converter<T, unknown> {
    return new BaseConverter<T, unknown>((from: unknown, _self: Converter<T, unknown>, _context?: unknown): Result<T> => {
        return (from === value) ? succeed(value) : fail(`${JSON.stringify(from)}: does not match ${JSON.stringify(value)}`);
    });
}

/**
 * Deprecated alias for @see literal
 * @param value - The value to be compared.
 * @deprecated Use {@link Converters.literal} instead.
 * @internal
 */
export const value = literal;

/**
 * A {@link Converter} which converts `unknown` to a `number`.
 * @remarks
 * Numbers and strings with a numeric format succeed. Anything else fails.
 * @public
 */
export const number = new BaseConverter<number>((from: unknown) => {
    if (typeof from !== 'number') {
        const num: number = (typeof from === 'string' ? Number(from) : NaN);
        return isNaN(num)
            ? fail(`Not a number: ${JSON.stringify(from)}`)
            : succeed(num);
    }
    return succeed(from);
});

/**
 * A {@link Converter} which converts `unknown` to `boolean`.
 * @remarks
 * Boolean values or the case-insensitive strings `'true'` and `'false'` succeed.
 * Anything else fails.
 * @public
 */
export const boolean = new BaseConverter<boolean>((from: unknown) => {
    if (typeof from === 'boolean') {
        return succeed(from as boolean);
    }
    else if (typeof from === 'string') {
        switch (from.toLowerCase()) {
            case 'true': return succeed(true);
            case 'false': return succeed(false);
        }
    }
    return fail(`Not a boolean: ${JSON.stringify(from)}`);
});

/**
 * A {@link Converter} which converts an optional `string` value. Values of type
 * `string` are returned.  Anything else returns {@link Success} with value `undefined`.
 * @public
 */
export const optionalString = string.optional();

/**
 * Helper function to create a {@link Converter} which converts any `string` into an
 * array of `string`, by separating at a supplied delimiter.
 * @remarks
 * Delimiter may also be supplied as context at conversion time.
 * @param delimiter - The delimiter at which to split.
 * @returns A new {@link Converter} returning `string[]`.
 * @public
 */
export function delimitedString(delimiter: string, options: 'filtered'|'all' = 'filtered'): Converter<string[], string> {
    return new BaseConverter<string[], string>((from: unknown, _self: Converter<string[], string>, context?: string) => {
        const result = string.convert(from);
        if (result.isSuccess()) {
            let strings = result.value.split(context ?? delimiter);
            if (options !== 'all') {
                strings = strings.filter((s) => (s.trim().length > 0));
            }
            return succeed(strings);
        }
        return fail(result.message);
    });
}

/**
 * A {@link Converter} which converts an iso formatted string, a number or a `Date` object to
 * a `Date` object.
 * @public
 */
export const isoDate = new BaseConverter<Date>((from: unknown) => {
    if (typeof from === 'string') {
        const dt = DateTime.fromISO(from);
        if (dt.isValid) {
            return succeed(dt.toJSDate());
        }
        return fail(`Invalid date: ${dt.invalidExplanation}`);
    }
    else if (typeof from === 'number') {
        return succeed(new Date(from));
    }
    else if (from instanceof Date) {
        return succeed(from);
    }
    return fail(`Cannot convert ${JSON.stringify(from)} to Date`);
});

/**
 * Helper function to create a {@link Converter} from any {@link Validation.Validator}
 * @param validator - the validator to be wrapped
 * @returns A {@link Converter} which uses the supplied validator.
 * @public
 */
export function validated<T, TC=unknown>(validator: Validator<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self?: Converter<T, TC>, context?: TC) => {
        return validator.validate(from, context);
    });
}

/**
 * Helper function to create a {@link Converter} from a supplied type guard function.
 * @param description - a description of the thing to be validated for use in error messages
 * @param guard - a {@link Validation.TypeGuardWithContext} which performs the validation.
 * @returns A new {@link Converter} which validates the values using the supplied type guard
 * and returns them in place.
 * @public
 */
export function isA<T, TC=unknown>(description: string, guard: TypeGuardWithContext<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self?: Converter<T, TC>, context?: TC) => {
        if (guard(from, context)) {
            return succeed(from);
        }
        return fail(`invalid ${description} (${JSON.stringify(from)})`);
    });
}

/**
 * A {@link Converter} which converts an optional `number` value.
 * @remarks
 * Values of type `number` or numeric strings are converted and returned.
 * Anything else returns {@link Success} with value `undefined`.
 * @public
 */
export const optionalNumber = number.optional();

/**
 * A {@link Converter} to convert an optional `boolean` value.
 * @remarks
 * Values of type `boolean` or strings that match (case-insensitive) `'true'`
 * or `'false'` are converted and returned.  Anything else returns {@link Success}
 * with value `undefined`.
 * @public
 */
export const optionalBoolean = boolean.optional();

/**
 * A helper function to create a {@link Converter} for polymorphic values.  Returns a
 * converter which Invokes the wrapped converters in sequence, returning the first successful
 * result.  Returns an error if none of the supplied converters can convert the value.
 * @remarks
 * If `onError` is `ignoreErrors` (default), then errors from any of the
 * converters are ignored provided that some converter succeeds.  If
 * onError is `failOnError`, then an error from any converter fails the entire
 * conversion.
 *
 * @param converters - An ordered list of {@link Converter | converters} to be considered.
 * @param onError - Specifies treatment of unconvertible elements.
 * @returns A new {@link Converter} which yields a value from the union of the types returned
 * by the wrapped converters.
 * @public
 */
export function oneOf<T, TC=unknown>(converters: Array<Converter<T, TC>>, onError: OnError = 'ignoreErrors'): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        const errors: string[] = [];
        for (const converter of converters) {
            const result = converter.convert(from, context);
            if (result.isSuccess() && (result.value !== undefined)) {
                return result;
            }

            if (result.isFailure()) {
                if (onError === 'failOnError') {
                    return result;
                }
                errors.push(result.message);
            }
        }
        return fail(`No matching converter for ${JSON.stringify(from)}: ${errors.join('\n')}`);
    });
}

/**
 * A helper function to create a {@link Converter} which converts `unknown` to an array of `<T>`.
 * @remarks
 * If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
 * be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
 * @param converter - {@link Converter} used to convert each item in the array.
 * @param ignoreErrors - Specifies treatment of unconvertible elements.
 * @returns A {@link Converter} which returns an array of `<T>`.
 * @public
 */
export function arrayOf<T, TC=undefined>(converter: Converter<T, TC>, onError: OnError = 'failOnError'): Converter<T[], TC> {
    return new BaseConverter((from: unknown, _self: Converter<T[], TC>, context?: TC) => {
        if (!Array.isArray(from)) {
            return fail(`Not an array: ${JSON.stringify(from)}`);
        }

        const successes: T[] = [];
        const errors: string[] = [];
        for (const item of from) {
            const result = converter.convert(item, context);
            if (result.isSuccess() && result.value !== undefined) {
                successes.push(result.value);
            }
            else if (result.isFailure()) {
                errors.push(result.message);
            }
        }

        return (errors.length === 0) || (onError === 'ignoreErrors')
            ? succeed(successes)
            : fail(errors.join('\n'));
    });
}

/**
 * A helper function to create a {@link Converter} which converts `unknown` to {@link ExtendedArray | ExtendedArray<T>}.
 * @remarks
 * If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
 * be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
 * @param converter - {@link Converter} used to convert each item in the array
 * @param ignoreErrors - Specifies treatment of unconvertible elements
 * @beta
 */
export function extendedArrayOf<T, TC=undefined>(label: string, converter: Converter<T, TC>, onError: OnError = 'failOnError'): Converter<ExtendedArray<T>, TC> {
    return arrayOf(converter, onError).map((items: T[]) => {
        return captureResult(() => new ExtendedArray(label, ...items));
    });
}

/**
 * {@link Converter} to convert an `unknown` to an array of `string`.
 * @remarks
 * Returns {@link Success} with the the supplied value if it as an array
 * of strings, returns {@link Failure} with an error message otherwise.
 * @public
 */
export const stringArray = arrayOf(string);

/**
 * {@link Converter} to convert an `unknown` to an array of `number`.
 * @remarks
 * Returns {@link Success} with the the supplied value if it as an array
 * of numbers, returns {@link Failure} with an error message otherwise.
 * @public
 */
export const numberArray = arrayOf(number);

/**
 * Options for {@link Converters.recordOf.(:withOptions)} and {@link Converters.mapOf.(:withOptions)}
 * helper functions.
 * @public
 */
export interface KeyedConverterOptions<T extends string = string, TC=undefined> {
    /**
     * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
     * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
     */
    onError?: 'fail'|'ignore';
    /**
     * If present, `keyConverter` is used to convert the source object property names to
     * keys in the resulting map or record.
     * @remarks
     * Can be used to coerce key names to supported values and/or strong types.
     */
    keyConverter?: Converter<T, TC>;
}

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Record<string, T>`.
 * @remarks
 * The resulting converter fails conversion if any element cannot be converted.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @returns A {@link Converter} which returns `Record<string, T>`.
 * {@label default}
 * @public
 */
export function recordOf<T, TC=undefined, TK extends string=string>(converter: Converter<T, TC>): Converter<Record<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Record<string, T>` and optionally
 * specified handling of elements that cannot be converted.
 * @remarks
 * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
 * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @returns A {@link Converter} which returns `Record<string, T>`.
 * {@label withOnError}
 * @public
 */
export function recordOf<T, TC=undefined, TK extends string=string>(
    converter: Converter<T, TC>,
    onError: 'fail'|'ignore'
): Converter<Record<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Record<TK, T>`.
 * @remarks
 * If present, the supplied {@link Converters.KeyedConverterOptions | options} can provide a strongly-typed
 * converter for keys and/or control the handling of elements that fail conversion.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @param options - Optional {@link Converters.KeyedConverterOptions | KeyedConverterOptions<TK, TC>} which
 * supplies a key converter and/or error-handling options.
 * @returns A {@link Converter} which returns `Record<TK, T>`.
 * {@label withOptions}
 * @public
 */
export function recordOf<T, TC=undefined, TK extends string=string>(
    converter: Converter<T, TC>,
    options: KeyedConverterOptions<TK, TC>
): Converter<Record<TK, T>, TC>;

/**
 * Concrete implementation of {@link Converters.(recordOf:default) | Converters.recordOf(Converter<T>)},
 * {@link Converters.(recordOf:withOnError) | Converters.recordOf(Converter<T>, 'fail'|'ignore')}, and
 * {@link Converters.(recordOf:withOptions) | Converters.recordOf(Converter<T>, KeyedConverterOptions)}.
 * @internal
 */
export function recordOf<T, TC=undefined, TK extends string=string>(
    converter: Converter<T, TC>,
    option: 'fail'|'ignore'|KeyedConverterOptions<TK, TC> = 'fail'
): Converter<Record<TK, T>, TC> {
    const options: KeyedConverterOptions<TK, TC> = (typeof option === 'string') ? { onError: option } : { onError: 'fail', ...option };
    return new BaseConverter((from: unknown, _self: Converter<Record<TK, T>, TC>, context?: TC) => {
        if ((typeof from !== 'object') || (from === null) || Array.isArray(from)) {
            return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
        }

        const record: Record<string, T> = {};
        const errors: string[] = [];

        for (const key in from) {
            if (isKeyOf(key, from)) {
                const writeKeyResult = options.keyConverter?.convert(key, context) ?? succeed(key);

                writeKeyResult.onSuccess((writeKey) => {
                    return converter.convert(from[key] as unknown, context).onSuccess((value) => {
                        record[writeKey] = value;
                        return succeed(true);
                    });
                }).onFailure((message) => {
                    errors.push(message);
                    return fail(message);
                });
            }
        }

        return (errors.length === 0) || (options.onError === 'ignore')
            ? succeed(record)
            : fail(errors.join('\n'));
    });
}

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Map<string, T>`.
 * @remarks
 * The resulting converter fails conversion if any element cannot be converted.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @returns A {@link Converter} which returns `Map<string, T>`.
 * {@label default}
 * @public
 */
export function mapOf<T, TC = undefined, TK extends string = string>(converter: Converter<T, TC>): Converter<Map<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Map<string, T>` and optionally
 * specified handling of elements that cannot be converted.
 * @remarks
 * if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
 * cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @returns A {@link Converter} which returns `Map<string, T>`.
 * {@label withOnError}
 * @public
 */
export function mapOf<T, TC = undefined, TK extends string = string>(
    converter: Converter<T, TC>,
    onError: 'fail' | 'ignore'
): Converter<Map<TK, T>, TC>;

/**
 * A helper function to create a {@link Converter} which converts the `string`-keyed properties
 * using a supplied {@link Converter | Converter<T>} to produce a `Map<TK, T>`.
 * @remarks
 * If present, the supplied {@link Converters.KeyedConverterOptions | options} can provide a strongly-typed
 * converter for keys and/or control the handling of elements that fail conversion.
 * @param converter - {@link Converter} used to convert each item in the source object.
 * @param options - Optional {@link Converters.KeyedConverterOptions | KeyedConverterOptions<TK, TC>} which
 * supplies a key converter and/or error-handling options.
 * @returns A {@link Converter} which returns `Map<TK, T>`.
 * {@label withOptions}
 * @public
 */
export function mapOf<T, TC = undefined, TK extends string = string>(
    converter: Converter<T, TC>,
    options: KeyedConverterOptions<TK, TC>
): Converter<Map<TK, T>, TC>;

/**
 * Concrete implementation of {@link Converters.(mapOf:default) | Converters.mapOf(Converter<T>)},
 * {@link Converters.(mapOf:withOnError) | Converters.mapOf(Converter<T>, 'fail'|'ignore')}, and
 * {@link Converters.(mapOf:withOptions) | Converters.mapOf(Converter<T>, KeyedConverterOptions)}.
 * @internal
 */
export function mapOf<T, TC = undefined, TK extends string = string>(
    converter: Converter<T, TC>,
    option: 'fail' | 'ignore' | KeyedConverterOptions<TK, TC> = 'fail'
): Converter<Map<TK, T>, TC> {
    const options = (typeof option === 'string') ? { onError: option } : { onError: 'fail', ...option };
    return new BaseConverter((from: unknown, _self: Converter<Map<TK, T>, TC>, context?: TC) => {
        if ((typeof from !== 'object') || (from === null) || Array.isArray(from)) {
            return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
        }

        const map = new Map<TK, T>();
        const errors: string[] = [];

        for (const key in from) {
            if (isKeyOf(key, from)) {
                const writeKeyResult = options.keyConverter?.convert(key, context) ?? succeed(key);

                writeKeyResult.onSuccess((writeKey) => {
                    return converter.convert(from[key] as unknown, context).onSuccess((value) => {
                        map.set(writeKey, value);
                        return succeed(true);
                    });
                }).onFailure((message) => {
                    errors.push(message);
                    return fail(message);
                });
            }
        }

        return (errors.length === 0) || (options.onError === 'ignore')
            ? succeed(map)
            : fail(errors.join('\n'));
    });
}

/**
 * Helper function to create  a {@link Converter} which validates that a supplied value is
 * of a type validated by a supplied validator function and returns it.
 * @remarks
 * If `validator` succeeds, this {@link Converter} returns {@link Success} with the supplied
 * value of `from` coerced to type `<T>`.  Returns a {@link Failure} with additional
 * information otherwise.
 * @param validator - A validator function to determine if the converted value is valid.
 * @param description - A description of the validated type for use in error messages.
 * @returns A new {@link Converter | Converter<T>} which applies the supplied validation.
 * @public
 */
export function validateWith<T, TC=undefined>(validator: (from: unknown) => from is T, description?: string): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self: Converter<T, TC>, _context?: TC) => {
        if (validator(from)) {
            return succeed(from);
        }
        return fail(`${JSON.stringify(from)}: invalid ${description ?? 'value'}`);
    });
}

/**
 * A helper function to create a {@link Converter} which extracts and converts an element from an array.
 * @remarks
 * The returned {@link Converter} returns {@link Success} with the converted value if the element exists
 * in the supplied array and can be converted. Returns {@link Failure} with an error message otherwise.
 * @param index - The index of the element to be extracted.
 * @param converter - A {@link Converter} used to convert the extracted element.
 * @returns A {@link Converter | Converter<T>} which extracts the specified element from an array.
 * @public
 */
export function element<T, TC=undefined>(index: number, converter: Converter<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self: Converter<T, TC>, context?: TC) => {
        if (index < 0) {
            return fail(`${index}: cannot convert for a negative element index`);
        }
        else if (!Array.isArray(from)) {
            return fail('element converter: source is not an array');
        }
        else if (index >= from.length) {
            return fail(`${index}: element converter index out of range (0..${from.length - 1})`);
        }
        return converter.convert(from[index], context);
    });
}

/**
 * A helper function to create a {@link Converter} which extracts and converts an optional element from an array.
 * @remarks
 * The resulting {@link Converter} returns {@link Success} with the converted value if the element exists
 * in the supplied array and can be converted. Returns {@link Success} with value `undefined` if the parameter
 * is an array but the index is out of range. Returns {@link Failure} with a message if the supplied parameter
 * is not an array, if the requested index is negative, or if the element cannot be converted.
 * @param index - The index of the element to be extracted.
 * @param converter - A {@link Converter} used to convert the extracted element.
 * @returns A {@link Converter | Converter<T>} which extracts the specified element from an array.
 * @public
 */
export function optionalElement<T, TC=undefined>(index: number, converter: Converter<T, TC>): Converter<T|undefined, TC> {
    return new BaseConverter((from: unknown, _self: Converter<T|undefined, TC>, context?: TC) => {
        if (index < 0) {
            return fail(`${index}: cannot convert for a negative element index`);
        }
        else if (!Array.isArray(from)) {
            return fail('element converter: source is not an array');
        }
        else if (index >= from.length) {
            return succeed(undefined);
        }
        return converter.convert(from[index], context);
    });
}

/**
 * A helper function to create a {@link Converter} which extracts and convert a property specified
 * by name from an object.
 * @remarks
 * The resulting {@link Converter} returns {@link Success} with the converted value of the corresponding
 * object property if the field exists and can be converted. Returns {@link Failure} with an error message
 * otherwise.
 * @param name - The name of the field to be extracted.
 * @param converter - {@link Converter} used to convert the extracted field.
 * @public
 */
export function field<T, TC=undefined>(name: string, converter: Converter<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self: Converter<T, TC>, context?: TC) => {
        if (typeof from === 'object' && (!Array.isArray(from)) && from !== null) {
            if (isKeyOf(name, from)) {
                return converter.convert(from[name], context).onFailure((message) => {
                    return fail(`Field ${name}: ${message}`);
                });
            }
            return fail(`Field ${name} not found in: ${JSON.stringify(from)}`);
        }
        return fail(`Cannot convert field "${name}" from non-object ${JSON.stringify(from)}`);
    });
}

/**
 * A helper function to create a {@link Converter} which extracts and convert a property specified
 * by name from an object.
 * @remarks
 * The resulting {@link Converter} returns {@link Success} with the converted value of the corresponding
 * object property if the field exists and can be converted. Returns {@link Success} with value `undefined`
 * if the supplied parameter is an object but the named field is not present.  Returns {@link Failure} with
 * an error message otherwise.
 * @param name - The name of the field to be extracted.
 * @param converter - {@link Converter} used to convert the extracted field.
 * @public
 */
export function optionalField<T, TC=undefined>(name: string, converter: Converter<T, TC>): Converter<T|undefined, TC> {
    return new BaseConverter((from: unknown, _self: Converter<T|undefined, TC>, context?: TC) => {
        if (typeof from === 'object' && (!Array.isArray(from)) && from !== null) {
            if (isKeyOf(name, from)) {
                const result = converter.convert(from[name], context).onFailure((message) => {
                    return fail(`${name}: ${message}`);
                });

                // if conversion was successful or input was undefined we
                // succeed with 'undefined', but we propagate actual
                // failures.
                if (result.isSuccess() || (from[name] !== undefined)) {
                    return result;
                }
            }
            return succeed(undefined);
        }
        return fail(`Cannot convert field "${name}" from non-object ${JSON.stringify(from)}`);
    }, undefined, { isOptional: true });
}

/**
 * Options for an {@link Converters.ObjectConverter | ObjectConverter}.
 * @public
 */
export interface ObjectConverterOptions<T> {
    /**
     * If present, lists optional fields. Missing non-optional fields cause an error.
     */
    optionalFields?: (keyof T)[];
    /**
     * If true, unrecognized fields yield an error.  If false or undefined (default),
     * unrecognized fields are ignored.
     */
    strict?: boolean;
    /**
     * Optional description to be included in error messages.
     */
    description?: string;
}

/**
 * Per-property converters for each of the properties in type T.
 * @remarks
 * Used to construct a {@link Converters.ObjectConverter | ObjectConverter}
 * @public
 */
export type FieldConverters<T, TC=unknown> = { [ key in keyof T ]: Converter<T[key], TC> };

/**
 * A {@link Converter} which converts an object of type `<T>` without changing shape, given
 * a {@link Converters.FieldConverters | FieldConverters<T>} for the fields in the object.
 * @remarks
 * By default, if all of the required fields exist and can be converted, returns a new object with
 * the converted values under the original key names.  If any required fields do not exist or cannot
 * be converted, the entire conversion fails. See {@link Converters.ObjectConverterOptions | ObjectConverterOptions}
 * for other conversion options.
 * @public
 */
export class ObjectConverter<T, TC=unknown> extends BaseConverter<T, TC> {
    /**
     * Fields converted by this {@link Converters.ObjectConverter | ObjectConverter}.
     */
    public readonly fields: FieldConverters<T>;
    /**
     * Options used to initialize this {@link Converters.ObjectConverter | ObjectConverter}.
     */
    public readonly options: ObjectConverterOptions<T>;

    /**
     * Constructs a new {@link Converters.ObjectConverter | ObjectConverter<T>} using options
     * supplied in a {@link Converters.ObjectConverterOptions | ObjectConverterOptions<T>}.
     * @param fields - A {@link Converters.FieldConverters | FieldConverters<T>} containing
     * a {@link Converter} for each field
     * @param options - An optional @see ObjectConverterOptions to configure the conversion
     * {@label withOptions}
     */
    public constructor(fields: FieldConverters<T, TC>, options?: ObjectConverterOptions<T>)

    /**
     * Constructs a new {@link Converters.ObjectConverter | ObjectConverter<T>} with optional
     * properties specified as an array of `keyof T`.
     * @param fields - A {@link Converters.FieldConverters | FieldConverters<T>} containing
     * a {@link Converter} for each field.
     * @param optional - An array of `keyof T` listing fields that are not required.
     * {@label withKeys}
     */
    public constructor(fields: FieldConverters<T, TC>, optional?: (keyof T)[]);
    /**
     * Concrete implementation of {@link Converters.ObjectConverter.(constructor:withOptions)}
     * and {@link Converters.ObjectConverter.(constructor:withKeys)}.
     * @internal
     */
    public constructor(fields: FieldConverters<T, TC>, opt?: ObjectConverterOptions<T>|(keyof T)[]) {
        super((from: unknown, _self, context?: TC) => {
            // eslint bug thinks key is used before defined
            // eslint-disable-next-line no-use-before-define
            const converted = {} as { [key in keyof T]: T[key] };
            const errors: string[] = [];
            for (const key in fields) {
                if (fields[key]) {
                    const isOptional = (fields[key].isOptional || this.options.optionalFields?.includes(key)) ?? false;
                    const result = isOptional
                        ? optionalField(key, fields[key]).convert(from, context)
                        : field(key, fields[key]).convert(from, context);
                    if (result.isSuccess() && (result.value !== undefined)) {
                        converted[key] = result.value;
                    }
                    else if (result.isFailure()) {
                        errors.push(result.message);
                    }
                }
            }

            if (this.options.strict === true) {
                if ((typeof from === 'object') && (!Array.isArray(from))) {
                    for (const key in from) {
                        if (from.hasOwnProperty(key) && (!isKeyOf(key, fields) || (fields[key] === undefined))) {
                            errors.push(`${key}: unexpected property in source object`);
                        }
                    }
                }
                else {
                    errors.push('source is not an object');
                }
            }
            return (errors.length === 0) ? succeed(converted) : fail(this.options.description ? `${this.options.description}: ${errors.join('\n')}` : errors.join('\n'));
        });

        this.fields = fields;
        if (Array.isArray(opt)) {
            this.options = { optionalFields: opt };
        }
        else {
            this.options = opt ?? {};
        }
    }

    /**
     * Creates a new {@link Converters.ObjectConverter | ObjectConverter} derived from this one but with
     * new optional properties as specified by a supplied {@link Converters.ObjectConverterOptions | ObjectConverterOptions<T>}.
     * @param options - The {@link Converters.ObjectConverterOptions | options} to be applied to the new
     * converter.
     * @returns A new {@link Converters.ObjectConverter | ObjectConverter} with the additional optional source properties.
     * {@label withOptions}
     */
    public partial(options: ObjectConverterOptions<T>): ObjectConverter<Partial<T>, TC>;

    /**
     * Creates a new {@link Converters.ObjectConverter | ObjectConverter} derived from this one but with
     * new optional properties as specified by a supplied array of `keyof T`.
     * @param optional - The keys of the source object properties to be made optional.
     * @returns A new {@link Converters.ObjectConverter | ObjectConverter} with the additional optional source
     * properties.
     * {@label withKeys}
     */
    public partial(optional?: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
    /**
     * Concrete implementation of
     * {@link Converters.ObjectConverter.(partial:withOptions) | ObjectConverter.partial(ObjectConverterOptions)} and
     * {@link Converters.ObjectConverter.(partial:withKeys) | ObjectConverter.partial((keyof T)[]}.
     * @internal
     */
    public partial(opt?: ObjectConverterOptions<T>|(keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return new ObjectConverter<Partial<T>, TC>(this.fields as FieldConverters<Partial<T>, TC>, opt as ObjectConverterOptions<Partial<T>>)._with(this._traits());
    }

    /**
     * Creates a new {@link Converters.ObjectConverter | ObjectConverter} derived from this one but with
     * new optional properties as specified by a supplied array of `keyof T`.
     * @param addOptionalProperties - The keys to be made optional.
     * @returns A new {@link Converters.ObjectConverter | ObjectConverter} with the additional optional source
     * properties.
     */
    public addPartial(addOptionalProperties: (keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return this.partial([...this.options.optionalFields ?? [], ...addOptionalProperties])._with(this._traits());
    }
}

/**
 * Helper function to create a {@link Converters.ObjectConverter | ObjectConverter<T>} which converts an object
 * without changing shape, given a {@link Converters.FieldConverters | FieldConverters<T>} and an optional
 * {@link Converters.ObjectConverterOptions | ObjectConverterOptions<T>} to further refine conversion behavior.
 * @remarks
 * By default, if all of the requested fields exist and can be converted, returns {@link Success}
 * with a new object that contains the converted values under the original key names.  If any required properties
 * do not exist or cannot be converted, the entire conversion fails, returning {@link Failure} with additional
 * error information.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 * @param properties - An {@link Converters.FieldConverters | FieldConverters<T>} defining the shape of the
 * source object and {@link Converter | converters} to be applied to each properties.
 * @param options - An {@link Converters.ObjectConverterOptions | ObjectConverterOptions<T>} containing options
 * for the object converter.
 * @returns A new {@link Converters.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label withOptions}
 * @public
 */
export function object<T>(properties: FieldConverters<T>, options?: ObjectConverterOptions<T>): ObjectConverter<T>;

/**
 * Helper function to create a {@link Converters.ObjectConverter | ObjectConverter<T>} which converts an object
 * without changing shape, given a {@link Converters.FieldConverters | FieldConverters<T>} and a set of
 * optional properties.
 * @remarks
 * By default, if all of the requested fields exist and can be converted, returns {@link Success}
 * with a new object that contains the converted values under the original key names.  If any required properties
 * do not exist or cannot be converted, the entire conversion fails, returning {@link Failure} with additional
 * error information.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 * @param properties - An {@link Converters.FieldConverters | FieldConverters<T>} defining the shape of the
 * source object and {@link Converter | converters} to be applied to each properties.
 * @param optional - An array of `(keyof T)` listing the keys to be considered optional.
 * {@label withKeys}
 * @returns A new {@link Converters.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * @public
 * @deprecated Use {@link Converters.object.(:withOptions) | Converters.object(fields, options)} instead.
 */

export function object<T>(properties: FieldConverters<T>, optional: (keyof T)[]): ObjectConverter<T>;
/**
 * Concrete implementation of {@link Converters.(object:withOptions) | Converters.object(fields, options)}
 * and {@link Converters.(object:withKeys) | Converters.objects(fields, optionalKeys)}.
 * @internal
 */
export function object<T>(properties: FieldConverters<T>, options?: (keyof T)[]|ObjectConverterOptions<T>): ObjectConverter<T> {
    return new ObjectConverter(properties, options as ObjectConverterOptions<T>);
}

/**
 * Options for the {@link Converters.strictObject.(:withOptions)} helper function.
 * @public
 */
export type StrictObjectConverterOptions<T> = Omit<ObjectConverterOptions<T>, 'strict'>;

/**
 * Helper function to create a {@link Converters.ObjectConverter | ObjectConverter} which converts an object
 * without changing shape, a {@link Converters.FieldConverters | FieldConverters<T>} and an optional
 * {@link Converters.StrictObjectConverterOptions | StrictObjectConverterOptions<T>} to further refine
 * conversion behavior.
 *
 * @remarks
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * The conversion fails if any unexpected fields are encountered.
 *
 * @param properties - An object containing defining the shape and converters to be applied.
 * @param options - An optional @see StrictObjectConverterOptions<T> containing options for the object converter.
 * @returns A new {@link Converters.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label withOptions}
 * @public
 */
export function strictObject<T>(properties: FieldConverters<T>, options?: StrictObjectConverterOptions<T>): ObjectConverter<T>;

/**
 * Helper function to create a {@link Converters.ObjectConverter | ObjectConverter} which converts an object
 * without changing shape, a {@link Converters.FieldConverters | FieldConverters<T>} and an optional
 * {@link Converters.StrictObjectConverterOptions | StrictObjectConverterOptions<T>} to further refine
 * conversion behavior.
 *
 * @remarks
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * The conversion fails if any unexpected fields are encountered.
 *
 * @param properties - An object containing defining the shape and converters to be applied.
 * @param optional - An array of `keyof T` containing keys to be considered optional.
 * @returns A new {@link Converters.ObjectConverter | ObjectConverter} which applies the specified conversions.
 * {@label withKeys}
 * @deprecated Use {@link Converters.strictObject(:withOptions) | Converters.strictObject(options)} instead.
 * @public
 */
export function strictObject<T>(properties: FieldConverters<T>, optional: (keyof T)[]): ObjectConverter<T>;

/**
 * Concrete implementation for {@link Converters.strictObject(:withOptions) | Converters.strictObject(fields, options)}
 * and {@link Converters.(strictObject:withKeys) | Converters.strictObject(fields, optional)}.
 * @internal
 */
export function strictObject<T>(
    properties: FieldConverters<T>,
    opt?: (keyof T)[]|StrictObjectConverterOptions<T>,
): ObjectConverter<T> {
    const options: ObjectConverterOptions<T> = (opt && Array.isArray(opt))
        ? { strict: true, optionalFields: opt }
        : { ...(opt ?? {}), strict: true };
    return new ObjectConverter(properties, options);
}

/**
 * A string-keyed `Record<string, Converter>` which maps specific {@link Converter | converters} to the
 * value of a discriminator property.
 * @public
 */
export type DiscriminatedObjectConverters<T, TD extends string = string, TC=unknown> = Record<TD, Converter<T, TC>>;

/**
 * Helper to create a {@link Converter} which converts a discriminated object without changing shape.
 * @remarks
 * Takes the name of the discriminator property and a
 * {@link Converters.DiscriminatedObjectConverters | string-keyed Record of converters}. During conversion,
 * the resulting {@link Converter} invokes the converter from `converters` that corresponds to the value of
 * the discriminator property in the source object.
 *
 * If the source is not an object, the discriminator property is missing, or the discriminator has
 * a value not present in the converters, conversion fails and returns {@link Failure} with more information.
 * @param discriminatorProp - Name of the property used to discriminate types.
 * @param converters - {@link Converters.DiscriminatedObjectConverters | String-keyed record of converters} to
 * invoke, where each key corresponds to a value of the discriminator property.
 * @returns A {@link Converter} which converts the corresponding discriminated object.
 * @public
 */
export function discriminatedObject<T, TD extends string = string, TC=unknown>(discriminatorProp: string, converters: DiscriminatedObjectConverters<T, TD>): Converter<T, TC> {
    return new BaseConverter((from: unknown) => {
        if ((typeof from !== 'object') || Array.isArray(from) || from === null) {
            return fail(`Not a discriminated object: "${JSON.stringify(from)}"`);
        }
        if ((!isKeyOf(discriminatorProp, from)) || (!from[discriminatorProp])) {
            return fail(`Discriminator property ${discriminatorProp} not present in "${JSON.stringify(from)}"`);
        }

        const discriminatorValue = from[discriminatorProp] as TD;
        const converter = converters[discriminatorValue];
        if (converter === undefined) {
            return fail(`No converter for discriminator ${discriminatorProp}="${discriminatorValue}"`);
        }
        return converter.convert(from);
    });
}


/**
 * Helper to create a {@link Converter} which converts a source object to a new object with a
 * different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter} returns {@link Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 * It returns {@link Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * @param properties - An object with key names that correspond to the target object and an
 * appropriate {@link Converters.FieldConverters | FieldConverter} which extracts and converts
 * a single filed from the source object.
 * @returns A {@link Converter} with the specified conversion behavior.
 * @public
 */
export function transform<T, TC=unknown>(properties: FieldConverters<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        // eslint bug thinks key is used before defined
        // eslint-disable-next-line no-use-before-define
        const converted = {} as { [ key in keyof T]: T[key] };
        const errors: string[] = [];

        for (const key in properties) {
            if (properties[key]) {
                const result = properties[key].convert(from, context);
                if (result.isSuccess() && (result.value !== undefined)) {
                    converted[key] = result.value;
                }
                else if (result.isFailure()) {
                    errors.push(result.message);
                }
            }
        }

        return (errors.length === 0) ? succeed(converted) : fail(errors.join('\n'));
    });
}

/**
 * Per-property converters and configuration for each field in the destination object of
 * a {@link Converters.transformObject} call.
 * @public
 */
export type FieldTransformers<TSRC, TDEST, TC=unknown> = { [ key in keyof TDEST ]: {
    /**
     * The name of the property in the source object to be converter.
     */
    from: keyof TSRC,
    /**
     * The converter used to convert the property.
     */
    converter: Converter<TDEST[key], TC>,
    /**
     * If `true` then a missing source property is ignored.  If `false` or omitted
     * then a missing source property causes an error.
     */
    optional?: boolean,
} };

/**
 * Options for a {@link Converters.transformObject} call.
 * @public
 */
export interface TransformObjectOptions<TSRC> {
    /**
     * If `strict` is `true` then unused properties in the source object cause
     * an error, otherwise they are ignored.
     */
    strict: true;

    /**
     * An optional list of source properties to be ignored when strict mode
     * is enabled.
     */
    ignore?: (keyof TSRC)[];

    /**
     * An optional description of this transform to be used for error messages.
     */
    description?: string;
}

/**
 * Helper to create a strongly-typed {@link Converter} which converts a source object to a
 * new object with a different shape.
 *
 * @remarks
 * On successful conversion, the resulting {@link Converter} returns {@link Success} with a new
 * object, which contains the converted values under the key names specified at initialization time.
 *
 * It returns {@link Failure} with an error message if any fields to be extracted do not exist
 * or cannot be converted.
 *
 * @param destinationFields - An object with key names that correspond to the target object and an
 * appropriate {@link Converters.FieldTransformers | FieldTransformers} which specifies the name
 * of the corresponding property in the source object, the converter used to convert the source
 * property and any configuration to guide the conversion.
 * @param options - Options which affect the transformation.
 *
 * @returns A {@link Converter} with the specified conversion behavior.
 * @public
 */
export function transformObject<TSRC, TDEST, TC=unknown>(
    destinationFields: FieldTransformers<TSRC, TDEST, TC>,
    options?: TransformObjectOptions<TSRC>
): Converter<TDEST, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        // eslint bug thinks key is used before defined
        // eslint-disable-next-line no-use-before-define
        const converted = {} as { [ key in keyof TDEST ]: TDEST[key] };
        const errors: string[] = [];
        const used: Set<keyof TSRC> = new Set(options?.ignore);

        if ((typeof from === 'object') && (!Array.isArray(from)) && (from !== null)) {
            for (const destinationKey in destinationFields) {
                if (destinationFields[destinationKey]) {
                    const srcKey = destinationFields[destinationKey].from;
                    const converter = destinationFields[destinationKey].converter;

                    if (isKeyOf(srcKey, from)) {
                        const result = converter.convert(from[srcKey], context);
                        if (result.isSuccess() && result.value !== undefined) {
                            converted[destinationKey] = result.value;
                        }
                        else if (result.isFailure()) {
                            errors.push(`${srcKey}->${destinationKey}: ${result.message}`);
                        }
                        used.add(srcKey);
                    }
                    else if (destinationFields[destinationKey].optional !== true) {
                        errors.push(`${String(srcKey)}: required property missing in source object.`);
                    }
                }
            }

            if (options?.strict === true) {
                for (const key in from) {
                    if (isKeyOf(key, from) && (!used.has(key as keyof TSRC))) {
                        errors.push(`${key}: unexpected property in source object`);
                    }
                }
            }
        }
        else {
            errors.push('source is not an object');
        }

        return (errors.length === 0) ? succeed(converted) : fail(options?.description ? `${options.description}:\n  ${errors.join('\n  ')}` : errors.join('\n'));
    });
}

/**
 * A helper wrapper to construct a {@link Converter} which converts to an arbitrary strongly-typed
 * range of some comparable type.
 * @param converter - {@link Converter} used to convert `min` and `max` extent of the range.
 * @param constructor - Static constructor to instantiate the object.
 * @public
 */
export function rangeTypeOf<T, RT extends RangeOf<T>, TC=unknown>(converter: Converter<T, TC>, constructor: (init: RangeOfProperties<T>) => Result<RT>): Converter<RT, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        const result = object({
            min: converter,
            max: converter,
        }, { optionalFields: ['min', 'max'] }).convert(from, context);
        if (result.isSuccess()) {
            return constructor({ min: result.value.min, max: result.value.max });
        }
        return fail(result.message);
    });
}

/**
 * A helper wrapper to construct a {@link Converter} which converts to {@link RangeOf | RangeOf<T>}
 * where `<T>` is some comparable type.
 * @param converter - {@link Converter} used to convert `min` and `max` extent of the range.
 * @public
 */
export function rangeOf<T, TC=unknown>(converter: Converter<T, TC>): Converter<RangeOf<T>, TC> {
    return rangeTypeOf<T, RangeOf<T>, TC>(converter, RangeOf.createRange);
}
