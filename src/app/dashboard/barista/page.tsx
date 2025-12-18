"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
import { 
  LayoutDashboard, 
  Menu as MenuIcon, // Used for Stock Icon
  ClipboardList, 
  LogOut, 
  Bell, 
  Search,
  ToggleLeft,
  ToggleRight,
  Coffee // Barista Icon
} from "lucide-react";

// 1. IMPORT THE NEW COMPONENT
import BaristaOrders from "@/components/barista/BaristaOrders";

type ViewState = "DASHBOARD" | "ORDERS" | "MENU";

export default function BaristaDashboard() {
  const { data: session } = useSession();
  const [view, setView] = useState<ViewState>("DASHBOARD");

  // 2. FETCH DATA 
  const { data: orders, isLoading: isLoadingOrders } = api.order.getAll.useQuery({ status: "ALL" });
  const { data: categories, refetch: refetchMenu } = api.menu.getAll.useQuery();
  
  // Mutation to toggle stock
  const toggleStock = api.menu.toggleAvailability.useMutation({
    onSuccess: () => refetchMenu(),
  });

  // 3. DYNAMIC DATE
  const [currentDate, setCurrentDate] = useState<string>("");
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  // 4. STATS & FILTERS (DRINKS ONLY)
  // Count active orders that contain at least one drink
  const activeTicketCount = orders?.filter(o => 
      (o.status === "PENDING" || o.status === "ON_PROCESS") && 
      o.items.some(i => i.menuItem.category.type?.toUpperCase() === "DRINK")
  ).length || 0;

  // Filter Out of Stock Items (Drinks Only)
  const unavailableItems = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter(cat => cat.type?.toUpperCase() === "DRINK") 
      .flatMap(cat => cat.items)
      .filter(item => !item.isAvailable);
  }, [categories]);

  // Search for Dashboard
  const [search, setSearch] = useState("");
  
  // Filter list for Dashboard (Only showing orders containing drinks)
  const filteredDashboardOrders = orders?.filter(order => {
    const hasDrinks = order.items.some(i => i.menuItem.category.type?.toUpperCase() === "DRINK");
    const matchesSearch = order.id.toString().includes(search) || ("Guest").toLowerCase().includes(search.toLowerCase());
    return hasDrinks && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] font-sans text-slate-800 relative">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white flex flex-col border-r border-gray-100 sticky top-0 h-screen z-20">
        <div className="p-8 flex items-center gap-3">
             <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs text-center leading-none">
                KANZ<br/>COFFEE
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Barista<br/>Station</h1>
            </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={view === "DASHBOARD"} onClick={() => setView("DASHBOARD")} />
            <NavItem icon={<ClipboardList size={20}/>} label="Barista Tickets" active={view === "ORDERS"} onClick={() => setView("ORDERS")} />
            <NavItem icon={<MenuIcon size={20}/>} label="Drink Stock" active={view === "MENU"} onClick={() => setView("MENU")} />
        </nav>

        <div className="p-8">
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors font-medium">
                <LogOut size={20} /> <span>Logout</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* VIEW 1: ORDERS CHECKLIST */}
        {view === "ORDERS" && <BaristaOrders />}
        
        {/* VIEW 2: MENU STOCK (DRINKS ONLY) */}
        {view === "MENU" && (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold">Manage Drink Availability</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories?.filter(cat => cat.type?.toUpperCase() === "DRINK").map((cat) => (
                        <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-[#C89F65] border-b pb-2">{cat.name}</h3>
                            <ul className="space-y-3">
                                {cat.items.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between">
                                        <span className={item.isAvailable ? "text-slate-800" : "text-gray-400 line-through"}>{item.name}</span>
                                        <button disabled={toggleStock.isPending} onClick={() => toggleStock.mutate({ id: item.id, isAvailable: !item.isAvailable })} className={`transition-colors ${item.isAvailable ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"}`}>
                                            {item.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* VIEW 3: DASHBOARD (Simple Overview) */}
        {view === "DASHBOARD" && (
            <>
                <header className="flex justify-end items-center mb-8">
                    <div className="text-xl font-medium text-slate-800">{currentDate}</div>
                </header>

                {/* Stats */}
                <div className="flex gap-6 mb-8">
                    <StatCard title="Active Drink Tickets" value={activeTicketCount} />
                    <StatCard title="Total Tickets Today" value={filteredDashboardOrders?.length || 0} />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-8">
                    
                    {/* Order List Table */}
                    <div className="col-span-8 bg-white p-6 rounded-3xl shadow-sm min-h-[500px]">
                        <h2 className="font-bold text-xl mb-6 text-black">Today's Drink Orders</h2>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                            <input type="text" placeholder="Search by ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-100 rounded-xl py-2.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#C89F65] text-sm" />
                        </div>
                        <div className="space-y-4">
                            {isLoadingOrders ? (
                                <div className="text-center text-gray-400 py-10">Loading orders...</div>
                            ) : filteredDashboardOrders?.map((order) => (
                                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-[#C89F65] text-white rounded-xl flex items-center justify-center font-bold text-lg">#{order.id.toString()}</div>
                                        <div>
                                            <div className="font-bold text-slate-800">Guest <span className="text-xs font-normal text-gray-400 ml-1">#{order.id}</span></div>
                                            {/* Count items that are drinks */}
                                            <div className="text-xs text-gray-400">
                                                {order.items.filter(i => i.menuItem.category.type?.toUpperCase() === "DRINK").length} drinks
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                            ))}
                            {filteredDashboardOrders?.length === 0 && <div className="text-center text-gray-400 py-10">No drink orders found</div>}
                        </div>
                    </div>

                    {/* Out of Stock Sidebar */}
                    <div className="col-span-4 bg-white p-6 rounded-3xl shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-6">
                             <h2 className="font-bold text-xl text-black">Out of Stock</h2>
                             <button onClick={() => setView("MENU")} className="text-xs text-[#C89F65] font-bold hover:underline">Edit</button>
                        </div>
                        
                        {unavailableItems.length > 0 ? (
                            <ul className="space-y-4">
                                {unavailableItems.map(item => (
                                    <li key={item.id} className="pb-3 border-b border-gray-100 last:border-0">
                                        <div className="font-bold text-slate-800">{item.name}</div>
                                        <div className="text-xs text-gray-400">Unavailable</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-400 italic">All drinks available.</div>
                        )}
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavItem({ icon, label, active = false, onClick }: any) {
    return (
        <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-[#C89F65] font-bold text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} <span>{label}</span>
        </div>
    )
}

function StatCard({ title, value }: { title: string, value: number }) {
    return (
        <div className="bg-[#C89F65] w-64 p-6 rounded-3xl text-white shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-white/10 h-24 w-24 rounded-full group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start relative z-10">
                <span className="font-medium text-white/90 text-lg">{title}</span>
                <Coffee size={24} className="text-white/80" />
            </div>
            <div className="text-5xl font-bold relative z-10">{value}</div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = { "PENDING": "bg-yellow-100 text-yellow-700", "ON_PROCESS": "bg-blue-100 text-blue-700", "READY": "bg-green-100 text-green-700" };
    return <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide min-w-[80px] text-center ${styles[status] || "bg-gray-100"}`}>{status}</span>;
}