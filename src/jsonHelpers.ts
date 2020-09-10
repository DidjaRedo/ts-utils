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

import * as fs from 'fs';
import * as path from 'path';
import { BaseConverter, Converter } from './converter';
import { Result, captureResult, fail, succeed } from './result';

import Mustache from 'mustache';
import { arrayOf } from './converters';

/* eslint-disable no-use-before-define */

export type JsonPrimitive = boolean | number | string | null | undefined;
export interface JsonObject { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonArray extends Array<JsonValue> { }

export function readJsonFileSync(srcPath: string): Result<JsonValue> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        const body = fs.readFileSync(fullPath, 'utf8').toString();
        return JSON.parse(body) as JsonValue;
    });
}

export function writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        fs.writeFileSync(fullPath, JSON.stringify(value, undefined, 2));
        return true;
    });
}

export function templatedJsonConverter(view?: unknown): Converter<JsonValue> {
    return new BaseConverter<JsonValue>((from: unknown, self: Converter<JsonValue>) => {
        if ((from === null) || (typeof from === 'number') || (typeof from === 'boolean')) {
            return succeed(from);
        }

        if (typeof from === 'string') {
            if ((view !== undefined) && from.includes('{{')) {
                return captureResult(() => Mustache.render(from, view));
            }
            return succeed(from);
        }

        if (typeof from !== 'object') {
            return fail(`Cannot convert ${JSON.stringify(from)} to JSON`);
        }

        if (Array.isArray(from)) {
            return arrayOf(self, 'failOnError').convert(from);
        }

        const src = from as JsonObject;
        const json: JsonObject = {};
        for (const prop in src) {
            // istanbul ignore else
            if (src.hasOwnProperty(prop)) {
                const result = self.convert(src[prop]).onSuccess((v) => {
                    json[prop] = v;
                    return succeed(v);
                });
                if (result.isFailure()) {
                    return result;
                }
            }
        }
        return succeed(json);
    });
}

export const jsonConverter = templatedJsonConverter();
