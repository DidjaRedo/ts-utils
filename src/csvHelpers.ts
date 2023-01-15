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
import { Result, captureResult } from './result';
import { parse } from 'papaparse';

/**
 * Options for {@link Csv.readCsvFileSync}
 * @beta
 */
export interface CsvOptions {
    delimiter?: string;
}

/**
 * Reads a CSV file from a supplied path.
 * @param srcPath - Source path from which the file is read.
 * @param options - optional parameters to control the processing
 * @returns The contents of the file.
 * @beta
 */
export function readCsvFileSync(srcPath: string, options?: CsvOptions): Result<unknown> {
    return captureResult(() => {
        const fullPath = path.resolve(srcPath);
        const body = fs.readFileSync(fullPath, 'utf8').toString();
        options = options ?? {};
        // eslint-disable-next-line
        return parse(body, { transform: (s: string) => s.trim(), header: false, dynamicTyping: false, skipEmptyLines: 'greedy', ...options }).data.slice(1);
    });
}
