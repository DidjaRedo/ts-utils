
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

import { DateTime } from 'luxon';
import { ExtendedArray } from './extendedArray';
import Mustache from 'mustache';
import { isKeyOf } from './utils';

type OnError = 'failOnError' | 'ignoreErrors';

/**
 * Options for @see StringConverter maching method
 */
export interface StringMatchOptions {
    /**
     * An optional message to be displayed if a non-matching string
     * is encountered.
     */
    message?: string;
}

/**
 * The @see StringConverter class extends @see BaseConverter to provide string-specific helper
 * functions.
 */
export class StringConverter<T extends string = string, TC = unknown> extends BaseConverter<T, TC> {
    /**
     * Construct a new @see StringConverter
     * @param defaultContext Optional context used by the conversion
     * @param traits Optional traits to be applied to the conversion
     * @param converter Optional converter to be used for the conversion
     */
    public constructor(
        defaultContext?: TC,
        traits?: ConverterTraits,
        converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T> = StringConverter._convert,
    ) {
        super(converter, defaultContext, traits);
    }

    protected static _convert<T extends string>(from: unknown): Result<T> {
        return typeof from === 'string'
            ? succeed(from as T)
            : fail(`Not a string: ${JSON.stringify(from)}`);
    }

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
     * Returns a @see StringConverter which constrains the result to match a supplied
     * string.
     * @param match The string to be matched
     * @param options Optional @see StringMatchOptions for this conversion
     * @returns @see Success with a matching string or @see Failure with an informative
     * error if the string does not match.
     */
    public matching(match: string, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a @see StringConverter which constrains the result to match one of a supplied
     * array of strings.
     * @param match The array to be searched
     * @param options Optional @see StringMatchOptions for this conversion
     * @returns @see Success with a matching string or @see Failure with an informative
     * error if the string does not match.
     */
    public matching(match: string[], options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a @see StringConverter which constrains the result to match one of a supplied
     * Set of strings.
     * @param match The Set to be tested
     * @param options Optional @see StringMatchOptions for this conversion
     * @returns @see Success with a matching string or @see Failure with an informative
     * error if the string does not match.
     */
    public matching(match: Set<T>, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;

    /**
     * Returns a @see StringConverter which constrains the result to match a supplied regular
     * expression.
     * @param match The @see RegExp to be tested
     * @param options Optional @see StringMatchOptions for this conversion
     * @returns @see Success with a matching string or @see Failure with an informative
     * error if the string does not match.
     */
    public matching(match: RegExp, options?: Partial<StringMatchOptions>): StringConverter<T, TC>;
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
 */
export const string = new StringConverter();

/**
 * Helper function to create a converter which converts unknown to string, applying
 * template conversions supplied at construction time or at runtime as context.
 * @param defaultContext optional default context to use for template values
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
 * A converter to convert unknown to one of a set of supplied enumerated values. Anything else fails.
 * Allowed enumerated values can also be supplied as context at conversion time.
 * @param values Array of allowed values
 */
export function enumeratedValue<T>(values: T[]): Converter<T, T[]> {
    return new BaseConverter((from: unknown, _self: Converter<T, T[]>, context?: T[]): Result<T> => {
        const v = context ?? values;
        const index = v.indexOf(from as T);
        return (index >= 0 ? succeed(v[index]) : fail(`Invalid enumerated value ${JSON.stringify(from)}`));
    });
}

/**
 * A converter to convert unknown to some value. Succeeds with the supplied value if an identity
 * comparison succeeds, fails otherwise.
 * @param value The value to be compared
 */
export function literal<T>(value: T): Converter<T, unknown> {
    return new BaseConverter<T, unknown>((from: unknown, _self: Converter<T, unknown>, _context?: unknown): Result<T> => {
        return (from === value) ? succeed(value) : fail(`${JSON.stringify(from)}: does not match ${JSON.stringify(value)}`);
    });
}

/**
 * Deprecated alias for @see literal
 * @param value The value to be compared
 * @deprecated use literal instead
 */
export const value = literal;

/**
 * A converter to convert unknown to a number.  Numbers and strings
 * with a numeric format succeed.  Anything else fails.
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
 * A converter to convert unknown to boolean. Boolean values or the
 * case-insensitive strings 'true' and 'false' succeed.  Anything
 * else fails.
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
 * A converter to convert an optional string value. Values of type string
 * are returned.  Anything else returns success with an undefined value.
 */
export const optionalString = string.optional();

/**
 * Creates a converter which converts any string into an array of strings
 * by separating at a supplied delimiter. Delimeter may also be supplied
 * as context at conversion time.
 * @param delimiter The delimiter at which to split.
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
 * A converter to convert an iso formatted string, a number or a Date object to a Date object
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
 * A converter to convert an optional number value. Values of type number
 * or numeric strings are converted and returned. Anything else returns
 * success with an undefined value.
 */
export const optionalNumber = number.optional();

/**
 * A converter to convert an optional boolean value. Values of type boolean
 * or strings that match (case-insensitive) 'true' or 'false' are converted
 * and returned.  Anything else returns success with an undefined value.
 */
export const optionalBoolean = boolean.optional();

/**
 * A helper wrapper for polymorphic fields. Invokes the wrapped converters
 * in sequence, returning the first successful result.  Returns an error
 * if none of the supplied converters can convert the value.
 *
 * If onError is 'ignoreErrors' (default), then errors from any of the
 * converters are ignored provided that some converter succeeds.  If
 * onError is 'failOnError', then an error from any converter fails the entire
 * conversion.
 *
 * @param converters An ordered list of converters to be considered
 * @param onError Specifies treatment of unconvertable elements
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
 * A helper wrapper for converting an array of <T>.  If onError is 'failOnError' (default),
 * then the entire conversion fails if any element cannot be converted.  If onError
 * is 'ignoreErrors', failing elements are silently ignored.
 * @param converter Converter used to convert each item in the array
 * @param ignoreErrors Specifies treatment of unconvertable elements
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
 * A helper wrapper for converting to Itemrray<T>.  If onError is 'failOnError' (default),
 * then the entire conversion fails if any element cannot be converted.  If onError
 * is 'ignoreErrors', failing elements are silently ignored.
 * @param converter Converter used to convert each item in the array
 * @param ignoreErrors Specifies treatment of unconvertable elements
 */
export function extendedArrayOf<T, TC=undefined>(label: string, converter: Converter<T, TC>, onError: OnError = 'failOnError'): Converter<ExtendedArray<T>, TC> {
    return arrayOf(converter, onError).map((items: T[]) => {
        return captureResult(() => new ExtendedArray(label, ...items));
    });
}

/**
 * Converter to convert an unknown to an array of strings. Conversion succeeds
 * and returns the supplied value if it as an array of strings, fails otherwise.
 */
export const stringArray = arrayOf(string);

/**
 * Converter to convert an unknown to an array of numbers. Conversion succeeds
 * and returns the supplied value if it as an array of numbers, fails otherwise.
 */
export const numberArray = arrayOf(number);

/**
 * Options for 'recordOf' and 'mapOf' converters
 */
export interface KeyedConverterOptions<T extends string = string, TC=undefined> {
    onError?: 'fail'|'ignore';
    keyConverter?: Converter<T, TC>;
}

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Record of T.
 * Conversion fails if any element cannot be converted.  If onError is 'ignore' failing
 * elements are silently ignored.
 * @param converter Converter used to convert each item in the record
 */
export function recordOf<T, TC=undefined, TK extends string=string>(converter: Converter<T, TC>): Converter<Record<TK, T>, TC>;

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Record of T.
 * If onError is 'fail' (default),  then the entire conversion fails if any element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the record
 * @param onError Specifies treatment of unconvertable elements
 */
export function recordOf<T, TC=undefined, TK extends string=string>(
    converter: Converter<T, TC>,
    onError: 'fail'|'ignore'
): Converter<Record<TK, T>, TC>;

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Record of T.
 * If options specify a key converter it will be applied to each key.
 * If onError is 'fail' (default),  then the entire conversion fails if any key or element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the record
 * @param options Optional @see KeyedConverterOptions
 */
export function recordOf<T, TC=undefined, TK extends string=string>(
    converter: Converter<T, TC>,
    options: KeyedConverterOptions<TK, TC>
): Converter<Record<TK, T>, TC>;

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
 * A helper wrapper to convert the string-keyed properties of an object to a Map of T.
 * Conversion fails if any element cannot be converted.
 * @param converter Converter used to convert each item in the map
 */
export function mapOf<T, TC = undefined, TK extends string = string>(converter: Converter<T, TC>): Converter<Map<TK, T>, TC>;

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Map of T.
 * If onError is 'fail' (default),  then the entire conversion fails if any element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the map
 * @param onError Specifies treatment of unconvertable elements
 */
export function mapOf<T, TC = undefined, TK extends string = string>(
    converter: Converter<T, TC>,
    onError: 'fail' | 'ignore'
): Converter<Map<TK, T>, TC>;

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Map of T.
 * If options specify a key converter it will be applied to each key.
 * If onError is 'fail' (default),  then the entire conversion fails if any key or element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the map
 * @param options Optional @see KeyedConverterOptions
 */
export function mapOf<T, TC = undefined, TK extends string = string>(
    converter: Converter<T, TC>,
    options: KeyedConverterOptions<TK, TC>
): Converter<Map<TK, T>, TC>;

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
 * A helper function to extract and convert an element from an array. Succeeds and returns
 * the converted value if the element exists in the supplied parameter and can be converted.
 * Fails otherwise.
 * @param index The index of the field to be extracted.
 * @param converter Converter used to convert the extracted element.
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
 * A helper function to extract and convert an optional element from an array. Succeeds
 * and returns the converted value if the element exists in the supplied parameter and can
 * be converted. Succeeds with undefined if the parameter is an array but the index is too
 * large. Fails if the supplied parameter is not an array, if the requested index is negative,
 * or if the element cannot be converted.
 * @param name The name of the field to be extracted.
 * @param converter Converter used to convert the extracted field.
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
 * A helper function to extract and convert a field from an object. Succeeds and returns
 * the converted value if the field exists in the supplied parameter and can be converted.
 * Fails otherwise.
 * @param name The name of the field to be extracted.
 * @param converter Converter used to convert the extracted field.
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
 * A helper function to extract and convert an optional field from an object. Succeeds
 * and returns the converted value if the field exists in the supplied parameter and can
 * be converted. Succeeds with undefined if the parameter is an object but the named field
 * is not present. Fails if the supplied parameter is not an object.
 * @param name The name of the field to be extracted.
 * @param converter Converter used to convert the extracted field.
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
 * Options for an @see ObjectConverter.
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
}

/**
 * Per-property converters for each of the properties in type T.
 */
export type FieldConverters<T, TC=unknown> = { [ key in keyof T ]: Converter<T[key], TC> };

/**
 * Converter to convert an object of type T without changing shape, given a @see FieldConverters<T>.
 * If all of the required fields exist and can be converted, returns a new object with the converted
 * values under the original key names.  If any required fields do not exist or cannot be converted,
 * the entire conversion fails.  See @see ObjectConverterOptions for other conversion options.
 */
export class ObjectConverter<T, TC=unknown> extends BaseConverter<T, TC> {
    public readonly fields: FieldConverters<T>;
    public readonly options: ObjectConverterOptions<T>;

    /**
     * Constructs a new @see ObjectConverter<T> using options supplied in an
     * optional @see ObjectConverterOptions<T>.
     * @param fields A @see FieldConverters<T> containing converters for each field
     * @param options An optional @see ObjectConverterOptions to configure the conversion
     */
    public constructor(fields: FieldConverters<T, TC>, options?: ObjectConverterOptions<T>)

    /**
     * Constructs a new @see ObjectConverter<T> using optional fields supplied in an
     * optional array of keyof T.
     * @param fields A @see FieldConverters<T> containing converters for each field
     * @param optional An optional array of keyof T listing fields that are not required.
     */
    public constructor(fields: FieldConverters<T, TC>, optional?: (keyof T)[]);
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
            return (errors.length === 0) ? succeed(converted) : fail(errors.join('\n'));
        });

        this.fields = fields;
        if (Array.isArray(opt)) {
            this.options = { optionalFields: opt };
        }
        else {
            this.options = opt ?? {};
        }
    }

    public partial(options: ObjectConverterOptions<T>): ObjectConverter<Partial<T>, TC>;
    public partial(optional?: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
    public partial(opt?: ObjectConverterOptions<T>|(keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return new ObjectConverter<Partial<T>, TC>(this.fields as FieldConverters<Partial<T>, TC>, opt as ObjectConverterOptions<Partial<T>>)._with(this._traits());
    }

    public addPartial(addOptionalFields: (keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return this.partial([...this.options.optionalFields ?? [], ...addOptionalFields])._with(this._traits());
    }
}

/**
 * Helper to convert an object without changing shape. The source parameter is an object with
 * key names that correspond to the target object and the appropriate corresponding converter
 * as the property value. If all of the requested fields exist and can be converted, returns a
 * new object with the converted values under the original key names.  If any fields do not exist
 * or cannot be converted, the entire conversion fails.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 * @param fields An object containing defining the shape and converters to be applied.
 * @param opt An @see ObjectConverterOptions<T> containing options for the object converter, or
 * an array of (keyof T) containing optional keys.
 */
export function object<T>(fields: FieldConverters<T>, opt?: (keyof T)[]|ObjectConverterOptions<T>): ObjectConverter<T> {
    return new ObjectConverter(fields, opt as ObjectConverterOptions<T>);
}

/**
 * Helper to convert an object without changing shape. The source parameter is an object with
 * key names that correspond to the target object and the appropriate corresponding converter
 * as the property value. If all of the requested fields exist and can be converted, returns a
 * new object with the converted values under the original key names.  If any fields do not exist
 * or cannot be converted, the entire conversion fails.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * The conversion fails if any unexpected fields are encountered.
 *
 * @param fields An object containing defining the shape and converters to be applied.
 * @param opt - An @see ObjectConverterOptions<T> containing options for the object converter, or
 * an array of (keyof T) containing optional keys.
 */
export function strictObject<T>(
    fields: FieldConverters<T>,
    opt?: (keyof T)[]|Omit<ObjectConverterOptions<T>, 'strict'>,
): ObjectConverter<T> {
    const options: ObjectConverterOptions<T> = (opt && Array.isArray(opt))
        ? { strict: true, optionalFields: opt }
        : { ...(opt ?? {}), strict: true };
    return new ObjectConverter(fields, options);
}

export type DiscriminatedObjectConverters<T, TD extends string = string, TC=unknown> = Record<TD, Converter<T, TC>>;

/**
 * Helper to convert a discriminated property without changing shape.  Takes the name of the
 * discriminator property and a string-keyed record of object converters, and invokes the
 * converter that corresponds to the value of the discriminator property in the source object.
 * Fails if the source is not an object or if the discriminator property is missing or has
 * a value not present in the converters.
 * @param discriminatorProp Name of the property used to discriminate types
 * @param converters String-keyed record of converters to invoke, where key corresponds to a value of the
 * discriminator property.
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
 * Helper to convert an object to a new object with a different shape. The source parameter is
 * an object with key names that correspond to the target object, and an approriate _field_
 * converter that will extract and convert a single field from the source object.
 *
 * If all of the extracted fields exist and can be converted, returns a new object with the
 * converted values under the original key names.  If any fields to be extracted do not exist
 * or cannot be converted, the entire conversion fails.
 *
 * Fields that succeed but convert to undefined are omitted from the result object but do not
 * fail the conversion.
 *
 * @param fields An object defining the shape of the target object and the field converters
 * to be used to construct it.
 */
export function transform<T, TC=unknown>(fields: FieldConverters<T, TC>): Converter<T, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        // eslint bug thinks key is used before defined
        // eslint-disable-next-line no-use-before-define
        const converted = {} as { [ key in keyof T]: T[key] };
        const errors: string[] = [];

        for (const key in fields) {
            if (fields[key]) {
                const result = fields[key].convert(from, context);
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
 * A helper wrapper to convert a range of some other comparable type
 * @param converter Converter used to convert min and max extent of the raid
 * @param constructor Optional static constructor to instantiate the object
 */
export function rangeTypeOf<T, RT extends RangeOf<T>, TC=unknown>(converter: Converter<T, TC>, constructor: (init: RangeOfProperties<T>) => Result<RT>): Converter<RT, TC> {
    return new BaseConverter((from: unknown, _self, context?: TC) => {
        const result = object({
            min: converter,
            max: converter,
        }, ['min', 'max']).convert(from, context);
        if (result.isSuccess()) {
            return constructor({ min: result.value.min, max: result.value.max });
        }
        return fail(result.message);
    });
}

export function rangeOf<T, TC=unknown>(converter: Converter<T, TC>): Converter<RangeOf<T>, TC> {
    return rangeTypeOf<T, RangeOf<T>, TC>(converter, RangeOf.createRange);
}
