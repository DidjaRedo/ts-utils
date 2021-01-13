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

type OnError = 'failOnError' | 'ignoreErrors';

export interface Converter<T, TC=undefined> {
    /**
     * Converts from unknown to <T>
     * @param from The unknown to be converted
     * @param context An optional context applied to the conversion
     * @returns An @see Result with a value or an error message
     */
    convert(from: unknown, context?: TC): Result<T>;

    /**
     * Converts from unknown to <T> or undefined, as appropriate.
     * If 'onError' is 'failOnError', the converter succeeds for
     * 'undefined' or any convertible value, but reports an error
     * if it encounters a value that cannot be converted.  If 'onError'
     * is 'ignoreErrors' (default) then values that cannot be converted
     * result in a successful return of 'undefined'.
     * @param from The unknown to be converted
     * @param context Optional context for use by the converter
     * @param onError Specifies handling of values that cannot be converted, default 'ignoreErrors'
     */
    convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T|undefined>;

    /**
     * Creates a converter for an optional value. If 'onError'
     * is 'failOnError', the converter accepts 'undefined' or a
     * convertible value, but reports an error if it encounters
     * a value that cannot be converted.  If 'onError' is 'ignoreErrors'
     * (default) then values that cannot be converted result in a
     * successful return of 'undefined'.
     *
     * @param onError Specifies handling of values that cannot be converted, default 'ignoreErrors'
     * */
    optional(onError?: OnError): Converter<T|undefined, TC>;

    /**
     * Applies a (possibly) mapping conversion to the converted value.
     * @param mapper A function which maps from the converted type to some other type.
     */
    map<T2>(mapper: (from: T) => Result<T2>): Converter<T2, TC>;

    /**
     * Applies an additional converter to the converted value.
     * @param mapConverter The converter to be applied to the converted value
     */
    mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC>;

    /**
     * Creates a converter with an optional constraint.  If the base converter
     * succeeds, calls a supplied constraint evaluation function with the
     * value and fails the conversion if the function returns either false
     * or Failure<T>.
     *
     * @param constraint Constraint evaluation function
     */
    withConstraint(constraint: (val: T) => boolean|Result<T>): Converter<T, TC>;
}

/**
 * Infers the type that will be returned by an intstantiated converter.  Works
 * for complex as well as simple types.
 * @example ConvertedToType<typeof Converters.mapOf(Converters.stringArray)> is Map<string, string[]>
 */
export type ConvertedToType<TCONV> =
    TCONV extends Converter<infer TTO>
        ? (TTO extends Array<infer TTOELEM> ? ConvertedToType<TTOELEM>[] : TTO)
        : (TCONV extends Array<infer TELEM> ? ConvertedToType<TELEM>[] : TCONV);

/**
 * Simple templated converter wrapper to simplify typed conversion from unknown.
 */
export class BaseConverter<T, TC=undefined> implements Converter<T, TC> {
    protected readonly _defaultContext?: TC;
    private readonly _converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>;

    public constructor(converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>, defaultContext?: TC) {
        this._converter = converter;
        this._defaultContext = defaultContext;
    }

    /**
     * Converts from unknown to <T>
     * @param from The unknown to be converted
     * @returns An @see Result with a value or an error message
     */
    public convert(from: unknown, context?: TC): Result<T> {
        return this._converter(from, this, context ?? this._defaultContext);
    }

    /**
     * Converts from unknown to <T> or undefined, as appropriate.
     * If 'onError' is 'failOnError', the converter succeeds for
     * 'undefined' or any convertible value, but reports an error
     * if it encounters a value that cannot be converted.  If 'onError'
     * is 'ignoreErrors' (default) then values that cannot be converted
     * result in a successful return of 'undefined'.
     * @param from The unknown to be converted
     * @param onError Specifies handling of values that cannot be converted, default 'ignoreErrors'
     */
    public convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T|undefined> {
        const result = this._converter(from, this, this._context(context));
        if (result.isFailure()) {
            onError = onError ?? 'ignoreErrors';
            return ((from === undefined) || onError === 'ignoreErrors') ? succeed(undefined) : result;
        }
        return result;
    }

    /**
     * Creates a converter for an optional value. If 'onError'
     * is 'failOnError', the converter accepts 'undefined' or a
     * convertible value, but reports an error if it encounters
     * a value that cannot be converted.  If 'onError' is 'ignoreErrors'
     * (default) then values that cannot be converted result in a
     * successful return of 'undefined'.
     *
     * @param onError Specifies handling of values that cannot be converted, default 'ignoreErrors'
     * */
    public optional(onError?: OnError): Converter<T|undefined, TC> {
        return new BaseConverter((from: unknown, _self: Converter<T|undefined, TC>, context?: TC) => {
            onError = onError ?? 'ignoreErrors';
            return this.convertOptional(from, this._context(context), onError);
        });
    }

    /**
     * Applies a (possibly) mapping conversion to the converted value.
     * @param mapper A function which maps from the converted type to some other type.
     */
    public map<T2>(mapper: (from: T) => Result<T2>): Converter<T2, TC> {
        return new BaseConverter((from: unknown, _self: Converter<T2, TC>, context?: TC) => {
            const innerResult = this._converter(from, this, this._context(context));
            if (innerResult.isSuccess()) {
                return mapper(innerResult.value);
            }
            return fail(innerResult.message);
        });
    }

    /**
     * Applies an additional converter to the converted value.
     * @param mapConverter The converter to be applied to the converted value
     */
    public mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC> {
        return new BaseConverter((from: unknown, _self: Converter<T2, TC>, context?: TC) => {
            const innerResult = this._converter(from, this, this._context(context));
            if (innerResult.isSuccess()) {
                return mapConverter.convert(innerResult.value);
            }
            return fail(innerResult.message);
        });
    }

    /**
     * Creates a converter with an optional constraint.  If the base converter
     * succeeds, calls a supplied constraint evaluation function with the
     * value and fails the conversion if the function returns either false
     * or Failure<T>.
     *
     * @param constraint Constraint evaluation function
     */
    public withConstraint(constraint: (val: T) => boolean|Result<T>): Converter<T, TC> {
        return new BaseConverter((from: unknown, _self: Converter<T, TC>, context?: TC) => {
            const result = this._converter(from, this, this._context(context));
            if (result.isSuccess()) {
                const constraintResult = constraint(result.value);
                if (typeof constraintResult === 'boolean') {
                    return constraintResult ? result : fail(`Value ${JSON.stringify(result.value)} does not meet constraint.`);
                }
                return constraintResult;
            }
            return result;
        });
    }

    protected _context(supplied?: TC): TC|undefined {
        return supplied ?? this._defaultContext;
    }
}
