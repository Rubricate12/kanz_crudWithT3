"use client";

import { useState } from "react";
import { Search, Calculator, CheckCircle2, Printer, X, Eye, Clock, XCircle } from "lucide-react";
import { api } from "@/trpc/react";

export default function OrderManagement() {
  // 1. Fetch Real Data
  const { data: orders, isLoading, refetch } = api.order.getAll.useQuery();
  
  // 2. Mutations (For cancelling orders, etc)
  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  // 3. Local State
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  
  // Modals State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null); // For Payment
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);   // For Details [NEW]

  const filters = ["All", "Pending", "Completed"]; 

  // 4. Filter Logic
  const filteredOrders = orders?.filter((order) => {
    // Tab Filter
    const matchesTab = 
        activeTab === "All" ? true : 
        activeTab === "Pending" ? order.status === "PENDING" :
        activeTab === "Completed" ? order.status === "COMPLETED" : true;

    // Search Filter (Safe conversion to string)
    const matchesSearch = order.id.toString().includes(search);

    return matchesTab && matchesSearch;
  });

  // Handle Cancel Order
  const handleCancel = (id: string) => {
    if(confirm("Are you sure you want to CANCEL this order?")) {
        updateStatus.mutate({ id, status: "CANCELLED" });
        setViewingOrder(null); // Close modal if open
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading Orders...</div>;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F5F5] p-8 overflow-hidden relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Orders</h1>
        <div className="text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-3">
            {filters.map((filter) => (
                <button
                    key={filter}
                    onClick={() => setActiveTab(filter)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                        activeTab === filter 
                        ? "bg-[#FCD34D] text-black shadow-md" 
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    {filter}
                </button>
            ))}
        </div>

        <div className="relative w-80">
            <Search className="absolute left-4 top-2.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search Order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#E5E5E5] rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FCD34D] text-sm font-medium"
            />
        </div>
      </div>

      {/* ORDER CARDS */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
        <div className="grid grid-cols-2 xl:grid-cols-2 gap-6">
            {filteredOrders?.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-4">
                    
                    {/* CARD HEADER */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-[#FCD34D] rounded-xl flex items-center justify-center font-bold text-xl text-black shadow-sm">
                                #{order.id.toString()}
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-800">Guest</div>
                                <div className="text-xs text-gray-400 font-bold tracking-wide">
                                    {order.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                        
                        {/* NEW BADGE LAYOUT */}
                        <div className="flex flex-col items-end gap-1">
                            {/* 1. Kitchen Status Badge */}
                            <StatusBadge status={order.status} />
                            
                            {/* 2. Payment Status Text */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                order.paymentMethod ? "text-green-600" : "text-orange-500"
                            }`}>
                                {order.paymentMethod ? "PAID" : "UNPAID"}
                            </span>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 pb-2"></div>

                    {/* Items List (Limited to 3 for preview) */}
                    <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm font-medium text-gray-600">
                                <span className="w-1/2">{item.menuItem.name}</span>
                                <span className="w-1/4 text-center">x{item.quantity}</span>
                                <span className="w-1/4 text-right">Rp{((item.price || item.menuItem.price) * item.quantity).toLocaleString("id-ID")}</span>
                            </div>
                        ))}
                        {order.items.length > 3 && (
                            <div className="text-xs text-center text-gray-400 italic">
                                + {order.items.length - 3} more items...
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-auto">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="font-bold text-lg text-black">Rp{order.total.toLocaleString("id-ID")}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {/* 1. SEE DETAILS BUTTON (Now working) */}
                        <button 
                            onClick={() => setViewingOrder(order)}
                            className="bg-[#D1FAE5] text-[#065F46] py-3 rounded-xl font-bold text-sm hover:bg-[#A7F3D0] transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye size={16} /> Details
                        </button>
                        
                        {/* UPDATE PAYMENT BUTTON LOGIC */}
                        <button 
                            disabled={!!order.paymentMethod} // Disable if paymentMethod exists (is not null)
                            onClick={() => setSelectedOrder(order)} 
                            className="bg-[#FCD34D] text-black py-3 rounded-xl font-bold text-sm hover:bg-[#fbbf24] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                        >
                            {order.paymentMethod ? "Paid" : "Payment"}
                        </button>
                    </div>

                </div>
            ))}
            
            {filteredOrders?.length === 0 && (
                <div className="col-span-2 text-center text-gray-400 py-10">
                    No orders found.
                </div>
            )}
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {selectedOrder && (
        <PaymentModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onSuccess={() => {
                setSelectedOrder(null);
                refetch();
            }}
        />
      )}

      {/* --- DETAILS MODAL  --- */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold">Order Details</h2>
                        <div className="text-sm text-gray-500">#{viewingOrder.id} • {new Date(viewingOrder.createdAt).toLocaleString()}</div>
                    </div>
                    <button onClick={() => setViewingOrder(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 border hover:bg-red-50"><X size={20} /></button>
                </div>

                {/* Items List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {viewingOrder.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-[#FCD34D] rounded-lg flex items-center justify-center font-bold text-sm">
                                    {item.quantity}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{item.menuItem.name}</div>
                                    <div className="text-xs text-gray-400">Rp{item.menuItem.price.toLocaleString("id-ID")}</div>
                                </div>
                            </div>
                            <div className="font-bold">
                                Rp{((item.price || item.menuItem.price) * item.quantity).toLocaleString("id-ID")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-bold">Total</span>
                        <span className="text-2xl font-bold">Rp{viewingOrder.total.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        {viewingOrder.status === "PENDING" && (
                            <button 
                                onClick={() => handleCancel(viewingOrder.id.toString())}
                                className="flex-1 py-3 border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle size={18}/> Cancel Order
                            </button>
                        )}
                        <button className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                            <Printer size={18}/> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        "COMPLETED": "bg-[#D1FAE5] text-[#065F46]", // Ready/Done look
        "PENDING": "bg-[#FEF3C7] text-[#92400E]", // Cooking look
        "CANCELLED": "bg-red-100 text-red-600",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
}

// --- PAYMENT MODAL (Your Existing Component) ---
function PaymentModal({ order, onClose, onSuccess }: { order: any, onClose: () => void, onSuccess: () => void }) {
    const [step, setStep] = useState<"SUMMARY" | "METHOD" | "AMOUNT" | "SUCCESS">("SUMMARY");
    const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER" | null>(null);
    const [cashAmount, setCashAmount] = useState("");

    const payOrderMutation = api.order.payOrder.useMutation({
        onSuccess: () => setStep("SUCCESS")
    });

    const totalAmount = order.total;
    const cashGiven = parseInt(cashAmount.replace(/\./g, "") || "0");
    const change = cashGiven - totalAmount;
    const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

    const handlePayment = (selectedMethod: "CASH" | "CARD" | "TRANSFER") => {
        setMethod(selectedMethod);
        if (selectedMethod === "CASH") {
            setStep("AMOUNT");
        } else {
            payOrderMutation.mutate({ orderId: order.id, paymentMethod: selectedMethod });
        }
    };

    const handleCashPayment = () => {
        if (cashGiven < totalAmount) {
            alert("Not enough cash!");
            return;
        }
        payOrderMutation.mutate({ orderId: order.id, paymentMethod: "CASH" });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {step !== "SUCCESS" && (
                    <div className="relative p-6 text-center border-b border-gray-100">
                        <h2 className="text-2xl font-bold">
                            {step === "SUMMARY" ? "Pay Order" : step === "METHOD" ? "Select Payment Method" : "Enter Amount"}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">#Order {order.id}</p>
                        <button onClick={onClose} className="absolute right-6 top-6 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"><X size={16} strokeWidth={3} /></button>
                    </div>
                )}
                <div className="p-8">
                    {step === "SUMMARY" && (
                        <div className="animate-in slide-in-from-left-4 duration-300">
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm font-medium text-gray-700">
                                        <span className="w-1/2">{item.menuItem?.name || "Item"}</span>
                                        <span className="w-1/4 text-center">{item.quantity}</span>
                                        <span className="w-1/4 text-right">{((item.menuItem?.price || 0) * item.quantity).toLocaleString("id-ID")}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 my-6"></div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold text-gray-600">Total</span>
                                <span className="text-2xl font-bold text-black">{fmt(totalAmount)}</span>
                            </div>
                            <button onClick={() => setStep("METHOD")} className="w-full py-4 bg-[#FCD34D] rounded-xl text-xl font-bold shadow-lg hover:bg-[#fbbf24] active:scale-95 transition-all">Pay</button>
                        </div>
                    )}
                    {step === "METHOD" && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <PaymentButton label="Cash" onClick={() => handlePayment("CASH")} />
                            <PaymentButton label="Debit/Credit Card" onClick={() => handlePayment("CARD")} />
                            <PaymentButton label="Transfer" onClick={() => handlePayment("TRANSFER")} />
                            <button onClick={() => setStep("SUMMARY")} className="w-full py-4 mt-4 text-gray-400 font-bold hover:text-black transition-colors">← Back</button>
                        </div>
                    )}
                    {step === "AMOUNT" && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-2"><Calculator className="text-[#FCD34D]" /><span className="font-bold text-[#000080]">Enter Cash Amount</span></div>
                            <input type="number" autoFocus value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Rp." className="w-full border border-gray-300 rounded-xl px-4 py-4 text-xl outline-none focus:border-[#FCD34D] mb-8" />
                            {cashGiven > 0 && <div className="mb-4 text-right text-sm font-bold text-gray-500">Change: <span className={change < 0 ? "text-red-500" : "text-green-500"}>{fmt(change)}</span></div>}
                            <button onClick={handleCashPayment} disabled={!cashAmount || cashGiven < totalAmount || payOrderMutation.isPending} className="w-full py-4 bg-[#FCD34D] rounded-full text-xl font-bold shadow-lg hover:bg-[#fbbf24] disabled:opacity-50 transition-all">{payOrderMutation.isPending ? "Processing..." : "Pay"}</button>
                        </div>
                    )}
                    {step === "SUCCESS" && (
                        <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300 py-4">
                            <div className="h-20 w-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-green-200 shadow-xl"><CheckCircle2 size={48} strokeWidth={3} /></div>
                            <h2 className="text-3xl font-bold text-[#000080] mb-2">Payment Successful!</h2>
                            <div className="flex items-center gap-2 text-gray-500 mb-8 w-full justify-center"><span>Order</span><div className="h-[1px] bg-gray-300 w-24"></div><span>#{order.id}</span></div>
                            <div className="w-full space-y-3 mb-8">
                                <div className="flex justify-between text-gray-500"><span>Total</span><span className="font-bold text-gray-700">{fmt(totalAmount)}</span></div>
                                {method === "CASH" ? (
                                    <>
                                        <div className="flex justify-between text-gray-500"><span>Cash Received</span><span className="font-bold text-gray-700">{fmt(cashGiven)}</span></div>
                                        <div className="flex justify-between text-gray-500"><span>Change</span><span className="font-bold text-green-600">{fmt(change)}</span></div>
                                    </>
                                ) : (
                                    <div className="flex justify-between text-gray-500"><span>Method</span><span className="font-bold text-gray-700">{method}</span></div>
                                )}
                            </div>
                            <div className="flex gap-4 w-full">
                                <button onClick={onSuccess} className="flex-1 py-3 bg-[#FCD34D] rounded-xl font-bold text-white shadow-md hover:bg-[#fbbf24] transition-all">OK</button>
                                <button className="px-5 py-3 bg-[#FCD34D] rounded-xl text-white shadow-md"><Printer size={24} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PaymentButton({ label, onClick }: { label: string, onClick: () => void }) {
    return <button onClick={onClick} className="w-full py-4 bg-[#FCD34D] rounded-xl text-2xl font-bold text-white shadow-md hover:bg-[#fbbf24] active:scale-95 transition-all">{label}</button>
}