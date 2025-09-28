// backend/middleware/auth.ts
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { verifyJwt } from "../lib/auth";

export type AuthRequest = NextApiRequest & { user?: { userId: number; role: string } };

export function requireAuth(handler: NextApiHandler, roles?: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = (req.cookies && req.cookies["token"]) || (req.headers.authorization && (req.headers.authorization as string).replace(/^Bearer\s+/i, ""));
    if (!token) return res.status(401).json({ error: "unauthenticated" });
    const payload = verifyJwt(token as string);
    if (!payload) return res.status(401).json({ error: "invalid_token" });
    if (roles && !roles.includes((payload as any).role)) return res.status(403).json({ error: "forbidden" });
    // attach
    (req as any).user = { userId: (payload as any).userId, role: (payload as any).role };
    return handler(req, res);
  };
}
