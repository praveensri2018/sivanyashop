// -- where to place: backend/lib/db.ts
// MSSQL pool helper (TypeScript-friendly)
// Usage: import { getPool, query } from "../lib/db";
//
// TELL EVERY TIME:
//  - Put database connection info in backend/.env (same folder as backend/package.json).
//  - Acceptable DATABASE_URL formats:
//      ADO-style (recommended):
//        DATABASE_URL="Server=94.249.213.96,1433;Database=SivanyaShop;User Id=sa;Password={Sivanya@2025};TrustServerCertificate=true;Encrypt=false;"
//      URI-style (converted internally):
//        DATABASE_URL="mssql://sa:Sivanya%402025@94.249.213.96:1433/SivanyaShop"
//  - After editing .env, STOP and RESTART dev server: npm run dev
//  - Do NOT commit .env to source control.

import * as sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

// Ensure DATABASE_URL exists
const rawConn = (process.env.DATABASE_URL ?? "").trim();
if (!rawConn) {
  throw new Error(
    "DATABASE_URL is required in env (backend/.env). TELL every time: put it in backend/.env"
  );
}

// Helpers to detect string format
function looksLikeAdo(s: string) {
  const lower = s.toLowerCase();
  return lower.includes("server=") || lower.includes("data source=") || lower.includes("address=");
}
function looksLikeUri(s: string) {
  const lower = s.toLowerCase();
  return lower.startsWith("mssql://") || lower.startsWith("sqlserver://");
}

// Convert mssql:// URI to sql.config
function uriToConfig(uri: string): sql.config {
  const u = new URL(uri);
  const user = decodeURIComponent(u.username || "");
  const password = decodeURIComponent(u.password || "");
  const host = u.hostname;
  const port = u.port ? parseInt(u.port, 10) : 1433;
  const database = u.pathname ? u.pathname.replace(/^\//, "") : undefined;

  const cfg: sql.config = {
    user: user || undefined,
    password: password || undefined,
    server: host,
    database: database || undefined,
    port,
    options: {
      // TELL EVERY TIME: adjust these via DB_ENCRYPT / DB_TRUST_SERVER_CERT in .env if needed
      encrypt: process.env.DB_ENCRYPT === "true" ? true : false,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true" ? true : true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  } as sql.config;

  return cfg;
}

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  if (pool && pool.connecting) {
    await pool.connect();
    return pool;
  }

  // strip surrounding quotes if any
  const s = rawConn.replace(/^\s*["']|["']\s*$/g, "");

  // 1) If ADO-style string -> pass to ConnectionPool constructor
  if (looksLikeAdo(s)) {
    const p = new sql.ConnectionPool(s);
    p.on("error", (err) => {
      console.error("[MSSQL] Pool error:", err.message);
    });
    await p.connect();
    pool = p;
    return pool;
  }

  // 2) If URI-style -> convert to config and create pool
  if (looksLikeUri(s)) {
    const cfg = uriToConfig(s);
    const p = new sql.ConnectionPool(cfg);
    p.on("error", (err) => {
      console.error("[MSSQL] Pool error:", err.message);
    });
    await p.connect();
    pool = p;
    return pool;
  }

  // 3) Unknown format -> throw helpful error
  throw new Error(
    "Unrecognized DATABASE_URL format. Use ADO 'Server=...;Database=...;' or 'mssql://user:pass@host:port/db'."
  );
}

// Simple query helper
export async function query<T = any>(q: string, params?: Record<string, any>) {
  const p = await getPool();
  const r = p.request();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      r.input(k, v);
    }
  }
  const res = await r.query(q);
  return res.recordset as T[];
}
