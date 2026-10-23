import { describe, expect, it } from 'vitest';
import { isPrivateAddress, safeFetch } from '../safe-fetch';

describe('isPrivateAddress', () => {
  it('flags non-public addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.5', '172.20.0.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '151.101.1.1', '2606:4700:4700::1111']) expect(isPrivateAddress(ip), ip).toBe(false);
  });
});

describe('safeFetch', () => {
  it('rejects non-web and internal targets before any request', async () => {
    await expect(safeFetch('file:///etc/passwd')).rejects.toThrow();
    await expect(safeFetch('http://127.0.0.1:3000/')).rejects.toThrow();
    await expect(safeFetch('http://localhost/')).rejects.toThrow();
    await expect(safeFetch('http://169.254.169.254/latest/meta-data/')).rejects.toThrow();
    await expect(safeFetch('not a url')).rejects.toThrow();
  });
});
