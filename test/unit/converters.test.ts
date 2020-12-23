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
import { ExtendedArray } from '../../src';

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

    describe('templateString converter', () => {
        test('converts valid strings', () => {
            ['A string', '1', 'true', ''].forEach((s) => {
                expect(Converters.templateString().convert(s)).toSucceedWith(s);
            });
        });

        test('fails for non-string values strings', () => {
            [1, true, {}, (): string => 'hello', ['true']].forEach((v) => {
                expect(Converters.templateString().convert(v)).toFailWith(/not a string/i);
            });
        });

        test('uses supplied context to populate template values', () => {
            const converter = Converters.templateString({ value: 'DEFAULT VALUE' });
            expect(converter.convert('{{value}} is expected', { value: 'expected' })).toSucceedWith('expected is expected');
        });

        test('uses default context to populate template values in none supplied at conversion time', () => {
            const converter = Converters.templateString({ value: 'DEFAULT VALUE' });
            expect(converter.convert('{{value}} is expected')).toSucceedWith('DEFAULT VALUE is expected');
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

        test('uses a context for expected values if supplied', () => {
            expect(pie.convert('apple', ['cherry'])).toFailWith(/invalid enumerated/i);
            expect(pie.convert('apple', ['apple'])).toSucceedWith('apple');
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
                    });
                }
            });
        });

        test('uses delimeter from context if supplied', () => {
            const converter = Converters.delimitedString(',');
            expect(converter.convert('a|b|c', '|')).toSucceedWith(['a', 'b', 'c']);
        });

        test('fails for a non-string', () => {
            expect(strings.convert(true)).toFailWith(/not a string/i);
        });
    });

    describe('isoDate converter', () => {
        test('converts an ISO formatted string to a Date object', () => {
            const date = new Date();
            expect(Converters.isoDate.convert(date.toISOString())).toSucceedWith(date);
        });

        test('converts a number to a Date object', () => {
            const date = new Date();
            expect(Converters.isoDate.convert(date.getTime())).toSucceedWith(date);
        });

        test('converts a Date object to a Date', () => {
            const date = new Date();
            expect(Converters.isoDate.convert(date)).toSucceedWith(date);
        });

        test('fails for a malformed date', () => {
            expect(Converters.isoDate.convert('whatever')).toFailWith(/invalid date/i);
        });

        test('fails for an unexpected type', () => {
            expect(Converters.isoDate.convert({ date: new Date() })).toFailWith(/cannot convert/i);
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

            test('can combine converters with different context types', () => {
                type TestEnum = 'enum1'|'enum2';
                const enumConverter = Converters.enumeratedValue<TestEnum>(['enum1', 'enum2']);
                const enumFirst = Converters.oneOf<TestEnum|number>([enumConverter, Converters.number]);
                expect(enumFirst.convert('enum1')).toSucceedWith('enum1');
                expect(enumFirst.convert(123)).toSucceedWith(123);
                expect(enumFirst.convert('enum7')).toFailWith(/invalid enumerated value/i);
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

        test('passes a supplied context to the base converter', () => {
            const context = { value: 'expected' };
            const sourceArray = ['{{value}} is expected', 'hello'];
            const expected = ['expected is expected', 'hello'];
            expect(Converters.arrayOf(Converters.templateString()).convert(sourceArray, context)).toSucceedWith(expected);
        });
    });


    describe('extendedArrayOf converter', () => {
        test('converts a valid array', () => {
            const srcArray = ['s1', 's2', 's3'];
            expect(Converters.extendedArrayOf('strings', Converters.string).convert(srcArray))
                .toSucceedAndSatisfy((got: ExtendedArray<string>) => {
                    expect(got.first()).toSucceedWith('s1');
                });
        });

        test('fails an array which contains values that cannot be converted if onError is "fail"', () => {
            const srcArray = ['s1', 's2', 's3', 10];
            expect(Converters.extendedArrayOf('strings', Converters.string, 'failOnError').convert(srcArray))
                .toFailWith(/not a string/i);
        });

        test('ignores values that cannot be converted if onError is "ignore"', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            expect(Converters.extendedArrayOf('strings', Converters.string, 'ignoreErrors').convert(badArray))
                .toSucceedAndSatisfy((got: ExtendedArray<string>) => {
                    expect(got.all()).toEqual(validArray);
                });
        });

        test('defaults to onError="failOnError"', () => {
            expect(Converters.extendedArrayOf('strings', Converters.string).convert([true])).toFail();
        });

        test('ignores undefined values returned by a converter', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            expect(Converters.extendedArrayOf('strings', Converters.string.optional()).convert(badArray))
                .toSucceedAndSatisfy((got: ExtendedArray<string>) => {
                    expect(got.all()).toEqual(validArray);
                });
        });

        test('fails when converting a non-array', () => {
            expect(Converters.extendedArrayOf('strings', Converters.string).convert(123))
                .toFailWith(/not an array/i);
        });

        test('passes a supplied context to the base converter', () => {
            const context = { value: 'expected' };
            const sourceArray = ['{{value}} is expected', 'hello'];
            const expected = ['expected is expected', 'hello'];
            expect(Converters.extendedArrayOf('templateStrings', Converters.templateString()).convert(sourceArray, context)).toSucceedWith(
                expect.arrayContaining(expected)
            );
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

        test('passes a supplied context to the base converter', () => {
            const source = {
                s1: '{{value}} is expected',
                s2: 's2',
            };
            const context = { value: 'expected' };
            const expected = {
                s1: 'expected is expected',
                s2: 's2',
            };
            const converter = Converters.templateString({ value: 'DEFAULT VALUE' });
            expect(Converters.recordOf(converter).convert(source, context)).toSucceedWith(expected);
        });

        test('fails when converting a non-object', () => {
            expect(Converters.recordOf(Converters.string).convert(123))
                .toFailWith(/not a string-keyed object/i);
        });
    });

    describe('mapOf converter', () => {
        test('converts a valid object', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const expected = new Map<string, string>([
                ['p1', 's1'],
                ['p2', 's2'],
                ['p3', 's2'],
            ]);
            expect(Converters.mapOf(Converters.string).convert(srcObject))
                .toSucceedWith(expected);
        });

        test('fails an object which contains values that cannot be converted if onError is "fail"', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
                p4: 10,
            };
            expect(Converters.mapOf(Converters.string, 'fail').convert(srcObject))
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

            expect(Converters.mapOf(Converters.string, 'fail').convert(srcObject))
                .toSucceedAndSatisfy((obj) => {
                    const value = obj as Map<string, unknown>;
                    expect(value.get('p1')).toEqual(srcObject.p1);
                    expect(value.get('p2')).toEqual(srcObject.p2);
                    expect(value.get('p3')).toEqual(srcObject.p3);
                    expect(value.get('p4')).toBeUndefined();
                    expect(value.get('base1')).toBeUndefined();
                });
        });

        test('ignores values that cannot be converted if onError is "ignore"', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const expected = new Map<string, string>([
                ['p1', 's1'],
                ['p2', 's2'],
                ['p3', 's3'],
            ]);
            const badObject = { ...validObject, badField: 10 };
            expect(
                Converters.mapOf(Converters.string, 'ignore').convert(badObject)
            ).toSucceedWith(expected);
        });

        test('defaults to onError="fail"', () => {
            expect(Converters.mapOf(Converters.string).convert({ bad: true })).toFail();
        });

        test('ignores undefined values returned by a converter', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const expected = new Map<string, string>([
                ['p1', 's1'],
                ['p2', 's2'],
                ['p3', 's3'],
            ]);
            const badObject = { badField: 100, ...validObject };
            expect(
                Converters.mapOf(Converters.string.optional()).convert(badObject)
            ).toSucceedWith(expected);
        });

        test('passes a supplied context to the base conveter', () => {
            const source = {
                p1: '{{expected}} is expected',
                p2: 'p2',
            };
            const context = { value: 'expected' };
            const expected = new Map<string, string>([
                ['p1', 'expected is expected'],
                ['p2', 'p2'],
            ]);
            const converter = Converters.templateString({ value: 'DEFAULT VALUE' });
            expect(Converters.mapOf(converter).convert(source, context)).toSucceedWith(expected);
        });

        test('fails when converting a non-object', () => {
            expect(Converters.mapOf(Converters.string).convert(123))
                .toFailWith(/not a string-keyed object/i);
        });
    });

    describe('element converter', () => {
        const good = ['test', 10];

        test('converts a correctly-typed field that exists', () => {
            [
                { index: 0, converter: Converters.element(0, Converters.string) },
                { index: 1, converter: Converters.element(1, Converters.number) },
            ].forEach((t) => {
                expect(t.converter.convert(good)).toSucceedWith(good[t.index]);
            });
        });

        test('fails for an incorrectly typed field', () => {
            [
                { index: 0, converter: Converters.element(0, Converters.number) },
                { index: 1, converter: Converters.element(1, Converters.string) },
            ].forEach((t) => {
                expect(t.converter.convert(good)).toFailWith(/not a/i);
            });
        });

        test('fails for a non-existent element', () => {
            const converter = Converters.element(3, Converters.string);
            expect(converter.convert(good)).toFailWith(/out of range/i);
        });

        test('fails for a negative element', () => {
            const converter = Converters.element(-1, Converters.string);
            expect(converter.convert(good)).toFailWith(/negative/i);
        });

        test('fails if the source is not an array', () => {
            const converter = Converters.element(0, Converters.string);
            ['hello', 10, { field: 'hello' }, true, (): string => 'hello', undefined].forEach((v) => {
                expect(converter.convert(v)).toFailWith(/not an array/i);
            });
        });

        test('passes a supplied context to the base converter', () => {
            const source = ['{{value}} is expected'];
            const context = { value: 'expected' };
            const converter = Converters.element(0, Converters.templateString({ value: 'DEFAULT VALUE' }));
            expect(converter.convert(source, context)).toSucceedWith('expected is expected');
        });
    });

    describe('optionalElement converter', () => {
        const good = ['test', 10];

        test('converts a correctly-typed field that exists', () => {
            [
                { index: 0, converter: Converters.optionalElement(0, Converters.string) },
                { index: 1, converter: Converters.optionalElement(1, Converters.number) },
            ].forEach((t) => {
                expect(t.converter.convert(good)).toSucceedWith(good[t.index]);
            });
        });

        test('fails for an incorrectly typed field', () => {
            [
                { index: 0, converter: Converters.optionalElement(0, Converters.number) },
                { index: 1, converter: Converters.optionalElement(1, Converters.string) },
            ].forEach((t) => {
                expect(t.converter.convert(good)).toFailWith(/not a/i);
            });
        });

        test('succeeds with undefined for a non-existent element', () => {
            const converter = Converters.optionalElement(3, Converters.string);
            expect(converter.convert(good)).toSucceedWith(undefined);
        });

        test('fails for a negative element', () => {
            const converter = Converters.optionalElement(-1, Converters.string);
            expect(converter.convert(good)).toFailWith(/negative/i);
        });

        test('fails if the source is not an array', () => {
            const converter = Converters.optionalElement(0, Converters.string);
            ['hello', 10, { field: 'hello' }, true, (): string => 'hello', undefined].forEach((v) => {
                expect(converter.convert(v)).toFailWith(/not an array/i);
            });
        });

        test('passes a supplied context to the base converter', () => {
            const source = ['{{value}} is expected'];
            const context = { value: 'expected' };
            const converter = Converters.optionalElement(0, Converters.templateString({ value: 'DEFAULT VALUE' }));
            expect(converter.convert(source, context)).toSucceedWith('expected is expected');
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
            ['hello', 10, ['hello'], true, (): string => 'hello', undefined].forEach((v) => {
                expect(getFirstString.convert(v))
                    .toFailWith(/non-object/i);
            });
        });

        test('passes a supplied context to the base converter', () => {
            const source = { first: '{{value}} is expected' };
            const context = { value: 'expected' };
            const getFirstTemplate = Converters.field('first', Converters.templateString({ value: 'DEFAULT VALUE' }));
            expect(getFirstTemplate.convert(source, context)).toSucceedWith('expected is expected');
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

        test('succeeds with undefined if the converter fails on an undefined field', () => {
            const ugly = { first: 'test', second: undefined };
            expect(getSecondNumber.convert(ugly))
                .toSucceedWith(undefined);
        });

        test('passes a supplied context to the base converter', () => {
            const source = { first: '{{value}} is expected' };
            const context = { value: 'expected' };
            const getFirstTemplate = Converters.optionalField('first', Converters.templateString({ value: 'DEFAULT VALUE' }));
            expect(getFirstTemplate.convert(source, context)).toSucceedWith('expected is expected');
        });

        test('fails if the parameter is not an object', () => {
            ['hello', 10, ['hello'], true, (): string => 'hello', undefined].forEach((v) => {
                expect(getFirstString.convert(v))
                    .toFailWith(/non-object/i);
            });
        });
    });

    describe('object converter', () => {
        interface Want {
            stringField: string;
            optionalStringField?: string;
            enumField: 'enum1'|'enum2',
            numField: number;
            boolField: boolean;
            numbers?: number[];
        }
        const allFields: (keyof Want)[] = [
            'stringField', 'optionalStringField', 'enumField', 'numField', 'boolField', 'numbers',
        ];
        const optionalFields: (keyof Want)[] = ['optionalStringField', 'numbers'];

        const wantConverters: Converters.FieldConverters<Want> = {
            stringField: Converters.string,
            optionalStringField: Converters.string,
            enumField: Converters.enumeratedValue<'enum1'|'enum2'>(['enum1', 'enum2']),
            numField: Converters.number,
            boolField: Converters.boolean,
            numbers: Converters.arrayOf(Converters.number),
        };

        [
            {
                converter: Converters.object<Want>(wantConverters, optionalFields),
                description: 'with optional fields supplied directly',
            },
            {
                converter: Converters.object<Want>(wantConverters, { optionalFields }),
                description: 'with optional properties supplied as ObjectConverterOptions',
            },
            {
                converter: Converters.object<Want>(wantConverters),
                description: 'with optional fields supplied via addPartial',
                add: optionalFields,
            },
            {
                converter: Converters.object<Want>(wantConverters, ['optionalStringField']),
                description: 'with optional fields supplied both directly and via addPartial',
                add: ['numbers'] as (keyof Want)[],
            },
        ].forEach((t) => {
            describe(t.description, () => {
                const converter = (t.add ? t.converter.addPartial(t.add) : t.converter);
                test('converts a valid object with missing optional fields', () => {
                    const src = {
                        stringField: 'string1',
                        enumField: 'enum1',
                        numField: -1,
                        boolField: true,
                    };

                    const expected: Want = {
                        stringField: 'string1',
                        enumField: 'enum1',
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
                        enumField: 'enum2',
                        numField: -1,
                        boolField: true,
                        numbers: [-1, 0, 1, '2'],
                    };

                    const expected: Want = {
                        stringField: 'string1',
                        optionalStringField: 'optional string',
                        enumField: 'enum2',
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

                describe('with partial specified', () => {
                    test('succeeds if any of the added fields are missing', () => {
                        const src = {
                            numField: -1,
                            enumField: 'enum1',
                            boolField: true,
                        };

                        expect(converter.addPartial(['stringField']).convert(src))
                            .toSucceedWith(src);
                    });
                });
            });
        });

        describe('for unknown properties', () => {
            const converters: Converters.FieldConverters<Want> = {
                stringField: Converters.string,
                optionalStringField: Converters.optionalString,
                enumField: Converters.enumeratedValue<'enum1'|'enum2'>(['enum1', 'enum2']),
                numField: Converters.number,
                boolField: Converters.boolean,
                numbers: undefined,
            };

            [
                {
                    description: 'a field with undefined converter',
                    src: {
                        stringField: 'string1',
                        optionalStringField: 'optional string',
                        enumField: 'enum1',
                        numField: -1,
                        boolField: true,
                        numbers: [-1, 0, 1, '2'],
                    },
                },
                {
                    description: 'an unknown field',
                    src: {
                        stringField: 'string1',
                        optionalStringField: 'optional string',
                        enumField: 'enum1',
                        numField: -1,
                        boolField: true,
                        extraField: [-1, 0, 1, '2'],
                    },
                },
            ].forEach((t) => {
                test(`silently ignores ${t.description} by default`, () => {
                    const partialConverter = Converters.object<Want>(converters);

                    const expected: Want = {
                        stringField: 'string1',
                        optionalStringField: 'optional string',
                        enumField: 'enum1',
                        numField: -1,
                        boolField: true,
                    };

                    expect(partialConverter.convert(t.src)).toSucceedWith(expected);
                });

                test(`fails for ${t.description} in strict mode`, () => {
                    const strictConverter = Converters.object<Want>(converters, { strict: true });

                    expect(strictConverter.convert(t.src)).toFailWith(/unexpected property/);
                });
            });
        });

        describe('for non-object source', () => {
            const tests = [
                'string',
                [{ stringField: 'hello' }],
                () => { return { stringField: 'hello' }; },
            ];
            test('fails in non-strict mode', () => {
                const converter = Converters.object<Want>(wantConverters, allFields);
                tests.forEach((t) => {
                    expect(converter.convert(t)).toFailWith(/non-object/);
                });
            });

            test('fails in strict mode', () => {
                const converter = Converters.object<Want>(wantConverters, { optionalFields: allFields, strict: true });
                tests.forEach((t) => {
                    expect(converter.convert(t)).toFailWith(/not an object/);
                });
            });
        });
    });

    describe('discriminated object converter', () => {
        interface StringThing {
            which: 'string thing';
            property: string;
        }
        interface NumberThing {
            which: 'number thing';
            property: number;
        }
        type Thing = StringThing|NumberThing;
        const stConvert = Converters.object<StringThing>({
            which: Converters.enumeratedValue<'string thing'>(['string thing']),
            property: Converters.string,
        });
        const ntConvert = Converters.object<NumberThing>({
            which: Converters.enumeratedValue<'number thing'>(['number thing']),
            property: Converters.number,
        });
        type ThingDiscriminator = 'string thing'|'number thing';
        const thing = Converters.discriminatedObject<Thing, ThingDiscriminator>('which', {
            'string thing': stConvert,
            'number thing': ntConvert,
        });

        test('converts any properly discriminated value', () => {
            const st: StringThing = { which: 'string thing', property: 'hello' };
            const nt: NumberThing = { which: 'number thing', property: 123 };
            expect(thing.convert(st)).toSucceedWith(st);
            expect(thing.convert(nt)).toSucceedWith(nt);
        });

        test('fails to convert discriminated but incorrect objects', () => {
            const stNot = { which: 'string thing', property: 123 };
            const ntNot = { which: 'number thing', property: 'hello' };
            expect(thing.convert(stNot)).toFailWith(/not a string/i);
            expect(thing.convert(ntNot)).toFailWith(/not a number/i);
        });

        test('fails to convert non-discriminated or incorrectly discriminnated objects objects', () => {
            expect(thing.convert({ property: 'hello' })).toFailWith(/discriminator.*not present/i);
            expect(thing.convert({ which: null, property: 'hello' })).toFailWith(/discriminator.*not present/i);
            expect(thing.convert({ which: 'boolean thing', property: true })).toFailWith(/no converter for discriminator/i);
        });

        test('fails for non-objects', () => {
            expect(thing.convert('string thing')).toFailWith(/not a discriminated object/i);
            expect(thing.convert([{ which: 'string thing', property: 'hello' }])).toFailWith(/not a discriminated object/i);
            expect(thing.convert(null)).toFailWith(/not a discriminated object/i);
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
