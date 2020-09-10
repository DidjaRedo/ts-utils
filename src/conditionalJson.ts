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

import { JsonObject, JsonPrimitive } from './jsonHelpers';
import { Result, captureResult, fail, mapResults, succeed } from './result';

import Mustache from 'mustache';

// eslint-disable-next-line no-use-before-define
export type ConditionalJsonValue = JsonPrimitive | ConditionalJsonObject | ConditionalJsonFragment | ConditionalJsonArray;

export interface ConditionalJsonObject {
    [key: string]: ConditionalJsonValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConditionalJsonArray extends Array<ConditionalJsonValue> {}

function isJsonPrimitive(from: unknown): from is JsonPrimitive {
    return ((typeof from === 'boolean') || (typeof from === 'number') || (typeof from === 'string') || (from === null));
}

function isJsonTemplate(from: unknown): from is string {
    return ((typeof from === 'string') && (from.includes('{{')));
}

export class ConditionalJsonFragment {
    public readonly qualifier: string;
    public readonly value: string;
    public readonly payload: ConditionalJsonObject;

    public constructor(qualifier: string, value: string, payload: ConditionalJsonObject) {
        this.qualifier = qualifier;
        this.value = value;
        this.payload = payload;
    }

    public matches(context: unknown): Result<boolean> {
        const wantResult = captureResult(() => Mustache.render(this.qualifier, context));
        if (wantResult.isFailure()) {
            return fail(wantResult.message);
        }

        const gotResult = captureResult(() => Mustache.render(this.value, context));
        if (gotResult.isFailure()) {
            return fail(gotResult.message);
        }

        return succeed(gotResult.value !== wantResult.value);
    }

    public eval(target: JsonObject, context: unknown): Result<boolean> {
        const matchResult = this.matches(context);
        if (matchResult.isFailure() || (matchResult.value === false)) {
            return matchResult;
        }

        for (const prop in this.payload) {
            if (!this.payload[prop]) {
                continue;
            }
            const val = this.payload[prop];
            if (isJsonPrimitive(val)) {
                if (isJsonTemplate(val)) {
                    const renderResult = captureResult(() => Mustache.render(val, context)).onSuccess((r) => {
                        target[prop] = r;
                        return succeed(r);
                    });
                    if (renderResult.isFailure()) {
                        return fail(renderResult.message);
                    }
                }
                else {
                    target[prop] = val;
                }
            }
        }
        return succeed(true);
    }
}

/*
export function resolveConditionalJsonProperty(target: JsonObject, propName: string, from: unknown, context: unknown): Result<JsonValue> {
    if (!(from instanceof ConditionalJsonFragment)) {
        return resolveConditionalJson(from, context).onSuccess((v) => {
            target[propName] = v;
            return succeed(v);
        });
    }

    return succeed(result);
}
*/

export function resolveConditionalJson(from: unknown, context: unknown): DetailedResult<JsonValue> {
    if (isJsonPrimitive(from)) {
        return succeed(from);
    }

    if (typeof from !== 'object') {
        return fail(`Cannot resolve ${JSON.stringify(from)} to conditional JSON`);
    }

    if (Array.isArray(from)) {
        return mapResults(from.map((item) => resolveConditionalJson(item, context)));
    }

    const src = from as ConditionalJsonObject;
    const result: ConditionalJsonObject = {};
    let haveMatch = false;

    for (const prop in src) {
        if (src[prop]  !== undefined) {

        }
    }
}