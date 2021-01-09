/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { matcherName, predicate } from './predicate';

import { matcherHint } from 'jest-matcher-utils';
import { printExpectedResult } from '../../utils/matcherHelpers';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toFailTest to test a custom matcher by
             * verifying that a test case fails.
             */
            toFailTest<T>(): R;
        }
    }
}

function passMessage<T>(): () => string {
    return () => [
        matcherHint(`.not.${matcherName}`, 'callback'),
        printExpectedResult('failure', false),
        '  Received: Test failed',
    ].join('\n');
}

function failMessage<T>(): () => string {
    return () => [
        matcherHint(`${matcherName}`, 'callback'),
        printExpectedResult('failure', true),
        '  Received: Test passed',
    ].join('\n');
}

export default {
    toFailTest: function<T> (cb: () => void): jest.CustomMatcherResult {
        const pass = predicate(cb);
        if (pass) {
            return { pass: true, message: passMessage() };
        }

        return { pass: false, message: failMessage() };
    },
};
