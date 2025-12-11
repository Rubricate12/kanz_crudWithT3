"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Use this if you have icon images

// Define the roles
type Role = "CASHIER" | "KITCHEN" | "BARISTA" | null;

export default function SignInPage() {
  const router = useRouter();
  
  // State: Default is NULL (Show the Menu). When set, shows Login Form.
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  
  // Login Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // For dev: use the entered username, or default to the role name
    const loginUser = username || selectedRole?.toLowerCase(); 

    const result = await signIn("credentials", {
      username: loginUser,
      password: password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard"); 
      router.refresh();
    } else {
      setIsLoading(false);
      setError("Login failed. Please check credentials.");
    }
  };

  // --- VIEW 1: STAFF MENU (Matches image_63e679.png) ---
  if (!selectedRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white font-sans text-black">
        {/* Top Yellow Bar */}
        <div className="fixed top-0 h-12 w-full bg-[#FCD34D]" />

        <div className="z-10 flex flex-col items-center gap-12 p-4">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-black">
            Staff Menu
          </h1>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {/* Cashier Button */}
            <RoleButton 
              label="Cashier" 
              color="border-blue-500 text-blue-500"
              icon="💰" // You can replace this with <Image /> later
              onClick={() => setSelectedRole("CASHIER")} 
            />
            
            {/* Kitchen Button */}
            <RoleButton 
              label="Kitchen" 
              color="border-green-500 text-green-500"
              icon="👨‍🍳" 
              onClick={() => setSelectedRole("KITCHEN")} 
            />
            
            {/* Barista Button */}
            <RoleButton 
              label="Barista" 
              color="border-[#3d2b1f] text-[#3d2b1f]"
              icon="☕" 
              onClick={() => setSelectedRole("BARISTA")} 
            />
          </div>

          <button 
            onClick={() => router.push("/")}
            className="rounded-xl bg-[#FCD34D] px-10 py-3 font-bold shadow-md transition hover:scale-105 active:scale-95"
          >
            BACK
          </button>
        </div>

        {/* Bottom Yellow Bar */}
        <div className="fixed bottom-0 h-12 w-full bg-[#FCD34D]" />
      </div>
    );
  }

  // --- VIEW 2: LOGIN FORM (Matches image_63ee55.png) ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white font-sans text-black">
      {/* Top Yellow Bar */}
      <div className="fixed top-0 h-12 w-full bg-[#FCD34D]" />

      <div className="z-10 w-full max-w-md p-6">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold">Welcome!</h1>
          <h2 className="mt-2 text-2xl font-bold capitalize">{selectedRole.toLowerCase()}</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
             <input
                type="text"
                placeholder="Username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-3 text-lg outline-none focus:border-[#FCD34D] focus:ring-1 focus:ring-[#FCD34D]"
              />
          </div>
          <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-3 text-lg outline-none focus:border-[#FCD34D] focus:ring-1 focus:ring-[#FCD34D]"
              />
          </div>
          
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-[#FCD34D] py-3 text-lg font-bold shadow-md hover:bg-[#fbbf24] disabled:opacity-50"
          >
            {isLoading ? "Login..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={() => setSelectedRole(null)} 
                className="text-sm font-medium text-gray-400 hover:text-black hover:underline"
            >
                Change Station
            </button>
        </div>
      </div>

      {/* Bottom Yellow Bar */}
      <div className="fixed bottom-0 h-12 w-full bg-[#FCD34D]" />
    </div>
  );
}

// Helper Component for the Icons
function RoleButton({ label, icon, color, onClick }: { label: string, icon: string, color: string, onClick: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={onClick}>
            <div className={`flex h-28 w-28 items-center justify-center rounded-xl border-[4px] bg-white text-5xl shadow-sm transition-transform duration-200 group-hover:scale-110 group-active:scale-95 ${color}`}>
                {icon}
            </div>
            <span className="text-lg font-bold text-black">{label}</span>
        </div>
    )
}