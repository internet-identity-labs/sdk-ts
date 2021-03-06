import { defaultWindowFeatures, stringifyWindowFeatures } from './window';

describe('Window features stringifier', () => {
    it('Stringifies input', () => {
        expect(typeof stringifyWindowFeatures({})).toBe('string');
    });
    it('Correctly stringifies default features', () => {
        expect(stringifyWindowFeatures(defaultWindowFeatures)).toEqual(
            'toolbar=0,location=0,menubar=0,width=500,height=500,top=100,left=100,'
        );
    });
});
