import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          console.log("👉 LOGIN ATTEMPT");

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            return null;
          }

          console.log("📧 EMAIL:", credentials.email);
          console.log("🔑 INPUT PASSWORD:", credentials.password);

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("👤 USER FROM DB:", user);

          if (!user) {
            console.log("❌ User not found");
            return null;
          }

          if (!user.password) {
            console.log("❌ No password stored");
            return null;
          }

          console.log("🔐 DB PASSWORD HASH:", user.password);

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          console.log("✅ PASSWORD MATCH RESULT:", isValid);

          if (!isValid) {
            console.log("❌ Password mismatch");
            return null;
          }

          console.log("🎉 LOGIN SUCCESS");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error("🔥 AUTH ERROR:", err);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // On login
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login", // optional (your login page)
  },

  secret: process.env.NEXTAUTH_SECRET,
};
