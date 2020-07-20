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
        test('ignores errors by default', () => {
            expect(stringConverter.convertOptional(true)).toSucceed();
        });
    });

    describe('optional method', () => {
        describe('with failOnError', () => {
            const optionalString = stringConverter.optional('failOnError');

            test('converts a valid value  or undefined as expected', () => {
                ['a string', '', 'true', '10', undefined].forEach((v) => {
                    expect(optionalString.convert(v)).toSucceedWith(v);
                });
            });
            test('fails for an invalid value', () => {
                [10, true, [], (): string => 'hello'].forEach((v) => {
                    expect(optionalString.convert(v)).toFailWith(/not a string/i);
                });
            });
        });

        describe('with ignoreErrors', () => {
            const optionalString = stringConverter.optional('ignoreErrors');

            test('converts a valid value or undefined as expected', () => {
                ['a string', '', 'true', '10', undefined].forEach((v) => {
                    expect(optionalString.convert(v)).toSucceedWith(v);
                });
            });
            test('succeeds and returns undefined for an invalid value', () => {
                [10, true, [], (): string => 'hello'].forEach((v) => {
                    expect(optionalString.convert(v)).toSucceedWith(undefined);
                });
            });
        });

        describe('with default conversion', () => {
            test('ignores errors', () => {
                const optionalString = stringConverter.optional();
                expect(optionalString.convert(true)).toSucceed();
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

        test('applies a mapping function to a sucessful conversion', () => {
            expect(mappingConverter.convert(3)).toSucceedWith(targetString.substring(0, 3));
        });

        test('reports a mapping failure for an otherwise successful conversion', () => {
            expect(mappingConverter.convert(-1)).toFailWith(/out of range/i);
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
            test('converts a valid value as expected', () => {
                [0, 100, '50'].forEach((v) => {
                    expect(constrained.convert(v)).toSucceedWith(Number(v));
                });
            });

            test('fails for an otherwise valid value that does not meet a boolean constraint', () => {
                [-1, 200, '101'].forEach((v) => {
                    expect(constrained.convert(v)).toFailWith(/constraint/i);
                });
            });

            test('propagates the error for an invalid value', () => {
                ['hello', {}, true].forEach((v) => {
                    expect(constrained.convert(v)).toFailWith(/not a number/i);
                });
            });
        });

        describe('with a Result constraint', () => {
            const constrained = numberConverter.withConstraint((n) => {
                return (n >= 0 && n <= 100) ? succeed(n) : fail('out of range');
            });

            test('converts a valid value as expected', () => {
                [0, 100, '50'].forEach((v) => {
                    expect(constrained.convert(v)).toSucceedWith(Number(v));
                });
            });

            test('fails for an otherwise valid value that does not meet a result constraint', () => {
                [-1, 200, '101'].forEach((v) => {
                    expect(constrained.convert(v)).toFailWith(/out of range/i);
                });
            });

            test('propagates the error for an invalid value', () => {
                ['hello', {}, true].forEach((v) => {
                    expect(constrained.convert(v)).toFailWith(/not a number/i);
                });
            });
        });
    });
});
