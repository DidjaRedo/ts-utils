import ToFail from './toFail';
import ToFailTest from './toFailTest';
import ToFailTestAndMatchSnapshot from './toFailTestAndMatchSnapshot';
import ToFailTestWith from './toFailTestWith';
import ToFailWith from './toFailWith';
import ToFailWithDetail from './toFailWithDetail';
import ToSucceed from './toSucceed';
import ToSucceedAndMatchInlineSnapshot from './toSucceedAndMatchInlineSnapshot';
import ToSucceedAndMatchSnapshot from './toSucceedAndMatchSnapshot';
import ToSucceedAndSatisfy from './toSucceedAndSatisfy';
import ToSucceedWith from './toSucceedWith';
import toSucceedWithDetail from './toSucceedWithDetail';

export default {
    ...ToFail,
    ...ToFailTest,
    ...ToFailTestAndMatchSnapshot,
    ...ToFailTestWith,
    ...ToFailWith,
    ...ToFailWithDetail,
    ...ToSucceed,
    ...ToSucceedAndMatchInlineSnapshot,
    ...ToSucceedAndMatchSnapshot,
    ...ToSucceedAndSatisfy,
    ...ToSucceedWith,
    ...toSucceedWithDetail,
};
