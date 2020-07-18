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

import { Result, captureResult, mapResults, succeed } from './result';
import Mustache from 'mustache';

Mustache.escape = (s: string) => s;

export type FormatTargets = 'text'|'markdown'|'embed';

export interface Formattable {
    format(format: string): Result<string>;
}

export class FormattableBase {
    protected static _tryAddDetail(details: string[], label: string, value: string|undefined): void {
        if (value !== undefined) {
            const padded = `  ${label}:`.padEnd(20, ' ');
            details.push(`${padded} ${value}`);
        }
    }

    public format(template: string): Result<string> {
        return captureResult(() => Mustache.render(template, this));
    }
}

export type Formatter<T> = (format: string, item: T) => Result<string>;
export type FormattersByExtendedTarget<TFT extends FormatTargets, T> = Record<TFT, Formatter<T>>;
export type FormattersByTarget<T> = FormattersByExtendedTarget<FormatTargets, T>;

export function formatList<T>(format: string, items: T[], itemFormatter: Formatter<T>): Result<string> {
    return mapResults(items.map((item) => {
        return itemFormatter(format, item);
    })).onSuccess((results: string[]) => {
        return succeed(results.join('\n'));
    });
}

