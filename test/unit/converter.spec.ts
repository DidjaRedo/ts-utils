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
import {
    Converter,
    Result,
    fail,
    succeed,
} from '../../src';

describe('Converter class', () => {
    const numberConverter = new Converter<number>((from: unknown) => {
        if (typeof from !== 'number') {
            const num: number = (typeof from === 'string' ? Number(from) : NaN);
            return isNaN(num)
                ? fail(`Not a number: ${JSON.stringify(from)}`)
                : succeed(num);
        }
        return succeed(from);
    });
    const stringConverter = new Converter<string>((from: unknown) => {
        return typeof from === 'string'
            ? succeed(from as string)
            : fail(`Not a string: ${JSON.stringify(from)}`);
    });

    describe('convertOptional method', () => {
        it('should ignore errors by default', () => {
            expect(stringConverter.convertOptional(true).isSuccess()).toBe(true);
        });
    });

    describe('optional method', () => {
        describe('with failOnError', () => {
            const optionalString = stringConverter.optional('failOnError');

            it('should convert a valid value  or undefined as expected', () => {
                ['a string', '', 'true', '10', undefined].forEach((v) => {
                    const result = optionalString.convert(v);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toEqual(v);
                    }
                });
            });
            it('should fail for an invalid value', () => {
                [10, true, [], (): string => 'hello'].forEach((v) => {
                    const result = optionalString.convert(v);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(/not a string/i);
                    }
                });
            });
        });

        describe('with ignoreErrors', () => {
            const optionalString = stringConverter.optional('ignoreErrors');

            it('should convert a valid value or undefined as expected', () => {
                ['a string', '', 'true', '10', undefined].forEach((v) => {
                    const result = optionalString.convert(v);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toEqual(v);
                    }
                });
            });
            it('should succeed and return undefined for an invalid value', () => {
                [10, true, [], (): string => 'hello'].forEach((v) => {
                    const result = optionalString.convert(v);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toBeUndefined();
                    }
                });
            });
        });

        describe('with default conversion', () => {
            it('should ignore errors', () => {
                const optionalString = stringConverter.optional();
                expect(optionalString.convert(true).isSuccess()).toBe(true);
            });
        });
    });

    describe('map method', () => {
        const targetString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const mapper = (count: number): Result<string> => {
            if ((count > 0) && (count < targetString.length)) {
                return succeed(targetString.substring(0, count));
            }
            return fail(`Count ${count} is out of range.`);
        };
        const mappingConverter = numberConverter.map(mapper);

        it('should apply a mapping function to a sucessful conversion', () => {
            const result = mappingConverter.convert(3);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(targetString.substring(0, 3));
            }
        });

        it('should report a mapping failure for an otherwise successful conversion', () => {
            const result = mappingConverter.convert(-1);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/out of range/i);
            }
        });

        it('should report a conversion failure without applying the mapping function', () => {
            const result = mappingConverter.convert('test');
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a number/i);
            }
        });
    });

    describe('withConstraint method', () => {
        describe('with a boolean constraint', () => {
            const constrained = numberConverter.withConstraint((n) => n >= 0 && n <= 100);
            it('should convert a valid value as expected', () => {
                [0, 100, '50'].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toEqual(Number(v));
                    }
                });
            });

            it('should fail for an otherwise valid value that does not meet a boolean constraint', () => {
                [-1, 200, '101'].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(/constraint/i);
                    }
                });
            });

            it('should propagate the error for an invalid value', () => {
                ['hello', {}, true].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(/not a number/i);
                    }
                });
            });
        });

        describe('with a Result constraint', () => {
            const constrained = numberConverter.withConstraint((n) => {
                return (n >= 0 && n <= 100) ? succeed(n) : fail('out of range');
            });

            it('should convert a valid value as expected', () => {
                [0, 100, '50'].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toEqual(Number(v));
                    }
                });
            });

            it('should fail for an otherwise valid value that does not meet a result constraint', () => {
                [-1, 200, '101'].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(/out of range/i);
                    }
                });
            });

            it('should propagate the error for an invalid value', () => {
                ['hello', {}, true].forEach((v) => {
                    const result = constrained.convert(v);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(/not a number/i);
                    }
                });
            });
        });
    });
});
