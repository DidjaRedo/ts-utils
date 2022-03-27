import './types';
import matchers from './matchers';

export { MockFileConfig, MockFileSystem } from './helpers';

// eslint-disable-next-line no-undef
type JestGlobal = typeof global & { expect: jest.Expect };

// eslint-disable-next-line no-undef
function isJestGlobal(g: typeof global): g is JestGlobal {
    return g.hasOwnProperty('expect');
}

// istanbul ignore else
if (isJestGlobal(global)) {
    global.expect.extend(matchers);
}
else {
    /* eslint-disable no-console */
    console.error([
        'Unable to find Jest\'s global expect',
        'Please check that you have added ts-utils-jest correctly to your jest configuration.',
    ].join('\n'));
    /* eslint-enable no-console */
}
