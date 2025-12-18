import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChefHat, Coffee, CreditCard, ShieldAlert } from "lucide-react";

export default async function AdminHub() {
  const session = await auth();

  // 1. SECURITY: If not Admin, kick them to their assigned role
  if (session?.user.role !== "ADMIN") {
    if (session?.user.role === "KITCHEN") redirect("/dashboard/kitchen");
    if (session?.user.role === "BARISTA") redirect("/dashboard/barista");
    if (session?.user.role === "CASHIER") redirect("/dashboard/cashier");
    return redirect("/"); // Fallback
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Admin Hub</h1>
        <p className="text-slate-500">Select a station to monitor or manage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        
        {/* Cashier Link */}
        <Link href="/dashboard/cashier" className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center hover:-translate-y-1">
          <div className="h-20 w-20 bg-[#FCD34D] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CreditCard size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Cashier Station</h2>
          <p className="text-sm text-slate-400 mt-2">Manage orders & payments</p>
        </Link>

        {/* Kitchen Link */}
        <Link href="/dashboard/kitchen" className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center hover:-translate-y-1">
          <div className="h-20 w-20 bg-[#F4A261] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ChefHat size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Kitchen Display</h2>
          <p className="text-sm text-slate-400 mt-2">View food tickets</p>
        </Link>

        {/* Barista Link */}
        <Link href="/dashboard/barista" className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center hover:-translate-y-1">
          <div className="h-20 w-20 bg-[#C89F65] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Coffee size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Barista Station</h2>
          <p className="text-sm text-slate-400 mt-2">View drink tickets</p>
        </Link>

      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-full border border-red-100">
            <ShieldAlert size={16} />
            <span>You are logged in as <strong>Administrator</strong>. You have full access.</span>
        </div>
      </div>
    </div>
  );
}