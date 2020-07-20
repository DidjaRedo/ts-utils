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
import * as Converters from '../../src/converters';

describe('Converters module', () => {
    describe('string converter', () => {
        test('converts valid strings', () => {
            ['A string', '1', 'true', ''].forEach((s) => {
                expect(Converters.string.convert(s)).toSucceedWith(s);
            });
        });

        test('fails for non-string values strings', () => {
            [1, true, {}, (): string => 'hello', ['true']].forEach((v) => {
                expect(Converters.string.convert(v)).toFailWith(/not a string/i);
            });
        });
    });

    describe('enumerated values converter', () => {
        const pie = Converters.enumeratedValue<'apple'|'blueberry'|'cherry'>(['apple', 'blueberry', 'cherry']);
        test('converts valid enumerated values', () => {
            [
                'apple', 'blueberry', 'cherry',
            ].forEach((test) => {
                expect(pie.convert(test)).toSucceedWith(test);
            });
        });

        test('fails for invalid enumerated values', () => {
            [
                'german chocolate',
                'birthday',
            ].forEach((test) => {
                expect(pie.convert(test)).toFailWith(/invalid enumerated/i);
            });
        });
    });

    describe('number converter', () => {
        test('converts valid numbers and numeric strings', () => {
            [-1, 0, 10, '100', '0', '-10'].forEach((v) => {
                expect(Converters.number.convert(v)).toSucceedWith(Number(v));
            });
        });

        test('fails for non-numbers and numeric strings', () => {
            ['test', true, '10der', '100 tests', {}, [], (): number => 100].forEach((v) => {
                expect(Converters.number.convert(v)).toFailWith(/not a number/i);
            });
        });
    });

    describe('boolean converter', () => {
        test('fails booleans and boolean strings', () => {
            [true, 'true', 'TRUE', 'True'].forEach((v) => {
                expect(Converters.boolean.convert(v)).toSucceedWith(true);
            });

            [false, 'false', 'FALSE', 'False'].forEach((v) => {
                expect(Converters.boolean.convert(v)).toSucceedWith(false);
            });
        });

        test('fails for non-booleans or non-boolean strings', () => {
            [1, 0, -1, {}, [], (): boolean => true, 'truthy', 'f', 't'].forEach((v) => {
                expect(Converters.boolean.convert(v)).toFailWith(/not a boolean/i);
            });
        });
    });

    describe('delimitedString converter', () => {
        const strings = Converters.delimitedString('|');
        const allStrings = Converters.delimitedString('|', 'all');
        const filteredStrings = Converters.delimitedString('|', 'filtered');

        test('splits a delimited string correctly', () => {
            [
                { test: 'a|b|c', expect: ['a', 'b', 'c'] },
                { test: 'a||c', expect: ['a', 'c'], all: ['a', '', 'c'] },
            ].forEach((t) => {
                for (const converter of [strings, filteredStrings, allStrings]) {
                    expect(converter.convert(t.test)).toSucceedAndSatisfy((got: string[]) => {
                        if (t.all && (converter === allStrings)) {
                            expect(got).toEqual(t.all);
                        }
                        else {
                            expect(got).toEqual(t.expect);
                        }
                        return true;
                    });
                }
            });
        });

        test('fails for a non-string', () => {
            expect(strings.convert(true)).toFailWith(/not a string/i);
        });
    });

    describe('oneOf converter', () => {
        describe('with onError set to ignoreOrrors', () => {
            const stringFirst = Converters.oneOf<string|number>([Converters.string, Converters.number]);
            const numFirst = Converters.oneOf<string|number>([Converters.number, Converters.string]);

            test('converts a value with the first converter that succeeds, ignoring errors', () => {
                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: '100' },
                ].forEach((t) => {
                    expect(stringFirst.convert(t.src)).toSucceedWith(t.expect);
                });

                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: 100 },
                ].forEach((t) => {
                    expect(numFirst.convert(t.src)).toSucceedWith(t.expect);
                });
            });

            test('fails if none of the converters can handle the value', () => {
                expect(numFirst.convert(true)).toFailWith(/no matching converter/i);
            });
        });

        describe('with onError set to failOnError', () => {
            const stringFirst = Converters.oneOf<string|number>([
                Converters.string,
                Converters.number,
            ], 'failOnError');
            const numFirst = Converters.oneOf<string|number>([
                Converters.number,
                Converters.string,
            ], 'failOnError');
            const optionalStringFirst = Converters.oneOf<string|number|undefined>([
                Converters.string.optional('ignoreErrors'),
                Converters.number,
            ], 'failOnError');
            const optionalNumFirst = Converters.oneOf<string|number|undefined>([
                Converters.number.optional('ignoreErrors'),
                Converters.string,
            ], 'failOnError');
            const allOptionalNumFirst = Converters.oneOf<string|number|undefined>([
                Converters.number.optional('ignoreErrors'),
                Converters.string.optional('ignoreErrors'),
            ], 'failOnError');

            test('converts a value with the first converter that returns undefined', () => {
                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: '100' },
                ].forEach((t) => {
                    expect(optionalStringFirst.convert(t.src)).toSucceedWith(t.expect);
                });

                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: 100 },
                ].forEach((t) => {
                    expect(optionalNumFirst.convert(t.src)).toSucceedWith(t.expect);
                });
            });

            test('fails if any of the converters return an error', () => {
                [
                    { src: 10, expect: /not a string/i },
                ].forEach((t) => {
                    expect(stringFirst.convert(t.src)).toFailWith(t.expect);
                });

                [
                    { src: 'Test', expect: /not a number/i },
                ].forEach((t) => {
                    expect(numFirst.convert(t.src)).toFailWith(t.expect);
                });
            });

            test('fails if none of the converters can handle the value', () => {
                expect(allOptionalNumFirst.convert(true)).toFailWith(/no matching converter/i);
            });
        });
    });

    describe('arrayOf converter', () => {
        test('converts a valid array', () => {
            const srcArray = ['s1', 's2', 's3'];
            expect(Converters.arrayOf(Converters.string).convert(srcArray)).toSucceedWith(srcArray);
        });

        test('fails an array which contains values that cannot be converted if onError is "fail"', () => {
            const srcArray = ['s1', 's2', 's3', 10];
            expect(Converters.arrayOf(Converters.string, 'failOnError').convert(srcArray)).toFailWith(/not a string/i);
        });

        test('ignores values that cannot be converted if onError is "ignore"', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            expect(Converters.arrayOf(Converters.string, 'ignoreErrors').convert(badArray)).toSucceedWith(validArray);
        });

        test('defaults to onError="failOnError"', () => {
            expect(Converters.arrayOf(Converters.string).convert([true])).toFail();
        });

        test('ignores undefined values returned by a converter', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            expect(Converters.arrayOf(Converters.string.optional()).convert(badArray)).toSucceedWith(validArray);
        });
        test('fails when converting a non-array', () => {
            expect(Converters.arrayOf(Converters.string).convert(123)).toFailWith(/not an array/i);
        });
    });


    describe('rangeOf converter', () => {
        const min = 0;
        const max = 1000;
        const converter = Converters.rangeOf(Converters.number);
        test('converts a range with valid or omitted min and max specificatons', () => {
            const expected = [
                { min, max },
                { min },
                { max },
                {},
            ];
            const toConvert = expected.map((x) => {
                const result: { min?: unknown, max?: unknown } = {};
                if (x.min !== undefined) {
                    result.min = `${x.min}`;
                }
                if (x.max !== undefined) {
                    result.max = x.max.toString();
                }
                return result;
            });

            for (let i = 0; i < toConvert.length; i++) {
                expect(converter.convert(toConvert[i])).toSucceedWith(expected[i]);
            }
        });

        test('converts and ignore extra fields', () => {
            const expected = { min, max };
            const conversion = converter.convert({
                min, max, extra: 'whatever',
            });
            expect(conversion).toSucceedWith(expected);
        });

        test('fails if either min or max is invalid', () => {
            const bad = [
                { min: 'not a number' },
                { min, max: true },
            ];
            for (const t of bad) {
                expect(converter.convert(t)).toFailWith(/not a number/i);
            }
        });

        test('fails if the range is inverted', () => {
            const bad = { min: max, max: min };
            expect(converter.convert(bad)).toFailWith(/inverted/i);
        });
    });

    describe('recordOf converter', () => {
        test('converts a valid object', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            expect(Converters.recordOf(Converters.string).convert(srcObject))
                .toSucceedWith(srcObject);
        });

        test('fails an object which contains values that cannot be converted if onError is "fail"', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
                p4: 10,
            };
            expect(Converters.recordOf(Converters.string, 'fail').convert(srcObject))
                .toFailWith(/not a string/i);
        });

        test('ignores inherited or non-enumerable properties even if onError is "fail"', () => {
            interface BaseObject {
                p1: string;
                p2: string;
                p3: string;
                p4: number;
                base1: number;
            }
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const BaseObjectFunc = function (this: BaseObject): void {
                this.p1 = 's1';
                this.p2 = 's2';
                this.p3 = 's3';
                Object.defineProperty(this, 'p4', { value: 10, enumerable: false });
            };
            BaseObjectFunc.prototype.base1 = 100;

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const BaseObject = BaseObjectFunc as unknown as { new (): BaseObject };

            const srcObject = new BaseObject();

            // make sure our source object looks as expected
            expect(srcObject.base1).toBe(100);
            expect(srcObject.hasOwnProperty('base1')).toBe(false);
            expect(srcObject.p4).toBe(10);

            expect(Converters.recordOf(Converters.string, 'fail').convert(srcObject))
                .toSucceedAndSatisfy((obj) => {
                    const value = obj as Record<string, unknown>;
                    expect(value.p1).toEqual(srcObject.p1);
                    expect(value.p2).toEqual(srcObject.p2);
                    expect(value.p3).toEqual(srcObject.p3);
                    expect(value.p4).toBeUndefined();
                    expect(value.base1).toBeUndefined();
                    return true;
                });
        });

        test('ignores values that cannot be converted if onError is "ignore"', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const badObject = { ...validObject, badField: 10 };
            expect(
                Converters.recordOf(Converters.string, 'ignore').convert(badObject)
            ).toSucceedWith(validObject);
        });

        test('defailts to onError="fail"', () => {
            expect(Converters.recordOf(Converters.string).convert({ bad: true })).toFail();
        });

        test('ignores undefined values returned by a converter', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const badObject = { badField: 100, ...validObject };
            expect(
                Converters.recordOf(Converters.string.optional()).convert(badObject)
            ).toSucceedWith(validObject);
        });

        test('fails when converting a non-object', () => {
            expect(Converters.recordOf(Converters.string).convert(123))
                .toFailWith(/not a string-keyed object/i);
        });
    });

    describe('field converter', () => {
        const getFirstString = Converters.field('first', Converters.string);
        const getSecondNumber = Converters.field('second', Converters.number);
        const good = { first: 'test', second: 10 };
        const bad = { furst: 10, second: 'test' };

        test('converts a correctly-typed field that exists', () => {
            expect(getFirstString.convert(good))
                .toSucceedWith(good.first);
        });

        test('fails for an incorrectly typed field', () => {
            expect(getSecondNumber.convert(bad))
                .toFailWith(/not a number/i);
        });

        test('fails for a non-existent field', () => {
            expect(getFirstString.convert(bad))
                .toFailWith(/field.*not found/i);
        });

        test('fails if the parameter is not an object', () => {
            ['hello', 10, true, (): string => 'hello', undefined].forEach((v) => {
                expect(getFirstString.convert(v))
                    .toFailWith(/non-object/i);
            });
        });
    });

    describe('optionalField converter', () => {
        const getFirstString = Converters.optionalField('first', Converters.string);
        const getSecondNumber = Converters.optionalField('second', Converters.number);
        const good = { first: 'test', second: 10 };
        const bad = { furst: 10, second: 'test' };

        test('converts a correctly-typed field that exists', () => {
            expect(getFirstString.convert(good))
                .toSucceedWith(good.first);
        });

        test('fails for an incorrectly typed field', () => {
            expect(getSecondNumber.convert(bad))
                .toFailWith(/not a number/i);
        });

        test('succeeds with undefined for a non-existent field', () => {
            expect(getFirstString.convert(bad))
                .toSucceedWith(undefined);
        });

        test('fails if the parameter is not an object', () => {
            ['hello', 10, true, (): string => 'hello', undefined].forEach((v) => {
                expect(getFirstString.convert(v))
                    .toFailWith(/non-object/i);
            });
        });
    });

    describe('object converter', () => {
        interface Want {
            stringField: string;
            optionalStringField?: string;
            numField: number;
            boolField: boolean;
            numbers?: number[];
        }

        const converter = Converters.object<Want>({
            stringField: Converters.string,
            optionalStringField: Converters.string,
            numField: Converters.number,
            boolField: Converters.boolean,
            numbers: Converters.arrayOf(Converters.number),
        }, [
            'optionalStringField',
            'numbers',
        ]);

        test('converts a valid object with missing optional fields', () => {
            const src = {
                stringField: 'string1',
                numField: -1,
                boolField: true,
            };

            const expected: Want = {
                stringField: 'string1',
                numField: -1,
                boolField: true,
            };

            expect(converter.convert(src))
                .toSucceedWith(expected);
        });

        test('converts a valid object with optional fields present', () => {
            const src = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
                numbers: [-1, 0, 1, '2'],
            };

            const expected: Want = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
                numbers: [-1, 0, 1, 2],
            };

            expect(converter.convert(src))
                .toSucceedWith(expected);
        });

        test('fails if any non-optional fields are missing', () => {
            const src = {
                misnamedStringField: 'string1',
                numField: -1,
                boolField: true,
            };
            expect(converter.convert(src))
                .toFailWith(/stringField not found/i);
        });

        test('fails if any non-optional fields are mistyped', () => {
            const src = {
                stringField: 'string1',
                numField: true,
                boolField: -1,
            };

            expect(converter.convert(src))
                .toFailWith(/not a number/i);
        });

        test('silently ignores fields without a converter', () => {
            const partialConverter = Converters.object<Want>({
                stringField: Converters.string,
                optionalStringField: Converters.optionalString,
                numField: Converters.number,
                boolField: Converters.boolean,
                numbers: undefined,
            });

            const src = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
                numbers: [-1, 0, 1, '2'],
            };

            const expected: Want = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
            };

            expect(partialConverter.convert(src))
                .toSucceedWith(expected);
        });

        describe('with partial specified', () => {
            test('succeeds if any of the added fields are missing', () => {
                const src = {
                    numField: -1,
                    boolField: true,
                };

                expect(converter.addPartial(['stringField']).convert(src))
                    .toSucceedWith(src);
            });
        });
    });

    describe('transform converter', () => {
        interface Want {
            stringField: string;
            optionalStringField?: string;
            numField: number;
            boolField: boolean;
            numbers?: number[];
        }

        const converter = Converters.transform<Want>({
            stringField: Converters.field('string1', Converters.string),
            optionalStringField: Converters.field('string2', Converters.string).optional(),
            numField: Converters.field('num1', Converters.number),
            boolField: Converters.field('b1', Converters.boolean),
            numbers: Converters.field('nums', Converters.arrayOf(Converters.number)).optional(),
        });

        test('converts a valid object with empty optional fields', () => {
            const src = {
                string1: 'string1',
                num1: -1,
                b1: true,
            };

            const expected: Want = {
                stringField: 'string1',
                numField: -1,
                boolField: true,
            };

            expect(converter.convert(src))
                .toSucceedWith(expected);
        });

        test('converts a valid object with optional fields present', () => {
            const src = {
                string1: 'string1',
                string2: 'optional string',
                num1: -1,
                b1: true,
                nums: [-1, 0, 1, '2'],
            };

            const expected: Want = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
                numbers: [-1, 0, 1, 2],
            };

            expect(converter.convert(src))
                .toSucceedWith(expected);
        });

        test('fails if any non-optional fields are missing', () => {
            const src = {
                misnamedString1: 'string1',
                num1: -1,
                b1: true,
            };

            expect(converter.convert(src))
                .toFailWith(/string1 not found/i);
        });

        test('fails if any non-optional fields are mistyped', () => {
            const src = {
                string1: 'string1',
                num1: true,
                b1: -1,
            };

            expect(converter.convert(src))
                .toFailWith(/not a number/i);
        });

        test('ignores mistyped optional fields', () => {
            const src = {
                string1: 'string1',
                string2: true,
                num1: -1,
                b1: true,
            };

            const expected: Want = {
                stringField: 'string1',
                numField: -1,
                boolField: true,
            };

            expect(converter.convert(src))
                .toSucceedWith(expected);
        });

        test('silently ignores fields without a converter', () => {
            const partialConverter = Converters.transform<Want>({
                stringField: Converters.field('string1', Converters.string),
                optionalStringField: Converters.field('string2', Converters.string).optional(),
                numField: Converters.field('num1', Converters.number),
                boolField: Converters.field('b1', Converters.boolean),
                numbers: undefined,
            });

            const src = {
                string1: 'string1',
                string2: 'optional string',
                num1: -1,
                b1: true,
                nums: [-1, 0, 1, '2'],
            };

            const expected: Want = {
                stringField: 'string1',
                optionalStringField: 'optional string',
                numField: -1,
                boolField: true,
            };

            expect(partialConverter.convert(src))
                .toSucceedWith(expected);
        });
    });
});
