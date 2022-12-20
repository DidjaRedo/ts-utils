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
import { Result, fail, mapResults, succeed } from './result';
import { Brand } from './brand';

type OnError = 'failOnError' | 'ignoreErrors';

/**
 * Converter traits.
 * @public
 */
export interface ConverterTraits {
    readonly isOptional: boolean;
    readonly brand?: string;
}

/**
 * Options for {@link Converter.withConstraint}.
 * @public
 */
export interface ConstraintOptions {
    /**
     * Optional description for error messages when constraint
     * function returns false.
     */
    readonly description: string;
}

/**
 * Generic converter to convert unknown to a templated type `<T>`, using
 * intrinsic rules or as modified by an optional conversion context
 * of optional templated type `<TC>` (default `undefined`).
 * @public
 */
export interface Converter<T, TC=undefined> extends ConverterTraits {
    /**
     * Indicates whether this element is explicitly optional.
     */
     readonly isOptional: boolean;

     /**
      * Returns the brand for a branded type.
      */
     readonly brand?: string;

     /**
     * Converts from `unknown` to `<T>`.
     * @param from - The `unknown` to be converted
     * @param context - An optional conversion context of type `<TC>` to be used in
     * the conversion.
     * @returns A {@link Result} with a {@link Success} and a value on success or an
     * {@link Failure} with a a message on failure.
     */
    convert(from: unknown, context?: TC): Result<T>;

    /**
     * Converts from `unknown` to `<T>` or `undefined`, as appropriate.
     *
     * @remarks
     * If `onError` is `failOnError`, the converter succeeds for
     * `undefined` or any convertible value, but reports an error
     * if it encounters a value that cannot be converted.
     *
     * If `onError` is `ignoreErrors` (default) then values that
     * cannot be converted result in a successful return of `undefined`.
     * @param from - The `unknown` to be converted
     * @param context - An optional conversion context of type `<TC>` to be used in
     * the conversion.
     * @param onError - Specifies handling of values that cannot be converted (default `ignoreErrors`).
     * @returns A {@link Result} with a {@link Success} and a value on success or an
     * {@link Failure} with a a message on failure.
     */
    convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T|undefined>;

    /**
     * Creates a {@link Converter} for an optional value.
     *
     * @remarks
     * If `onError` is `failOnError`, the resulting converter will accept `undefined`
     * or a convertible value, but report an error if it encounters a value that cannot be
     * converted.
     *
     * If `onError` is `ignoreErrors` (default) then values that cannot be converted will
     * result in a successful return of `undefined`.
     *
     * @param onError - Specifies handling of values that cannot be converted (default `ignoreErrors`).
     * @returns A new {@link Converter} returning `<T|undefined>`.
     * */
    optional(onError?: OnError): Converter<T|undefined, TC>;

    /**
     * Creates a {@link Converter} which applies a (possibly) mapping conversion to
     * the converted value of this {@link Converter}.
     * @param mapper - A function which maps from the the result type `<T>` of this
     * converter to a new result type `<T2>`.
     * @returns A new {@link Converter} returning `<T2>`.
     */
    map<T2>(mapper: (from: T) => Result<T2>): Converter<T2, TC>;

    /**
     * Creates a {@link Converter} which applies an additional supplied
     * converter to the result of this converter.
     *
     * @param mapConverter - The {@link Converter} to be applied to the
     * converted result from this {@link Converter}.
     * @returns A new {@link Converter} returning `<T2>`.
     */
    mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC>;

    /**
     * Creates a {@link Converter} which maps the individual items of a collection
     * resulting from this {@link Converter} using the supplied map function.
     *
     * @remarks
     * Fails if `from` is not an array.
     *
     * @param mapper - The map function to be applied to each element of the
     * result of this {@link Converter}.
     * @returns A new {@link Converter} returning `<TI[]>`.
     */
    mapItems<TI>(mapper: (from: unknown) => Result<TI>): Converter<TI[], TC>;

    /**
     * Creates a {@link Converter} which maps the individual items of a collection
     * resulting from this {@link Converter} using the supplied {@link Converter}.
     *
     * @remarks
     * Fails if `from` is not an array.
     *
     * @param mapConverter - The {@link Converter} to be applied to each element of the
     * result of this {@link Converter}.
     * @returns A new {@link Converter} returning `<TI[]>`.
     */
     mapConvertItems<TI>(mapConverter: Converter<TI, unknown>): Converter<TI[], TC>;

     /**
      * Creates a {@link Converter} which applies a supplied type guard to the conversion
      * result.
      * @param guard - The type guard function to apply.
      * @param message - Optional message to be reported if the type guard fails.
      * @returns A new {@link Converter} returning `<TI>`.
      */
    withTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI, TC>;

     /**
      * Creates a {@link Converter} which applies a supplied type guard to each member of
      * the conversion result from this converter.
      *
      * @remarks
      * Fails if the conversion result is not an array or if any member fails the
      * type guard.
      * @param guard - The type guard function to apply to each element.
      * @param message - Optional message to be reported if the type guard fails.
      * @returns A new {@link Converter} returning `<TI>`.
      */
      withItemTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI[], TC>;

    /**
     * Creates a {@link Converter} which applies an optional constraint to the result
     * of this conversion.  If this {@link Converter} (the base converter) succeeds, the new
     * converter calls a supplied constraint evaluation function with the conversion, which
     * fails the entire conversion if the constraint function returns either `false` or
     * {@link Failure | Failure<T>}.
     *
     * @param constraint - Constraint evaluation function.
     * @param options - {@link ConstraintOptions | Options} for constraint evaluation.
     * @returns A new {@link Converter} returning `<T>`.
     */
    withConstraint(
        constraint: (val: T) => boolean|Result<T>,
        options?: ConstraintOptions,
    ): Converter<T, TC>;

    /**
     * returns a converter which adds a brand to the type to prevent mismatched usage
     * of simple types.
     * @param brand - The brand to be applied to the result value.
     * @returns A {@link Converter} returning `Brand<T, B>`.
     */
    withBrand<B extends string>(brand: B): Converter<Brand<T, B>, TC>;
}

/**
 * internal
 */
type InnerInferredType<TCONV> =
    TCONV extends Converter<infer TTO>
        ? (TTO extends Array<infer TTOELEM> ? InnerInferredType<TTOELEM>[] : TTO)
        : (TCONV extends Array<infer TELEM> ? InnerInferredType<TELEM>[] : TCONV);

/**
 * Infers the type that will be returned by an instantiated converter.  Works
 * for complex as well as simple types.
 * @example `Infer<typeof Converters.mapOf(Converters.stringArray)>` is `Map<string, string[]>`
 * @beta
 */
export type Infer<TCONV> = TCONV extends Converter<infer TTO> ? InnerInferredType<TTO> : never;

/**
 * Deprecated name for Infer<T> retained for compatibility
 * @deprecated use @see Infer instead
 * @internal
 */
export type ConvertedToType<TCONV> = Infer<TCONV>;

/**
 * Base templated wrapper to simplify creation of new {@link Converter}s.
 * @public
 */
export class BaseConverter<T, TC=undefined> implements Converter<T, TC> {
    /**
     * @internal
     */
    protected readonly _defaultContext?: TC;
    /**
     * @internal
     */
    protected _isOptional = false;
    /**
     * @internal
     */
    protected _brand?: string;

    private readonly _converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>;

    /**
     * Constructs a new {@link Converter} which uses the supplied function to perform the conversion.
     * @param converter - The conversion function to be applied.
     * @param defaultContext - Optional conversion context to be used by default.
     * @param traits - Optional {@link ConverterTraits | traits} to be assigned to the resulting
     * converter.
     */
    public constructor(
        converter: (from: unknown, self: Converter<T, TC>, context?: TC) => Result<T>,
        defaultContext?: TC,
        traits?: ConverterTraits,
    ) {
        this._converter = converter;
        this._defaultContext = defaultContext;
        this._isOptional = (traits?.isOptional === true);
        this._brand = (traits?.brand);
    }

    /**
     * {@inheritdoc Converter.isOptional}
     */
    public get isOptional(): boolean {
        return this._isOptional;
    }

    /**
     * {@inheritdoc Converter.brand}
     */
    public get brand(): string|undefined {
        return this._brand;
    }

    /**
     * {@inheritdoc Converter.convert}
     */
    public convert(from: unknown, context?: TC): Result<T> {
        return this._converter(from, this, context ?? this._defaultContext);
    }

    /**
     * {@inheritdoc Converter.convertOptional}
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
     * {@inheritdoc Converter.optional}
     */
    public optional(onError?: OnError): Converter<T|undefined, TC> {
        return new BaseConverter((from: unknown, _self: Converter<T|undefined, TC>, context?: TC) => {
            onError = onError ?? 'failOnError';
            return this.convertOptional(from, this._context(context), onError);
        })._with(this._traits({ isOptional: true }));
    }

    /**
     * {@inheritdoc Converter.map}
     */
    public map<T2>(mapper: (from: T) => Result<T2>): Converter<T2, TC> {
        return new BaseConverter<T2, TC>((from: unknown, _self: Converter<T2, TC>, context?: TC) => {
            const innerResult = this._converter(from, this, this._context(context));
            if (innerResult.isSuccess()) {
                return mapper(innerResult.value);
            }
            return fail(innerResult.message);
        })._with(this._traits());
    }

    /**
     * {@inheritdoc Converter.mapConvert}
     */
    public mapConvert<T2>(mapConverter: Converter<T2>): Converter<T2, TC> {
        return new BaseConverter<T2, TC>((from: unknown, _self: Converter<T2, TC>, context?: TC) => {
            const innerResult = this._converter(from, this, this._context(context));
            if (innerResult.isSuccess()) {
                return mapConverter.convert(innerResult.value);
            }
            return fail(innerResult.message);
        // eslint-disable-next-line no-return-assign
        })._with(this._traits());
    }

    /**
     * {@inheritdoc Converter.mapItems}
     */
    public mapItems<TI>(mapper: (from: unknown) => Result<TI>): Converter<TI[], TC> {
        return new BaseConverter<TI[], TC>((from: unknown, _self: Converter<TI[], TC>, context?: TC) => {
            return this._converter(from, this, this._context(context)).onSuccess((items) => {
                if (Array.isArray(items)) {
                    return mapResults(items.map((i) => mapper(i)));
                }
                return fail('Cannot map items - not an array');
            });
        });
    }

    /**
     * {@inheritdoc Converter.mapConvertItems}
     */
    public mapConvertItems<TI>(mapConverter: Converter<TI, unknown>): Converter<TI[], TC> {
        return new BaseConverter<TI[], TC>((from: unknown, _self: Converter<TI[], TC>, context?: TC) => {
            return this._converter(from, this, this._context(context)).onSuccess((items) => {
                if (Array.isArray(items)) {
                    return mapResults(items.map((i) => mapConverter.convert(i)));
                }
                return fail('Cannot map items - not an array');
            });
        });
    }

    /**
     * {@inheritdoc Converter.withTypeGuard}
     */
    public withTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI, TC> {
        return new BaseConverter<TI, TC>((from: unknown, _self: Converter<TI, TC>, context?: TC) => {
            return this._converter(from, this, this._context(context)).onSuccess((inner) => {
                message = message ?? 'invalid type';
                return guard(inner) ? succeed(inner) : fail(`${message}: ${JSON.stringify(from)}`);
            });
        });
    }

    /**
     * {@inheritdoc Converter.withItemTypeGuard}
     */
    public withItemTypeGuard<TI>(guard: (from: unknown) => from is TI, message?: string): Converter<TI[], TC> {
        return new BaseConverter<TI[], TC>((from: unknown, _self: Converter<TI[], TC>, context?: TC) => {
            return this._converter(from, this, this._context(context)).onSuccess((items) => {
                if (Array.isArray(items)) {
                    return mapResults(items.map((i) => {
                        message = message ?? 'invalid type';
                        return guard(i) ? succeed(i) : fail(`${message}: ${JSON.stringify(from)}`);
                    }));
                }
                return fail('Cannot guard item type - not an array');
            });
        });
    }

    /**
     * {@inheritdoc Converter.withConstraint}
     */
    public withConstraint(
        constraint: (val: T) => boolean|Result<T>,
        options?: ConstraintOptions,
    ): Converter<T, TC> {
        return new BaseConverter<T, TC>((from: unknown, _self: Converter<T, TC>, context?: TC) => {
            const result = this._converter(from, this, this._context(context));
            if (result.isSuccess()) {
                const constraintResult = constraint(result.value);
                if (typeof constraintResult === 'boolean') {
                    return constraintResult
                        ? result
                        : fail(
                            `"${JSON.stringify(result.value)}": ${options?.description ?? 'does not meet constraint'}`
                        );
                }
                return constraintResult;
            }
            return result;
        })._with(this._traits());
    }

    /**
     * {@inheritdoc Converter.withBrand}
     */
    public withBrand<B extends string>(brand: B): Converter<Brand<T, B>, TC> {
        if (this._brand) {
            throw new Error(`Cannot replace existing brand "${this._brand}" with "${brand}".`);
        }

        return new BaseConverter<Brand<T, B>, TC>((from: unknown, _self: Converter<T, TC>, context?: TC) => {
            return this._converter(from, this, this._context(context)).onSuccess((v) => {
                return succeed(v as Brand<T, B>);
            });
        })._with(this._traits({ brand }));
    }

    /**
     * @internal
     */
    protected _context(supplied?: TC): TC|undefined {
        return supplied ?? this._defaultContext;
    }

    /**
     * @internal
     */
    protected _traits(traits?: Partial<ConverterTraits>): ConverterTraits {
        return {
            isOptional: this.isOptional,
            brand: this.brand,
            ...(traits ?? {}),
        };
    }

    /**
     * @internal
     */
    protected _with(traits: Partial<ConverterTraits>): this {
        this._isOptional = (traits.isOptional === true);
        this._brand = (traits.brand);
        return this;
    }
}
