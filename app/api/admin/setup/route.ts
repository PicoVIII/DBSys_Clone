import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

export async function POST() {
  try {
    const password = bcrypt.hashSync("admin123", 10);
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`User\` (fname, lname, phone, email, password, role) VALUES (?, ?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin', is_banned = 0`,
      ["Admin", "User", "0000000000", "admin@ebayclone.com", password]
    );
    return NextResponse.json({
      message: "Admin account ready",
      email: "admin@ebayclone.com",
      password: "admin123",
    });
  } catch {
    return NextResponse.json({ error: "Failed to setup admin" }, { status: 500 });
  }
}
