"use client";

import { useState } from "react";
import { Search, ChevronLeft } from "lucide-react";
import { api } from "@/trpc/react";

export default function KitchenMenu({ onBack }: { onBack: () => void }) {
  // 1. FETCH DATA
  const { data: categories, isLoading, refetch } = api.menu.getAll.useQuery();
  const toggleMutation = api.menu.toggleAvailability.useMutation({
    onSuccess: () => refetch(),
  });

  // 2. STATE
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // 3. DERIVED DATA (Flattening categories for the grid)
  const allItems = categories?.flatMap(cat => 
    cat.items.map(item => ({ ...item, categoryId: cat.id, categoryName: cat.name }))
  ) || [];

  // Filter for the Center Grid
  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter for the Right Sidebar (Only Out of Stock)
  const outOfStockItems = allItems.filter(item => !item.isAvailable);

  // 4. HANDLER
  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, isAvailable: !currentStatus });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F5F5] overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white px-8 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-500 hover:text-black flex items-center gap-2 font-bold">
                <ChevronLeft size={20} /> Back
            </button>
            <div className="h-6 w-[1px] bg-gray-200"></div>
            <h2 className="text-xl font-bold text-slate-800">Menu Management</h2>
        </div>
        
        {/* Search */}
        <div className="relative w-96">
            <Search className="absolute left-4 top-2.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search Menu..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-100 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FCD34D] text-sm"
            />
        </div>
        
        <div className="text-gray-500 font-medium text-sm">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT SIDEBAR: CATEGORIES --- */}
        <aside className="w-64 bg-white border-r border-gray-100 overflow-y-auto p-6">
            <h3 className="text-[#FCD34D] font-bold text-sm tracking-wider mb-4 uppercase">Categories</h3>
            <div className="space-y-2">
                <button 
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                        selectedCategory === "all" ? "bg-[#FCD34D] text-black shadow-sm font-bold" : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    All Menu
                </button>
                {categories?.map((cat) => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                            selectedCategory === cat.id ? "bg-[#FCD34D] text-black shadow-sm font-bold" : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </aside>

        {/* --- CENTER: MENU GRID --- */}
        <main className="flex-1 p-8 overflow-y-auto">
            {isLoading ? (
                <div className="text-center text-gray-400 mt-20">Loading Menu...</div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-3 transition-all ${!item.isAvailable ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                            <div className="text-center py-4 flex-1 flex flex-col justify-center">
                                <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{item.name}</h4>
                                <p className="text-sm text-gray-500 font-medium">Rp{item.price.toLocaleString("id-ID")}</p>
                            </div>
                            <button 
                                onClick={() => handleToggle(item.id, item.isAvailable)}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                                    item.isAvailable 
                                    ? "bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-500" // Click to disable
                                    : "bg-red-500 text-white hover:bg-green-500" // Click to enable
                                }`}
                            >
                                {item.isAvailable ? "Set Out of Stock" : "Restock (Available)"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>

        {/* --- RIGHT SIDEBAR: OUT OF STOCK LIST --- */}
        <aside className="w-80 bg-white border-l border-gray-100 p-6 overflow-y-auto">
            <h3 className="font-bold text-xl mb-6 text-black">Out of Stock</h3>
            
            {outOfStockItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center italic mt-10">All items are available.</p>
            ) : (
                <ul className="space-y-4">
                    {outOfStockItems.map((item) => (
                        <li key={item.id} className="pb-4 border-b border-gray-100 last:border-0 flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-slate-800">{item.name}</div>
                                <div className="text-xs text-red-500 font-medium">Unavailable</div>
                            </div>
                            <button 
                                onClick={() => handleToggle(item.id, false)} // Set to true (Available)
                                className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Restore
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>

      </div>
    </div>
  );
}