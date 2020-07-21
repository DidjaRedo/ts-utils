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

import '../helpers/jest';
import { InMemoryLogger, LogLevel, Logger, LoggerBase, NoOpLogger } from '../../src/logger';
import {
    Result,
    Success,
    succeed,
} from '../../src';

describe('Logger class', () => {
    const messages: Record<LogLevel, string|undefined> = {
        'detail': 'This is a detail message',
        'info': 'This is an info message',
        'warning': 'This is a warning message',
        'error': 'This is an error message',
        'silent': 'This is a silent message',
    };
    const message = 'this is the default message';

    type LogResults = Partial<Record<LogLevel|'warnAndFail'|'default', Result<string|undefined>>>;
    function logEverything(logger: Logger): LogResults {
        return {
            detail: logger.detail(messages.detail),
            info: logger.info(messages.info),
            warning: logger.warn(messages.warning),
            warnAndFail: logger.warnAndFail(messages.warning),
            error: logger.error(messages.error),
            default: logger.log(message),
        };
    }

    describe('InMemoryLogger classe', () => {
        test('logs everything for logLevel "detail"', () => {
            const logger = new InMemoryLogger('detail');
            const results = logEverything(logger);
            expect(logger.messages).toEqual([
                messages.detail, messages.info, messages.warning, messages.warning, messages.error, message,
            ]);

            expect(results.detail).toSucceedWith(messages.detail);
            expect(results.info).toSucceedWith(messages.info);
            expect(results.warning).toSucceedWith(messages.warning);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(message);

            expect(logger.silent).toEqual([]);
        });

        test('omits "detail" for logLevel "info"', () => {
            const logger = new InMemoryLogger('info');
            const results = logEverything(logger);
            expect(logger.messages).toEqual([
                messages.info, messages.warning, messages.warning, messages.error, message,
            ]);

            expect(results.detail).toSucceedWith(undefined);
            expect(results.info).toSucceedWith(messages.info);
            expect(results.warning).toSucceedWith(messages.warning);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(message);

            expect(logger.silent).toEqual([]);
        });

        test('omits "detail" and "info" for logLevel "warning"', () => {
            const logger = new InMemoryLogger('warning');
            const results = logEverything(logger);
            expect(logger.messages).toEqual([
                messages.warning, messages.warning, messages.error, message,
            ]);

            expect(results.detail).toSucceedWith(undefined);
            expect(results.info).toSucceedWith(undefined);
            expect(results.warning).toSucceedWith(messages.warning);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(message);

            expect(logger.silent).toEqual([]);
        });

        test('displays only errors and explicit logs for logLevel "error"', () => {
            const logger = new InMemoryLogger('error');
            const results = logEverything(logger);
            expect(logger.messages).toEqual([
                messages.error, message,
            ]);

            expect(results.detail).toSucceedWith(undefined);
            expect(results.info).toSucceedWith(undefined);
            expect(results.warning).toSucceedWith(undefined);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(message);

            expect(logger.silent).toEqual([]);
        });

        test('suppresses everything and sends explicit log messages to the silent channel for logLevel "silent"', () => {
            const logger = new InMemoryLogger('silent');
            const results = logEverything(logger);

            expect(results.detail).toSucceedWith(undefined);
            expect(results.info).toSucceedWith(undefined);
            expect(results.warning).toSucceedWith(undefined);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(undefined);

            expect(logger.messages).toEqual([]);
            expect(logger.silent).toEqual([message]);
        });

        test('concatenates parameters as strings', () => {
            const logger = new InMemoryLogger();
            logger.log('This is a string with an embedded ', 2, ' and a boolean ', true);
            expect(logger.messages).toEqual(['This is a string with an embedded 2 and a boolean true']);
        });

        describe('clear method', () => {
            test('clears both messages and silent', () => {
                const logger = new InMemoryLogger();
                logger.log('message');
                logger.logLevel = 'silent';
                logger.log('silent');
                expect(logger.messages).toEqual(['message']);
                expect(logger.silent).toEqual(['silent']);
                logger.clear();
                expect(logger.messages).toEqual([]);
                expect(logger.silent).toEqual([]);
            });
        });
    });

    describe('NoOpLogger class', () => {
        test('returns successfully when logging', () => {
            const logger = new NoOpLogger('detail');
            expect(() => logEverything(logger)).not.toThrow();
        });

        test('returns successfully when silent', () => {
            const logger = new NoOpLogger('silent');
            expect(() => logEverything(logger)).not.toThrow();
        });
    });

    describe('Unknown errors', () => {
        class BogusLogger extends LoggerBase {
            protected _innerLog(_message: string): Success<string|undefined> {
                return succeed(undefined);
            }
            protected _innerSilent(_message: string): Success<string|undefined> {
                return succeed(undefined);
            }
        }

        test('returns \'unknown error\' if the inner logger returns undefined', () => {
            const logger = new BogusLogger('detail');
            const results = logEverything(logger);
            expect(results.detail).toSucceedWith(undefined);
            expect(results.info).toSucceedWith(undefined);
            expect(results.warning).toSucceedWith(undefined);
            expect(results.warnAndFail).toFailWith(messages.warning);
            expect(results.error).toFailWith(messages.error);
            expect(results.default).toSucceedWith(undefined);
        });
    });
});
