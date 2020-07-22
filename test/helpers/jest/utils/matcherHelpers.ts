import { printExpected, printReceived } from 'jest-matcher-utils';

import { Result } from '../ts-utils';

function printExpectedValue<T>(outcome: string, expected?: T): string {
    return (expected !== undefined)
        ? `  ${outcome} with ${printExpected(expected)}`
        : `  ${outcome}`;
}

export function printExpectedResult<T>(expect: 'success'|'failure', isNot: boolean, expected?: T): string {
    return [
        'Expected:',
        (isNot
            ? ((expect === 'success')
                ? printExpectedValue('Success', expected)
                : printExpectedValue('Failure', expected))
            : ((expect === 'success')
                ? printExpectedValue('Not success', expected)
                : printExpectedValue('Not failure', expected))),
    ].join('\n');
}

export function printReceivedResult<T>(received: Result<T>): string {
    return [
        'Received:',
        (received.isSuccess()
            ? `  Success with ${printReceived(received.value)}`
            : `  Failure with "${received.message}"`),
    ].join('\n');
}
