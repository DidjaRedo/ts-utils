
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
import { BaseConverter, Converter } from './converter';
import { RangeOf, RangeOfProperties } from './rangeOf';
import { Result, captureResult, fail, succeed } from './result';

import { DateTime } from 'luxon';
import { ExtendedArray } from './extendedArray';
import Mustache from 'mustache';
import { isKeyOf } from './utils';

type OnError = 'failOnError' | 'ignoreErrors';

/**
 * A converter to convert unknown to string. Values of type
 * string succeed.  Anything else fails.
 */
export const string = new BaseConverter<string>((from: unknown) => {
    return typeof from === 'string'
        ? succeed(from as string)
        : fail(`Not a string: ${JSON.stringify(from)}`);
});

/**
 * Helper function to create a converter which converts unknown to string, applying
 * template conversions supplied at construction time or at runtime as context.
 * @param defaultContext optional default context to use for template values
 */
export function templateString(defaultContext?: unknown): Converter<string, unknown> {
    return new BaseConverter<string, unknown>((from: unknown, _self: Converter<string, unknown>, context?: unknown) => {
        if (typeof from !== 'string') {
            return fail(`Not a string: ${JSON.stringify(from)}`);
        }
        return captureResult(() => Mustache.render(from, context));
    }, defaultContext);
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
 * A helper wrapper to convert the string-keyed properties of an object to a Record of T.
 * If onError is 'fail' (default),  then the entire conversion fails if any element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the record
 * @param ignoreErrors Specifies treatment of unconvertable elements
 */
export function recordOf<T, TC=undefined>(converter: Converter<T, TC>, onError: 'fail'|'ignore' = 'fail'): Converter<Record<string, T>, TC> {
    return new BaseConverter((from: unknown, _self: Converter<Record<string, T>, TC>, context?: TC) => {
        if ((typeof from !== 'object') || Array.isArray(from)) {
            return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
        }

        const record: Record<string, T> = {};
        const errors: string[] = [];

        for (const key in from) {
            if (isKeyOf(key, from)) {
                const result = converter.convert(from[key] as unknown, context);
                if (result.isSuccess()) {
                    record[key] = result.value;
                }
                else {
                    errors.push(result.message);
                }
            }
        }

        return (errors.length === 0) || (onError === 'ignore')
            ? succeed(record)
            : fail(errors.join('\n'));
    });
}

/**
 * A helper wrapper to convert the string-keyed properties of an object to a Map of T.
 * If onError is 'fail' (default),  then the entire conversion fails if any element
 * cannot be converted.  If onError is 'ignore' failing elements are silently ignored.
 * @param converter Converter used to convert each item in the record
 * @param ignoreErrors Specifies treatment of unconvertable elements
 */
export function mapOf<T, TC=undefined>(converter: Converter<T, TC>, onError: 'fail'|'ignore' = 'fail'): Converter<Map<string, T>, TC> {
    return new BaseConverter((from: unknown, _self: Converter<Map<string, T>, TC>, context?: TC) => {
        if ((typeof from !== 'object') || Array.isArray(from)) {
            return fail(`Not a string-keyed object: ${JSON.stringify(from)}`);
        }

        const map = new Map<string, T>();
        const errors: string[] = [];

        for (const key in from) {
            if (isKeyOf(key, from)) {
                const result = converter.convert(from[key] as unknown, context);
                if (result.isSuccess()) {
                    map.set(key, result.value);
                }
                else {
                    errors.push(result.message);
                }
            }
        }

        return (errors.length === 0) || (onError === 'ignore')
            ? succeed(map)
            : fail(errors.join('\n'));
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
        if (typeof from === 'object' && from !== null) {
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
        if (typeof from === 'object' && from !== null) {
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
    });
}

export type FieldConverters<T, TC=unknown> = { [ key in keyof T ]: Converter<T[key], TC> };

export class ObjectConverter<T, TC=unknown> extends BaseConverter<T, TC> {
    public readonly fields: FieldConverters<T>;
    public readonly optionalFields: (keyof T)[];

    public constructor(fields: FieldConverters<T, TC>, optional?: (keyof T)[]) {
        super((from: unknown, _self, context?: TC) => {
            // eslint bug thinks key is used before defined
            // eslint-disable-next-line no-use-before-define
            const converted = {} as { [key in keyof T]: T[key] };
            const errors: string[] = [];
            for (const key in fields) {
                if (fields[key]) {
                    const isOptional = optional?.includes(key) ?? false;
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
            return (errors.length === 0) ? succeed(converted) : fail(errors.join('\n'));
        });

        this.fields = fields;
        this.optionalFields = optional ?? [];
    }

    public partial(optional?: (keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return new ObjectConverter<Partial<T>, TC>(this.fields as FieldConverters<Partial<T>, TC>, optional);
    }

    public addPartial(addOptionalFields: (keyof T)[]): ObjectConverter<Partial<T>, TC> {
        return this.partial([...this.optionalFields, ...addOptionalFields]);
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
 */
export function object<T>(fields: FieldConverters<T>, optional?: (keyof T)[]): ObjectConverter<T> {
    return new ObjectConverter(fields, optional);
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
