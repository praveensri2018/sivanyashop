// PLACE: backend/repositories/retailerRepo.js
const { query, sql } = require('../lib/db');

async function fetchRetailers() {
  const res = await query(`SELECT Id, Name, Email, Role, IsActive, CreatedAt FROM dbo.Users WHERE Role = 'RETAILER' ORDER BY Id DESC`);
  return res.recordset;
}

async function fetchRetailerById(id) {
  const res = await query('SELECT Id, Name, Email, Role, IsActive, CreatedAt FROM dbo.Users WHERE Id = @id AND Role = \'RETAILER\'', {
    id: { type: sql.Int, value: id }
  });
  return res.recordset[0];
}

async function findUserByEmail(email) {
  const res = await query('SELECT TOP 1 * FROM dbo.Users WHERE Email = @email', { email: { type: sql.NVarChar, value: email } });
  return res.recordset[0];
}

/*
  createUser
  Uses OUTPUT ... INTO @out to avoid SQL Server "OUTPUT with triggers" restriction.
*/
async function createUser({ name, email, passwordHash, role = 'RETAILER', isActive = 1 }) {
  const sqlText = `
    DECLARE @out TABLE (
      Id INT,
      Name NVARCHAR(200),
      Email NVARCHAR(255),
      PasswordHash NVARCHAR(255),
      Role NVARCHAR(20),
      IsActive BIT,
      CreatedAt DATETIMEOFFSET
    );

    INSERT INTO dbo.Users (Name, Email, PasswordHash, Role, IsActive)
    OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.PasswordHash, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt
      INTO @out
    VALUES (@name, @email, @passwordHash, @role, @isActive);

    SELECT * FROM @out;
  `;

  const res = await query(sqlText, {
    name: { type: sql.NVarChar, value: name },
    email: { type: sql.NVarChar, value: email },
    passwordHash: { type: sql.NVarChar, value: passwordHash },
    role: { type: sql.NVarChar, value: role },
    isActive: { type: sql.Bit, value: isActive ? 1 : 0 }
  });

  return res.recordset[0];
}

/*
  updateUser
  No TypeScript annotations here — pure JS.
*/
async function updateUser(id, { name, email, passwordHash, isActive }) {
  // Build dynamic SET clause and params (plain JS object)
  const sets = [];
  const params = { id: { type: sql.Int, value: id } };

  if (name !== undefined) {
    sets.push('Name = @name');
    params.name = { type: sql.NVarChar, value: name };
  }
  if (email !== undefined) {
    sets.push('Email = @email');
    params.email = { type: sql.NVarChar, value: email };
  }
  if (passwordHash !== undefined) {
    sets.push('PasswordHash = @passwordHash');
    params.passwordHash = { type: sql.NVarChar, value: passwordHash };
  }
  if (isActive !== undefined) {
    sets.push('IsActive = @isActive');
    params.isActive = { type: sql.Bit, value: isActive ? 1 : 0 };
  }

  if (sets.length === 0) {
    // nothing to update
    return fetchRetailerById(id);
  }

  const sqlText = `
    DECLARE @out TABLE (
      Id INT,
      Name NVARCHAR(200),
      Email NVARCHAR(255),
      PasswordHash NVARCHAR(255),
      Role NVARCHAR(20),
      IsActive BIT,
      CreatedAt DATETIMEOFFSET
    );

    UPDATE dbo.Users
    SET ${sets.join(', ')}
    OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.PasswordHash, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt
      INTO @out
    WHERE Id = @id AND Role = 'RETAILER';

    SELECT * FROM @out;
  `;

  const res = await query(sqlText, params);
  return res.recordset[0];
}

/*
  softDeleteUser
  Soft delete with OUTPUT INTO @out (returns the updated row)
*/
async function softDeleteUser(id) {
  const sqlText = `
    DECLARE @out TABLE (
      Id INT,
      Name NVARCHAR(200),
      Email NVARCHAR(255),
      Role NVARCHAR(20),
      IsActive BIT,
      CreatedAt DATETIMEOFFSET
    );

    UPDATE dbo.Users
    SET IsActive = 0
    OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt
      INTO @out
    WHERE Id = @id AND Role = 'RETAILER';

    SELECT * FROM @out;
  `;

  const res = await query(sqlText, { id: { type: sql.Int, value: id } });
  return res.recordset[0];
}

module.exports = {
  fetchRetailers,
  fetchRetailerById,
  findUserByEmail,
  createUser,
  updateUser,
  softDeleteUser
};
