"use client";

import { useState } from "react"; // Import useState
import { api } from "@/trpc/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import IncomeDetails from "./IncomeDetails"; // Import the new component

export default function IncomeReport() {
  const { data, isLoading } = api.order.getIncomeReport.useQuery();
  
  // 1. STATE FOR NAVIGATION
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading || !data) return <div className="p-10 text-center">Loading Report...</div>;

  // 2. RENDER DETAILS IF STATE IS TRUE
  if (showDetails) {
      return <IncomeDetails onBack={() => setShowDetails(false)} />;
  }

  // --- EXISTING CHART CODE BELOW ---
  const pieData = [
    { name: 'Achieved', value: data.target.current },
    { name: 'Remaining', value: data.target.total - data.target.current },
  ];
  const COLORS = ['#FCD34D', '#E5E7EB']; 

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F5F5] p-8 overflow-y-auto">
      
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Income Report</h1>

      {/* --- TOP ROW --- */}
      <div className="flex gap-6 mb-8 h-[400px]">
        
        {/* Main Chart */}
        <div className="flex-[2] bg-[#FCD34D] p-6 rounded-3xl shadow-sm flex flex-col">
            <h2 className="text-center font-serif text-lg text-slate-800 mb-4">Pendapatan dan Target per Bulan</h2>
            <div className="flex-1 bg-white rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} tick={{fontSize: 12}} />
                        <YAxis tickFormatter={(val: any) => `Rp${val/1000000}M`} tick={{fontSize: 10}} />
                        <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`} />
                        <Legend />
                        <Bar dataKey="income" name="Pendapatan" barSize={20} fill="#0F4C75" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="target" name="Target" stroke="#FF5722" strokeWidth={3} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Target Donut */}
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center relative">
            <div className="absolute top-6 right-6 bg-[#E8E87B] text-[#5A5A30] px-4 py-1 rounded-lg font-bold text-sm">
                Our Target
            </div>
            
            <div className="relative w-64 h-64 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            innerRadius={80}
                            outerRadius={110}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-5xl font-bold text-black">{data.target.percentage}%</span>
                </div>
            </div>

            <div className="mt-4 text-center">
                <div className="text-xs text-gray-400 font-bold mb-1">Status</div>
                <div className="text-sm font-bold text-gray-800">
                    Rp {data.target.current.toLocaleString("id-ID")} / Rp {data.target.total.toLocaleString("id-ID")}
                </div>
            </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: SUMMARY CARDS --- */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pass the toggle function to the button */}
        <SummaryCard 
            title="Days" 
            label="04" 
            stats={data.stats.day} 
            onDetails={() => setShowDetails(true)} 
        />
        <SummaryCard 
            title="Weeks" 
            label="03" 
            stats={data.stats.week} 
            color="bg-[#E4A583]" 
            onDetails={() => setShowDetails(true)}
        />
        <SummaryCard 
            title="Year" 
            label="2025" 
            stats={data.stats.year} 
            color="bg-[#E8E87B]" 
            onDetails={() => setShowDetails(true)}
        />
      </div>

    </div>
  );
}

// 3. UPDATE CARD TO ACCEPT ONCLICK
function SummaryCard({ title, label, stats, color = "bg-[#E8E87B]", onDetails }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className={`${color} px-4 py-2 rounded-xl font-bold text-xl text-slate-800`}>
                    {label}
                </div>
                <div className={`${color} px-6 py-2 rounded-xl font-bold text-lg text-slate-800`}>
                    {title}
                </div>
            </div>

            <h3 className="text-gray-500 font-bold mb-4">Pemasukan</h3>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-400 w-1/3">Items</span>
                    <span className="font-bold text-gray-400 w-1/3 text-center">Qty</span>
                    <span className="font-bold text-gray-400 w-1/3 text-right">Income</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span className="w-1/3">Makanan</span>
                    <span className="w-1/3 text-center">{stats.foodQty}</span>
                    <span className="w-1/3 text-right">Rp {stats.foodIncome.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span className="w-1/3">Minuman</span>
                    <span className="w-1/3 text-center">{stats.drinkQty}</span>
                    <span className="w-1/3 text-right">Rp {stats.drinkIncome.toLocaleString("id-ID")}</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-dashed border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-lg text-black">Rp {stats.total.toLocaleString("id-ID")}</span>
            </div>

            <button 
                onClick={onDetails}
                className="w-full bg-[#D1FAE5] text-[#065F46] py-3 rounded-xl font-bold text-sm hover:bg-[#A7F3D0] transition-colors mt-auto"
            >
                See Details
            </button>
        </div>
    )
}