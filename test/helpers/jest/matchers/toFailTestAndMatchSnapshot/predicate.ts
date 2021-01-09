/* eslint-disable @typescript-eslint/no-unused-vars,no-unused-vars */
import { Result, captureResult, fail, succeed } from '../../ts-utils';

export const matcherName = 'toFailTestAndMatchSnapshot';

export function predicate<T>(cb: () => void): Result<string> {
    const cbResult = captureResult(() => cb());
    if (cbResult.isFailure()) {
        return succeed(cbResult.message);
    }
    return fail('Callback did not fail');
}
