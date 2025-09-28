// backend/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyPassword, signJwt } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email_password_required" });

  const user = await verifyPassword(email, password);
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const token = signJwt({ userId: user.Id, role: user.Role }, { expiresIn: "30d" });
  res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}`);
  res.status(200).json({ id: user.Id, email: user.Email, name: user.Name, role: user.Role });
}
