// backend/lib/auth.ts  -- replace existing file with this
import { getPool } from "./db";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";                // <-- namespace import (TypeScript-friendly)
import type { Secret, SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET: Secret = (process.env.JWT_SECRET || "change_this_in_prod") as Secret;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

export type UserRow = { Id: number; Name?: string; Email: string; Role: string; IsActive: boolean; ReferralCode?: string };

export async function createUser(payload: { name?: string; email: string; password: string; role?: string; referralCode?: string }) {
  const pwHash = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
  const pool = await getPool();
  const result = await pool.request()
    .input("Name", payload.name || null)
    .input("Email", payload.email)
    .input("PasswordHash", pwHash)
    .input("Role", payload.role || "CUSTOMER")
    .input("ReferralCode", payload.referralCode || null)
    .query(`
      INSERT INTO dbo.Users (Name, Email, PasswordHash, Role, ReferralCode)
      OUTPUT inserted.Id, inserted.Email, inserted.Name, inserted.Role, inserted.IsActive, inserted.ReferralCode
      VALUES (@Name, @Email, @PasswordHash, @Role, @ReferralCode)
    `);
  return result.recordset[0] as UserRow;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = await getPool();
  const res = await pool.request().input("Email", email).query("SELECT Id, Name, Email, Role, IsActive, ReferralCode FROM dbo.Users WHERE Email = @Email");
  return res.recordset[0] || null;
}

export async function verifyPassword(email: string, password: string): Promise<UserRow | null> {
  const pool = await getPool();
  const res = await pool.request().input("Email", email).query("SELECT Id, Name, Email, Role, IsActive, PasswordHash, ReferralCode FROM dbo.Users WHERE Email = @Email");
  const row = res.recordset[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.PasswordHash);
  if (!ok) return null;
  return { Id: row.Id, Name: row.Name, Email: row.Email, Role: row.Role, IsActive: row.IsActive, ReferralCode: row.ReferralCode };
}

/**
 * signJwt
 * - payload: object
 * - options: jwt SignOptions (e.g. { expiresIn: "7d" })
 */
export function signJwt(payload: object, options?: SignOptions) {
  // options must be of type SignOptions; JWT_SECRET typed as Secret
  const signOptions: SignOptions = options ?? { expiresIn: "7d" };
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}
