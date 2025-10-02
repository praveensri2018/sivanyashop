// => PLACE: backend/repositories/userRepo.js
const { query, sql } = require('../lib/db');

async function findByEmail(email) {
  const result = await query(
    'SELECT Id, Name, Email, PasswordHash, Role, IsActive, ReferralCode FROM dbo.Users WHERE Email = @email',
    { email: { type: sql.NVarChar, value: email } }
  );
  return result.recordset[0];
}

async function createUser({ name, email, passwordHash, role = 'CUSTOMER' }) {
  const result = await query(
    'INSERT INTO dbo.Users (Name, Email, PasswordHash, Role) OUTPUT INSERTED.Id VALUES (@name, @email, @passwordHash, @role)',
    {
      name: { type: sql.NVarChar, value: name },
      email: { type: sql.NVarChar, value: email },
      passwordHash: { type: sql.NVarChar, value: passwordHash },
      role: { type: sql.NVarChar, value: role }
    }
  );
  return result.recordset[0];
}

module.exports = { findByEmail, createUser };
