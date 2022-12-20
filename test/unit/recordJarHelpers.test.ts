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
                'FieldEuro: Before^#x20ac;after',
            ])).toSucceedWith([{
                /* eslint-disable @typescript-eslint/naming-convention */
                FieldCR: 'before\rafter',
                FieldNL: 'before\nafter',
                FieldTab: 'before\tafter',
                FieldBackslash: 'before\\after',
                FieldAmpersand: 'before&after',
                FieldEuro: 'before€after',
                /* eslint-enable @typescript-eslint/naming-convention */
            }]);
        });

        test('fails for a misplaced backslash', () => {
            expect(RecordJar.parseRecordJarLines([
                'BadField: before\xafter',
            ])).toFailWith(/unrecognized escape/i);
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

        test('fails for empty continuation line', () => {
            expect(RecordJar.parseRecordJarLines([
                'SomeText:         \\',
                '                  \\',
                '                  \\',
            ])).toFailWith(/empty continuation line/i);
        });
    });
});
