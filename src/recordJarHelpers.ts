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
import { isKeyOf } from './utils';

interface RecordBody {
    body: string;
    isContinuation: boolean;
}

/**
 * Represents a single record in a JAR file
 * @public
 */
export type JarRecord = Record<string, string | string[]>;

/**
 * @public
 */
export type JarFieldPicker<T extends JarRecord = JarRecord> = (record: T) => (keyof T)[];

/**
 * Options for a JAR record parser.
 * @public
 */
export interface JarRecordParserOptions {
    readonly arrayFields?: string[] | JarFieldPicker;
    readonly fixedContinuationSize?: number;
}

class RecordParser {
    public readonly records: JarRecord[] = [];
    public readonly options: JarRecordParserOptions;

    protected _fields: JarRecord = {};
    protected _name: string | undefined = undefined;
    protected _body: RecordBody | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor(options?: JarRecordParserOptions) {
        this.options = options ?? {};
    }

    public static parse(lines: string[], options?: JarRecordParserOptions): Result<JarRecord[]> {
        return new RecordParser(options)._parse(lines);
    }

    protected static _parseRecordBody(body: string): Result<RecordBody> {
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

    protected static _applyOptions(record: JarRecord, options: JarRecordParserOptions): JarRecord {
        if (options.arrayFields) {
            record = { ...record }; // don't edit incoming values
            const arrayFields = Array.isArray(options.arrayFields)
                ? options.arrayFields
                : options.arrayFields(record);

            for (const field of arrayFields) {
                if (isKeyOf(field, record) && typeof record[field] === 'string') {
                    const current = record[field] as string;
                    record[field] = [current];
                }
            }
        }
        return record;
    }

    protected _parse(lines: string[]): Result<JarRecord[]> {
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
                const result = this._parseContinuation(line);
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
            return RecordParser._parseRecordBody(parts[1].trim()).onSuccess((body) => {
                this._body = body;
                return succeed(true);
            });
        });
    }

    protected _parseContinuation(line: string): Result<RecordBody> {
        let trimmed = line.trim();
        if (!this._body!.isContinuation) {
            // istanbul ignore next
            const fixedSize = this.options?.fixedContinuationSize ?? 0;
            if (fixedSize > 0) {
                if (trimmed.length < line.length - fixedSize) {
                    // oops, took too much
                    trimmed = line.slice(fixedSize);
                }
            }
        }
        return RecordParser._parseRecordBody(trimmed).onSuccess((newBody) => {
            return succeed({
                body: `${this._body!.body}${newBody.body}`,
                isContinuation: newBody.isContinuation,
            });
        });
    }

    protected _havePendingRecord(): boolean {
        return Object.keys(this._fields).length > 0;
    }

    protected _writePendingRecord(): Result<JarRecord | undefined> {
        return this._writePendingField().onSuccess(() => {
            let record = this._havePendingRecord() ? this._fields : undefined;
            if (record !== undefined) {
                record = RecordParser._applyOptions(record, this.options);
                this.records.push(record);
                this._fields = {};
            }
            return succeed(undefined);
        });
    }

    protected _writePendingField(): Result<boolean> {
        if (this._name !== undefined) {
            if (this._body!.body.length < 1) {
                return fail('empty body value not allowed');
            }
            if (!isKeyOf(this._name, this._fields)) {
                this._fields[this._name] = this._body!.body;
            }
            else if (typeof this._fields[this._name] === 'string') {
                const current = this._fields[this._name] as string;
                this._fields[this._name] = [current, this._body!.body];
            }
            else {
                const current = this._fields[this._name] as string[];
                current.push(this._body!.body);
            }
            this._name = undefined;
            this._body = undefined;
        }
        return succeed(true);
    }
}

/**
 * Reads a record-jar from an array of strings, each of which represents one
 * line in the source file.
 * @param lines - the array of strings to be parsed
 * @param options - Optional parser configuration
 * @returns a corresponding array of `Record<string, string>`
 * @public
 */
export function parseRecordJarLines(lines: string[], options?: JarRecordParserOptions): Result<JarRecord[]> {
    return RecordParser.parse(lines, options);
}

/**
 * Reads a record-jar file from a supplied path.
 * @param srcPath - Source path from which the file is read.
 * @param options - Optional parser configuration
 * @returns The contents of the file as an array of `Record<string, string>`
 * @see https://datatracker.ietf.org/doc/html/draft-phillips-record-jar-01
 * @public
 */
export function readRecordJarFileSync(srcPath: string, options?: JarRecordParserOptions): Result<JarRecord[]> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        return fs.readFileSync(fullPath, 'utf8').toString().split(/\r?\n/);
    }).onSuccess((lines) => {
        return parseRecordJarLines(lines, options);
    });
}
