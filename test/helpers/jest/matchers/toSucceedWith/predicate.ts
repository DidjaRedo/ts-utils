import { Result } from '../../ts-utils';
import { equals } from 'expect/build/jasmineUtils';

export const matcherName = 'toSucceedWith';

export function predicate<T>(received: Result<T>, expected: unknown): boolean {
    if (received.isSuccess()) {
        if ((typeof received.value === 'string') && (expected instanceof RegExp)) {
            return expected.test(received.value);
        }
        return equals(received.value, expected);
    }
    return false;
}
