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

import '../helpers/jest';
import { FormattableBase, Result, formatList } from '../../src';

interface TestProps {
    first: string;
    second: string;
    third: string;
    fourth?: string;
    bogusMessage?: string;
}

const defaultTestProps: TestProps = {
    first: 'This is the first field',
    second: 'This is the second field',
    third: 'The third field, this is',
    bogusMessage: 'bogus property invoked',
};

class TestFormattable extends FormattableBase {
    public readonly first: string;
    public readonly third: string;
    public fourth?: string;

    protected readonly _props: TestProps;

    public constructor(props?: TestProps) {
        super();
        this._props = props ?? defaultTestProps;
        this.first = this._props.first;
        this.third = this._props.third;
        this.fourth = this._props.fourth;
    }

    public get second() { return this._props.second; }

    public bogus(): string|undefined {
        if (this._props.bogusMessage) {
            throw new Error(this._props.bogusMessage);
        }
        return undefined;
    }

    public details(): string {
        const details: string[] = ['Details:'];
        FormattableBase._tryAddDetail(details, 'First', this.first);
        FormattableBase._tryAddDetail(details, 'Second', this.second);
        FormattableBase._tryAddDetail(details, 'Third', this.third);
        FormattableBase._tryAddDetail(details, 'Fourth', this.fourth);
        return details.join('\n');
    }
}

function testPropsFormatter(format: string, props: TestProps): Result<string> {
    return new TestFormattable(props).format(format);
}

describe('formatter module', () => {
    describe('FormattableBase class', () => {
        test('formats a message containing string fields and properties', () => {
            const f = new TestFormattable();
            expect(f.format('{{first}}/{{second}}'))
                .toSucceedWith('This is the first field/This is the second field');
        });

        test('omits undefined properties referenced in the message', () => {
            const f = new TestFormattable();
            expect(f.format('{{second}}/{{fourth}}/{{third}}'))
                .toSucceedWith('This is the second field//The third field, this is');

            f.fourth = 'yo four';
            expect(f.format('{{second}}/{{fourth}}/{{third}}'))
                .toSucceedWith('This is the second field/yo four/The third field, this is');
        });

        test('reports an error if a formatting error occurs', () => {
            const f = new TestFormattable();
            expect(f.format('{{bogus}}')).toFailWith('bogus property invoked');
        });

        test('_tryAddDetails helper skips undefined values', () => {
            const f = new TestFormattable();
            expect(f.format('{{details}}')).toSucceedWith([
                'Details:',
                '  First:             This is the first field',
                '  Second:            This is the second field',
                '  Third:             The third field, this is',
            ].join('\n'));

            f.fourth = 'yo four';
            expect(f.format('{{details}}')).toSucceedWith([
                'Details:',
                '  First:             This is the first field',
                '  Second:            This is the second field',
                '  Third:             The third field, this is',
                '  Fourth:            yo four',
            ].join('\n'));
        });
    });

    describe('formatList function', () => {
        const props: TestProps[] = [
            { first: 'first 0', second: 'second 0', third: 'third 0' },
            { first: 'first 1', second: 'second 1', third: 'third 1', fourth: 'fourth 1' },
            { first: 'first 2', second: 'second 2', third: 'third 2', fourth: 'fourth 2' },
            { first: 'first 3', second: 'second 3', third: 'third 3', bogusMessage: 'bogus, man' },
        ];

        test('formats all list elements with the supplied format and formatter', () => {
            expect(formatList('{{first}}', props, testPropsFormatter))
                .toSucceedWith(['first 0', 'first 1', 'first 2', 'first 3'].join('\n'));
        });

        test('omits empty lines', () => {
            expect(formatList('{{fourth}}', props, testPropsFormatter))
                .toSucceedWith(['fourth 1', 'fourth 2'].join('\n'));
        });

        test('fails if any formatters fail', () => {
            expect(formatList('{{bogus}}', props, testPropsFormatter))
                .toFailWith('bogus, man');
        });
    });
});
