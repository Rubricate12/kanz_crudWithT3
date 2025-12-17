"use client";

import { signOut, useSession } from "next-auth/react";

export default function KitchenPage() {
  const { data: session } = useSession();

  // Loading state
  if (!session) return <div className="p-8 text-xl font-bold">Connecting to KDS...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      {/* KDS Header */}
      <header className="flex h-16 items-center justify-between bg-zinc-800 px-6 shadow-md border-b border-zinc-700">
        <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍🍳</span>
            <div>
                <h1 className="text-xl font-bold leading-none text-white">Kitchen Display</h1>
                <span className="text-xs text-zinc-400">Live Incoming Orders</span>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-sm font-medium text-green-500">System Online</span>
            </div>

            <div className="h-8 w-[1px] bg-zinc-600" />

            <div className="flex flex-col items-end">
                <span className="text-xs text-zinc-400">Station Chef</span>
                <span className="font-bold text-[#FCD34D] uppercase leading-none">
                  {session.user?.name || "Kitchen Staff"}
                </span>
            </div>
            
            <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg bg-red-900/30 border border-red-900 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-900/50 transition-colors"
            >
                OFF DUTY
            </button>
        </div>
      </header>

      {/* Ticket Rail (Main Content) */}
      <main className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-full pb-4">
            
            {/* MOCK TICKET 1: NEW ORDER */}
            <TicketCard 
                id="#1024" 
                table="Table 5" 
                time="2m ago" 
                status="NEW"
                items={[
                    { name: "Dbl Cheeseburger", qty: 1, notes: "No onions" },
                    { name: "French Fries Lg", qty: 2, notes: "" },
                    { name: "Coke Zero", qty: 1, notes: "" }
                ]}
            />

            {/* MOCK TICKET 2: COOKING */}
            <TicketCard 
                id="#1025" 
                table="Table 2" 
                time="5m ago" 
                status="COOKING"
                items={[
                    { name: "Chicken Wings (6pcs)", qty: 1, notes: "Extra Spicy" },
                    { name: "Caesar Salad", qty: 1, notes: "" }
                ]}
            />

             {/* MOCK TICKET 3: READY */}
             <TicketCard 
                id="#1023" 
                table="Takeaway" 
                time="12m ago" 
                status="READY"
                items={[
                    { name: "Cappuccino", qty: 1, notes: "Oat milk" },
                    { name: "Croissant", qty: 2, notes: "Warmed up" }
                ]}
            />

        </div>
      </main>
    </div>
  );
}

// --- Helper Components for the UI ---

function TicketCard({ id, table, time, status, items }: any) {
    // Dynamic styles based on status
    const statusColor = 
        status === "NEW" ? "bg-green-600 text-white" :
        status === "COOKING" ? "bg-orange-500 text-black" :
        "bg-zinc-600 text-zinc-300";

    return (
        <div className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg">
            {/* Ticket Header */}
            <div className={`px-4 py-2 flex justify-between items-center ${statusColor}`}>
                <span className="font-bold text-lg">{id}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
            </div>
            
            {/* Meta Info */}
            <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex justify-between text-sm text-zinc-300">
                <span>{table}</span>
                <span>{time}</span>
            </div>

            {/* Items List */}
            <div className="p-4 flex-grow space-y-3">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col border-b border-zinc-700/50 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-white text-lg">{item.qty}x</span>
                            <span className="ml-2 flex-grow text-zinc-200 font-medium leading-tight">{item.name}</span>
                        </div>
                        {item.notes && (
                            <span className="text-xs text-red-400 mt-1 italic pl-6">
                                Note: {item.notes}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <div className="p-3 bg-zinc-800 border-t border-zinc-700">
                <button className="w-full py-3 rounded-lg bg-[#FCD34D] text-black font-bold hover:bg-yellow-400 transition-colors active:scale-95">
                    {status === "NEW" ? "START COOKING" : status === "COOKING" ? "MARK READY" : "COMPLETE"}
                </button>
            </div>
        </div>
    )
}