"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FloatingBackground from "@/components/FloatingBackground";
import AuthBackground from "@/components/ui/AuthBackground";

export default function RegisterPage() {

  const [role, setRole] = useState("STUDENT");

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [studentId,setStudentId] = useState("");
  const [mentorId,setMentorId] = useState("");
  const [adminId,setAdminId] = useState("");

  const [department,setDepartment] = useState("");
  const [year,setYear] = useState("");
  const [linkedin,setLinkedin] = useState("");

  async function handleRegister(e:React.FormEvent){

    e.preventDefault();

    await fetch("/api/users/register",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({
        name,
        email,
        password,
        role,
        studentId,
        mentorId,
        adminId,
        department,
        year,
        linkedin
      })
    });

    window.location.href="/login";

  }

  return(

    <main className="relative min-h-screen flex items-center justify-center">

      <AuthBackground/>
      <FloatingBackground/>

      <motion.form
        initial={{opacity:0,y:40}}
        animate={{opacity:1,y:0}}
        onSubmit={handleRegister}
        className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-10 w-[420px]"
      >

        <h1 className="text-2xl font-semibold text-center">
          Create Account
        </h1>


        {/* ROLE SELECTOR */}

        <div className="flex gap-3 mt-6 justify-center">

          {["STUDENT","MENTOR","ADMIN"].map((r)=>(
            
            <button
              key={r}
              type="button"
              onClick={()=>setRole(r)}
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


        {/* COMMON FIELDS */}

        <div className="mt-6 space-y-4">

          <input
            placeholder="Name"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <input
            placeholder="Email"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

        </div>


        {/* STUDENT FIELDS */}

        {role === "STUDENT" && (

          <div className="mt-4 space-y-4">

            <input
              placeholder="Student ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={studentId}
              onChange={(e)=>setStudentId(e.target.value)}
            />

            <input
              placeholder="Department"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={department}
              onChange={(e)=>setDepartment(e.target.value)}
            />

            <input
              placeholder="Year"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={year}
              onChange={(e)=>setYear(e.target.value)}
            />

            <input
              placeholder="LinkedIn URL (optional)"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={linkedin}
              onChange={(e)=>setLinkedin(e.target.value)}
            />

          </div>

        )}


        {/* MENTOR FIELDS */}

        {role === "MENTOR" && (

          <div className="mt-4 space-y-4">

            <input
              placeholder="Mentor ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={mentorId}
              onChange={(e)=>setMentorId(e.target.value)}
            />

            <input
              placeholder="Department"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={department}
              onChange={(e)=>setDepartment(e.target.value)}
            />

          </div>

        )}


        {/* ADMIN FIELDS */}

        {role === "ADMIN" && (

          <div className="mt-4 space-y-4">

            <input
              placeholder="Admin ID"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={adminId}
              onChange={(e)=>setAdminId(e.target.value)}
            />

            <input
              placeholder="Department"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2"
              value={department}
              onChange={(e)=>setDepartment(e.target.value)}
            />

          </div>

        )}


        <button
          className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
        >
          Register
        </button>

      </motion.form>

    </main>

  )

}