// => PLACE: backend/repositories/userRepo.js
const { query, sql } = require('../lib/db');

async function findByEmail(email) {
  const result = await query(
    'SELECT Id, Name, Email, PasswordHash, Role, IsActive, ReferralCode FROM dbo.Users WHERE Email = @email',
    { email: { type: sql.NVarChar, value: email } }
  );
  return result.recordset[0];
}

// => REPLACE the existing createUser function with this version.
// This avoids OUTPUT ... INSERTED when the table has triggers by using
// SCOPE_IDENTITY() and then selecting the inserted row.
async function createUser({ name, email, passwordHash, role = 'CUSTOMER' }) {
  const sqlText = `
    DECLARE @NewId INT;
    INSERT INTO dbo.Users (Name, Email, PasswordHash, Role)
    VALUES (@name, @email, @passwordHash, @role);
    SET @NewId = CAST(SCOPE_IDENTITY() AS INT);
    SELECT Id, Name, Email, Role, IsActive, ReferralCode
    FROM dbo.Users
    WHERE Id = @NewId;
  `;

  const result = await query(sqlText, {
    name: { type: sql.NVarChar, value: name },
    email: { type: sql.NVarChar, value: email },
    passwordHash: { type: sql.NVarChar, value: passwordHash },
    role: { type: sql.NVarChar, value: role }
  });

  // Returns the full user row (Id, Name, Email, Role, IsActive, ReferralCode)
  return result.recordset[0];
}

module.exports = { findByEmail, createUser };
