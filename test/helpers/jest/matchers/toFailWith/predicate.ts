
import { Result } from '../../ts-utils';

export const matcherName = 'toFailWith';

export function predicate<T>(received: Result<T>, expected: string|RegExp|undefined): boolean {
    if (received.isFailure()) {
        if (expected === undefined) {
            return received.message === undefined;
        }
        else if (expected instanceof RegExp) {
            return received.message.match(expected) !== null;
        }
        else {
            return received.message === expected;
        }
    }
    return false;
}
