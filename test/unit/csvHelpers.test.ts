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
import fs from 'fs';
import { readCsvFileSync } from '../../src/csvHelpers';

describe('csvHelpers module', () => {
    describe('readCsvFileSync method', () => {
        const path = 'path/to/some/file.csv';
        const stringPayload = [
            'field1,field2,field3',
            '7, 8, 9',
            '4, 5, 6',
            '1, 2, 3',
        ].join('\n');
        const csvPayload = [
            ['7', '8', '9'],
            ['4', '5', '6'],
            ['1', '2', '3'],
        ];

        test('returns a requested CSV file', () => {
            const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
                if (typeof gotPath !== 'string') {
                    throw new Error('Mock implementation only accepts string');
                }
                expect(gotPath).toContain(path);
                return stringPayload;
            });

            expect(readCsvFileSync(path)).toSucceedWith(csvPayload);
            spy.mockRestore();
        });

        test('propagates any error', () => {
            const path = 'path/to/some/file.csv';
            const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
                if (typeof gotPath !== 'string') {
                    throw new Error('Mock implementation only accepts string');
                }
                expect(gotPath).toContain(path);
                throw new Error('Mock Error!');
            });

            expect(readCsvFileSync(path)).toFailWith(/mock error/i);
            spy.mockRestore();
        });

        test('accepts delimiter as an option', () => {
            const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((gotPath: unknown) => {
                if (typeof gotPath !== 'string') {
                    throw new Error('Mock implementation only accepts string');
                }
                expect(gotPath).toContain(path);
                return stringPayload.replace(/,/g, ';');
            });

            expect(readCsvFileSync(path, { delimiter: ';' })).toSucceedWith(csvPayload);
            spy.mockRestore();
        });
    });
});
