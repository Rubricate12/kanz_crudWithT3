import { auth } from "@/server/auth"; 
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  // ROUTING LOGIC
  if (session) {
    const role = session.user.role;
    // Admin goes to the Hub we created in Step 1
    if (role === "ADMIN") redirect("/dashboard");
    // Staff go straight to work
    if (role === "KITCHEN") redirect("/dashboard/kitchen");
    if (role === "BARISTA") redirect("/dashboard/barista");
    if (role === "CASHIER") redirect("/dashboard/cashier");
  }

  // LOGIN SCREEN (If not logged in)
  return (
    <main className="flex min-h-screen flex-col justify-between bg-white font-sans text-black">
      <div className="h-16 w-full bg-[#FCD34D]" />
      <div className="flex flex-grow items-center justify-center px-8">
        <div className="flex flex-col items-center gap-8">
            <div className="flex h-64 w-64 flex-col items-center justify-center rounded-full border-4 border-black bg-white p-2 text-center shadow-lg">
                 <span className="text-6xl font-extrabold tracking-tighter">KANZ</span>
                 <span className="mt-1 rotate-[-5deg] text-sm font-serif italic text-gray-600">coffee & eatery</span>
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-black">
              Kanz Coffee & Eatery
            </h1>
            
            <Link
                href="/auth/signin" 
                className="flex items-center justify-center rounded-full bg-[#FCD34D] px-20 py-5 text-2xl font-bold tracking-widest text-black shadow-lg transition-transform hover:scale-105 active:scale-95 border-2 border-black"
            >
                START SYSTEM
            </Link>
        </div>
      </div>
      <div className="h-16 w-full bg-[#FCD34D]" />
    </main>
  );
}