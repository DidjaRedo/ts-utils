import { DetailedResult, Result } from '../ts-utils';
import { printExpected, printReceived } from 'jest-matcher-utils';

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

export function printExpectedDetailedResult<T, TD>(
    expect: 'success'|'failure',
    isNot: boolean,
    expectedMessage?: T,
    expectedDetail?: TD,
): string {
    // istanbul ignore next
    return [
        'Expected:',
        (isNot
            ? ((expect === 'success')
                ? printExpectedValue('Success', expectedMessage)
                : printExpectedValue('Failure', expectedMessage))
            : ((expect === 'success')
                ? printExpectedValue('Not success', expectedMessage)
                : printExpectedValue('Not failure', expectedMessage))),
        `  Detail: "${printExpected(expectedDetail)}"`,
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

export function printReceivedDetailedResult<T, TD>(received: DetailedResult<T, TD>): string {
    return [
        'Received:',
        (received.isSuccess()
            ? `  Success with "${printReceived(received.value)}"\n  Detail: "${printReceived(received.detail)}"`
            : `  Failure with "${received.message}"\n  Detail: "${printReceived(received.detail)}"`),
    ].join('\n');
}
