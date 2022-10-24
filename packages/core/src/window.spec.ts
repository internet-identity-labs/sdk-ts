import { defaultWindowFeatures, stringifyWindowFeatures } from './window';

describe('Window features stringifier', () => {
  it('Stringifies input', () => {
    expect(typeof stringifyWindowFeatures({})).toBe('string');
  });
  it('Correctly stringifies default features', () => {
    expect(stringifyWindowFeatures(defaultWindowFeatures)).toEqual(
      'height=705,width=525,top=-352.5,left=-262.5,toolbar=0,location=0,menubar=0,'
    );
  });
});
