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

function parseRecordBody(from: string, oldBody?: string): Result<RecordBody> {
    let body = `${oldBody ?? ''}${from.trim()}`;
    const isContinuation = body.endsWith('\\');
    if (isContinuation) {
        body = body.slice(0, body.length - 1);
    }
    if (body.includes('\\')) {
        const invalid: string[] = [];
        body = body.replace(/\\./g, (match) => {
            switch (match) {
                case '\\\\': return '\\';
                case '\\&': return '&';
                case '\\r': return '\r';
                case '\\n': return '\n';
                case '\\t': return '\t';
            }
            invalid.push(match);
            return '\\';
        });
        if (invalid.length > 0) {
            return fail(`unrecognized escape "${invalid.join(', ')}" in record-jar body`);
        }
    }
    return succeed({ body, isContinuation });
}

/**
 * Parses an in-memory representation of a record-jar file.
 * @param lines - an array of strings, each of which represents
 * a line in the original file.
 * @returns An array of `Record<string, string>`, each of which corresponds to
 * a single record from the source record-jar data.
 */
export function parseRecordJarLines(lines: string[]): Result<Record<string, string>[]> {
    const records: Record<string, string>[] = [];
    let current: Record<string, string> = {};
    let name: string | undefined = undefined;
    let body: RecordBody | undefined = undefined;

    for (let n = 0; n < lines.length; n++) {
        const line = lines[n];
        if (line === '%%' && !body?.isContinuation) {
            if (name !== undefined) {
                current[name] = body!.body;
            }
            records.push(current);
            current = {};
            name = undefined;
            body = undefined;
        }
        else if (body?.isContinuation || /^\s+/.test(line)) {
            // starts with whitespace - continuation of previous line
            if (body === undefined) {
                return fail(`${n}: continuation ("${line}") without prior value`);
            }
            const result = parseRecordBody(line, body.body);
            if (result.isFailure()) {
                return fail(result.message);
            }
            body = result.value;
        }
        else {
            const parts = line.split(':');
            if (parts.length !== 2) {
                return fail(`${n}: malformed line ("${line}") in record-jar`);
            }
            if (name !== undefined) {
                current[name] = body!.body;
            }
            name = parts[0].trimEnd();
            const result = parseRecordBody(parts[1]);
            if (result.isFailure()) {
                return fail(result.message);
            }
            body = result.value;
        }
    }
    if (name !== undefined) {
        current[name] = body!.body;
        records.push(current);
        current = {};
        name = undefined;
        body = undefined;
    }
    return succeed(records);
}

/**
 * Reads a record-jar file from a supplied path.
 * @param srcPath - Source path from which the file is read.
 * @returns The contents of the file as an array of `Record<string, string>`
 * @beta
 */
export function readRecordJarFileSync(srcPath: string): Result<Record<string, string>[]> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        return fs.readFileSync(fullPath, 'utf8').toString().split(/\r?\n/);
    }).onSuccess((lines) => {
        return parseRecordJarLines(lines);
    });
}
