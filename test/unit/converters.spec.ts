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
import * as Converters from '../../src/converters';

describe('Converters module', () => {
    describe('string converter', () => {
        it('should convert valid strings', () => {
            ['A string', '1', 'true', ''].forEach((s) => {
                const result = Converters.string.convert(s);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toEqual(s);
                }
            });
        });

        it('should fail for non-string values strings', () => {
            [1, true, {}, (): string => 'hello', ['true']].forEach((v) => {
                const result = Converters.string.convert(v);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/not a string/i);
                }
            });
        });
    });

    describe('enumerated values converter', () => {
        const pie = Converters.enumeratedValue<'apple'|'blueberry'|'cherry'>(['apple', 'blueberry', 'cherry']);
        it('should convert valid enumerated values', () => {
            [
                'apple', 'blueberry', 'cherry',
            ].forEach((test) => {
                expect(pie.convert(test)).toSucceedWith(test);
            });
        });

        it('should fail for invalid enumerated values', () => {
            [
                'german chocolate',
                'birthday',
            ].forEach((test) => {
                expect(pie.convert(test)).toFailWith(/invalid enumerated/i);
            });
        });
    });

    describe('number converter', () => {
        it('should convert valid numbers and numeric strings', () => {
            [-1, 0, 10, '100', '0', '-10'].forEach((v) => {
                const result = Converters.number.convert(v);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toEqual(Number(v));
                }
            });
        });

        it('should fail for non-numbers and numeric strings', () => {
            ['test', true, '10der', '100 tests', {}, [], (): number => 100].forEach((v) => {
                const result = Converters.number.convert(v);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/not a number/i);
                }
            });
        });
    });

    describe('boolean converter', () => {
        it('should convert booleans and boolean strings', () => {
            [true, 'true', 'TRUE', 'True'].forEach((v) => {
                const result = Converters.boolean.convert(v);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe(true);
                }
            });

            [false, 'false', 'FALSE', 'False'].forEach((v) => {
                const result = Converters.boolean.convert(v);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toBe(false);
                }
            });
        });

        it('should fail for non-booleans or non-boolean strings', () => {
            [1, 0, -1, {}, [], (): boolean => true, 'truthy', 'f', 't'].forEach((v) => {
                const result = Converters.boolean.convert(v);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/not a boolean/i);
                }
            });
        });
    });

    describe('delimitedString converter', () => {
        const strings = Converters.delimitedString('|');
        const allStrings = Converters.delimitedString('|', 'all');
        const filteredStrings = Converters.delimitedString('|', 'filtered');

        it('should split a delimited string correctly', () => {
            [
                { test: 'a|b|c', expect: ['a', 'b', 'c'] },
                { test: 'a||c', expect: ['a', 'c'], all: ['a', '', 'c'] },
            ].forEach((t) => {
                for (const converter of [strings, filteredStrings, allStrings]) {
                    const result = converter.convert(t.test);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        if (t.all && (converter === allStrings)) {
                            expect(result.value).toEqual(t.all);
                        }
                        else {
                            expect(result.value).toEqual(t.expect);
                        }
                    }
                }
            });
        });

        it('should fail for a non-string', () => {
            const result = strings.convert(true);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a string/i);
            }
        });
    });

    describe('oneOf converter', () => {
        describe('with onError set to ignoreOrrors', () => {
            const stringFirst = Converters.oneOf<string|number>([Converters.string, Converters.number]);
            const numFirst = Converters.oneOf<string|number>([Converters.number, Converters.string]);

            it('should convert a value with the first converter that succeeds, ignoring errors', () => {
                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: '100' },
                ].forEach((t) => {
                    const result = stringFirst.convert(t.src);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toBe(t.expect);
                    }
                });

                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: 100 },
                ].forEach((t) => {
                    const result = numFirst.convert(t.src);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toBe(t.expect);
                    }
                });
            });

            it('should fail if none of the converters can handle the value', () => {
                const result = numFirst.convert(true);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/no matching converter/i);
                }
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

            it('should convert a value with the first converter that returns undefined', () => {
                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: '100' },
                ].forEach((t) => {
                    const result = optionalStringFirst.convert(t.src);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toBe(t.expect);
                    }
                });

                [
                    { src: 'Test', expect: 'Test' },
                    { src: 10, expect: 10 },
                    { src: '100', expect: 100 },
                ].forEach((t) => {
                    const result = optionalNumFirst.convert(t.src);
                    expect(result.isSuccess()).toBe(true);
                    if (result.isSuccess()) {
                        expect(result.value).toBe(t.expect);
                    }
                });
            });

            it('should fail if any of the converters return an error', () => {
                [
                    { src: 10, expect: /not a string/i },
                ].forEach((t) => {
                    const result = stringFirst.convert(t.src);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(t.expect);
                    }
                });

                [
                    { src: 'Test', expect: /not a number/i },
                ].forEach((t) => {
                    const result = numFirst.convert(t.src);
                    expect(result.isFailure()).toBe(true);
                    if (result.isFailure()) {
                        expect(result.message).toMatch(t.expect);
                    }
                });
            });

            it('should fail if none of the converters can handle the value', () => {
                const result = allOptionalNumFirst.convert(true);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/no matching converter/i);
                }
            });
        });
    });

    describe('arrayOf converter', () => {
        it('should convert a valid array', () => {
            const srcArray = ['s1', 's2', 's3'];
            const result = Converters.arrayOf(Converters.string).convert(srcArray);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(srcArray);
            }
        });

        it('should fail an array which contains values that cannot be converted if onError is "fail"', () => {
            const srcArray = ['s1', 's2', 's3', 10];
            const result = Converters.arrayOf(Converters.string, 'failOnError').convert(srcArray);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a string/i);
            }
        });

        it('should ignore values that cannot be converted if onError is "ignore"', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            const result = Converters.arrayOf(Converters.string, 'ignoreErrors').convert(badArray);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(validArray);
            }
        });

        it('should default to onError="failOnError"', () => {
            expect(Converters.arrayOf(Converters.string).convert([true]).isFailure()).toBe(true);
        });

        it('should ignore undefined values returned by a converter', () => {
            const validArray = ['s1', 's2', 's3'];
            const badArray = [100, ...validArray, 10];
            const result = Converters.arrayOf(Converters.string.optional()).convert(badArray);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(validArray);
            }
        });

        it('should fail when converting a non-array', () => {
            const result = Converters.arrayOf(Converters.string).convert(123);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not an array/i);
            }
        });
    });


    describe('rangeOf converter', () => {
        const min = 0;
        const max = 1000;
        const converter = Converters.rangeOf(Converters.number);
        it('should convert a range with valid or omitted min and max specificatons', () => {
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
                const conversion = converter.convert(toConvert[i]);
                expect(conversion.isSuccess()).toBe(true);
                if (conversion.isSuccess()) {
                    expect(conversion.value).toEqual(expected[i]);
                }
            }
        });

        it('should convert and ignore extra fields', () => {
            const expected = { min, max };
            const conversion = converter.convert({
                min, max, extra: 'whatever',
            });
            expect(conversion.isSuccess()).toBe(true);
            if (conversion.isSuccess()) {
                expect(conversion.value).toEqual(expected);
            }
        });

        it('should fail if either min or max is invalid', () => {
            const bad = [
                { min: 'not a number' },
                { min, max: true },
            ];
            for (const t of bad) {
                const conversion = converter.convert(t);
                expect(conversion.isFailure()).toBe(true);
                if (conversion.isFailure()) {
                    expect(conversion.message).toMatch(/not a number/i);
                }
            }
        });

        it('should fail if the range is inverted', () => {
            const bad = { min: max, max: min };
            const conversion = converter.convert(bad);
            expect(conversion.isFailure()).toBe(true);
            if (conversion.isFailure()) {
                expect(conversion.message).toMatch(/inverted/i);
            }
        });
    });

    describe('recordOf converter', () => {
        it('should convert a valid object', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const result = Converters.recordOf(Converters.string).convert(srcObject);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(srcObject);
            }
        });

        it('should fail an object which contains values that cannot be converted if onError is "fail"', () => {
            const srcObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
                p4: 10,
            };
            const result = Converters.recordOf(Converters.string, 'fail').convert(srcObject);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a string/i);
            }
        });

        it('should ignore inherited or non-enumerable properties even if onError is "fail"', () => {
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

            const result = Converters.recordOf(Converters.string, 'fail').convert(srcObject);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                const value = result.value as Record<string, unknown>;
                expect(value.p1).toEqual(srcObject.p1);
                expect(value.p2).toEqual(srcObject.p2);
                expect(value.p3).toEqual(srcObject.p3);
                expect(value.p4).toBeUndefined();
                expect(value.base1).toBeUndefined();
            }
        });

        it('should ignore values that cannot be converted if onError is "ignore"', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const badObject = { ...validObject, badField: 10 };
            const result = Converters.recordOf(Converters.string, 'ignore').convert(badObject);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(validObject);
            }
        });

        it('should default to onError="fail"', () => {
            expect(Converters.recordOf(Converters.string).convert({ bad: true }).isFailure()).toBe(true);
        });

        it('should ignore undefined values returned by a converter', () => {
            const validObject = {
                p1: 's1',
                p2: 's2',
                p3: 's3',
            };
            const badObject = { badField: 100, ...validObject };
            const result = Converters.recordOf(Converters.string.optional()).convert(badObject);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(validObject);
            }
        });

        it('should fail when converting a non-object', () => {
            const result = Converters.recordOf(Converters.string).convert(123);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a string-keyed object/i);
            }
        });
    });

    describe('field converter', () => {
        const getFirstString = Converters.field('first', Converters.string);
        const getSecondNumber = Converters.field('second', Converters.number);
        const good = { first: 'test', second: 10 };
        const bad = { furst: 10, second: 'test' };

        it('should succeed in converting a correctly-typed field that exists', () => {
            const result = getFirstString.convert(good);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(good.first);
            }
        });

        it('should fail for an incorrectly typed field', () => {
            const result = getSecondNumber.convert(bad);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a number/i);
            }
        });

        it('should fail for a non-existent field', () => {
            const result = getFirstString.convert(bad);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/field.*not found/i);
            }
        });

        it('should fail if the parameter is not an object', () => {
            ['hello', 10, true, (): string => 'hello', undefined].forEach((v) => {
                const result = getFirstString.convert(v);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/non-object/i);
                }
            });
        });
    });

    describe('optionalField converter', () => {
        const getFirstString = Converters.optionalField('first', Converters.string);
        const getSecondNumber = Converters.optionalField('second', Converters.number);
        const good = { first: 'test', second: 10 };
        const bad = { furst: 10, second: 'test' };

        it('should succeed in converting a correctly-typed field that exists', () => {
            const result = getFirstString.convert(good);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(good.first);
            }
        });

        it('should fail for an incorrectly typed field', () => {
            const result = getSecondNumber.convert(bad);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a number/i);
            }
        });

        it('should succeed with undefined for a non-existent field', () => {
            const result = getFirstString.convert(bad);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toBeUndefined();
            }
        });

        it('should fail if the parameter is not an object', () => {
            ['hello', 10, true, (): string => 'hello', undefined].forEach((v) => {
                const result = getFirstString.convert(v);
                expect(result.isFailure()).toBe(true);
                if (result.isFailure()) {
                    expect(result.message).toMatch(/non-object/i);
                }
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

        it('should convert a valid object with missing optional fields', () => {
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

            const result = converter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        it('should convert a valid object with optional fields present', () => {
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

            const result = converter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        it('should fail if any non-optional fields are missing', () => {
            const src = {
                misnamedStringField: 'string1',
                numField: -1,
                boolField: true,
            };
            const result = converter.convert(src);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/stringField not found/i);
            }
        });

        it('should fail if any non-optional fields are mistyped', () => {
            const src = {
                stringField: 'string1',
                numField: true,
                boolField: -1,
            };
            const result = converter.convert(src);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a number/i);
            }
        });

        it('should silently ignore fields without a converter', () => {
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

            const result = partialConverter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        describe('with partial specified', () => {
            it('should succeed if any of the added fields are missing', () => {
                const src = {
                    numField: -1,
                    boolField: true,
                };
                const result = converter.addPartial(['stringField']).convert(src);
                expect(result.isSuccess()).toBe(true);
                if (result.isSuccess()) {
                    expect(result.value).toEqual(src);
                }
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

        it('should convert a valid object with empty optional fields', () => {
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

            const result = converter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        it('should convert a valid object with optional fields present', () => {
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

            const result = converter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        it('should fail if any non-optional fields are missing', () => {
            const src = {
                misnamedString1: 'string1',
                num1: -1,
                b1: true,
            };
            const result = converter.convert(src);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/string1 not found/i);
            }
        });

        it('should fail if any non-optional fields are mistyped', () => {
            const src = {
                string1: 'string1',
                num1: true,
                b1: -1,
            };
            const result = converter.convert(src);
            expect(result.isFailure()).toBe(true);
            if (result.isFailure()) {
                expect(result.message).toMatch(/not a number/i);
            }
        });

        it('should ignore mistyped optional fields', () => {
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

            const result = converter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });

        it('should silently ignore fields without a converter', () => {
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

            const result = partialConverter.convert(src);
            expect(result.isSuccess()).toBe(true);
            if (result.isSuccess()) {
                expect(result.value).toEqual(expected);
            }
        });
    });
});
