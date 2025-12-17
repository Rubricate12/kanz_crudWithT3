"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  // --- POPUP STATE ---
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); 
    setShowErrorPopup(false);

    const loginUser = username || selectedRole?.toLowerCase();

    try {
      console.log("Attempting login..."); 

      const result = await signIn("credentials", {
        username: loginUser,
        password: password,
        loginRole: selectedRole, 
        redirect: false, 
      });

      console.log("Login Result:", result); 

      // 🛑 FIX: Check for ERROR first!
      // Even if ok is true, if there is an error string, it failed.
      if (result?.error) {
        // LOGIN FAILED
        setPassword(""); // Clear password
        
        // Show specific error based on what happened
        if (selectedRole) {
           setErrorMessage(`Access Denied: This account is not a ${selectedRole}.`);
        } else {
           setErrorMessage("Invalid Username or Password.");
        }
        setShowErrorPopup(true);
      
      } else if (result?.ok) {
        // LOGIN SUCCESS (Only if no error)
        router.push("/dashboard"); 
        router.refresh();
      } 
      
    } catch (err) {
      console.error("CRITICAL LOGIN ERROR:", err);
      setPassword("");
      setErrorMessage("System Error. Please check console.");
      setShowErrorPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIEW 1: STAFF MENU ---
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
            <RoleButton 
              label="Cashier" 
              color="border-blue-500 text-blue-500"
              icon="💰" 
              onClick={() => setSelectedRole("CASHIER")} 
            />
            <RoleButton 
              label="Kitchen" 
              color="border-green-500 text-green-500"
              icon="👨‍🍳" 
              onClick={() => setSelectedRole("KITCHEN")} 
            />
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
        <div className="fixed bottom-0 h-12 w-full bg-[#FCD34D]" />
      </div>
    );
  }

  // --- VIEW 2: LOGIN FORM ---
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans text-black">
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

      <div className="fixed bottom-0 h-12 w-full bg-[#FCD34D]" />

      {/* --- ERROR POPUP --- */}
      {showErrorPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-80 overflow-hidden rounded-xl bg-[#F0F0F0] shadow-2xl border-2 border-blue-400">
                {/* Header */}
                <div className="bg-[#D32F2F] py-3 text-center">
                    <h3 className="text-xl font-bold text-white">Error</h3>
                </div>
                
                {/* Body */}
                <div className="p-6 text-center">
                    <p className="font-semibold text-black leading-relaxed">
                        {errorMessage}
                    </p>
                </div>

                {/* Footer / Button */}
                <div className="pb-6 flex justify-center">
                    <button 
                        onClick={() => setShowErrorPopup(false)}
                        className="rounded-full bg-[#D32F2F] px-8 py-1 text-lg font-bold text-white shadow-sm hover:bg-red-700 active:scale-95"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
      )}

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