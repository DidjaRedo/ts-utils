
import { DetailedResult } from '../../ts-utils';
import { equals } from '@jest/expect-utils';

export const matcherName = 'toFailWith';

export function predicate<T, TD>(received: DetailedResult<T, TD>, expectedResult: string|RegExp|undefined, expectedDetail: TD): boolean {
    if (received.isFailure()) {
        if (expectedResult === undefined) {
            if (received.message !== undefined) {
                return false;
            }
        }
        else if (expectedResult instanceof RegExp) {
            if (received.message.match(expectedResult) === null) {
                return false;
            }
        }
        else if (received.message !== expectedResult) {
            return false;
        }

        return equals(received.detail, expectedDetail);
    }
    return false;
}
