/// <reference types="jest"/>

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
import { Result } from '../ts-utils';

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
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
             * @param {unknown} expected
             */
            toSucceedWith(expected: unknown): R;

            /**
             * Use .toSucceedWithDetail to verify that a DetailedResult<T, TD> is
             * a success and that the result value and detail matches the supplied
             * values
             * @param {unknown} expected
             */
            toSucceedWithDetail<TD>(expected: unknown, detail: TD|undefined): R;

            /**
             * Use .toSucceedAndSatisfy to verify that a Result<T> is a success
             * and that the supplied test function returns true (or void)
             * for the resulting value
             * @param {(value: T) => boolean|void} test
             */
            toSucceedAndSatisfy<T>(test: (value: T) => boolean|void): R;

            /**
             * Use .toSucceedAndMatchInlineSnapshot to verify that a Result<T> is a success
             * and that the result value matches an inline snapshot
             */
            // eslint-disable-next-line @typescript-eslint/ban-types
            toSucceedAndMatchInlineSnapshot<T>(snapshot: string|undefined): R;

            /**
             * Use .toSucceedAndMatchSnapshot to verify that a Result<T> is a success
             * and that the result value matches a stored snapshot
             */
            toSucceedAndMatchSnapshot<T>(): R;

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
             * Use .toFailWithDetail to verify that a DetailedResult<T> is
             * a failure that matches both a supplied expected failure value
             * (string, RegExp or undefined) and a supplied failure detail.
             * @param {string|RegExp|undefined} message
             */
            toFailWithDetail<TD>(message: string|RegExp|undefined, detail: TD): R;

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
