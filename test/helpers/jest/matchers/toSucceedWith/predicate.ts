import { Result } from '../../ts-utils';
import { equals } from 'expect/build/jasmineUtils';

export const matcherName = 'toSucceedWith';

export function predicate<T>(received: Result<T>, expected: T): boolean {
    if (received.isSuccess()) {
        return equals(received.value, expected);
    }
    return false;
}
