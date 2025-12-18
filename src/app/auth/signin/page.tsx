"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { 
  ChefHat, 
  Coffee, 
  CreditCard, 
  LayoutDashboard, 
  ArrowLeft, 
  Loader2 
} from "lucide-react";

export default function SignInPage() {
  // State to track selected role
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // If a role is selected, show the Login Form
  if (selectedRole) {
    return (
      <LoginForm 
        role={selectedRole} 
        onBack={() => setSelectedRole(null)} 
      />
    );
  }

  // Otherwise, show the Station Picker
  return (
    <StationPicker onSelect={(role: string) => setSelectedRole(role)} />
  );
}

// --- COMPONENT 1: LOGIN FORM (Updated Back Button) ---
function LoginForm({ role, onBack }: { role: string, onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const callbackUrl = role === "ADMIN" ? "/dashboard" : `/dashboard/${role.toLowerCase()}`;

    try {
      await signIn("credentials", {
        username: username,
        loginRole: role,
        password: password, 
        callbackUrl: callbackUrl,
      });
    } catch (error) {
      console.error("Login failed", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800 relative overflow-hidden">
      
      {/* Top Yellow Bar */}
      <div className="h-16 w-full bg-[#FCD34D] absolute top-0 left-0 z-0" />

      {/* --- NEW BACK BUTTON POSITION --- */}
      {/* Floating at top-left, just below the yellow bar */}
      <button 
          onClick={onBack}
          className="absolute top-20 left-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-bold text-gray-500 hover:text-black hover:shadow-md hover:border-gray-300 transition-all active:scale-95"
      >
          <ArrowLeft size={18} /> 
          <span>Back to Stations</span>
      </button>

      {/* Main Content Center */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-black mb-2 tracking-tight">Welcome!</h1>
                {/* Role Badge */}
                <div className="inline-block bg-[#FCD34D]/20 text-[#D97706] px-4 py-1 rounded-full text-sm font-extrabold uppercase tracking-widest mt-2">
                    {role} Station
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Username</label>
                    <input 
                        type="text" 
                        placeholder="Enter username" 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-medium outline-none focus:border-[#FCD34D] focus:bg-[#FCD34D]/5 transition-all placeholder:text-gray-300"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-medium outline-none focus:border-[#FCD34D] focus:bg-[#FCD34D]/5 transition-all placeholder:text-gray-300"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FCD34D] text-black font-extrabold text-xl py-4 rounded-xl hover:bg-[#fbbf24] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Login"}
                </button>
            </form>

        </div>
      </div>

      {/* Bottom Yellow Bar */}
      <div className="h-16 w-full bg-[#FCD34D] absolute bottom-0 left-0 z-0" />
    </div>
  );
}

// --- COMPONENT 2: STATION PICKER ---
function StationPicker({ onSelect }: { onSelect: (role: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] font-sans p-4 relative">
      
      {/* Top Bar */}
      <div className="h-4 w-full bg-[#FCD34D] absolute top-0 left-0" />

      <div className="text-center mb-12 z-10">
        <div className="h-20 w-20 bg-white border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
           <span className="font-extrabold text-lg tracking-tighter">KANZ</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Select Station</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
        <StationCard role="CASHIER" icon={<CreditCard size={32}/>} label="Cashier" color="bg-[#FCD34D]" onClick={() => onSelect("CASHIER")} />
        <StationCard role="KITCHEN" icon={<ChefHat size={32}/>} label="Kitchen" color="bg-[#F4A261]" onClick={() => onSelect("KITCHEN")} />
        <StationCard role="BARISTA" icon={<Coffee size={32}/>} label="Barista" color="bg-[#C89F65]" onClick={() => onSelect("BARISTA")} />
        <StationCard role="ADMIN" icon={<LayoutDashboard size={32}/>} label="Admin" color="bg-slate-800 text-white" onClick={() => onSelect("ADMIN")} />
      </div>
      
      {/* Bottom Bar */}
      <div className="h-4 w-full bg-[#FCD34D] absolute bottom-0 left-0" />
    </div>
  );
}

function StationCard({ role, icon, label, color, onClick }: any) {
    return (
      <button 
        onClick={onClick}
        className="relative overflow-hidden group p-6 rounded-2xl transition-all shadow-sm hover:shadow-xl transform hover:-translate-y-1 text-left flex items-center gap-6 border border-gray-100 bg-white h-32"
      > 
        <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-inner ${color} ${role === 'ADMIN' ? 'text-white' : 'text-black'}`}>
            {icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{label}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Click to login</p>
        </div>
      </button>
    )
}