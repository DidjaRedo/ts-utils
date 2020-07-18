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
import '../helpers/jestHelpers';
import {
    Failure,
    Result,
    Success,
    allSucceed,
    captureResult,
    fail,
    mapResults,
    mapSuccess,
    succeed,
} from '../../src';

describe('Result module', () => {
    describe('Success class', () => {
        describe('getValueOrThrow method', () => {
            it('should return the value and not throw', () => {
                const value = 'hello';
                const s = new Success(value);
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = s.getValueOrThrow();
                }).not.toThrow();
                expect(gotValue).toEqual(value);
            });
        });

        describe('getValueOrDefault method', () => {
            it('should return the value and not throw', () => {
                const value = 'hello';
                const s = new Success(value);
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = s.getValueOrDefault();
                }).not.toThrow();
                expect(gotValue).toEqual(value);
            });

            describe('with an undefined value', () => {
                it('should return the supplied default and not throw', () => {
                    const dflt = 'default value';
                    const s = new Success<string|undefined>(undefined);
                    let gotValue: string|undefined;
                    expect(() => {
                        gotValue = s.getValueOrDefault(dflt);
                    }).not.toThrow();
                    expect(gotValue).toEqual(dflt);
                });
            });
        });

        describe('onSuccess method', () => {
            it('should call the continuation', () => {
                const cb = jest.fn();
                succeed('hello').onSuccess(cb);
                expect(cb).toHaveBeenCalled();
            });

            it('should return any result from the continuation', () => {
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
            it('should not call the continuation and should return the original result', () => {
                const cb = jest.fn((_: string): Result<string> => fail('oops'));
                const result = succeed('hello').onFailure(cb);
                expect(cb).not.toHaveBeenCalled();
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe('hello');
                }
            });
        });
    });

    describe('Failure class', () => {
        describe('getValueOrThrow method', () => {
            it('should throw the message', () => {
                const errorMessage = 'this is an error message';
                const f = new Failure(errorMessage);

                expect(() => f.getValueOrThrow()).toThrowError(errorMessage);
            });
        });

        describe('getValueOrDefault method', () => {
            it('should return undefined if default is omitted', () => {
                const f = new Failure<string>('this is an error message');
                let gotValue: string|undefined;

                expect(() => {
                    gotValue = f.getValueOrDefault();
                }).not.toThrow();
                expect(gotValue).toBeUndefined();
            });

            it('should return the supplied default and not throw', () => {
                const dflt = 'default value';
                const f = new Failure<string>('this is an error message');
                let gotValue: string|undefined;
                expect(() => {
                    gotValue = f.getValueOrDefault(dflt);
                }).not.toThrow();
                expect(gotValue).toEqual(dflt);
            });
        });

        describe('captureResult method', () => {
            it('should return success and the value if the method does not throw', () => {
                const successfulReturn = 'This is a successful return';
                const result = captureResult(() => {
                    return successfulReturn;
                });
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe(successfulReturn);
                }
            });

            it('should return failure and the thrown message if the method throws', () => {
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

        describe('mapResults method', () => {
            const strings = ['string1', 'STRING2', 'String_3'];
            const results = strings.map((s) => succeed(s));
            it('should report all values if all results are successful', () => {
                const result = mapResults(results);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toEqual(strings);
                }
            });

            it('should report an error if any results failed', () => {
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

        describe('mapSuccess method', () => {
            const strings = ['string1', 'STRING2', 'String_3'];
            const results = [...strings.map((s) => succeed(s)), fail('failure')];
            it('should report all successful values if any results are successful', () => {
                const result = mapSuccess(results);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toEqual(strings);
                }
            });

            it('should report an error if all results failed', () => {
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

        describe('allSucceed method', () => {
            const strings = ['string1', 'STRING2', 'String_3'];
            const results = strings.map((s) => succeed(s));
            it('should return true if all results are successful', () => {
                const result = allSucceed(results, true);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe(true);
                }
            });

            it('should report an error if any results failed', () => {
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


        describe('onSuccess method', () => {
            it('should not call the continuation and should return the original result', () => {
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
            it('should call the continuation', () => {
                const cb = jest.fn();
                fail('oops').onFailure(cb);
                expect(cb).toHaveBeenCalled();
            });

            it('should return any result from the continuation', () => {
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
    });

    describe('custom matcher tests', () => {
        it('should correctly report success or failure', () => {
            expect(succeed('hello')).toSucceed();
            expect(succeed('hello')).toSucceedWith('hello');
            expect(succeed('hello')).not.toSucceedWith('goodbye');
            expect(fail('oops')).not.toSucceed();
            expect(fail('oops')).not.toSucceedWith('oops');

            expect(fail('oops')).toFail();
            expect(fail('very long complicated message')).toFailWith(/complicated/i);
            expect(fail('very long complicated message')).toFailWith('complicated');

            expect(succeed({
                title: 'A title string',
                subtitles: ['subtitle 1', 'subtitle 2'],
            })).toSucceedWith(expect.objectContaining({
                title: expect.stringMatching(/.*title*/),
                subtitles: expect.arrayContaining([
                    'subtitle 1',
                    expect.stringContaining('2'),
                ]),
            }));

            expect(succeed({
                title: 'A title string',
                subtitles: ['subtitle 1', 'subtitle 2'],
            })).not.toSucceedWith(expect.objectContaining({
                title: expect.stringMatching(/.*title*/),
                subtitles: expect.arrayContaining([
                    'subtitle 1',
                    expect.stringContaining('3'),
                ]),
            }));

            expect(succeed({
                title: 'A title string',
                subtitles: ['subtitle 1', 'subtitle 2'],
            })).toSucceedWithCallback((value: { title: string, subtitles: string[] }) => {
                expect(value.title).toEqual('A title string');
            });

            expect(2).toBeInRange(1, 3);
            expect(2).toBeInRange(1, 2);
            expect(2).toBeInRange(2, 5);
            expect(4).not.toBeInRange(1, 3);
            expect(4).not.toBeInRange(5, 10);

            const obj = { name: 'name', value: 'value' };
            expect('this').toBeOneOf(['this', 7, obj]);
            expect('that').not.toBeOneOf(['this', 7, obj]);
            expect(obj).toBeOneOf([obj]);
            expect({ ...obj }).toBeOneOf([obj]);
            expect({ ...obj, extra: 'extra' }).not.toBeOneOf([obj]);
            expect(obj).toBeOneOf(['this', 7, expect.objectContaining({ name: 'name' })]);
        });
    });
});
