import { DetailedResult } from '../../ts-utils';
import { equals } from '@jest/expect-utils';

export const matcherName = 'toSucceedWithDetail';

export function predicate<T, TD>(received: DetailedResult<T, TD>, expected: unknown, detail: TD|undefined): boolean {
    if (received.isSuccess()) {
        let pass = false;
        if ((typeof received.value === 'string') && (expected instanceof RegExp)) {
            pass = expected.test(received.value);
        }
        else {
            pass = equals(received.value, expected);
        }

        pass = pass && equals(received.detail, detail);
        return pass;
    }
    return false;
}
