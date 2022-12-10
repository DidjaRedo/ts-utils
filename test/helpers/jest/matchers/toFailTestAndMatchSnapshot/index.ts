/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { matcherName, predicate } from './predicate';

import { Context } from 'jest-snapshot/build';
import { matcherHint } from 'jest-matcher-utils';
import { toMatchSnapshot } from 'jest-snapshot';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toFailTestWith to test a custom matcher by
             * verifying that a test case fails as expected and
             * reports an error matching a stored snapshot.
             */
            toFailTestAndMatchSnapshot<T>(): R;
        }
    }
}

export default {
    toFailTestAndMatchSnapshot: function<T> (this: jest.MatcherContext, cb: () => void): jest.CustomMatcherResult {
        const context = this as unknown as Context;
        const cbResult = predicate(cb);
        if (cbResult.isFailure()) {
            return {
                pass: false, message: (): string => {
                    return [
                        matcherHint(`${matcherName}`, 'callback'),
                        '  Expected: Callback to fail with an error that matches snapshot',
                        '  Received: Callback succeeded',
                    ].join('\n');
                },
            };
        }
        return toMatchSnapshot.call(
            context,
            cbResult.value,
            'toFailTestAndMatchSnapshot',
        ) as jest.CustomMatcherResult;
    },
};
