// backend/lib/auth.js
// => PLACE: backend/lib/auth.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, sql } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const BCRYPT_ROUNDS = 10;

async function createUser({ name, email, password, role = "CUSTOMER" }) {
  // === PLACE: check if email already exists before inserting
  const checkSql = `SELECT Id FROM dbo.Users WHERE Email = @email`;
  const existing = await query(checkSql, {
    email: { type: sql.NVarChar(255), value: email }
  });
  if (existing.recordset.length > 0) {
    // return failure if email exists
    return { error: "Email already exists" };
  }
  // === PLACE END

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const insertSql = `
    INSERT INTO dbo.Users (Name, Email, PasswordHash, Role)
    OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.Role
    VALUES (@name, @email, @hash, @role)
  `;
  const result = await query(insertSql, {
    name: { type: sql.NVarChar(200), value: name },
    email: { type: sql.NVarChar(255), value: email },
    hash: { type: sql.NVarChar(255), value: hash },
    role: { type: sql.NVarChar(20), value: role }
  });
  return result.recordset[0];
}

async function verifyPassword(email, password) {
  const q = `SELECT Id, Name, Email, PasswordHash, Role FROM dbo.Users WHERE Email = @email`;
  const res = await query(q, { email: { type: sql.NVarChar(255), value: email } });
  const user = res.recordset[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) return null;
  return { id: user.Id, name: user.Name, email: user.Email, role: user.Role };
}

function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: opts.expiresIn || "6h" });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { createUser, verifyPassword, signJwt, verifyJwt };
