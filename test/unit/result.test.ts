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
import 'jest-extended';
import '../helpers/jest';
import {
    DetailedResult,
    Failure,
    Result,
    Success,
    allSucceed,
    captureResult,
    fail,
    failWithDetail,
    isKeyOf,
    mapDetailedResults,
    mapFailures,
    mapResults,
    mapSuccess,
    populateObject,
    propagateWithDetail,
    succeed,
    succeedWithDetail,
} from '../../src';
import { InMemoryLogger } from '../../src/logger';

describe('Result module', () => {
    describe('Success class', () => {
        describe('orThrow method', () => {
            test('returns the value and not throw', () => {
                const value = 'hello';
                const s = new Success(value);
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = s.orThrow();
                }).not.toThrow();
                expect(gotValue).toEqual(value);

                expect(() => {
                    gotValue = s.getValueOrThrow();
                }).not.toThrow();
                expect(gotValue).toEqual(value);
            });

            test('does not invoke a logger if supplied', () => {
                const logger = { error: jest.fn() };
                expect(() => {
                    succeed('hello').orThrow(logger);
                }).not.toThrow();
                expect(logger.error).not.toHaveBeenCalled();

                expect(() => {
                    succeed('hello').getValueOrThrow(logger);
                }).not.toThrow();
                expect(logger.error).not.toHaveBeenCalled();
            });
        });

        describe('orDefault method', () => {
            test('returns the value and not throw', () => {
                const value = 'hello';
                const s = new Success(value);
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = s.orDefault();
                }).not.toThrow();
                expect(gotValue).toEqual(value);

                expect(() => {
                    gotValue = s.getValueOrDefault();
                }).not.toThrow();
                expect(gotValue).toEqual(value);
            });

            describe('with an undefined value', () => {
                test('returns the supplied default and not throw', () => {
                    const dflt = 'default value';
                    const s = new Success<string|undefined>(undefined);
                    let gotValue: string|undefined;

                    expect(() => {
                        gotValue = s.orDefault(dflt);
                    }).not.toThrow();
                    expect(gotValue).toEqual(dflt);

                    expect(() => {
                        gotValue = s.getValueOrDefault(dflt);
                    }).not.toThrow();
                    expect(gotValue).toEqual(dflt);
                });
            });
        });

        describe('onSuccess method', () => {
            test('calls the continuation', () => {
                const cb = jest.fn();
                succeed('hello').onSuccess(cb);
                expect(cb).toHaveBeenCalled();
            });

            test('returns any result from the continuation', () => {
                let result = succeed('hello').onSuccess(() => succeed('goodbye'));
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe('goodbye');
                }

                result = succeed('hello').onSuccess(() => fail('oops'));
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toBe('oops');
                }
            });
        });

        describe('onFailure method', () => {
            test('calls the continuation and returns the original result', () => {
                const cb = jest.fn((_: string): Result<string> => fail('oops'));
                const result = succeed('hello').onFailure(cb);
                expect(cb).not.toHaveBeenCalled();
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe('hello');
                }
            });
        });

        describe('withFailureDetail method', () => {
            test('reports success with no detail', () => {
                expect(succeed('hello').withFailureDetail('fred')).toSucceedWithDetail('hello', undefined);
            });
        });

        describe('withDetail method', () => {
            test('reports success with the supplied detail', () => {
                expect(succeed('hello').withDetail('fred')).toSucceedWithDetail('hello', 'fred');
            });

            test('reports success with the success detail if supplied', () => {
                expect(succeed('hello').withDetail('fred', 'wilma')).toSucceedWithDetail('hello', 'wilma');
            });
        });
    });

    describe('Failure class', () => {
        describe('orThrow method', () => {
            test('throws the message', () => {
                const errorMessage = 'this is an error message';
                const f = new Failure(errorMessage);

                expect(() => f.orThrow()).toThrowError(errorMessage);
                expect(() => f.getValueOrThrow()).toThrowError(errorMessage);
            });

            test('calls logger if supplied', () => {
                const logger = { error: jest.fn() };
                const errorMessage = 'this is an error message';
                const f = new Failure(errorMessage);

                expect(() => f.orThrow(logger)).toThrowError(errorMessage);
                expect(logger.error).toHaveBeenCalledWith(errorMessage);
            });

            test('getValueOrThrow calls logger if supplied', () => {
                const logger = { error: jest.fn() };
                const errorMessage = 'this is an error message';
                const f = new Failure(errorMessage);

                expect(() => f.getValueOrThrow(logger)).toThrowError(errorMessage);
                expect(logger.error).toHaveBeenCalledWith(errorMessage);
            });

            test('works with the utility logger class', () => {
                const logger = new InMemoryLogger();
                const errorMessage = 'this is an error message';
                const f = new Failure(errorMessage);

                expect(() => f.orThrow(logger)).toThrowError(errorMessage);
                expect(logger.messages).toEqual([errorMessage]);
            });
        });

        describe('orDefault method', () => {
            test('returns undefined if default is omitted', () => {
                const f = new Failure<string>('this is an error message');
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = f.orDefault();
                }).not.toThrow();
                expect(gotValue).toBeUndefined();

                expect(() => {
                    gotValue = f.getValueOrDefault();
                }).not.toThrow();
                expect(gotValue).toBeUndefined();
            });

            test('returns the supplied default and does not throw', () => {
                const dflt = 'default value';
                const f = new Failure<string>('this is an error message');
                let gotValue: string|undefined;
                expect(() => {
                    gotValue = f.orDefault(dflt);
                }).not.toThrow();
                expect(gotValue).toEqual(dflt);
            });
        });

        describe('onSuccess method', () => {
            test('does not call the continuation and returns the original result', () => {
                const cb = jest.fn((_: unknown): Result<string> => fail('oops'));
                const result = fail('oops').onSuccess(cb);
                expect(cb).not.toHaveBeenCalled();
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toBe('oops');
                }
            });
        });

        describe('onFailure method', () => {
            test('calls the continuation', () => {
                const cb = jest.fn();
                fail('oops').onFailure(cb);
                expect(cb).toHaveBeenCalled();
            });

            test('returns any result from the continuation', () => {
                let result = fail('bad').onFailure(() => fail('double bad'));
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toBe('double bad');
                }

                result = fail('hello').onFailure(() => succeed('nice save'));
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe('nice save');
                }
            });
        });

        describe('withFailureDetail method', () => {
            test('reports failure with the supplied detail', () => {
                expect(fail('oops').withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
            });
        });

        describe('withDetail method', () => {
            test('reports failure with the supplied detail', () => {
                expect(fail('oops').withDetail('fred')).toFailWithDetail('oops', 'fred');
            });

            test('reports failure with the default detail even if success detail is supplied', () => {
                expect(fail('oops').withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
            });
        });

        describe('toString method', () => {
            test('returns the message', () => {
                expect(new Failure('oops').toString()).toBe('oops');
            });
        });
    });

    describe('detailedSuccess class', () => {
        test('reports value', () => {
            const result = succeedWithDetail('message');
            expect(result).toSucceedWith('message');
        });

        test('reports detail', () => {
            const result = succeedWithDetail('message', 'detail');
            expect(result).toSucceedWith('message');
            expect(result.detail).toBe('detail');
        });

        test('isSuccess indicates detailed success', () => {
            const result = succeedWithDetail<string, string>('original message') as DetailedResult<string, string>;
            // The only difference between Success and DetailedSuccess is the call signature for
            // onFailure and onSuccess
            expect(result.onFailure((_message, detail) => {
                expect(typeof detail).toBe('never');
                return succeedWithDetail('hello');
            })).toSucceedWith('original message');
        });

        test('onSuccess passes value', () => {
            expect(succeedWithDetail('value').onSuccess((v) => {
                expect(v).toEqual('value');
                return succeedWithDetail('it worked!');
            })).toSucceedWith('it worked!');
        });

        test('onSuccess propagates detail', () => {
            expect(succeedWithDetail('value', 'detail').onSuccess((v, d) => {
                expect(v).toEqual('value');
                expect(d).toEqual('detail');
                return succeedWithDetail('it worked!');
            })).toSucceedWith('it worked!');
        });

        test('onFailure propagates success value', () => {
            expect(succeedWithDetail<string, string>('pass through').onFailure((_message, detail) => {
                expect(typeof detail).toBe('never');
                return failWithDetail('failed', 'should not happen');
            })).toSucceedWith('pass through');
        });

        describe('withFailureDetail method', () => {
            test('reports success with detail undefined', () => {
                expect(succeedWithDetail('hello', 10).withFailureDetail('fred')).toSucceedWithDetail('hello', undefined);
            });
        });

        describe('withDetail method', () => {
            test('reports success with the supplied detail, overriding original detail', () => {
                expect(succeedWithDetail('hello', 10).withDetail('fred')).toSucceedWithDetail('hello', 'fred');
            });

            test('reports success with the success detail if supplied, overriding original detail', () => {
                expect(succeedWithDetail('hello', 10).withDetail('fred', 'wilma')).toSucceedWithDetail('hello', 'wilma');
            });
        });
    });

    describe('detailedFailure class', () => {
        test('reports detail in addition to message', () => {
            const result = failWithDetail('message', 'detail');
            expect(result).toFailWith('message');
            expect(result.detail).toBe('detail');
        });

        test('isFailure indicates detailed failure', () => {
            const result = failWithDetail('message', 'detail') as DetailedResult<string, string>;
            if (result.isFailure()) {
                expect(result.detail).toBe('detail');
            }
        });

        test('onSuccess propagates detail', () => {
            const detail = { detail: 'detail' };
            expect(failWithDetail('error', detail).onSuccess((_v) => {
                expect(typeof _v).toBe('never');
                return succeedWithDetail('weird');
            })).toFailWithDetail('error', detail);
        });

        test('onFailure passes detail', () => {
            const detail = { detail: 'detail' };
            expect(failWithDetail('error', detail).onFailure((message, detail) => {
                expect(message).toBe('error');
                expect(detail).toEqual(detail);
                return succeedWithDetail('it worked');
            })).toSucceedWith('it worked');
        });

        describe('withFailureDetail method', () => {
            test('reports failure with the supplied detail, overriding any original detail', () => {
                expect(failWithDetail('oops', 10).withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
            });
        });

        describe('withDetail method', () => {
            test('reports failure with the supplied detail, overriding any original detail', () => {
                expect(failWithDetail('oops', 10).withDetail('fred')).toFailWithDetail('oops', 'fred');
            });

            test('reports failure with the default detail, overriding any original detail, even if success detail is supplied', () => {
                expect(failWithDetail('oops', 10).withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
            });
        });
    });

    describe('propagateWithDetail function', () => {
        test('propagates value and success detail on success if defined', () => {
            expect(propagateWithDetail(succeed('hello'), 'e', 's')).toSucceedWithDetail('hello', 's');
        });

        test('propagates value and default detail on success if success detail is not defined', () => {
            expect(propagateWithDetail(succeed('hello'), 'detail')).toSucceedWithDetail('hello', 'detail');
        });

        test('propagates message and failure detail if success detail is not defined', () => {
            expect(propagateWithDetail(fail('oops'), 'detail')).toFailWithDetail('oops', 'detail');
        });

        test('propagates message and failure detail if success detail is defined', () => {
            expect(propagateWithDetail(fail('oops'), 'e', 's')).toFailWithDetail('oops', 'e');
        });
    });

    describe('captureResult function', () => {
        test('returns success and the value if the method does not throw', () => {
            const successfulReturn = 'This is a successful return';
            const result = captureResult(() => {
                return successfulReturn;
            });
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toBe(successfulReturn);
            }
        });

        test('returns failure and the thrown message if the method throws', () => {
            const failedReturn = 'This is a successful return';
            const result = captureResult(() => {
                throw new Error(failedReturn);
            });
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toBe(failedReturn);
            }
        });
    });

    describe('mapResults function', () => {
        const strings = ['string1', 'STRING2', 'String_3'];
        const results = strings.map((s) => succeed(s));
        test('reports all values if all results are successful', () => {
            const result = mapResults(results);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(strings);
            }
        });

        test('reports an error if any results failed', () => {
            const errors = ['Biff!', 'Pow!', 'Bam!'];
            const errorResults = errors.map((s) => fail(s));
            const badResults = [...results, ...errorResults];
            const result = mapResults(badResults);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                for (const e of errors) {
                    expect(result.message).toContain(e);
                }
            }
        });
    });

    describe('mapDetailedResults function', () => {
        type TestDetail = 'real'|'fake';
        const strings = ['string1', 'STRING2', 'String_3'];
        const results = strings.map((s) => succeedWithDetail<string, TestDetail>(s, 'real'));

        test('reports all values if all results are successful', () => {
            expect(mapDetailedResults(results, ['fake'])).toSucceedWith(strings);
        });

        test('reports an error if any results fail with an unlisted error', () => {
            const errors = ['Biff!', 'Pow!', 'Bam!'];
            const errorResults = errors.map((s) => failWithDetail<string, TestDetail>(s, 'real'));
            const badResults = [...results, ...errorResults];
            const result = mapDetailedResults(badResults, ['fake']);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                for (const e of errors) {
                    expect(result.message).toContain(e);
                }
            }
        });

        test('ignores listed errors', () => {
            const errors = ['Biff!', 'Pow!', 'Bam!'];
            const errorResults = errors.map((s) => failWithDetail<string, TestDetail>(s, 'fake'));
            const badResults = [...results, ...errorResults];
            expect(mapDetailedResults(badResults, ['fake'])).toSucceedWith(strings);
        });

        test('omits listed errors even if some other result fails with an unlisted error', () => {
            const realErrors = ['Biff!', 'Pow!', 'Bam!'];
            const fakeErrors = ['Zap!'];
            const realErrorResults = realErrors.map((s) => failWithDetail<string, TestDetail>(s, 'real'));
            const fakeErrorResults = fakeErrors.map((s) => failWithDetail<string, TestDetail>(s, 'fake'));
            const badResults = [...results, ...fakeErrorResults, ...realErrorResults];
            const result = mapDetailedResults(badResults, ['fake']);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                for (const e of realErrors) {
                    expect(result.message).toContain(e);
                }
                for (const e of fakeErrors) {
                    expect(result.message).not.toContain(e);
                }
            }
        });
    });

    describe('mapSuccess function', () => {
        const strings = ['string1', 'STRING2', 'String_3'];
        const results = [...strings.map((s) => succeed(s)), fail('failure')];
        test('reports all successful values if any results are successful', () => {
            const result = mapSuccess(results);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(strings);
            }
        });

        test('reports an error if all results failed', () => {
            const errors = ['Biff!', 'Pow!', 'Bam!'];
            const errorResults = errors.map((s) => fail(s));
            const badResults = [...errorResults];
            const result = mapSuccess(badResults);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                for (const e of errors) {
                    expect(result.message).toContain(e);
                }
            }
        });
    });

    describe('mapFailures function', () => {
        const strings = ['string1', 'STRING2', 'String_3'];
        test('reports all error messages ignoring successful results', () => {
            const results = [fail('failure 1'), ...strings.map((s) => succeed(s)), fail('failure 2')];
            expect(mapFailures(results)).toEqual(['failure 1', 'failure 2']);
        });

        test('returns an empty array if all results succeed', () => {
            const results = strings.map((s) => succeed(s));
            expect(mapFailures(results)).toEqual([]);
        });
    });

    describe('allSucceed function', () => {
        const strings = ['string1', 'STRING2', 'String_3'];
        const results = strings.map((s) => succeed(s));
        test('returns true if all results are successful', () => {
            const result = allSucceed(results, true);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toBe(true);
            }
        });

        test('reports an error if any results failed', () => {
            const errors = ['Biff!', 'Pow!', 'Bam!'];
            const errorResults = errors.map((s) => fail(s));
            const badResults = [...results, ...errorResults];
            const result = allSucceed(badResults, true);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                for (const e of errors) {
                    expect(result.message).toContain(e);
                }
            }
        });
    });

    describe('populateObject function', () => {
        test('populates an object by invoking each initializer', () => {
            expect(populateObject({
                field: () => succeed('field'),
                numberField: () => succeed(10),
            })).toSucceedWith({
                field: 'field',
                numberField: 10,
            });
        });

        test('fails if any initializers fail', () => {
            expect(populateObject({
                field: () => succeed('field'),
                numberField: () => fail('oopsy'),
            })).toFailWith(/oopsy/i);
        });

        test('reports errors from all failing initializers', () => {
            expect(populateObject({
                field: () => fail('oops 1'),
                field2: () => fail('oops 2'),
            })).toFailWith('oops 1\noops 2');
        });

        test('invokes all initializers even if one fails', () => {
            const good2 = jest.fn(() => succeed('good 2'));
            expect(populateObject({
                field: () => fail('oops 1'),
                field2: good2,
                field3: () => fail('oops 3'),
            })).toFailWith('oops 1\noops 3');
            expect(good2).toHaveBeenCalled();
        });

        describe('with order (deprecated)', () => {
            test('invokes initializers in the specified order', () => {
                expect(populateObject({
                    field1: (state) => {
                        return (state.field2 === 'field2')
                            ? succeed('field1')
                            : fail('field 2 has not been correctly initialized');
                    },
                    field2: () => succeed('field2'),
                }, ['field2', 'field1'])).toSucceedWith({
                    field1: 'field1',
                    field2: 'field2',
                });
            });
        });

        describe('with options', () => {
            test('invokes initializers in the specified order', () => {
                expect(populateObject({
                    field1: (state) => {
                        return (state.field2 === 'field2')
                            ? succeed('field1')
                            : fail('field 2 has not been correctly initialized');
                    },
                    field2: () => succeed('field2'),
                }, { order: ['field2', 'field1'] })).toSucceedWith({
                    field1: 'field1',
                    field2: 'field2',
                });
            });

            test('invokes unlisted initializers after listed initializers', () => {
                expect(populateObject({
                    field3: (state) => succeed(`[${state.field1}, ${state.field2}]`),
                    field1: (state) => {
                        return (state.field2 === 'field2')
                            ? succeed('field1')
                            : fail('field 2 has not been correctly initialized');
                    },
                    field2: () => succeed('field2'),
                }, { order: ['field2', 'field1'] })).toSucceedWith({
                    field1: 'field1',
                    field2: 'field2',
                    field3: '[field1, field2]',
                });
            });

            test('fails if order lists a property that has no initializer', () => {
                interface Thing {
                    field1?: string;
                    field2?: string;
                    field3?: string;
                    field4?: string;
                }
                expect(populateObject<Thing>({
                    field3: (state) => succeed(`[${state.field1}, ${state.field2}]`),
                    field1: (state) => {
                        return (state.field2 === 'field2')
                            ? succeed('field1')
                            : fail('field 2 has not been correctly initialized');
                    },
                    field2: () => succeed('field2'),
                }, { order: ['field2', 'field1', 'field4'] })).toFailWith(/is present but/i);
            });

            test('propagates undefined results by default', () => {
                interface Thing {
                    field1: string;
                    field2?: string;
                    field3?: string;
                }
                expect(populateObject<Thing>({
                    field1: () => succeed('value1'),
                    field2: () => succeed(undefined),
                    field3: () => succeed(undefined),
                })).toSucceedAndSatisfy((thing: Thing) => {
                    expect(thing.field1).toBe('value1');
                    expect(thing.field2).toBeUndefined();
                    expect(thing.field3).toBeUndefined();
                    expect(isKeyOf('field2', thing)).toBe(true);
                    expect(isKeyOf('field3', thing)).toBe(true);
                });
            });

            test('does not propagate undefined results if suppressUndefined is true.', () => {
                interface Thing {
                    field1: string;
                    field2?: string;
                    field3?: string;
                }
                expect(populateObject<Thing>({
                    field1: () => succeed('value1'),
                    field2: () => succeed(undefined),
                    field3: () => succeed(undefined),
                }, { suppressUndefined: true })).toSucceedAndSatisfy((thing: Thing) => {
                    expect(thing.field1).toBe('value1');
                    expect(thing.field2).toBeUndefined();
                    expect(thing.field3).toBeUndefined();
                    expect(isKeyOf('field2', thing)).toBe(false);
                    expect(isKeyOf('field3', thing)).toBe(false);
                });
            });

            test('does not propagate undefined results for properties listed in suppressUndefined.', () => {
                interface Thing {
                    field1: string;
                    field2?: string;
                    field3?: string;
                }
                expect(populateObject<Thing>({
                    field1: () => succeed('value1'),
                    field2: () => succeed(undefined),
                    field3: () => succeed(undefined),
                }, { suppressUndefined: ['field2'] })).toSucceedAndSatisfy((thing: Thing) => {
                    expect(thing.field1).toBe('value1');
                    expect(thing.field2).toBeUndefined();
                    expect(thing.field3).toBeUndefined();
                    expect(isKeyOf('field2', thing)).toBe(false);
                    expect(isKeyOf('field3', thing)).toBe(true);
                });
            });
        });
    });
});
