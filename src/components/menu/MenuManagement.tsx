"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, X, ChevronLeft, Save, FolderPlus, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

// --- Types ---
interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

// Ensure TypeScript knows about the 'type' field
interface Category {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
  type: string; // "FOOD" or "DRINK"
}

export default function MenuManagement({ onBack }: { onBack: () => void }) {
  
  // 1. DATA FETCHING
  const { data: categories, isLoading, refetch } = api.menu.getAll.useQuery();

  // 2. MUTATIONS
  const createItem = api.menu.create.useMutation({ onSuccess: () => refreshData() });
  const updateItem = api.menu.update.useMutation({ onSuccess: () => refreshData() });
  const deleteItem = api.menu.delete.useMutation({ onSuccess: () => refreshData() });
  
  const createCategory = api.menu.createCategory.useMutation({ onSuccess: () => refreshData() });
  const deleteCategory = api.menu.deleteCategory.useMutation({ onSuccess: () => refreshData() });

  // Helper to refresh and close modals
  const refreshData = () => {
    refetch();
    setModalType(null);
    setIsSaving(false);
  };

  // 3. STATE
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [modalType, setModalType] = useState<"ITEM" | "CATEGORY" | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null); 

  // Forms
  const [itemForm, setItemForm] = useState({ name: "", price: "", categoryId: "" });
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"FOOD" | "DRINK">("FOOD");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }));
  }, []);

  // --- HANDLERS ---

  // 1. Save Logic
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        if (modalType === "ITEM") {
            if (editingItem) {
                // EDIT EXISTING ITEM
                updateItem.mutate({
                    id: editingItem.id,
                    name: itemForm.name,
                    price: parseFloat(itemForm.price),
                    categoryId: itemForm.categoryId
                });
            } else {
                // CREATE NEW ITEM
                createItem.mutate({
                    name: itemForm.name,
                    price: parseFloat(itemForm.price),
                    categoryId: itemForm.categoryId
                });
            }
        } else if (modalType === "CATEGORY") {
            createCategory.mutate({
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
                type: categoryType // <--- Sending the type to DB
            });
        }
    } catch (error) {
        console.error("Failed to save", error);
        setIsSaving(false);
    }
  };

  // 2. Delete Handlers
  const handleDeleteItem = (id: string) => {
    if(confirm("Are you sure you want to delete this item?")) {
        deleteItem.mutate({ id });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if(confirm("Delete this category? ALL ITEMS inside it will be deleted too.")) {
        deleteCategory.mutate({ id });
    }
  };

  // 3. Open Modals
  const openAddItem = () => {
    setModalType("ITEM");
    setEditingItem(null);
    setItemForm({ name: "", price: "", categoryId: categories?.[0]?.id || "" });
  };

  const openEditItem = (item: MenuItem) => {
    setModalType("ITEM");
    setEditingItem(item);
    setItemForm({ name: item.name, price: item.price.toString(), categoryId: item.categoryId });
  };

  const openAddCategory = () => {
    setModalType("CATEGORY");
    setCategoryName("");
    setCategoryType("FOOD"); // Default to FOOD
  };

  // 4. Filtering
  const activeItems = categories?.flatMap(cat => 
    cat.items.map(item => ({ ...item, categoryId: cat.id }))
  ).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col z-10">
        <div className="p-6 flex items-center gap-3">
             <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs text-center leading-none">
                KANZ<br/>COFFEE
            </div>
            <h1 className="font-bold text-lg leading-tight">Kanz Coffee<br/>& Eatery</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            
            {/* --- MEALS SECTION --- */}
            <div>
                <h3 className="text-[#FCD34D] font-bold text-sm tracking-wider mb-4 uppercase">Meals</h3>
                <div className="space-y-1">
                    <CategoryLink label="All Items" active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
                    
                    {/* Filter for FOOD categories */}
                    {categories?.filter(cat => cat.type === "FOOD").map(cat => (
                        <div key={cat.id} className="group flex items-center justify-between hover:bg-gray-50 rounded-lg pr-2 transition-colors">
                            <CategoryLink 
                                label={cat.name} 
                                active={selectedCategory === cat.id} 
                                onClick={() => setSelectedCategory(cat.id)} 
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {categories?.filter(cat => cat.type === "FOOD").length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-4">No meal categories</div>
                    )}
                </div>
            </div>

            {/* --- DRINKS SECTION --- */}
            <div>
                <h3 className="text-[#FCD34D] font-bold text-sm tracking-wider mb-4 uppercase">Drink & Dessert</h3>
                <div className="space-y-1">
                    
                    {/* Filter for DRINK categories */}
                    {categories?.filter(cat => cat.type === "DRINK").map(cat => (
                        <div key={cat.id} className="group flex items-center justify-between hover:bg-gray-50 rounded-lg pr-2 transition-colors">
                            <CategoryLink 
                                label={cat.name} 
                                active={selectedCategory === cat.id} 
                                onClick={() => setSelectedCategory(cat.id)} 
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {categories?.filter(cat => cat.type === "DRINK").length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-4">No drink categories</div>
                    )}
                </div>
            </div>

            <button 
                onClick={openAddCategory}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 font-bold hover:border-[#FCD34D] hover:text-[#FCD34D] hover:bg-yellow-50 transition-all"
            >
                <FolderPlus size={18} />
                <span>Add Category</span>
            </button>
        </div>

        {/* BACK BUTTON */}
        <div className="p-6 border-t border-gray-100 bg-white">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors w-full"
            >
                <ChevronLeft size={20} />
                <span>Back to Dashboard</span>
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-20 border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
             <div className="relative w-96 bg-gray-100 rounded-full h-12 flex items-center overflow-hidden px-4">
                <Search className="text-gray-400 mr-2" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Menu" 
                    className="bg-transparent outline-none w-full text-sm font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-6">
                 <div className="text-gray-500 font-medium">{currentDate}</div>
                 <button 
                    onClick={openAddItem}
                    className="bg-[#FCD34D] hover:bg-[#fbbf24] text-black px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                 >
                    <Plus size={20} />
                    Add Item
                 </button>
             </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F3F4F6]">
             {isLoading ? <div className="p-10 text-center">Loading...</div> : (
                <div className="grid grid-cols-4 gap-6">
                    {activeItems?.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative h-40 flex flex-col items-center justify-center text-center border border-transparent hover:border-[#FCD34D]">
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openEditItem(item); }} className="p-1.5 bg-gray-100 hover:bg-[#FCD34D] rounded-md transition-colors"><Pencil size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-md transition-colors"><Trash2 size={14} /></button>
                            </div>
                            <div className="font-bold text-gray-800 mb-1">{item.name}</div>
                            <div className="text-sm text-gray-500">Rp{item.price.toLocaleString("id-ID")}</div>
                        </div>
                    ))}
                    <button onClick={openAddItem} className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FCD34D] hover:text-[#FCD34D] hover:bg-yellow-50/50 transition-all h-40">
                        <Plus size={32} />
                        <span className="font-bold text-sm mt-2">Add New Item</span>
                    </button>
                </div>
             )}
        </div>
      </main>

      {/* MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">
                        {modalType === "ITEM" ? (editingItem ? "Edit Item" : "Add New Item") : "Add New Category"}
                    </h3>
                    <button onClick={() => setModalType(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {modalType === "ITEM" && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#FCD34D]" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (Rp)</label>
                                <input required type="number" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#FCD34D]" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <select className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#FCD34D]" value={itemForm.categoryId} onChange={e => setItemForm({...itemForm, categoryId: e.target.value})}>
                                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {modalType === "CATEGORY" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Name</label>
                            <input 
                                required 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#FCD34D]" 
                                value={categoryName} 
                                onChange={e => setCategoryName(e.target.value)} 
                            />
                        </div>

                        {/* TYPE SELECTOR BUTTONS */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Group Under</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCategoryType("FOOD")}
                                    className={`p-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                                        categoryType === "FOOD" 
                                        ? "bg-[#FFFBEB] border-[#FCD34D] text-[#FCD34D]" 
                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    🍔 Meals
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategoryType("DRINK")}
                                    className={`p-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                                        categoryType === "DRINK" 
                                        ? "bg-[#FFFBEB] border-[#FCD34D] text-[#FCD34D]" 
                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    🥤 Drink & Dessert
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                    <button type="submit" disabled={isSaving} className="w-full bg-[#FCD34D] py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#fbbf24] mt-4 disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

function CategoryLink({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex-1 text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#FFFBEB] text-[#FCD34D] font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
            {label}
        </button>
    )
}