"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { 
  Search, 
  Clock, 
  CheckSquare, 
  Coffee // Barista Icon
} from "lucide-react";

export default function BaristaOrders() {
  // 1. DATA FETCHING
  const { data: orders, refetch } = api.order.getAll.useQuery({ status: "ALL" });

  // 2. MUTATIONS
  const toggleItem = api.order.toggleItemStatus.useMutation({
    onSuccess: () => refetch(),
  });
  const updateOrderStatus = api.order.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  // 3. FILTER LOGIC
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING">("PENDING");

  const baristaOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders
      .filter(o => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      .map(order => {
        // --- FILTER: KEEP ONLY DRINKS ---
        const drinkItems = order.items.filter(item => 
            item.menuItem.category.type?.toUpperCase() === "DRINK"
        );
        return { ...order, items: drinkItems };
      })
      .filter(order => order.items.length > 0) // Remove orders with no drinks
      .filter(order => {
         // View Filter: Active vs History
         if (filter === "PENDING") return order.status !== "READY";
         return true;
      })
      .filter(order => order.id.toString().includes(search));
  }, [orders, search, filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coffee className="text-[#C89F65]" /> Barista Tickets
        </h2>
        
        <div className="flex gap-4">
             {/* Filter Toggle */}
             <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                    onClick={() => setFilter("PENDING")}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === "PENDING" ? "bg-white shadow text-black" : "text-gray-400"}`}
                >
                    Active
                </button>
                <button 
                    onClick={() => setFilter("ALL")}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === "ALL" ? "bg-white shadow text-black" : "text-gray-400"}`}
                >
                    History
                </button>
             </div>

             {/* Search */}
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Ticket #..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#C89F65]" 
                />
             </div>
        </div>
      </div>

      {/* TICKET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {baristaOrders.map((order) => {
              // Check if every drink in this order is ready
              const allDrinksReady = order.items.every(i => i.isReady);
              
              return (
                  <div key={order.id} className={`bg-white p-6 rounded-3xl shadow-sm border-t-8 transition-all ${allDrinksReady ? "border-green-500 ring-2 ring-green-100" : "border-[#C89F65]"}`}>
                      
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xl ${allDrinksReady ? "bg-green-500 text-white" : "bg-[#C89F65] text-white"}`}>
                                  {order.id}
                              </div>
                              <div>
                                  <div className="font-bold text-lg">Guest #{order.id}</div>
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12}/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                              </div>
                          </div>
                          
                          {/* "Mark Ready" Button */}
                          {allDrinksReady && order.status !== "READY" ? (
                              <button 
                                  onClick={() => updateOrderStatus.mutate({ id: order.id, status: "READY" })}
                                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors animate-pulse"
                              >
                                  Ready?
                              </button>
                          ) : (
                             <span className="text-xs font-bold text-gray-300 bg-gray-100 px-2 py-1 rounded uppercase">{order.status}</span>
                          )}
                      </div>

                      {/* ITEMS LIST WITH CHECKBOXES */}
                      <div className="space-y-3">
                          {order.items.map((item: any) => (
                              <div 
                                  key={item.id} 
                                  // --- CLICK TO TOGGLE STATUS ---
                                  onClick={() => toggleItem.mutate({ itemId: item.id, isReady: !item.isReady })}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all active:scale-[0.98]
                                      ${item.isReady 
                                          ? "bg-green-50 border-green-200 opacity-60" 
                                          : "bg-white border-gray-100 hover:border-[#C89F65] hover:shadow-sm"
                                      }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${item.isReady ? "bg-green-500 text-white" : "bg-gray-100 text-gray-300"}`}>
                                          <CheckSquare size={16} strokeWidth={3} />
                                      </div>
                                      <span className={`font-bold text-sm ${item.isReady ? "text-gray-500 line-through" : "text-slate-700"}`}>
                                          {item.menuItem.name}
                                      </span>
                                  </div>
                                  <div className="font-bold text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                                      x{item.quantity}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )
          })}

          {baristaOrders.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="text-6xl mb-4">☕</div>
                  <p>No active drink tickets found.</p>
              </div>
          )}
      </div>
    </div>
  );
}