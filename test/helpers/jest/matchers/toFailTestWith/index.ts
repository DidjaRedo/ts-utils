/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { Failure, Success } from '../../ts-utils';
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { printExpectedResult } from '../../utils/matcherHelpers';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toFailTestWith to test a custom matcher by
             * verifying that a test case fails as expected and
             * reports an error matching a supplied value.
             * @param {string|string[]|RegExp} expected
             */
            toFailTestWith<T>(expected: string|string[]|RegExp): R;
        }
    }
}

function passMessage<T>(cbResult: Success<string>, expected: RegExp|string|string[]): () => string {
    return () => [
        matcherHint(`.not.${matcherName}`, 'callback', 'expectedMessage'),
        printExpectedResult('failure', false, expected),
        `  Received: Callback failed with:\n>>>>\n${cbResult.value}\n<<<<`,
    ].join('\n');
}

function failMessage<T>(cbResult: Failure<string>, expected: RegExp|string|string[]): () => string {
    return () => [
        matcherHint(`${matcherName}`, 'callback', 'expectedMessage'),
        printExpectedResult('failure', true, expected),
        ((cbResult.message === '')
            ? '  Received: Callback succeeded'
            : `  Received: Callback failed with:\n>>>>\n${cbResult.message}\n<<<<`),
    ].join('\n');
}

export default {
    toFailTestWith: function<T> (cb: () => void, expected: RegExp|string|string[]): jest.CustomMatcherResult {
        const cbResult = predicate(cb, expected);
        if (cbResult.isSuccess()) {
            return { pass: true, message: passMessage(cbResult, expected) };
        }

        return { pass: false, message: failMessage(cbResult, expected) };
    },
};
