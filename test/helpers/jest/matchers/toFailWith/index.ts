import { matcherName, predicate } from './predicate';
import { printExpectedResult, printReceivedResult } from '../../utils/matcherHelpers';

import { Result } from '../../ts-utils';
import { matcherHint } from 'jest-matcher-utils';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toFailWith to verify that a Result<T> is a failure
             * that matches a supplied string, RegExp or undefined value
             * @param {string|RegExp|undefined} message
             */
            toFailWith(message: string|RegExp|undefined): R;
        }
    }
}

function passMessage<T>(received: Result<T>, expected: string|RegExp|undefined): () => string {
    return () => [
        matcherHint(`.not.${matcherName}`),
        printExpectedResult('failure', false, expected),
        printReceivedResult(received),
    ].join('\n');
}

function failMessage<T>(received: Result<T>, expected: string|RegExp|undefined): () => string {
    return () => [
        matcherHint(`${matcherName}`),
        printExpectedResult('failure', true, expected),
        printReceivedResult(received),
    ].join('\n');
}

export default {
    toFailWith: function<T> (received: Result<T>, expected: string|RegExp|undefined): jest.CustomMatcherResult {
        const pass = predicate(received, expected);
        if (pass) {
            return { pass: true, message: passMessage(received, expected) };
        }

        return { pass: false, message: failMessage(received, expected) };
    },
};
