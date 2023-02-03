import { request } from "./postmsg-rpc";


describe('postmsg-rpc', () => {
  it('should return chainId', () => {
    expect(request).toBeDefined();
  });
});
