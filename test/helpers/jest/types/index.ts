/// <reference types="jest"/>

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
import { Result } from '../ts-utils';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            /**
             * Use .toSucceed to verify that a Result<T> is a success
             */
            toSucceed<T>(): R;

            /**
             * Use .toSucceedWith to verify that a Result<T> is a success
             * and that the result value matches the supplied value
             * @param {T} expected
             */
            toSucceedWith<T>(expected: T): R;

            /**
             * Use .toSucceedAndSatisfy to verify that a Result<T> is a success
             * and that the result value matches the supplied predicate
             * @param {(value: T) => boolean} predicate
             */
            toSucceedAndSatisfy<T>(predicate: (value: T) => boolean): R;

            /**
             * Use .toFail to verify that a Result<T> is a failure
             */
            toFail<T>(): R;

            /**
             * Use .toFailWith to verify that a Result<T> is a failure
             * that matches a supplied string, RegExp or undefined value
             * @param {string|RegExp|undefined} message
             */
            toFailWith<T>(expected: string|RegExp|undefined): R;

            /**
             * Use .toFailTest to test a custom matcher by
             * verifying that a test case fails.
             */
            toFailTest<T>(): R;

            /**
             * Use .toFailTestWith to test a custom matcher by
             * verifying that a test case fails as expected and
             * reports an error matching a stored snapshot.
             */
            toFailTestAndMatchSnapshot<T>(): R;

            /**
             * Use .toFailTestWith to test a custom matcher by
             * verifying that a test case fails as expected and
             * reports an error matching a supplied value.
             * @param {string|string[]|RegExp} expected
             */
            toFailTestWith<T>(expected: string|string[]|RegExp): R;
        }
    }
}
