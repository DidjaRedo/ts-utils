import ToFail from './toFail';
import ToFailTest from './toFailTest';
import ToFailTestAndMatchSnapshot from './toFailTestAndMatchSnapshot';
import ToFailTestWith from './toFailTestWith';
import ToFailWith from './toFailWith';
import ToSucceed from './toSucceed';
import ToSucceedAndMatchInlineSnapshot from './toSucceedAndMatchInlineSnapshot';
import ToSucceedAndMatchSnapshot from './toSucceedAndMatchSnapshot';
import ToSucceedAndSatisfy from './toSucceedAndSatisfy';
import ToSucceedWith from './toSucceedWith';

export default {
    ...ToFail,
    ...ToFailTest,
    ...ToFailTestAndMatchSnapshot,
    ...ToFailTestWith,
    ...ToFailWith,
    ...ToSucceed,
    ...ToSucceedAndMatchInlineSnapshot,
    ...ToSucceedAndMatchSnapshot,
    ...ToSucceedAndSatisfy,
    ...ToSucceedWith,
};
