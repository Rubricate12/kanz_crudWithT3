import { auth, signOut } from "@/server/auth"; // Import signOut logic (Note: server action)
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col justify-between bg-white font-sans text-black">
      
      {/* Top Bar (Yellow) */}
      <div className="h-16 w-full bg-[#FCD34D]" />

      {/* Main Content */}
      <div className="flex flex-grow items-center justify-center px-8 md:px-24">
        <div className="flex w-full max-w-5xl items-center justify-between">
            
            {/* Left Side: Logo */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full border-4 border-black bg-white p-2 text-center shadow-sm">
                     <span className="text-4xl font-extrabold tracking-tighter">KANZ</span>
                     <span className="mt-1 rotate-[-5deg] text-xs font-serif italic text-gray-600">coffee & eatery</span>
                </div>
                <h1 className="text-xl font-bold uppercase tracking-wide text-black">
                  Kanz Coffee & Eatery
                </h1>
            </div>

            {/* Right Side: Buttons */}
            <div className="flex flex-col items-center gap-4">
                 {/* Main Action Button */}
                 <Link
                    href={session ? "/dashboard" : "/auth/signin"} 
                    className="flex items-center justify-center rounded-lg bg-[#FCD34D] px-16 py-4 text-xl font-bold tracking-widest text-black shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                    {session ? "ENTER SYSTEM" : "START"}
                </Link>

                {/* LOGOUT OPTION - Only shows if logged in */}
                {session && (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">
                            Logged in as <strong className="uppercase text-black">{session.user?.name}</strong>
                        </span>
                        
                        <Link 
                            href="/api/auth/signout" 
                            className="text-sm font-semibold text-red-600 hover:underline"
                        >
                            Not you? Log Out
                        </Link>
                    </div>
                )}
            </div>

        </div>
      </div>

      {/* Bottom Bar (Yellow) */}
      <div className="h-16 w-full bg-[#FCD34D]" />
    </main>
  );
}