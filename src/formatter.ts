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

/**
 * Destination format for some formatted string.
 * @beta
 */
export type FormatTargets = 'text'|'markdown'|'embed';

/**
 * Interface for an object that can be formatted.
 * @beta
 */
export interface Formattable {
    /**
     * Formats an object using the supplied mustache template.
     * @param format - A mustache template used to format the object.
     * @returns {@link Success} with the resulting string, or {@link Failure}
     * with an error message if an error occurs.
     */
    format(format: string): Result<string>;
}

/**
 * Base class which adds common formatting.
 * @beta
 */
export class FormattableBase {
    /**
     * Helper enables derived classes to add named details to a formatted presentation.
     * @param details - An array of detail description strings.
     * @param label - Label to use for the new detail.
     * @param value - Value to use for the new detail.
     * @internal
     */
    protected static _tryAddDetail(details: string[], label: string, value: string|undefined): void {
        if (value !== undefined) {
            const padded = `  ${label}:`.padEnd(20, ' ');
            details.push(`${padded} ${value}`);
        }
    }

    /**
     * {@inheritdoc Formattable.format}
     */
    public format(template: string): Result<string> {
        return captureResult(() => Mustache.render(template, this));
    }
}

/**
 * Type definition for a formatting function, which takes a `string` and an
 * item and returns {@link Result | Result<string>}.
 * @beta
 */
export type Formatter<T> = (format: string, item: T) => Result<string>;

/**
 * A collection of {@link Formatter | formatters} indexed by target name, to enable
 * different format methods per output target.
 * @beta
 */
export type FormattersByExtendedTarget<TFT extends FormatTargets, T> = Record<TFT, Formatter<T>>;
/**
 * A collection of {@link Formatter | formatters} indexed by the {@link FormatTargets | default supported
 * target formats}.
 * @beta
 */
export type FormattersByTarget<T> = FormattersByExtendedTarget<FormatTargets, T>;

/**
 * Formats a list of items using the supplied template and formatter, one result
 * per output line.
 * @param format - A mustache template used to format each item.
 * @param items - The items to be formatted.
 * @param itemFormatter - The {@link Formatter | Formatter<T>} used to format each item.
 * @returns The resulting string.
 * @beta
 */
export function formatList<T>(format: string, items: T[], itemFormatter: Formatter<T>): Result<string> {
    return mapResults(items.map((item) => {
        return itemFormatter(format, item);
    })).onSuccess((results: string[]) => {
        const filtered = results.filter((s) => (s !== ''));
        return succeed(filtered.join('\n'));
    });
}

