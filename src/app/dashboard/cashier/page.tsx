"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "@/trpc/react"; // <--- Import tRPC
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ClipboardList, 
  BarChart3, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  X,
  Calculator, 
  CheckCircle2, 
  Printer 
} from "lucide-react";
import PosSystem from "@/components/pos/PosSystem";

export default function CashierDashboard() {
  const { data: session } = useSession();
  
  // 1. FETCH REAL DATA
  const { data, refetch } = api.order.getDashboardData.useQuery();

  // VIEW STATE
  const [view, setView] = useState<"DASHBOARD" | "POS">("DASHBOARD");

  // MODAL STATE: Store the entire order object so we have items/price
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  if (view === "POS") {
    // Refetch dashboard when coming back from POS to see new orders
    return <PosSystem onCancel={() => { setView("DASHBOARD"); refetch(); }} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] font-sans text-slate-800 relative">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white flex flex-col border-r border-gray-100 sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs text-center leading-none">
                KANZ<br/>COFFEE
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Kanz Coffee<br/>& Eatery</h1>
            </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
            <NavItem icon={<MenuIcon size={20}/>} label="Menu" />
            <NavItem icon={<ClipboardList size={20}/>} label="Order" />
            <NavItem icon={<BarChart3 size={20}/>} label="Income Report" />
        </nav>
        <div className="p-8">
            <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors font-medium"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
      </aside>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <div className="text-xl font-bold">Good Morning, {session?.user?.name}</div>
            <div className="text-gray-500 font-medium">Sunday, 30 November 2025</div>
        </header>

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard title="New Orders" value={data?.stats.newOrders.toString() || "0"} />
            <StatCard title="Total Orders" value={data?.stats.totalOrders.toString() || "0"} />
            <StatCard 
                title="Income" 
                value={`Rp ${(data?.stats.income || 0).toLocaleString("id-ID")}`} 
            />
            
            <button 
                onClick={() => setView("POS")}
                className="bg-[#FCD34D] rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-sm hover:bg-[#fbbf24] hover:shadow-md transition-all active:scale-95"
            >
                <Plus size={24} />
                New Order
            </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT: Recent Order History */}
            <div className="col-span-5 bg-white p-6 rounded-3xl shadow-sm">
                <h2 className="font-bold text-xl mb-6">Order List</h2>
                <div className="space-y-4">
                    {/* DYNAMIC LIST */}
                    {data?.recentOrders.map((order) => (
                         <OrderRow 
                            key={order.id}
                            id={`#${order.id}`} 
                            name={`Guest`} // You can add Customer Name to DB later
                            status={order.status === "COMPLETED" ? "Paid" : "Unpaid"} 
                            items={`${order.items.length} Items`} 
                            badge={order.status}
                            badgeColor={order.status === "COMPLETED" ? "bg-blue-50 text-blue-600" : "bg-yellow-100 text-yellow-700"}
                         />
                    ))}
                    {data?.recentOrders.length === 0 && <p className="text-gray-400">No recent orders</p>}
                </div>
            </div>

            {/* MIDDLE: Unpaid Orders (Click to Pay) */}
            <div className="col-span-4 bg-white p-6 rounded-3xl shadow-sm">
                <h2 className="font-bold text-xl mb-6">Payment</h2>
                <div className="space-y-4">
                    {/* DYNAMIC LIST */}
                    {data?.unpaidOrders.map((order) => (
                        <PaymentRow 
                            key={order.id}
                            id={`P${order.id}`} 
                            name="Guest" 
                            orderId={`#Order ${order.id}`} 
                            onPay={() => setSelectedOrder(order)} // <-- Pass FULL order object
                        />
                    ))}
                    {data?.unpaidOrders.length === 0 && <p className="text-gray-400">No unpaid orders</p>}
                </div>
            </div>

            {/* RIGHT: Out of Stock (Static for now) */}
            <div className="col-span-3 bg-white p-6 rounded-3xl shadow-sm h-fit">
                <h2 className="font-bold text-xl mb-6">Out of Stock</h2>
                <ul className="space-y-4">
                    <StockItem name="Vanilla Cookies Cream" />
                    <StockItem name="Cireng" />
                </ul>
            </div>
        </div>
      </main>

      {/* --- POPUP MODAL --- */}
      {selectedOrder && (
        <PaymentModal 
            order={selectedOrder} // Pass full object
            onClose={() => setSelectedOrder(null)}
            onSuccess={() => {
                setSelectedOrder(null);
                refetch(); // Refresh data after payment
            }}
        />
      )}

    </div>
  );
}

// --- UPDATED PAYMENT MODAL ---

function PaymentModal({ order, onClose, onSuccess }: { order: any, onClose: () => void, onSuccess: () => void }) {
    const [step, setStep] = useState<"SUMMARY" | "METHOD" | "AMOUNT" | "SUCCESS">("SUMMARY");
    const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER" | null>(null);
    const [cashAmount, setCashAmount] = useState("");

    // Mutation to save payment
    const payOrderMutation = api.order.payOrder.useMutation({
        onSuccess: () => {
            // Move to success screen only after DB updates
            setStep("SUCCESS");
        }
    });

    const totalAmount = order.total;
    const cashGiven = parseInt(cashAmount.replace(/\./g, "") || "0");
    const change = cashGiven - totalAmount;
    const fmt = (n: number) => "Rp" + n.toLocaleString("id-ID");

    const handlePayment = (selectedMethod: "CASH" | "CARD" | "TRANSFER") => {
        setMethod(selectedMethod);
        if (selectedMethod === "CASH") {
            setStep("AMOUNT");
        } else {
            // For Card/Transfer, pay immediately
            payOrderMutation.mutate({ 
                orderId: order.id, 
                paymentMethod: selectedMethod 
            });
        }
    };

    const handleCashPayment = () => {
        payOrderMutation.mutate({ 
            orderId: order.id, 
            paymentMethod: "CASH" 
        });
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
                        <button onClick={onClose} className="absolute right-6 top-6 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                            <X size={16} strokeWidth={3} />
                        </button>
                    </div>
                )}

                <div className="p-8">
                    {/* 1. SUMMARY */}
                    {step === "SUMMARY" && (
                        <div className="animate-in slide-in-from-left-4 duration-300">
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {/* DYNAMIC RECEIPT ITEMS */}
                                {order.items.map((item: any) => (
                                    <ReceiptItem 
                                        key={item.id}
                                        name={item.menuItem?.name || "Item"} 
                                        qty={item.quantity} 
                                        price={((item.menuItem?.price || 0) * item.quantity).toLocaleString("id-ID")} 
                                    />
                                ))}
                            </div>
                            <div className="border-t border-gray-200 my-6"></div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold text-gray-600">Total</span>
                                <span className="text-2xl font-bold text-black">{fmt(totalAmount)}</span>
                            </div>
                            <button onClick={() => setStep("METHOD")} className="w-full py-4 bg-[#FCD34D] rounded-xl text-xl font-bold shadow-lg hover:bg-[#fbbf24] active:scale-95 transition-all">
                                Pay
                            </button>
                        </div>
                    )}

                    {/* 2. METHOD */}
                    {step === "METHOD" && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <PaymentButton label="Cash" onClick={() => handlePayment("CASH")} />
                            <PaymentButton label="Debit/Credit Card" onClick={() => handlePayment("CARD")} />
                            <PaymentButton label="Transfer" onClick={() => handlePayment("TRANSFER")} />
                            <button onClick={() => setStep("SUMMARY")} className="w-full py-4 mt-4 text-gray-400 font-bold hover:text-black transition-colors">← Back</button>
                        </div>
                    )}

                    {/* 3. CASH AMOUNT */}
                    {step === "AMOUNT" && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <input 
                                type="number" autoFocus value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                                placeholder="Rp." className="w-full border border-gray-300 rounded-xl px-4 py-4 text-xl outline-none focus:border-[#FCD34D] mb-8"
                            />
                            <button 
                                onClick={handleCashPayment}
                                disabled={!cashAmount || cashGiven < totalAmount || payOrderMutation.isPending}
                                className="w-full py-4 bg-[#FCD34D] rounded-full text-xl font-bold shadow-lg hover:bg-[#fbbf24] disabled:opacity-50 transition-all"
                            >
                                {payOrderMutation.isPending ? "Processing..." : "Pay"}
                            </button>
                        </div>
                    )}

                    {/* 4. SUCCESS */}
                    {step === "SUCCESS" && (
                        <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300 py-4">
                            <div className="h-20 w-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-green-200 shadow-xl">
                                <CheckCircle2 size={48} strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-bold text-[#000080] mb-2">Payment Successful!</h2>
                            <div className="flex items-center gap-2 text-gray-500 mb-8 w-full justify-center">
                                <span>Order</span><div className="h-[1px] bg-gray-300 w-24"></div><span>#{order.id}</span>
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

// --- SUB COMPONENTS (Visuals) ---

function PaymentButton({ label, onClick }: { label: string, onClick: () => void }) {
    return <button onClick={onClick} className="w-full py-4 bg-[#FCD34D] rounded-xl text-2xl font-bold text-white shadow-md hover:bg-[#fbbf24] active:scale-95 transition-all">{label}</button>
}

function ReceiptItem({ name, qty, price }: any) {
    return <div className="flex justify-between items-center text-sm font-medium text-gray-700"><span className="w-1/2">{name}</span><span className="w-1/4 text-center">{qty}</span><span className="w-1/4 text-right">Rp {price}</span></div>
}

function PaymentRow({ id, name, orderId, onPay }: any) {
    return <div className="flex items-center justify-between p-2"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-[#FCD34D] rounded-xl flex items-center justify-center font-bold text-lg">{id}</div><div><div className="font-bold">{name}</div><div className="text-xs text-gray-400">{orderId}</div></div></div><button onClick={onPay} className="bg-[#F4A261] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors shadow-sm">Pay Now →</button></div>
}

function NavItem({ icon, label, active = false }: any) { return <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-[#FCD34D] font-bold text-black' : 'text-gray-500 hover:bg-gray-50'}`}>{icon}<span>{label}</span></div> }
function StatCard({ title, value }: any) { return <div className="bg-[#F4A261] p-6 rounded-2xl text-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group"><div className="absolute -right-4 -bottom-4 bg-white/10 h-24 w-24 rounded-full group-hover:scale-110 transition-transform" /><div className="flex justify-between items-start relative z-10"><span className="font-medium text-white/90">{title}</span><Bell size={20} className="text-white/80" /></div><div className="text-3xl font-bold relative z-10">{value}</div></div> }
function OrderRow({ id, name, status, items, badge, badgeColor = "bg-green-100 text-green-700" }: any) { return <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-[#FCD34D] rounded-xl flex items-center justify-center font-bold text-lg">{id}</div><div><div className="font-bold flex items-center gap-2">{name} <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wide font-extrabold">{status}</span></div><div className="text-xs text-gray-400">{items}</div></div></div><span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>{badge}</span></div> }
function StockItem({ name }: any) { return <li className="text-sm font-medium text-gray-600 pb-3 border-b border-gray-100 last:border-0">{name}</li> }