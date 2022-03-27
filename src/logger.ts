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
import { Failure, Success, fail, succeed } from './result';

export type LogLevel = 'detail'|'info'|'warning'|'error'|'silent';

export interface Logger {
    log(message?: unknown, ...parameters: unknown[]): Success<string|undefined>;
    detail(message?: unknown, ...parameters: unknown[]): Success<string|undefined>;
    info(message?: unknown, ...parameters: unknown[]): Success<string|undefined>;
    warn(message?: unknown, ...parameters: unknown[]): Success<string|undefined>;
    warnAndFail<T>(message?: unknown, ...parameters: unknown[]): Failure<T>;
    error<T>(message?: unknown, ...parameters: unknown[]): Failure<T>;
}

export abstract class LoggerBase {
    public logLevel: LogLevel = 'info';

    public constructor(logLevel?: LogLevel) {
        this.logLevel = logLevel ?? 'info';
    }

    public detail(message?: unknown, ...parameters: unknown[]): Success<string|undefined> {
        if (this.logLevel === 'detail') {
            return this.log(message, parameters);
        }
        return succeed(undefined);
    }

    public info(message?: unknown, ...parameters: unknown[]): Success<string|undefined> {
        if ((this.logLevel === 'detail') || (this.logLevel === 'info')) {
            return this.log(message, parameters);
        }
        return succeed(undefined);
    }

    public warn(message?: unknown, ...parameters: unknown[]): Success<string|undefined> {
        if ((this.logLevel !== 'error') && (this.logLevel !== 'silent')) {
            return this.log(message, parameters);
        }
        return succeed(undefined);
    }

    public warnAndFail<T>(message?: unknown, ...parameters: unknown[]): Failure<T> {
        const formatted = this._format(message, ...parameters);
        if ((this.logLevel !== 'error') && (this.logLevel !== 'silent')) {
            const result = this.log(formatted);
            return fail(result.value ?? formatted);
        }
        return fail(formatted);
    }

    public error<T>(message?: unknown, ...parameters: unknown[]): Failure<T> {
        const formatted = this._format(message, ...parameters);
        if (this.logLevel !== 'silent') {
            const result = this.log(formatted);
            return fail(result.value ?? formatted);
        }
        return fail(formatted);
    }

    public log(message?: unknown, ...parameters: unknown[]): Success<string|undefined> {
        const messageString = this._format(message, ...parameters);
        if (this.logLevel === 'silent') {
            return this._innerSilent(messageString);
        }
        return this._innerLog(messageString);
    }

    protected _format(message?: unknown, ...parameters: unknown[]): string {
        const raw = [message, ...parameters];
        const filtered = raw.filter((m): m is string => (m !== undefined));
        const strings = filtered.map((m) => m.toString());
        const joined = strings.join('');
        return joined;
    }

    protected _innerSilent(_message: string): Success<string|undefined> {
        return succeed(undefined);
    }

    protected abstract _innerLog(message: string): Success<string|undefined>;
}

export class InMemoryLogger extends LoggerBase {
    protected _messages: string[] = [];
    protected _silent: string[] = [];

    public constructor(logLevel?: LogLevel) {
        super(logLevel);
    }

    public get messages(): string[] { return this._messages; }
    public get silent(): string[] { return this._silent; }

    public clear(): void {
        this._messages = [];
        this._silent = [];
    }

    protected _innerLog(message: string): Success<string|undefined> {
        this._messages.push(message);
        return succeed(message);
    }

    protected _innerSilent(message: string): Success<string|undefined> {
        this._silent.push(message);
        return succeed(undefined);
    }
}

export class NoOpLogger extends LoggerBase {
    protected _innerLog(message: string): Success<string|undefined> {
        // no-op
        return succeed(message);
    }
}
