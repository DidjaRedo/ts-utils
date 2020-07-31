
import { Context } from 'jest-snapshot/build/types';
import { Result } from '../../ts-utils';
import { matcherHint } from 'jest-matcher-utils';
import { toMatchInlineSnapshot } from 'jest-snapshot';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toSucceedAndMatchInlineSnapshot to verify that a Result<T> is a success
             * and that the result value matches an inline snapshot
             */
            // eslint-disable-next-line @typescript-eslint/ban-types
            toSucceedAndMatchInlineSnapshot<T>(snapshot: string|undefined): R;
        }
    }
}

const matcherName = 'toSucceedAndMatchInlineSnapshot';

export default {
    // eslint-disable-next-line @typescript-eslint/ban-types
    toSucceedAndMatchInlineSnapshot: function<T> (this: jest.MatcherContext, received: Result<T>, snapshot: string|undefined): jest.CustomMatcherResult {
        const context = this as unknown as Context;
        if (received.isFailure()) {
            return {
                pass: false, message: (): string => {
                    return [
                        matcherHint(`${matcherName}`, 'callback'),
                        '  Expected: Callback to succeed with a result that matches the snapshot',
                        '  Received: Callback failed',
                    ].join('\n');
                },
            };
        }
        return toMatchInlineSnapshot.call(
            context,
            received.value,
            {},
            snapshot,
        );
    },
};
