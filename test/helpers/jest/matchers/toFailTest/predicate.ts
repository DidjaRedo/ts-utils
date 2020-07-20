import { captureResult } from '../../ts-utils';
export const matcherName = 'toFailTest';

export function predicate<T>(cb: () => void): boolean {
    const cbResult = captureResult(() => cb());
    return cbResult.isFailure();
}
