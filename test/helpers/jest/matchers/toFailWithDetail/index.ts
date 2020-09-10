import { matcherName, predicate } from './predicate';
import { printExpectedDetailedResult, printReceivedDetailedResult } from '../../utils/matcherHelpers';

import { DetailedResult } from '../../ts-utils';
import { matcherHint } from 'jest-matcher-utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
        interface Matchers<R> {
            /**
             * Use .toFailWithDetail to verify that a DetailedResult<T> is
             * a failure that matches both a supplied expected failure message
             * (string, RegExp or undefined) and a supplied failure detail.
             * @param {string|RegExp|undefined} message
             */
            toFailWithDetail<TD>(message: string|RegExp|undefined, detail: TD): R;
        }
    }
}

function passMessage<T, TD>(received: DetailedResult<T, TD>, expectedMessage: string|RegExp|undefined, expectedDetail: TD): () => string {
    return () => [
        matcherHint(`.not.${matcherName}`),
        printExpectedDetailedResult('failure', false, expectedMessage, expectedDetail),
        printReceivedDetailedResult(received),
    ].join('\n');
}

function failMessage<T, TD>(received: DetailedResult<T, TD>, expectedMessage: string|RegExp|undefined, expectedDetail: TD): () => string {
    return () => [
        matcherHint(`${matcherName}`),
        printExpectedDetailedResult('failure', true, expectedMessage, expectedDetail),
        printReceivedDetailedResult(received),
    ].join('\n');
}

export default {
    toFailWithDetail: function<T, TD> (received: DetailedResult<T, TD>, expectedMessage: string|RegExp|undefined, expectedDetail: TD): jest.CustomMatcherResult {
        const pass = predicate(received, expectedMessage, expectedDetail);
        if (pass) {
            return { pass: true, message: passMessage(received, expectedMessage, expectedDetail) };
        }

        return { pass: false, message: failMessage(received, expectedMessage, expectedDetail) };
    },
};
