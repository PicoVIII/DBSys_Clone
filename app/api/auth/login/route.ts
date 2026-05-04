import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

type User = {
  user_id: number;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  password: string;
};

// Logs in a user by checking the bcrypt password hash.
export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<RowDataPacket[] & User[]>(
      `SELECT * FROM \`User\` WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login success",
      user: {
        user_id: user.user_id,
        fname: user.fname,
        lname: user.lname,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 }
    );
  }
}
