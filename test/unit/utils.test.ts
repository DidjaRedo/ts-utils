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
import {
    getTypeOfProperty,
    getValueOfPropertyOrDefault,
    isKeyOf,
    mapToRecord,
    omit,
    optionalMapToPossiblyEmptyRecord,
    optionalMapToRecord,
    optionalRecordToMap,
    optionalRecordToPossiblyEmptyMap,
    pick,
    recordToMap,
} from '../../src/utils';

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
    });

    describe('optionalRecordToPossiblyEmptyMap function', () => {
        test('converts a valid Record to a matching Map', () => {
            expect(optionalRecordToPossiblyEmptyMap(record, (_k, v) => succeed(v))).toSucceedWith(map);
        });

        test('converts undefined to an empty map', () => {
            expect(optionalRecordToPossiblyEmptyMap<string, string>(undefined, (_k, v) => succeed(v)))
                .toSucceedAndSatisfy((map: Map<string, string>) => {
                    expect(map).toBeDefined();
                    expect(map.size).toBe(0);
                });
        });
    });

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
    });

    describe('optionalMapToPossiblyEmptyRecord function', () => {
        test('converts a valid Map to a matching Record', () => {
            expect(optionalMapToPossiblyEmptyRecord(map, (_k, v) => succeed(v))).toSucceedWith(record);
        });

        test('converts undefined to empty record', () => {
            expect(optionalMapToPossiblyEmptyRecord(undefined, (_k, v) => succeed(v))).toSucceedWith({});
        });
    });

    describe('isKeyOf function', () => {
        const sym = Symbol('symbol');
        const obj = {
            'string': 'string value',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            1: 'number value',
            [sym]: 'symbol value',
        };

        test('returns true if the requested property exists', () => {
            expect(isKeyOf('string', obj)).toBe(true);
            expect(isKeyOf(1, obj)).toBe(true);
            expect(isKeyOf(sym, obj)).toBe(true);
        });

        test('returns false if the requested property does not exist', () => {
            expect(isKeyOf('String', obj)).toBe(false);
            expect(isKeyOf(2, obj)).toBe(false);
            expect(isKeyOf(Symbol('symbol'), obj)).toBe(false);
        });
    });

    describe('pick function', () => {
        test('it picks the requested properties', () => {
            expect(pick({
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            }, ['prop1', 'prop3'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });

        test('it silently ignores missing properties', () => {
            interface PickMe {
                prop1: number;
                prop2: string;
                prop3: boolean;
                prop4?: string;
            }
            const pickMe: PickMe = {
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            };

            expect(pick(pickMe, ['prop1', 'prop3', 'prop4'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });
    });

    describe('omit function', () => {
        test('it omits the requested properties', () => {
            expect(omit({
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            }, ['prop2'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });

        test('it silently ignores missing properties', () => {
            interface PickMe {
                prop1: number;
                prop2: string;
                prop3: boolean;
                prop4?: string;
            }
            const pickMe: PickMe = {
                prop1: 1,
                prop2: 'p2',
                prop3: true,
            };

            expect(omit(pickMe, ['prop2', 'prop4'])).toEqual({
                prop1: 1,
                prop3: true,
            });
        });
    });

    describe('getValueOfPropertyOrDefault function', () => {
        const sym = Symbol('symbol');
        const obj = {
            'string': 'string value',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            1: 'number value',
            [sym]: 'symbol value',
        };

        test('it returns a property that exists', () => {
            expect(getValueOfPropertyOrDefault('string', obj)).toBe('string value');
            expect(getValueOfPropertyOrDefault(1, obj)).toBe('number value');
            expect(getValueOfPropertyOrDefault(sym, obj)).toBe('symbol value');
        });

        test('it returns undefined by default for a property that does not exist', () => {
            expect(getValueOfPropertyOrDefault('a string', obj)).toBeUndefined();
            expect(getValueOfPropertyOrDefault(2, obj)).toBeUndefined();
            expect(getValueOfPropertyOrDefault(Symbol('symbol'), obj)).toBeUndefined();
        });

        test('it returns a supplied default for a property that does not exist', () => {
            expect(getValueOfPropertyOrDefault('a string', obj, 'xyzzy')).toBe('xyzzy');
            expect(getValueOfPropertyOrDefault(2, obj, 'xyzzy')).toBe('xyzzy');
            expect(getValueOfPropertyOrDefault(Symbol('symbol'), obj, 'xyzzy')).toBe('xyzzy');
        });
    });

    describe('getTypeOfProperty function', () => {
        const sym = Symbol('symbol');
        const obj = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            1: 'key is a number',
            [sym]: 'key is a symbol',
            'string': 'string value',
            'number': 100,
            'boolean': true,
            'object': { },
            'array': [1, 2, 3],
            'null': null,
            'undefined': undefined,
            'symbol': Symbol('a symbol'),
            'function': () => true,
            'valueIsUndefined': 'undefined',
        };

        test('it returns the expected type for properties that exist', () => {
            expect(getTypeOfProperty(1, obj)).toBe('string');
            expect(getTypeOfProperty(sym, obj)).toBe('string');
            expect(getTypeOfProperty('string', obj)).toBe('string');
            expect(getTypeOfProperty('number', obj)).toBe('number');
            expect(getTypeOfProperty('boolean', obj)).toBe('boolean');
            expect(getTypeOfProperty('object', obj)).toBe('object');
            expect(getTypeOfProperty('array', obj)).toBe('object');
            expect(getTypeOfProperty('null', obj)).toBe('object');
            expect(getTypeOfProperty('undefined', obj)).toBe('undefined');
            expect(getTypeOfProperty('symbol', obj)).toBe('symbol');
            expect(getTypeOfProperty('function', obj)).toBe('function');
            expect(getTypeOfProperty('valueIsUndefined', obj)).toBe('string');
        });

        test('it returns the literal undefined for properties that do not exist', () => {
            expect(getTypeOfProperty('nonexistent', obj)).toBe(undefined);
        });
    });
});
