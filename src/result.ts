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

/* eslint-disable no-use-before-define */
/**
 * Represents the {@link IResult | result} of some operation or sequence of operations.
 * @remarks
 * {@link Success | Success<T>} and {@link Failure | Failure<T>} share the common
 * contract {@link IResult}, enabling commingled discriminated usage.
 * @public
 */
export type Result<T> = Success<T> | Failure<T>;
/**
 * Continuation callback to be called in the event that an
 * {@link Result} is successful.
 * @public
 */
export type SuccessContinuation<T, TN> = (value: T) => Result<TN>;
/**
 * Continuation callback to be called in the event that an
 * {@link Result} fails.
 * @public
 */
export type FailureContinuation<T> = (message: string) => Result<T>;
/**
 * Type inference to determine the result type of an {@link Result}.
 * @beta
 */
export type ResultValueType<T> = T extends Result<infer TV> ? TV : never;

/**
 * Simple logger interface used by {@link IResult.orThrow}.
 * @public
 */
export interface IResultLogger {
    /**
     * Log an error message.
     * @param message - The message to be logged.
     */
    error(message: string): void;
}

/**
 * Represents the result of some operation of sequence of operations.
 * @remarks
 * This common contract enables commingled discriminated usage of {@link Success | Success<T>}
 * and {@link Failure | Failure<T>}.
 * @public
 */
export interface IResult<T> {
    /**
     * Indicates whether the operation was successful.
     */
    readonly success: boolean;

    /**
     * Indicates whether this operation was successful.  Functions
     * as a type guard for {@link Success | Success<T>}.
     */
    isSuccess(): this is Success<T>;

    /**
     * Indicates whether this operation failed.  Functions
     * as a type guard for {@link Failure | Failure<T>}.
     */
    isFailure(): this is Failure<T>;

    /**
     * Gets the value associated with a successful {@link IResult | result},
     * or throws the error message if the corresponding operation failed.
     *
     * Note that `getValueOrThrow` is being superseded by `orThrow` and
     * will eventually be deprecated.  Please use orDefault instead.
     *
    * @param logger - An optional {@link IResultLogger | logger} to which the
     * error will also be reported.
     * @returns The return value, if the operation was successful.
     * @throws The error message if the operation failed.
     */
    getValueOrThrow(logger?: IResultLogger): T;

    /**
     * Gets the value associated with a successful {@link IResult | result},
     * or a default value if the corresponding operation failed.
     * @param dflt - The value to be returned if the operation failed (default is
     * `undefined`).
     *
     * Note that `getValueOrDefault` is being superseded by `orDefault` and
     * will eventually be deprecated.  Please use orDefault instead.
     *
     * @returns The return value, if the operation was successful.  Returns
     * the supplied default value or `undefined` if no default is supplied.
     */
    getValueOrDefault(dflt?: T): T|undefined;

    /**
     * Gets the value associated with a successful {@link IResult | result},
     * or throws the error message if the corresponding operation failed.
     * @param logger - An optional {@link IResultLogger | logger} to which the
     * error will also be reported.
     * @returns The return value, if the operation was successful.
     * @throws The error message if the operation failed.
     */
    orThrow(logger?: IResultLogger): T;

    /**
     * Gets the value associated with a successful {@link IResult | result},
     * or a default value if the corresponding operation failed.
     * @param dflt - The value to be returned if the operation failed (default is
     * `undefined`).
     * @returns The return value, if the operation was successful.  Returns
     * the supplied default value or `undefined` if no default is supplied.
     */
    orDefault(dflt?: T): T|undefined;

    /**
     * Calls a supplied {@link SuccessContinuation | success continuation} if
     * the operation was a success.
     * @remarks
     * The {@link SuccessContinuation | success continuation} might return a
     * different result type than {@link IResult} on which it is invoked. This
     * enables chaining of operations with heterogenous return types.
     *
     * @param cb - The {@link SuccessContinuation | success continuation} to
     * be called in the event of success.
     * @returns If this operation was successful, returns the value returned
     * by the {@link SuccessContinuation | success continuation}.  If this result
     * failed, propagates the error message from this failure.
     */
    onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN>;

    /**
     * Calls a supplied {@link FailureContinuation | failed continuation} if
     * the operation failed.
     * @param cb - The {@link FailureContinuation | failure continuation} to
     * be called in the event of failure.
     * @returns If this operation failed, returns the value returned by the
     * {@link FailureContinuation | failure continuation}.  If this result
     * was successful, propagates the result value from the successful event.
     */
    onFailure(cb: FailureContinuation<T>): Result<T>;

    /**
     * Converts a {@link IResult | IResult<T>} to a {@link DetailedResult | DetailedResult<T, TD>},
     * adding a supplied detail if the operation failed.
     * @param detail - The detail to be added if this operation failed.
     * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with either
     * the success result or the error message from this {@link IResult}, with
     * the supplied detail (if this event failed) or detail `undefined` (if
     * this result succeeded).
     */
    withFailureDetail<TD>(detail: TD): DetailedResult<T, TD>;

    /**
     * Converts a {@link IResult | IResult<T>} to a {@link DetailedResult | DetailedResult<T, TD>},
     * adding supplied details.
     * @param detail - The default detail to be added to the new {@link DetailedResult}.
     * @param successDetail - An optional detail to be added if this result was successful.
     * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with either
     * the success result or the error message from this {@link IResult} and the
     * appropriate added detail.
     */
    withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD>;
}

/**
 * Reports a successful {@link IResult | result} from some operation and the
 * corresponding value.
 * @public
 */
export class Success<T> implements IResult<T> {
    /**
     * {@inheritdoc IResult.success}
     */
    public readonly success = true;
    /**
     * @internal
     */
    private readonly _value: T;

    /**
     * Constructs a {@link Success} with the supplied value.
     * @param value - The value to be returned.
     */
    constructor(value: T) {
        this._value = value;
    }

    /**
     * The result value returned by the successful operation.
     */
    public get value(): T {
        return this._value;
    }

    /**
     * {@inheritdoc IResult.isSuccess}
     */
    public isSuccess(): this is Success<T> {
        return true;
    }

    /**
     * {@inheritdoc IResult.isFailure}
     */
    public isFailure(): this is Failure<T> {
        return false;
    }

    /**
     * {@inheritdoc IResult.orThrow}
     */
    public orThrow(_logger?: IResultLogger): T {
        return this._value;
    }

    /**
     * {@inheritdoc IResult.orDefault}
     */
    public orDefault(dflt?: T): T|undefined {
        return this._value ?? dflt;
    }

    /**
     * {@inheritdoc IResult.getValueOrThrow}
     */
    public getValueOrThrow(_logger?: IResultLogger): T {
        return this._value;
    }

    /**
     * {@inheritdoc IResult.getValueOrDefault}
     */
    public getValueOrDefault(dflt?: T): T|undefined {
        return this._value ?? dflt;
    }

    /**
     * {@inheritdoc IResult.onSuccess}
     */
    public onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN> {
        return cb(this.value);
    }

    /**
     * {@inheritdoc IResult.onFailure}
     */
    public onFailure(_: FailureContinuation<T>): Result<T> {
        return this;
    }

    /**
     * {@inheritdoc IResult.withFailureDetail}
     */
    public withFailureDetail<TD>(_detail: TD): DetailedResult<T, TD> {
        return succeedWithDetail(this.value);
    }

    /**
     * {@inheritdoc IResult.withDetail}
     */
    public withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD> {
        return succeedWithDetail(this.value, successDetail ?? detail);
    }
}

/**
 * Reports a failed {@link IResult | result} from some operation, with an error message.
 * @public
 */
export class Failure<T> implements IResult<T> {
    /**
     * {@inheritdoc IResult.success}
     */
    public readonly success = false;

    /**
     * @internal
     */
    private readonly _message: string;

    /**
     * Constructs a {@link Failure} with the supplied message.
     * @param message - Error message to be reported.
     */
    constructor(message: string) {
        this._message = message;
    }

    /**
     * Gets the error message associated with this error.
     */
    public get message(): string {
        return this._message;
    }

    /**
     * {@inheritdoc IResult.isSuccess}
     */
    public isSuccess(): this is Success<T> {
        return false;
    }

    /**
     * {@inheritdoc IResult.isFailure}
     */
    public isFailure(): this is Failure<T> {
        return true;
    }

    /**
     * {@inheritdoc IResult.orThrow}
     */
    public orThrow(logger?: IResultLogger): never {
        if (logger !== undefined) {
            logger.error(this._message);
        }
        throw new Error(this._message);
    }

    /**
     * {@inheritdoc IResult.orDefault}
     */
    public orDefault(dflt?: T): T|undefined {
        return dflt;
    }

    /**
     * {@inheritdoc IResult.getValueOrThrow}
     */
    public getValueOrThrow(logger?: IResultLogger): never {
        if (logger !== undefined) {
            logger.error(this._message);
        }
        throw new Error(this._message);
    }

    /**
     * {@inheritdoc IResult.getValueOrDefault}
     */
    public getValueOrDefault(dflt?: T): T|undefined {
        return dflt;
    }

    /**
     * {@inheritdoc IResult.onSuccess}
     */
    public onSuccess<TN>(_: SuccessContinuation<T, TN>): Result<TN> {
        return new Failure(this.message);
    }

    /**
     * {@inheritdoc IResult.onFailure}
     */
    public onFailure(cb: FailureContinuation<T>): Result<T> {
        return cb(this.message);
    }

    /**
     * {@inheritdoc IResult.withFailureDetail}
     */
    public withFailureDetail<TD>(detail: TD): DetailedResult<T, TD> {
        return failWithDetail(this.message, detail);
    }

    /**
     * {@inheritdoc IResult.withDetail}
     */
    public withDetail<TD>(detail: TD, _successDetail?: TD): DetailedResult<T, TD> {
        return failWithDetail(this.message, detail);
    }

    /**
     * Get a 'friendly' string representation of this object.
     * @remarks
     * The string representation of a {@link Failure} value is the error message.
     * @returns A string representing this object.
     */
    public toString(): string {
        return this.message;
    }
}

/**
 * Returns {@link Success | Success<T>} with the supplied result value.
 * @param value - The successful result value to be returned
 * @public
 */
export function succeed<T>(value: T): Success<T> {
    return new Success<T>(value);
}

/**
 * Returns {@link Failure | Failure<T>} with the supplied error message.
 * @param message - Error message to be returned.
 * @public
 */
export function fail<T>(message: string): Failure<T> {
    return new Failure<T>(message);
}

/**
 * Callback to be called when a {@link DetailedResult} encounters success.
 * @remarks
 * A success callback can return a different result type than it receives, allowing
 * success results to chain through intermediate result types.
 * @public
 */
export type DetailedSuccessContinuation<T, TD, TN> = (value: T, detail?: TD) => DetailedResult<TN, TD>;

/**
 * Callback to be called when a {@link DetailedResult} encounters a failure.
 * @remarks
 * A failure callback can change {@link Failure} to {@link Success} (e.g. by returning a default value)
 * or it can change or embellish the error message, but it cannot change the success return type.
 * @public
 */
export type DetailedFailureContinuation<T, TD> = (message: string, detail: TD) => DetailedResult<T, TD>;

/**
 * A {@link DetailedSuccess} extends {@link Success} to report optional success details in
 * addition to the error message.
 * @public
 */
export class DetailedSuccess<T, TD> extends Success<T> {
    /**
     * @internal
     */
    protected _detail?: TD;

    /**
     * Constructs a new {@link DetailedSuccess | DetailedSuccess<T, TD>} with the supplied
     * value and detail.
     * @param value - The value to be returned.
     * @param detail - An optional successful detail to be returned.  If omitted, detail
     * will be `undefined`.
     */
    public constructor(value: T, detail?: TD) {
        super(value);
        this._detail = detail;
    }

    /**
     * The success detail associated with this {@link DetailedSuccess}, or `undefined` if
     * no detail was supplied.
     */
    public get detail(): TD|undefined {
        return this._detail;
    }

    /**
     * Reports that this {@link DetailedSuccess} is a success.
     * @remarks
     * Always true for {@link DetailedSuccess} but can be used as type guard
     * to discriminate {@link DetailedSuccess} from {@link DetailedFailure} in
     * a {@link DetailedResult}.
     * @returns `true`
     */
    public isSuccess(): this is DetailedSuccess<T, TD> {
        return true;
    }

    /**
     * Invokes the supplied {@link DetailedSuccessContinuation | success callback} and propagates
     * its returned {@link DetailedResult | DetailedResult<TN, TD>}.
     * @remarks
     * The success callback mutates the return type from `<T>` to `<TN>`.
     * @param cb - The {@link DetailedSuccessContinuation | success callback} to be invoked.
     * @returns The {@link DetailedResult | DetailedResult<T, TD>} returned by the success callback.
     */
    public onSuccess<TN>(cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
        return cb(this.value, this._detail);
    }

    /**
     * Propagates this {@link DetailedSuccess}.
     * @remarks
     * Failure does not mutate return type so we can return this event directly.
     * @param _cb - {@link DetailedFailureContinuation | Failure callback} to be called
     * on a {@link DetailedResult} in case of failure (ignored).
     * @returns `this`
     */
    public onFailure(_cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
        return this;
    }
}

/**
 * A {@link DetailedFailure} extends {@link Failure} to report optional failure details in
 * addition to the error message.
 * @public
 */
export class DetailedFailure<T, TD> extends Failure<T> {
    /**
     * @internal
     */
    protected _detail: TD;

    /**
     * Constructs a new {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied
     * message and detail.
     * @param message - The message to be returned.
     * @param detail - The error detail to be returned.
     */
    public constructor(message: string, detail: TD) {
        super(message);
        this._detail = detail;
    }

    /**
     * The error detail associated with this {@link DetailedFailure}.
     */
    public get detail(): TD {
        return this._detail;
    }

    /**
     * Reports that this {@link DetailedFailure} is a failure.
     * @remarks
     * Always true for {@link DetailedFailure} but can be used as type guard
     * to discriminate {@link DetailedSuccess} from {@link DetailedFailure} in
     * a {@link DetailedResult}.
     * @returns `true`
     */
    public isFailure(): this is DetailedFailure<T, TD> {
        return true;
    }

    /**
     * Propagates the error message and detail from this result.
     * @remarks
     * Mutates the success type as the success callback would have, but does not
     * call the success callback.
     * @param _cb - {@link DetailedSuccessContinuation | Success callback} to be called
     * on a {@link DetailedResult} in case of success (ignored).
     * @returns A new {@link DetailedFailure | DetailedFailure<TN, TD>} which contains
     * the error message and detail from this one.
     */
    public onSuccess<TN>(_cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
        return new DetailedFailure<TN, TD>(this.message, this._detail);
    }

    /**
     * Invokes the supplied {@link DetailedFailureContinuation | failure callback} and propagates
     * its returned {@link DetailedResult | DetailedResult<T, TD>}.
     * @param cb - The {@link DetailedFailureContinuation | failure callback} to be invoked.
     * @returns The {@link DetailedResult | DetailedResult<T, TD>} returned by the failure callback.
     */
    public onFailure(cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
        return cb(this.message, this._detail);
    }
}

/**
 * Type inference to determine the result type `T` of a {@link DetailedResult | DetailedResult<T, TD>}.
 * @beta
 */
export type DetailedResult<T, TD> = DetailedSuccess<T, TD>|DetailedFailure<T, TD>;

/**
 * Type inference to determine the detail type `TD` of a {@link DetailedResult | DetailedResult<T, TD>}.
 * @beta
 */
export type ResultDetailType<T> = T extends DetailedResult<unknown, infer TD> ? TD : never;

/**
 * Returns {@link DetailedSuccess | DetailedSuccess<T, TD>} with a supplied value and optional
 * detail.
 * @param value - The value of type `<T>` to be returned.
 * @param detail - An optional detail of type `<TD>` to be returned.
 * @returns A {@link DetailedSuccess | DetailedSuccess<T, TD>} with the supplied value
 * and detail, if supplied.
 * @public
 */
export function succeedWithDetail<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
    return new DetailedSuccess<T, TD>(value, detail);
}

/**
 * Returns {@link DetailedFailure | DetailedFailure<T, TD>} with a supplied error message and detail.
 * @param message - The error message to be returned.
 * @param detail - The event detail to be returned.
 * @returns An {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied error
 * message and detail.
 * @public
 */
export function failWithDetail<T, TD>(message: string, detail: TD): DetailedFailure<T, TD> {
    return new DetailedFailure<T, TD>(message, detail);
}

/**
 * Propagates a {@link Success} or {@link Failure} {@link Result}, adding supplied
 * event details as appropriate.
 * @param result - The {@link Result} to be propagated.
 * @param detail - The event detail (type `<TD>`) to be added to the {@link Result | result}.
 * @param successDetail - An optional distinct event detail to be added to {@link Success} results.  If `successDetail`
 * is omitted or `undefined`, then `detail` will be applied to {@link Success} results.
 * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with the success value or error
 * message from the original `result` but with the specified detail added.
 * @public
 */
export function propagateWithDetail<T, TD>(result: Result<T>, detail: TD, successDetail?: TD): DetailedResult<T, TD> {
    return result.isSuccess()
        ? succeedWithDetail(result.value, successDetail ?? detail)
        : failWithDetail(result.message, detail);
}

/**
 * Wraps a function which might throw to convert exception results
 * to {@link Failure}.
 * @param func - The function to be captured.
 * @returns Returns {@link Success} with a value of type `<T>` on
 * success , or {@link Failure} with the thrown error message if
 * `func` throws an `Error`.
 * @public
 */
export function captureResult<T>(func: () => T): Result<T> {
    try {
        return succeed(func());
    }
    catch (err) {
        return fail((err as Error).message);
    }
}

/**
 * Aggregates successful result values from a collection of {@link Result | Result<T>}.
 * @param results - The collection of {@link Result | Result<T>} to be mapped.
 * @returns  If all {@link Result | results} are successful, returns {@link Success} with an
 * array containing all returned values.  If any {@link Result | results} failed, returns
 * {@link Failure} with a concatenated summary of all error messages.
 * @public
 */
export function mapResults<T>(results: Iterable<Result<T>>): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of results) {
        if (result.isSuccess()) {
            elements.push(result.value);
        }
        else {
            errors.push(result.message);
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(elements);
}

/**
 * Aggregates successful results from a collection of {@link DetailedResult | DetailedResult<T, TD>},
 * optionally ignoring certain error details.
 * @param results - The collection of {@link DetailedResult | DetailedResult<T, TD>} to be mapped.
 * @param ignore - An array of error detail values (of type `<TD>`) that should be ignored.
 * @returns {@link Success} with an array containing all successful results if all results either
 * succeeded or returned error details listed in `ignore`.  If any results failed with details
 * that cannot be ignored, returns {@link Failure} with an concatenated summary of all non-ignorable
 * error messages.
 * @public
 */
export function mapDetailedResults<T, TD>(results: Iterable<DetailedResult<T, TD>>, ignore: TD[]): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of results) {
        if (result.isSuccess()) {
            elements.push(result.value);
        }
        else if (!ignore.includes(result.detail)) {
            errors.push(result.message);
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(elements);
}

/**
 * Aggregates successful results from a a collection of {@link Result | Result<T>}.
 * @param results - An `Iterable` of {@link Result | Result<T>} from which success
 * results are to be aggregated.
 * @returns {@link Success} with an array of `<T>` if any results were successful. If
 * all {@link Result | results} failed, returns {@link Failure} with a concatenated
 * summary of all error messages.
 * @public
 */
export function mapSuccess<T>(results: Iterable<Result<T>>): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of results) {
        if (result.isSuccess()) {
            elements.push(result.value);
        }
        else {
            errors.push(result.message);
        }
    }

    if ((elements.length === 0) && (errors.length > 0)) {
        return fail(errors.join('\n'));
    }
    return succeed(elements);
}

/**
 * Aggregates error messages from a collection of {@link Result | Result<T>}.
 * @param results - An iterable collection of {@link Result | Result<T>} for which
 * error messages are aggregated.
 * @returns An array of strings consisting of all error messages returned by
 * {@link Result | results} in the source collection. Ignores {@link Success}
 * results and returns an empty array if there were no errors.
 * @public
 */
export function mapFailures<T>(results: Iterable<Result<T>>): string[] {
    const errors: string[] = [];
    for (const result of results) {
        if (result.isFailure()) {
            errors.push(result.message);
        }
    }
    return errors;
}

/**
 * Determines if an iterable collection of {@link Result | Result<T>} were all successful.
 * @param results - The collection of {@link Result | Result<T>} to be tested.
 * @returns Returns {@link Success} with `true` if all {@link Result | results} are successful.
 * If any are unsuccessful, returns {@link Failure} with a concatenated summary the error
 * messages from all failed elements.
 * @public
 */
export function allSucceed<T>(results: Iterable<Result<unknown>>, successValue: T): Result<T> {
    const errors: string[] = [];

    // istanbul ignore else
    if (results !== undefined) {
        for (const result of results) {
            if (result.isFailure()) {
                errors.push(result.message);
            }
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(successValue);
}

/**
 * String-keyed record of initialization functions to be passed to {@link populateObject.(:withOptions)}.
 * @public
 */
export type FieldInitializers<T> = { [ key in keyof T ]: (state: Partial<T>) => Result<T[key]> };

/**
 * Options for the {@link populateObject.(:withOptions)} function.
 * @public
 */
export interface PopulateObjectOptions<T> {
    /**
     * If present, specifies the order in which property values should
     * be evaluated.  Any keys not listed are evaluated after all listed
     * keys in indeterminate order.  If 'order' is not present, keys
     * are evaluated in indeterminate order.
     */
    order?: (keyof T)[];

    /**
     * Specify handling of `undefined` values.  By default, successful
     * `undefined` results are written to the result object.  If this value
     * is `true` then `undefined` results are suppressed for all properties.
     * If this value is an array of property keys then `undefined` results
     * are suppressed for those properties only.
     */
    suppressUndefined?: boolean | (keyof T)[];
}

/**
 * Populates an an object based on a prototype full of field initializers that return {@link Result | Result<T[key]>}.
 * Returns {@link Success} with the populated object if all initializers succeed, or {@link Failure} with a
 * concatenated list of all error messages.
 * @param initializers - An object with the shape of the target but with initializer functions for
 * each property.
 * @param options - An optional {@link PopulateObjectOptions | set of options} which
 * modify the behavior of this call.
 * @public
 * {@label withOptions}
 */
export function populateObject<T>(initializers: FieldInitializers<T>, options?: PopulateObjectOptions<T>): Result<T>;

/**
 * Populates an an object based on a prototype full of field initializers that return {@link Result | Result<T[key]>}.
 * Returns {@link Success} with the populated object if all initializers succeed, or {@link Failure} with a
 * concatenated list of all error messages.
 * @param initializers - An object with the shape of the target but with initializer functions for
 * each property.
 * @param order - Optional order in which keys should be written.
 * @public
 * {@label withOrder}
 * @deprecated Pass {@link PopulateObjectOptions} instead.
 */
export function populateObject<T>(initializers: FieldInitializers<T>, order: (keyof T)[]): Result<T>;
export function populateObject<T>(initializers: FieldInitializers<T>, optionsOrOrder?: PopulateObjectOptions<T> | (keyof T)[]): Result<T> {
    const options: PopulateObjectOptions<T> = optionsOrOrder
        ? Array.isArray(optionsOrOrder) ? { order: optionsOrOrder } : optionsOrOrder
        : {};
    const state = {} as { [key in keyof T]: T[key] };
    const errors: string[] = [];
    const keys: (keyof T)[] = Array.from(options.order ?? []);
    const foundKeys = new Set<keyof T>(options.order);

    // start with the supplied order then append anything else we find
    for (const key in initializers) {
        if (!foundKeys.has(key)) {
            keys.push(key);
            foundKeys.add(key);
        }
    }

    for (const key of keys) {
        if (initializers[key]) {
            const result = initializers[key](state);
            if (result.isSuccess()) {
                if (result.value === undefined) {
                    if ((options.suppressUndefined === true)
                        || Array.isArray(options.suppressUndefined) && options.suppressUndefined.includes(key)) {
                        continue;
                    }
                }
                state[key] = result.value;
            }
            else {
                errors.push(result.message);
            }
        }
        else {
            errors.push(`populateObject: Key ${String(key)} is present but has no initializer`);
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(state as T);
}
