/*
 * Copyright (c) 2022 Erik Fortune
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
import { RecordJar } from '../../src';
import fs from 'fs';

describe('record-jar helpers', () => {
    describe('parseRecordJarLines function', () => {
        test('parses a single record', () => {
            expect(RecordJar.parseRecordJarLines([
                'Field1 : Value1',
                'Field2: Value2',
                'Field3:Value3',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'Value1',
                Field2: 'Value2',
                Field3: 'Value3',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('parses escapes in a body', () => {
            expect(RecordJar.parseRecordJarLines([
                'FieldCR : before\\rafter',
                'FieldNL: before\\nafter',
                'FieldTab:before\\tafter',
                'FieldBackslash: before\\\\after',
                'FieldAmpersand: before\\&after',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                FieldCR: 'before\rafter',
                FieldNL: 'before\nafter',
                FieldTab: 'before\tafter',
                FieldBackslash: 'before\\after',
                FieldAmpersand: 'before&after',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('parses unicode characters in a body', () => {
            expect(RecordJar.parseRecordJarLines([
                'FieldEuro: before&#x20ac;after',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                FieldEuro: 'before€after',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('parses a value which contains a colon', () => {
            expect(RecordJar.parseRecordJarLines([
                'FieldColon:    value with a colon before:after',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                FieldColon: 'value with a colon before:after',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('fails for a misplaced backslash', () => {
            expect(RecordJar.parseRecordJarLines([
                'BadField: before\\xafter',
            ])).toFailWith(/unrecognized escape/i);
            expect(RecordJar.parseRecordJarLines([
                'BadField: fails in continuation too\\',
                '  before\\aafter',
            ])).toFailWith(/unrecognized escape/i);
        });

        test('fails for malformed lines', () => {
            expect(RecordJar.parseRecordJarLines([
                'no colon',
            ])).toFailWith(/malformed line/);

            expect(RecordJar.parseRecordJarLines([
                ': this field name is empty',
            ])).toFailWith(/malformed line/);
        });

        test('parses multiple like-named fields into an array', () => {
            expect(RecordJar.parseRecordJarLines([
                'Field1 : Value1',
                'Field1: Value2',
                '%%',
                'Field1 : value1a',
                'Field1 : value2a',
                'Field1 : value3a',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: ['Value1', 'Value2'],
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            {
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: ['value1a', 'value2a', 'value3a'],
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            ]);
        });

        describe('with options', () => {
            test('parses single values into arrays for fields specified in array', () => {
                expect(RecordJar.parseRecordJarLines([
                    'Field1 : Value1',
                    'Field2: Value2',
                    '%%',
                    'Field1 : value1',
                    'Field1: value2',
                    'Field2 : value1a',
                    'Field2 : value2a',
                    'Field2 : value3a',
                    'Field3 : one value',
                ], {
                    arrayFields: ['Field1'],
                })).toSucceedWith([{
                    /* eslint-disable @typescript-eslint/naming-convention */
                    Field1: ['Value1'],
                    Field2: 'Value2',
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
                {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    Field1: ['value1', 'value2'],
                    Field2: ['value1a', 'value2a', 'value3a'],
                    Field3: 'one value',
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
                ]);
            });

            test('parses single values into arrays for fields specified via function', () => {
                expect(RecordJar.parseRecordJarLines([
                    'Field1 : Value1',
                    'Field2: Value2',
                    '%%',
                    'Field1 : value1',
                    'Field1: value2',
                    'Field2 : value1a',
                    'Field2 : value2a',
                    'Field2 : value3a',
                    'Field3 : one value',
                ], {
                    arrayFields: () => ['Field1'],
                })).toSucceedWith([{
                    /* eslint-disable @typescript-eslint/naming-convention */
                    Field1: ['Value1'],
                    Field2: 'Value2',
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
                {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    Field1: ['value1', 'value2'],
                    Field2: ['value1a', 'value2a', 'value3a'],
                    Field3: 'one value',
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
                ]);
            });

            test('correctly parses an overflow body with fixed continuation size', () => {
                expect(RecordJar.parseRecordJarLines([
                    'Continuations : fixed continuation 2:',
                    ' no space for 1 indent,',
                    '  no space for 2 indent,',
                    '   1 space for 3 indent,',
                    '    2 space for 4 indent',
                ], {
                    fixedContinuationSize: 2,
                })).toSucceedWith([
                    {
                        /* eslint-disable @typescript-eslint/naming-convention */
                        Continuations: 'fixed continuation 2:no space for 1 indent,no space for 2 indent, 1 space for 3 indent,  2 space for 4 indent',
                        /* eslint-enable @typescript-eslint/naming-convention */
                    },
                ]);
            });
        });

        test('parses multiple records', () => {
            expect(RecordJar.parseRecordJarLines([
                'Field1 : Value1',
                'Field2: Value2',
                'Field3:Value3',
                '%%',
                'Field1 : value1a',
                'Field2 : value2a',
                'Field3 : value3a',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'Value1',
                Field2: 'Value2',
                Field3: 'Value3',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            {
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'value1a',
                Field2: 'value2a',
                Field3: 'value3a',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            ]);
        });

        test('correctly parses an overflow body', () => {
            expect(RecordJar.parseRecordJarLines([
                'Eulers-Number : 2.718281828459045235360287471',
                '    352662497757247093699959574966967627724076630353547',
                ' 5945713821785251664274274663919320030599218174135...',
            ])).toSucceedWith([
                {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Eulers-Number': '2.7182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274274663919320030599218174135...',
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
            ]);
        });

        test('parses overflow body with a continuation character', () => {
            expect(RecordJar.parseRecordJarLines([
                'SomeField : This is some running text \\',
                'that is continued on several lines \\',
                'and which preserves spaces between \\',
                'the words.',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                SomeField: 'This is some running text that is continued on several lines and which preserves spaces between the words.',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);

            expect(RecordJar.parseRecordJarLines([
                'AnotherExample: There are three spaces   \\',
                'between \'spaces\' and \'between\' in this record.',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                AnotherExample: 'There are three spaces   between \'spaces\' and \'between\' in this record.',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);

            expect(RecordJar.parseRecordJarLines([
                'SwallowingExample: There are no spaces between \\',
                '       the numbers one and two in this example 1\\',
                '       2.',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                SwallowingExample: 'There are no spaces between the numbers one and two in this example 12.',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('ignores blank lines', () => {
            expect(RecordJar.parseRecordJarLines([
                'Field1 : Value1',
                'Field2: Value2',
                '',
                'Field3:Value3',
                '%%',
                '    ',
                'Field1 : value1a',
                'Field2 : value2a',
                'Field3 : value3a',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'Value1',
                Field2: 'Value2',
                Field3: 'Value3',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            {
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'value1a',
                Field2: 'value2a',
                Field3: 'value3a',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            ]);
        });

        test('consumes blank lines in a continuation', () => {
            expect(RecordJar.parseRecordJarLines([
                'LongField: line with a continuation \\',
                'Field: looks like a field but gets appended',
                'LongField2: line with a continuation \\',
                '',
                'Field: is actually a new field',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                LongField: 'line with a continuation Field: looks like a field but gets appended',
                LongField2: 'line with a continuation ',
                Field: 'is actually a new field',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);

            expect(RecordJar.parseRecordJarLines([
                'LongField: \\',
                '',
                '%%',
            ])).toFailWith(/empty body value/i);
        });

        test('ignores comments and empty records', () => {
            expect(RecordJar.parseRecordJarLines([
                'Field1 : Value1',
                'Field2: Value2',
                'Field3:Value3',
                '%% some extra comments here',
                '%% are ignored so this is still the',
                '%% second record',
                'Field1 : value1a',
                'Field2 : value2a',
                'Field3 : value3a',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'Value1',
                Field2: 'Value2',
                Field3: 'Value3',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            {
                /* eslint-disable @typescript-eslint/naming-convention */
                Field1: 'value1a',
                Field2: 'value2a',
                Field3: 'value3a',
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            ]);
        });

        test('fails for empty continuation line', () => {
            expect(RecordJar.parseRecordJarLines([
                'SomeText:         \\',
                '                  \\',
                '                  \\',
            ])).toFailWith(/empty body value/i);
        });

        test('fails for a dangling continuation line', () => {
            expect(RecordJar.parseRecordJarLines([
                '%%',
                '  bad continuation',
            ])).toFailWith(/without prior value/i);
        });
    });

    describe('readRecordJarFileSync method', () => {
        const path = 'path/to/some/record.jar';
        const stringPayload = [
            'Field1 : Value1',
            'Field2: Value2',
            'Field3:Value3',
        ].join('\n');
        const expected = [{
            /* eslint-disable @typescript-eslint/naming-convention */
            Field1: 'Value1',
            Field2: 'Value2',
            Field3: 'Value3',
            /* eslint-enable @typescript-eslint/naming-convention */
        }];

        test('returns a requested record-jar file', () => {
            const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
                if (typeof gotPath !== 'string') {
                    throw new Error('Mock implementation only accepts string');
                }
                expect(gotPath).toContain(path);
                return stringPayload;
            });

            expect(RecordJar.readRecordJarFileSync(path)).toSucceedWith(expected);
            spy.mockRestore();
        });

        test('propagates any error', () => {
            const path = 'path/to/some/record.jar';
            const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
                if (typeof gotPath !== 'string') {
                    throw new Error('Mock implementation only accepts string');
                }
                expect(gotPath).toContain(path);
                throw new Error('Mock Error!');
            });

            expect(RecordJar.readRecordJarFileSync(path)).toFailWith(/mock error/i);
            spy.mockRestore();
        });
    });
});
