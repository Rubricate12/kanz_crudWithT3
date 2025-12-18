"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Search, ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// 1. DEFINE TYPES
interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  isAvailable: boolean; // Added strict typing for availability
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function PosSystem({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();

  // Fetch Data (With Auto-Refresh for Stock Updates)
  const { data: categories, isLoading, refetch } = api.menu.getAll.useQuery(undefined, {
    refetchInterval: 5000, // Check for updates every 5 seconds
  });

  // Mutation: Save Order
  const createOrder = api.order.create.useMutation({
    onSuccess: () => {
      alert("Order Placed Successfully!");
      setCart([]); // Clear cart
      onCancel();  // Go back to dashboard
      router.refresh(); // Refresh dashboard data
    },
    onError: (err) => {
        alert("Failed to create order: " + err.message);
        // If it failed because something just went out of stock, refresh immediately
        refetch();
    }
  });

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  
  // Dynamic Date State
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-GB', options));
  }, []);

  // 2. CART LOGIC
  const addToCart = (item: MenuItem) => {
    // --- STOCK CHECK ---
    if (!item.isAvailable) {
        alert("Sorry, this item is currently Sold Out.");
        return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, change: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const newQty = i.qty + change;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // 3. FILTERING LOGIC
  const activeItems = categories?.flatMap(cat => 
    cat.items.map(item => ({ ...item, categoryId: cat.id }))
  ).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800">
      
      {/* --- COLUMN 1: NAVIGATION (Left) --- */}
      <aside className="w-64 border-r border-gray-100 flex flex-col bg-white">
        
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
             <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs text-center leading-none">
                KANZ<br/>COFFEE
            </div>
            <h1 className="font-bold text-lg leading-tight">Kanz Coffee<br/>& Eatery</h1>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            
            {/* Group: Meals (Filtered by type="FOOD") */}
            <div>
                <h3 className="text-[#FCD34D] font-bold text-sm tracking-wider mb-4 uppercase">Meals</h3>
                <div className="space-y-2">
                     <CategoryButton 
                        label="All Menu" 
                        isActive={selectedCategory === "all"} 
                        onClick={() => setSelectedCategory("all")} 
                      />
                      {categories?.filter(c => c.type === "FOOD").map(cat => (
                        <CategoryButton 
                            key={cat.id}
                            label={cat.name} 
                            isActive={selectedCategory === cat.id} 
                            onClick={() => setSelectedCategory(cat.id)} 
                        />
                      ))}
                      {categories?.filter(c => c.type === "FOOD").length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-2">No meals found</div>
                      )}
                </div>
            </div>

            {/* Group: Drinks (Filtered by type="DRINK") */}
            <div>
                <h3 className="text-[#FCD34D] font-bold text-sm tracking-wider mb-4 uppercase">Drink & Dessert</h3>
                <div className="space-y-2">
                      {categories?.filter(c => c.type === "DRINK").map(cat => (
                        <CategoryButton 
                            key={cat.id}
                            label={cat.name} 
                            isActive={selectedCategory === cat.id} 
                            onClick={() => setSelectedCategory(cat.id)} 
                        />
                      ))}
                      {categories?.filter(c => c.type === "DRINK").length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-2">No drinks found</div>
                      )}
                </div>
            </div>
        </div>

        {/* Back Button */}
        <div className="p-6">
            <button 
                onClick={onCancel}
                className="flex items-center gap-2 text-gray-500 font-bold hover:text-black transition-colors"
            >
                <ChevronLeft size={24} />
                <span className="text-lg">Back</span>
            </button>
        </div>
      </aside>


      {/* --- COLUMN 2: MENU GRID (Center) --- */}
      <main className="flex-1 bg-[#F3F4F6] p-8 flex flex-col relative">
        
        {/* Top Header: Search & Date */}
        <div className="flex justify-between items-start mb-8">
            <div className="relative w-96">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Menu"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-200/50 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FCD34D] transition-all"
                />
            </div>
            
            {/* Dynamic Date */}
            <div className="text-gray-500 font-medium">
                {currentDate || "Loading..."}
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
                <div className="text-center p-10 text-gray-400">Loading Menu...</div>
            ) : (
                <div className="grid grid-cols-3 2xl:grid-cols-4 gap-4">
                    {activeItems?.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className={`
                                relative bg-white rounded-xl p-4 shadow-sm transition-all flex flex-col items-center justify-center text-center h-48 group overflow-hidden
                                ${!item.isAvailable 
                                    ? "opacity-60 grayscale cursor-not-allowed border border-gray-200" 
                                    : "hover:shadow-md cursor-pointer active:scale-95"
                                }
                            `}
                        >
                            {/* --- SOLD OUT BADGE --- */}
                            {!item.isAvailable && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/50">
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full -rotate-12 shadow-md">
                                        SOLD OUT
                                    </span>
                                </div>
                            )}

                            <div className={`font-bold text-gray-800 mb-2 transition-colors ${item.isAvailable ? "group-hover:text-[#FCD34D]" : ""}`}>
                                {item.name}
                            </div>
                            <div className="text-gray-500 text-sm">
                                Rp{item.price.toLocaleString("id-ID")}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>


      {/* --- COLUMN 3: CART (Right) --- */}
      <aside className="w-96 bg-[#F3F4F6] border-l border-gray-200 flex flex-col relative">
         
         {/* Cart Header */}
         <div className="p-6 flex justify-between items-center">
            <span className="bg-[#FCD34D] px-4 py-2 rounded-lg font-bold text-sm">Order Menu</span>
            <span className="font-medium text-gray-600">Order #New</span>
         </div>

         {/* Cart Items List */}
         <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-center">
                    Silahkan pilih menu....
                </div>
            ) : (
                cart.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-800 w-3/4 leading-tight">{item.name}</span>
                            <span className="font-bold text-gray-600">Rp{(item.price * item.qty).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-end gap-3 items-center">
                             <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-100 rounded hover:bg-red-100 hover:text-red-500 transition-colors">
                                <Minus size={14} />
                             </button>
                             <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                             <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-100 rounded hover:bg-green-100 hover:text-green-500 transition-colors">
                                <Plus size={14} />
                             </button>
                             <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                             <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                ))
            )}
         </div>

         {/* Yellow Footer */}
         <div className="p-6 mt-auto">
             <div className="bg-[#FCD34D] rounded-xl p-4 shadow-lg flex items-center justify-between">
                 <div>
                     <div className="text-2xl font-bold text-black">
                        Rp{cartTotal.toLocaleString("id-ID")}
                     </div>
                     <div className="text-xs font-bold text-black/60">
                        {cartCount} items
                     </div>
                 </div>
                 <button 
                    disabled={cart.length === 0 || createOrder.isPending}
                    onClick={() => {
                        createOrder.mutate({
                            items: cart.map(i => ({ id: i.id, qty: i.qty })),
                            total: cartTotal
                        });
                    }}
                    className="bg-white text-[#FCD34D] px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 >
                    {createOrder.isPending ? "Saving..." : "Order"}
                 </button>
             </div>
         </div>

      </aside>

    </div>
  );
}

// --- Helper Component ---
function CategoryButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                ? "bg-[#FCD34D] text-black shadow-sm font-bold" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
        >
            {label}
        </button>
    )
}