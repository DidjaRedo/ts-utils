
import { Result } from '../../ts-utils';

export const matcherName = 'toSucceed';

export function predicate<T>(received: Result<T>): boolean {
    return received.isSuccess();
}
