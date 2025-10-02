// => PLACE: backend/utils/password.js
const bcrypt = require('bcrypt');

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

async function hash(password) {
  return bcrypt.hash(password, saltRounds);
}

async function compare(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hash, compare };
