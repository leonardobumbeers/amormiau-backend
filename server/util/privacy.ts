const PRIVATE_CREDENTIAL_FIELDS = new Set(['password', 'accessToken']);

function plainObject(value) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
}

function sanitizeUser(user) {
  const safeUser = plainObject(user);
  if (!safeUser) return safeUser;

  for (const field of PRIVATE_CREDENTIAL_FIELDS) delete safeUser[field];
  return safeUser;
}

function sanitizeUsers(users) {
  return users.map(sanitizeUser);
}

module.exports = { sanitizeUser, sanitizeUsers };
