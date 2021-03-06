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
export type Result<T> = Success<T> | Failure<T>;
export type SuccessContinuation<T, TN> = (value: T) => Result<TN>;
export type FailureContinuation<T> = (message: string) => Result<T>;
export type ResultValueType<T> = T extends Result<infer TV> ? TV : never;

export interface IResultLogger {
    error(message: string): void;
}

export interface IResult<T> {
    isSuccess(): this is Success<T>;
    isFailure(): this is Failure<T>;
    getValueOrThrow(logger?: IResultLogger): T;
    getValueOrDefault(dflt?: T): T|undefined;
    onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN>;
    onFailure(cb: FailureContinuation<T>): Result<T>;
    withFailureDetail<TD>(detail: TD): DetailedResult<T, TD>;
    withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD>;
}

export class Success<T> implements IResult<T> {
    private readonly _value: T;

    constructor(value: T) {
        this._value = value;
    }

    public isSuccess(): this is Success<T> {
        return true;
    }

    public isFailure(): this is Failure<T> {
        return false;
    }

    public get value(): T {
        return this._value;
    }

    public getValueOrThrow(_logger?: IResultLogger): T {
        return this._value;
    }

    public getValueOrDefault(dflt?: T): T|undefined {
        return this._value ?? dflt;
    }

    public onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN> {
        return cb(this.value);
    }

    public onFailure(_: FailureContinuation<T>): Result<T> {
        return this;
    }

    public withFailureDetail<TD>(_detail: TD): DetailedResult<T, TD> {
        return succeedWithDetail(this.value);
    }

    public withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD> {
        return succeedWithDetail(this.value, successDetail ?? detail);
    }
}

export class Failure<T> implements IResult<T> {
    private readonly _message: string;

    constructor(message: string) {
        this._message = message;
    }

    public isSuccess(): this is Success<T> {
        return false;
    }

    public isFailure(): this is Failure<T> {
        return true;
    }

    public get message(): string {
        return this._message;
    }

    public getValueOrThrow(logger?: IResultLogger): never {
        if (logger !== undefined) {
            logger.error(this._message);
        }
        throw new Error(this._message);
    }

    public getValueOrDefault(dflt?: T): T|undefined {
        return dflt;
    }

    public onSuccess<TN>(_: SuccessContinuation<T, TN>): Result<TN> {
        return new Failure(this.message);
    }

    public onFailure(cb: FailureContinuation<T>): Result<T> {
        return cb(this.message);
    }

    public withFailureDetail<TD>(detail: TD): DetailedResult<T, TD> {
        return failWithDetail(this.message, detail);
    }

    public withDetail<TD>(detail: TD, _successDetail?: TD): DetailedResult<T, TD> {
        return failWithDetail(this.message, detail);
    }

    public toString(): string {
        return this.message;
    }
}

/**
 * Helper function for successful return
 * @param val The value to be returned
 */
export function succeed<T>(val: T): Success<T> {
    return new Success<T>(val);
}

/**
 * Helper function for error return
 * @param message Error message to be returned
 */
export function fail<T>(message: string): Failure<T> {
    return new Failure<T>(message);
}

export type DetailedSuccessContinuation<T, TD, TN> = (value: T, detail?: TD) => DetailedResult<TN, TD>;
export type DetailedFailureContinuation<T, TD> = (message: string, detail: TD) => DetailedResult<T, TD>;

export class DetailedSuccess<T, TD> extends Success<T> {
    protected _detail?: TD;

    public constructor(value: T, detail?: TD) {
        super(value);
        this._detail = detail;
    }

    public get detail(): TD|undefined {
        return this._detail;
    }

    public isSuccess(): this is DetailedSuccess<T, TD> {
        return true;
    }

    public onSuccess<TN>(cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
        return cb(this.value, this._detail);
    }

    public onFailure(_cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
        return this;
    }
}

/**
 * A DetailedFailure reports optional failure details in addition
 * to the standard failure message.
 */
export class DetailedFailure<T, TD> extends Failure<T> {
    protected _detail: TD;

    public constructor(message: string, detail: TD) {
        super(message);
        this._detail = detail;
    }

    public get detail(): TD {
        return this._detail;
    }

    public isFailure(): this is DetailedFailure<T, TD> {
        return true;
    }

    public onSuccess<TN>(_cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
        return new DetailedFailure<TN, TD>(this.message, this._detail);
    }

    public onFailure(cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
        return cb(this.message, this._detail);
    }
}

export type DetailedResult<T, TD> = DetailedSuccess<T, TD>|DetailedFailure<T, TD>;
export type ResultDetailType<T> = T extends DetailedResult<unknown, infer TD> ? TD : never;

export function succeedWithDetail<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
    return new DetailedSuccess<T, TD>(value, detail);
}

export function failWithDetail<T, TD>(message: string, detail: TD): DetailedFailure<T, TD> {
    return new DetailedFailure<T, TD>(message, detail);
}

export function propagateWithDetail<T, TD>(result: Result<T>, detail: TD, successDetail?: TD): DetailedResult<T, TD> {
    return result.isSuccess()
        ? succeedWithDetail(result.value, successDetail ?? detail)
        : failWithDetail(result.message, detail);
}

/**
 * Wraps a function which returns a value of type <T> or throws
 * to produce Success<T> or Failure<T>
 * @param func The method to be captured
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
 * Maps an array of Result<T> to an array of <T>, if all results are
 * successful.  If any results fail, returns failure with a concatenated
 * summary of all failure messages.
 * @param resultsIn The results to be mapped.
 */
export function mapResults<T>(resultsIn: Iterable<Result<T>>): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of resultsIn) {
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
 * Maps an array of DetailedResult<T, TD> to an array of <T>, if all results are
 * successful or yield ignorable errors.  If any results fail with an error that
 * cannot be ignored, returns failure with a concatenated summary of all failure messages.
 * @param resultsIn The results to be mapped.
 * @param ignore Error detail values that should be ignored
 */
export function mapDetailedResults<T, TD>(resultsIn: Iterable<DetailedResult<T, TD>>, ignore: TD[]): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of resultsIn) {
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
 * Maps an array of Result<T> to an array of <T>, omitting any error
 * results.  If no results were successful, returns failure with a
 * concatenated summary of all failure messages.
 */
export function mapSuccess<T>(resultsIn: Iterable<Result<T>>): Result<T[]> {
    const errors: string[] = [];
    const elements: T[] = [];

    for (const result of resultsIn) {
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
 * Maps an array of Result<T> to an array of strings consisting of all
 * error messages returned by results in the source array. Ignores
 * success results and returns an empty array if there were no errors.
 * @param resultsIn results to be reported
 */
export function mapFailures<T>(resultsIn: Iterable<Result<T>>): string[] {
    const errors: string[] = [];
    for (const result of resultsIn) {
        if (result.isFailure()) {
            errors.push(result.message);
        }
    }
    return errors;
}

/**
 * Returns success with true if all results are successful.  If any are unsuccessful,
 * returns failure with a concatenated summary of all failure messages.
 * @param results The results to be tested.
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

export type FieldInitializers<T> = { [ key in keyof T ]: (state: Partial<T>) => Result<T[key]> };

/**
 * Populates an an object based on a prototype full of field initializers that return Result<T[key]>.
 * Returns success with the populated object if all initializers succeed, or failure with a
 * concatenated list of all failure messages.
 * @param initializers An object with the shape of the target but with initializer functions for
 * each property.
 */
export function populateObject<T>(initializers: FieldInitializers<T>, order?: (keyof T)[]): Result<T> {
    const state = {} as { [key in keyof T]: T[key] };
    const errors: string[] = [];
    const keys: (keyof T)[] = Array.from(order ?? []);
    const foundKeys = new Set<keyof T>(order);

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
                state[key] = result.value;
            }
            else {
                errors.push(result.message);
            }
        }
        else {
            errors.push(`populateObject: Key ${key} is present but has no initializer`);
        }
    }

    if (errors.length > 0) {
        return fail(errors.join('\n'));
    }
    return succeed(state as T);
}
