"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function login() {
    setMsg(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error || "Login failed");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <p className="mt-2 text-slate-600">Enter ADMIN_PASSWORD from your .env</p>

      <div className="mt-6 flex flex-col gap-3">
        <input
          className="rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button className="rounded bg-black px-4 py-2 text-white" onClick={login}>
          Login
        </button>
        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
      </div>
    </main>
  );
}
