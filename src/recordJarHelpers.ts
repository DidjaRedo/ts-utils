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
    let body: string | undefined = undefined;
    let isContinue = false;

    for (let n = 0; n < lines.length; n++) {
        const line = lines[n];
        if (line === '%%' && !isContinue) {
            if (name !== undefined) {
                current[name] = body!;
            }
            records.push(current);
            current = {};
            name = undefined;
            body = undefined;
        }
        else if (isContinue || /^\s+/.test(line)) {
            // starts with whitespace - continuation of previous line
            if (body === undefined) {
                return fail(`${n}: continuation ("${line}") without prior value`);
            }
            body = `${body}${line.trim()}`;
            isContinue = body.endsWith('\\');
            if (isContinue) {
                body = body.slice(0, body.length - 1);
                isContinue = true;
            }
        }
        else {
            const parts = line.split(':');
            if (parts.length !== 2) {
                return fail(`${n}: malformed line ("${line}") in record-jar`);
            }
            if (name !== undefined) {
                current[name] = body!;
            }
            name = parts[0].trimEnd();
            body = parts[1].trim();
            isContinue = body.endsWith('\\');
            if (isContinue) {
                body = body.slice(0, body.length - 1);
            }
        }
    }
    if (name !== undefined) {
        current[name] = body!;
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
