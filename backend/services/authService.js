// => PLACE: backend/services/authService.js
const userRepo = require('../repositories/userRepo');
const { compare, hash } = require('../utils/password');
const { sign } = require('../utils/jwt');

async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid credentials' };
  if (!user.IsActive) throw { status: 403, message: 'Account inactive' };

  const valid = await compare(password, user.PasswordHash);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  const token = sign({ id: user.Id, email: user.Email, role: user.Role });

  return {
    token,
    user: { id: user.Id, name: user.Name, email: user.Email, role: user.Role }
  };
}

// Register user (Customer or Retailer)
async function register({ name, email, password, role }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 400, message: 'Email already exists' };

  const passwordHash = await hash(password);
  const user = await userRepo.createUser({ name, email, passwordHash, role });

  const token = sign({ id: user.Id, email: user.Email, role: role });
  return { token, user: { id: user.Id, name: user.Name, email: user.Email, role } };
}

module.exports = { login, register };
