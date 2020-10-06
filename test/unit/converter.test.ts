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
    BaseConverter,
    Converter,
    Result,
    fail,
    succeed,
} from '../../src';

interface TestContext {
    value: string;
}

describe('BaseConverter class', () => {
    const numberConverter = new BaseConverter<number>((from: unknown) => {
        if (typeof from !== 'number') {
            const num: number = (typeof from === 'string' ? Number(from) : NaN);
            return isNaN(num)
                ? fail(`Not a number: ${JSON.stringify(from)}`)
                : succeed(num);
        }
        return succeed(from);
    });
    const stringConverter = new BaseConverter<string>((from: unknown) => {
        return typeof from === 'string'
            ? succeed(from as string)
            : fail(`Not a string: ${JSON.stringify(from)}`);
    });
    const contextConverter = new BaseConverter<string, TestContext>((from: unknown, _self: Converter<string, TestContext>, context?: TestContext): Result<string> => {
        if (typeof from === 'string') {
            const v = context?.value ?? '';
            return succeed(from.replace('{{value}}', v));
        }
        return fail('Cannot convert non-string');
    }, { value: 'DEFAULT VALUE' });

    describe('convert method', () => {
        test('passes context if supplied', () => {
            expect(contextConverter.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith('expected is expected');
        });

        test('uses default context if no context is supplied', () => {
            expect(contextConverter.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
        });
    });

    describe('convertOptional method', () => {
        test('ignores errors by default', () => {
            expect(stringConverter.convertOptional(true)).toSucceed();
        });

        test('passes context if supplied', () => {
            expect(contextConverter.convertOptional('{{value}} is expected', { value: 'expected' })).toSucceedWith('expected is expected');
        });

        test('uses default context if no context is supplied', () => {
            expect(contextConverter.convertOptional('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
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

        test('passes context to base converter', () => {
            const optionalTest = contextConverter.optional();
            expect(optionalTest.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith('expected is expected');
        });

        test('passes default context to base converter if none supplied', () => {
            const optionalTest = contextConverter.optional();
            expect(optionalTest.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
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

        test('reports a conversion failure without applying the mapping function', () => {
            expect(mappingConverter.convert('test'))
                .toFailWith(/not a number/i);
        });

        test('passes a supplied context to the base converter', () => {
            const testMap = contextConverter.map((from: string): Result<{ got: string}> => {
                return succeed({ got: from });
            });
            expect(testMap.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
                got: 'expected is expected',
            });
        });

        test('passes default context to the base converter if no context is supplied', () => {
            const testMap = contextConverter.map((from: string): Result<{ got: string}> => {
                return succeed({ got: from });
            });
            expect(testMap.convert('{{value}} is expected')).toSucceedWith({
                got: 'DEFAULT VALUE is expected',
            });
        });
    });

    describe('mapConvert method', () => {
        const converter = stringConverter.mapConvert(numberConverter);

        test('applies a second converter to a successful conversion', () => {
            expect(converter.convert('100')).toSucceedWith(100);
        });

        test('reports a failure from the chained converter', () => {
            expect(converter.convert('fred')).toFailWith(/not a number/i);
        });

        test('reports a failure from the initial conversion without invoking the second', () => {
            expect(converter.convert(true)).toFailWith(/not a string/i);
        });

        test('passes a supplied context to the base converter', () => {
            const tc = new BaseConverter<{ got: string }>((from: unknown) => {
                return succeed({ got: from as string });
            });
            const cc = contextConverter.mapConvert(tc);
            expect(cc.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith({
                got: 'expected is expected',
            });
        });

        test('passes default context to the base converter if none is supplied', () => {
            const tc = new BaseConverter<{ got: string }>((from: unknown) => {
                return succeed({ got: from as string });
            });
            const cc = contextConverter.mapConvert(tc);
            expect(cc.convert('{{value}} is expected')).toSucceedWith({
                got: 'DEFAULT VALUE is expected',
            });
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

        test('passes a supplied context to the base converter', () => {
            const constrained = contextConverter.withConstraint((s) => s.includes('expected'));
            expect(constrained.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith('expected is expected');
        });

        test('passes the default context to the base converter if none is supplied', () => {
            const constrained = contextConverter.withConstraint((s) => s.includes('expected'));
            expect(constrained.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
        });
    });
});
