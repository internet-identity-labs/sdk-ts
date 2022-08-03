import { getPersonaDomain } from './common';

describe(getPersonaDomain.name, () => {
    it('includes protocol and hostname', () => {
        expect(getPersonaDomain(new URL('https://nfid.one/authenticate'))).toBe(
            'https://nfid.one'
        );
    });
});
