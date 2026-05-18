import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn("Credentials missing email or password", { credentials });
          throw new Error("Email and password are required");
        }

        type User = {
          user_id: number;
          fname: string;
          lname: string;
          phone: string;
          email: string;
          password: string;
        };

        const [rows] = await pool.query<RowDataPacket[] & User[]>(
          `SELECT * FROM ` + "`User`" + ` WHERE email = ?`,
          [credentials.email]
        );

        if (!rows || rows.length === 0) {
          console.warn("No user found for email", credentials.email);
          throw new Error("Invalid credentials");
        }

        const user = rows[0];
        const valid = await bcrypt.compare(credentials.password, user.password);

        if (!valid) {
          console.warn("Invalid password for user", credentials.email);
          throw new Error("Invalid credentials");
        }

        if (user.is_banned && Number(user.is_banned) === 1) {
          throw new Error("Your account has been banned");
        }

        return {
          id: String(user.user_id),
          name: `${user.fname} ${user.lname}`,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: string } }) {
      if (user && typeof user.id !== "undefined") {
        const t = token as JWT & { id?: string; role?: string; picture?: string };
        t.id = String(user.id);
        // Fetch role from DB
        try {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT role, profile_picture FROM `User` WHERE user_id = ?",
            [user.id]
          );
          if (rows.length > 0) {
            t.role = String(rows[0].role);
            t.picture = rows[0].profile_picture || null;
          }
        } catch { /* ignore */ }
      }
      return token;
    },
  async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const t = token as JWT & { id?: string; role?: string; picture?: string };
        const s = session.user as Session["user"] & { id?: string; role?: string; picture?: string };
        s.id = t.id;
        s.role = t.role;
        s.picture = t.picture;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
