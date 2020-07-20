import './types';
import matchers from './matchers';

type JestGlobal = NodeJS.Global & { expect: jest.Expect };

function isJestGlobal(g: NodeJS.Global): g is JestGlobal {
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
