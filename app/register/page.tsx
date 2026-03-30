"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FloatingBackground from "@/components/FloatingBackground";
import AuthBackground from "@/components/ui/AuthBackground";

const departments = ["IT", "CSE", "EXTC", "MECH"];

export default function RegisterPage() {
  const [mentors, setMentors] = useState<
    Array<{ id: string; name: string | null; email: string; department: string | null }>
  >([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [adminId, setAdminId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [error, setError] = useState("");

  async function loadMentors(nextDepartment: string) {
    if (!nextDepartment.trim()) {
      setMentors([]);
      setMentorId("");
      return;
    }

    try {
      setMentorLoading(true);
      const res = await fetch(`/api/mentors?department=${encodeURIComponent(nextDepartment)}`);
      const data = await res.json();

      if (!res.ok) {
        setMentors([]);
        return;
      }

      setMentors(data.mentors ?? []);
      setMentorId("");
    } finally {
      setMentorLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        studentId,
        mentorId,
        adminId,
        department,
        year,
        division,
        linkedin,
        githubUrl,
        portfolioUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ?? "Registration failed");
      return;
    }

    window.location.href = "/login";
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <AuthBackground />
      <FloatingBackground />

      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleRegister}
        className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-10 w-[460px]"
      >
        <h1 className="text-2xl font-semibold text-center">Create Account</h1>

        <div className="flex gap-3 mt-6 justify-center">
          {["STUDENT", "MENTOR", "ADMIN"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                role === r
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Name"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {role === "STUDENT" && (
          <div className="mt-4 space-y-4">
            <input
              placeholder="Student ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />

            <select
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 bg-white"
              value={department}
              onChange={(e) => {
                const nextDepartment = e.target.value;
                setDepartment(nextDepartment);
                void loadMentors(nextDepartment);
              }}
              required
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              placeholder="Year"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />

            <input
              placeholder="Division"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
            />

            <div>
              <select
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 bg-white"
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                required
                disabled={!department.trim() || mentorLoading}
              >
                <option value="">
                  {mentorLoading
                    ? "Loading mentors..."
                    : !department.trim()
                      ? "Select department first"
                      : mentors.length === 0
                        ? "No mentors available for this department"
                        : "Select mentor"}
                </option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name ?? mentor.email}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-neutral-500">
                Mentor selection is required for student registration.
              </p>
            </div>
          </div>
        )}

        {role === "MENTOR" && (
          <div className="mt-4 space-y-4">
            <input
              placeholder="Mentor ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
            />

            <select
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 bg-white"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === "ADMIN" && (
          <div className="mt-4 space-y-4">
            <input
              placeholder="Admin ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />

            <select
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 bg-white"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <input
            type="url"
            placeholder="LinkedIn URL (optional)"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />

          <input
            type="url"
            placeholder="GitHub URL (optional)"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />

          <input
            type="url"
            placeholder="Portfolio URL (optional)"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : null}

        <button className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition">
          Register
        </button>
      </motion.form>
    </main>
  );
}
