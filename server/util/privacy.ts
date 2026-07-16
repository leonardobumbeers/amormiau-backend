const PRIVATE_CREDENTIAL_FIELDS = new Set(['password', 'accessToken']);

type UserRecord = Record<string, unknown>;
type ObjectDocument = { toObject(): UserRecord };

function plainObject(value: UserRecord | ObjectDocument | null): UserRecord | null {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
}

function sanitizeUser(user: UserRecord | ObjectDocument | null): UserRecord | null {
  const safeUser = plainObject(user);
  if (!safeUser) return safeUser;

  for (const field of PRIVATE_CREDENTIAL_FIELDS) delete safeUser[field];
  return safeUser;
}

function sanitizeUsers(users: Array<UserRecord | ObjectDocument>): Array<UserRecord | null> {
  return users.map(sanitizeUser);
}

module.exports = { sanitizeUser, sanitizeUsers };
