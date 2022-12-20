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

import * as fs from 'fs';
import * as path from 'path';
import { Result, captureResult, fail, succeed } from './result';

interface RecordBody {
    body: string;
    isContinuation: boolean;
}

class RecordParser {
    public readonly records: Record<string, string>[] = [];

    protected _fields: [string, string][] = [];
    protected _name: string | undefined = undefined;
    protected _body: RecordBody | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    public static parse(lines: string[]): Result<Record<string, string>[]> {
        return new RecordParser()._parse(lines);
    }

    protected static _parseRecordBody(from: string, oldBody?: string): Result<RecordBody> {
        let body = `${oldBody ?? ''}${from.trim()}`;
        const isContinuation = body.endsWith('\\');
        if (isContinuation) {
            body = body.slice(0, body.length - 1);
        }
        if (this._hasEscapes(body)) {
            const result = this._replaceEscapes(body);
            if (result.isFailure()) {
                return fail(result.message);
            }
            body = result.value;
        }
        return succeed({ body, isContinuation });
    }

    protected static _hasEscapes(from: string): boolean {
        return from.includes('\\') || from.includes('&');
    }

    protected static _replaceEscapes(body: string): Result<string> {
        const invalid: string[] = [];
        const escaped = body.replace(/(\\.)|(&#x[a-fA-F0-9]{2,6};)/g, (match) => {
            switch (match) {
                case '\\\\': return '\\';
                case '\\&': return '&';
                case '\\r': return '\r';
                case '\\n': return '\n';
                case '\\t': return '\t';
            }
            if (match.startsWith('&')) {
                const hexCode = `0x${match.slice(3, match.length - 1)}`;
                const charCode = Number.parseInt(hexCode, 16);
                return String.fromCharCode(charCode);
            }
            invalid.push(match);
            return '\\';
        });
        if (invalid.length > 0) {
            return fail(`unrecognized escape "${invalid.join(', ')}" in record-jar body`);
        }
        return succeed(escaped);
    }

    protected _parse(lines: string[]): Result<Record<string, string>[]> {
        for (let n = 0; n < lines.length; n++) {
            const line = lines[n];
            if (line.startsWith('%%') && !this._body?.isContinuation) {
                const result = this._writePendingRecord();
                if (result.isFailure()) {
                    return fail(`${n}: ${result.message}`);
                }
            }
            else if (/^\s*$/.test(line)) {
                // ignore blank lines but cancel continuation
                if (this._body) {
                    this._body.isContinuation = false;
                }
                continue;
            }
            else if (this._body?.isContinuation || /^\s+/.test(line)) {
                // explicit continuation on previous line or implicit starts with whitespace
                if (this._body === undefined) {
                    return fail(`${n}: continuation ("${line}") without prior value.`);
                }
                const result = RecordParser._parseRecordBody(line, this._body.body);
                if (result.isFailure()) {
                    return fail(`${n}: ${result.message}`);
                }
                this._body = result.value;
            }
            else {
                const result = this._parseField(line);
                if (result.isFailure()) {
                    return fail(`${n}: ${result.message}`);
                }
            }
        }

        const result = this._writePendingRecord();
        if (result.isFailure()) {
            return fail(`${lines.length}: ${result.message}`);
        }
        return succeed(this.records);
    }

    protected _parseField(line: string): Result<boolean> {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex < 1) {
            return fail(`malformed line ("${line}") in record-jar.`);
        }
        const parts = [
            line.slice(0, separatorIndex),
            line.slice(separatorIndex + 1),
        ];

        return this._writePendingField().onSuccess(() => {
            this._name = parts[0].trimEnd();
            return RecordParser._parseRecordBody(parts[1]).onSuccess((body) => {
                this._body = body;
                return succeed(true);
            });
        });
    }

    protected _writePendingRecord(): Result<Record<string, string> | undefined> {
        return this._writePendingField().onSuccess(() => {
            const record = this._fields.length > 0 ? Object.fromEntries(this._fields) : undefined;
            if (record !== undefined) {
                this.records.push(record);
                this._fields = [];
            }
            return succeed(undefined);
        });
    }

    protected _writePendingField(): Result<boolean> {
        if (this._name !== undefined) {
            if (this._body!.body.length < 1) {
                return fail('empty body value not allowed');
            }
            this._fields.push([this._name, this._body!.body]);
            this._name = undefined;
            this._body = undefined;
        }
        return succeed(true);
    }
}

export function parseRecordJarLines(lines: string[]): Result<Record<string, string>[]> {
    return RecordParser.parse(lines);
}

/**
 * Reads a record-jar file from a supplied path.
 * @param srcPath - Source path from which the file is read.
 * @returns The contents of the file as an array of `Record<string, string>`
 * @see https://datatracker.ietf.org/doc/html/draft-phillips-record-jar-01
 * @public
 */
export function readRecordJarFileSync(srcPath: string): Result<Record<string, string>[]> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        return fs.readFileSync(fullPath, 'utf8').toString().split(/\r?\n/);
    }).onSuccess((lines) => {
        return parseRecordJarLines(lines);
    });
}
