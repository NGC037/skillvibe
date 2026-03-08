"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import FloatingBackground from "@/components/FloatingBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500">

      <FloatingBackground />

      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-10 w-[380px]"
      >

        <h1 className="text-2xl font-semibold text-center">
          Welcome Back
        </h1>

        <p className="text-sm text-neutral-500 text-center mt-2">
          Login to continue to SkillVibe
        </p>

        <div className="mt-6 space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
        >
          Login
        </button>

      </motion.form>

    </main>
  );
}