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
import 'jest-extended';
import '../helpers/jest';

import { Result, fail, succeed } from '../../src';
import { mapToRecord, optionalMapToRecord, optionalRecordToMap, recordToMap } from '../../src/utils';

describe('Utils module', () => {
    const record: Record<string, string> = {
        first: '1st',
        second: '2nd',
        third: '3rd',
    };
    const map = new Map<string, string>([
        ['first', '1st'],
        ['second', '2nd'],
        ['third', '3rd'],
    ]);

    describe('recordToMap function', () => {
        test('converts a valid Record to a matching Map', () => {
            expect(recordToMap(record, (_k, v) => succeed(v))).toSucceedWith(map);
        });

        test('omits undefined values', () => {
            const r2: Record<string, unknown> = { ...record, fourth: null, fifth: undefined, sixth: '6th' };
            const m2 = new Map<string, unknown>([
                ['first', '1st'],
                ['second', '2nd'],
                ['third', '3rd'],
                ['fourth', null],
                ['sixth', '6th'],
            ]);
            expect(recordToMap(r2, (_k, v) => succeed(v))).toSucceedWith(m2);
        });

        test('propagates an error from the factory method', () => {
            const factory = (k: string, v: string): Result<string> => (k === 'second') ? fail('oops') : succeed(v);
            expect(recordToMap(record, factory)).toFailWith('second: oops');
        });
    });

    describe('optionalRecordToMap function', () => {
        test('converts a valid Record to a matching Map', () => {
            expect(optionalRecordToMap(record, (_k, v) => succeed(v))).toSucceedWith(map);
        });

        test('converts undefined to Success(undefined)', () => {
            expect(optionalRecordToMap(undefined, (_k, v) => succeed(v))).toSucceedWith(undefined);
        });
    })

    describe('mapToRecord function', () => {
        test('converts a valid map to a matching record', () => {
            expect(mapToRecord(map, (_k, v) => succeed(v))).toSucceedWith(record);
        });

        test('omits undefined values', () => {
            const r2: Record<string, unknown> = { ...record, fourth: null, sixth: '6th' };
            const m2 = new Map<string, unknown>([
                ['first', '1st'],
                ['second', '2nd'],
                ['third', '3rd'],
                ['fourth', null],
                ['fifth', undefined],
                ['sixth', '6th'],
            ]);
            expect(mapToRecord(m2, (_k, v) => succeed(v))).toSucceedWith(r2);
        });

        test('propagates an error from the factory method', () => {
            const factory = (k: string, v: string): Result<string> => (k === 'second') ? fail('oops') : succeed(v);
            expect(mapToRecord(map, factory)).toFailWith('second: oops');
        });
    });

    describe('optionalMapToRecord function', () => {
        test('converts a valid Map to a matching Record', () => {
            expect(optionalMapToRecord(map, (_k, v) => succeed(v))).toSucceedWith(record);
        });

        test('converts undefined to Success(undefined)', () => {
            expect(optionalMapToRecord(undefined, (_k, v) => succeed(v))).toSucceedWith(undefined);
        });
    })
});
