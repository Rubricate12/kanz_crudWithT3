"use client";

import { useState } from "react";
import { api } from "@/trpc/react"; // Import tRPC hooks

interface StaffLoginProps {
  stationName: string; // "Cashier", "Kitchen", etc.
  onLoginSuccess: (employeeName: string) => void;
}

export default function StaffLogin({ stationName, onLoginSuccess }: StaffLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // tRPC utility to fetch data manually
  const utils = api.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Ask the backend if this PIN exists
      const employee = await utils.client.employee.login.query({ pin });

      if (!employee) {
        setError("Invalid PIN code");
        setLoading(false);
        return;
      }

      // 2. Optional: Check if this employee is allowed on this station
      // (For now we allow Admin everywhere)
      if (employee.role !== "ADMIN" && employee.role !== stationName.toUpperCase()) {
         setError(`Access Denied. You are registered as ${employee.role}`);
         setLoading(false);
         return;
      }

      // 3. Success!
      onLoginSuccess(employee.name);
      
    } catch (err) {
      setError("System Error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-black">
      {/* Top Warning Bar */}
      <div className="fixed top-0 flex h-16 w-full items-center justify-between bg-[#FCD34D] px-8 shadow-sm">
        <span className="font-bold">LOCKED TERMINAL</span>
        <span className="text-sm font-semibold uppercase opacity-70">{stationName} Station</span>
      </div>

      <div className="z-10 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Access</h1>
          <p className="text-gray-500">Enter your PIN to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 text-center text-4xl font-bold tracking-[1em] text-gray-800 focus:border-[#FCD34D] focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all"
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm font-bold text-red-600 animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "UNLOCK"}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">Restricted Area • Authorized Personnel Only</p>
    </div>
  );
}