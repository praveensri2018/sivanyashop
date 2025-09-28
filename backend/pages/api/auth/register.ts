// backend/pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createUser, findUserByEmail, signJwt } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, email, password, referralCode } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email_password_required" });

  const existing = await findUserByEmail(email);
  if (existing) return res.status(400).json({ error: "user_exists" });

  const user = await createUser({ name, email, password, role: "CUSTOMER", referralCode });
  const token = signJwt({ userId: user.Id, role: user.Role }, { expiresIn: "30d" });

  // set HttpOnly cookie
  res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}`);
  res.status(201).json({ id: user.Id, email: user.Email, name: user.Name });
}
