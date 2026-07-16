const { sanitizeUser, sanitizeUsers } = require('../util/privacy');

describe('personal data response protection', () => {
  it('removes credential material without mutating the stored user', () => {
    const user = {
      _id: 'u1', email: 'user@example.com', password: 'bcrypt-hash',
      accessToken: 'live-jwt', cpf: '00000000000'
    };

    expect(sanitizeUser(user)).toEqual({
      _id: 'u1', email: 'user@example.com', cpf: '00000000000'
    });
    expect(user.password).toBe('bcrypt-hash');
    expect(user.accessToken).toBe('live-jwt');
  });

  it('sanitizes mongoose-style documents and arrays', () => {
    const document = {
      toObject: () => ({ _id: 'u1', password: 'hash', accessToken: 'token' })
    };

    expect(sanitizeUser(document)).toEqual({ _id: 'u1' });
    expect(sanitizeUsers([document, { _id: 'u2', password: 'hash' }]))
      .toEqual([{ _id: 'u1' }, { _id: 'u2' }]);
  });

  it('handles absent users safely', () => {
    expect(sanitizeUser(null)).toBeNull();
  });
});
