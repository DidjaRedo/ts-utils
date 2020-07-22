
import { Result, captureResult, fail, succeed } from '../../ts-utils';

export const matcherName = 'toSucceedAndSatisfy';

// If the result is successful and callback does not throw, returns Success with the callback return value, or
//    true if the callback returns undefined
// If the result is successful but the callback throws, returns Failure with the thrown error
// If the result is failure, returns Success with undefined
export function predicate<T>(received: Result<T>, cb: (value: T) => boolean|void, capture: boolean): Result<boolean|undefined> {
    if (received.isSuccess()) {
        const cbResult = (capture ? captureResult(() => cb(received.value)) : succeed(cb(received.value)));
        if (cbResult.isSuccess()) {
            return succeed((cbResult.value === true) || (cbResult.value === undefined));
        }
        return fail(`  Callback failed with:\n    ${cbResult.message}`);
    }
    return succeed(undefined);
}
