/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { Context, toMatchSnapshot } from 'jest-snapshot';
import { Result } from '../../ts-utils';
import { matcherHint } from 'jest-matcher-utils';
import { printReceivedResult } from '../../utils/matcherHelpers';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toSucceedAndMatchSnapshot to verify that a Result<T> is a success
             * and that the result value matches a stored snapshot
             */
            toSucceedAndMatchSnapshot<T>(): R;
        }
    }
}

const matcherName = 'toSucceedAndMatchSnapshot';

export default {
    toSucceedAndMatchSnapshot: function<T> (this: jest.MatcherContext, received: Result<T>): jest.CustomMatcherResult {
        const context = this as unknown as Context;
        if (received.isFailure()) {
            return {
                pass: false, message: (): string => {
                    return [
                        matcherHint(`${matcherName}`, 'callback'),
                        'Expected:\n  Callback to succeed with a result that matches the snapshot',
                        printReceivedResult(received),
                    ].join('\n');
                },
            };
        }
        return toMatchSnapshot.call(
            context,
            received.value,
            'toSucceedAndMatchSnapshot',
        ) as jest.CustomMatcherResult;
    },
};
