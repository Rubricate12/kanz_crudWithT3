"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChevronLeft } from "lucide-react";
import { api } from "@/trpc/react"; // 1. Import API

export default function IncomeDetails({ onBack }: { onBack: () => void }) {
  
  // 2. Fetch Real Data
  const { data: transactions, isLoading } = api.order.getTransactions.useQuery();

  if (isLoading) return <div className="p-10 text-center">Loading Data...</div>;

  // 3. Calculate Stats dynamically
  const totalRevenue = transactions?.reduce((sum, t) => sum + t.income, 0) || 0;
  const totalFood = transactions?.reduce((sum, t) => sum + t.foodCount, 0) || 0;
  const totalDrink = transactions?.reduce((sum, t) => sum + t.drinkCount, 0) || 0;

  const PIE_DATA = [
    { name: "Makanan", value: totalFood, color: "#1F5F78" }, 
    { name: "Minuman", value: totalDrink, color: "#E07A5F" }, 
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F5F5] p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button 
            onClick={onBack}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm"
        >
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-slate-800">Income Days Report</h1>
      </div>

      {/* TOP ROW */}
      <div className="flex gap-6 mb-8">
        
        {/* LEFT CARD: SUMMARY */}
        <div className="w-1/3 bg-white p-6 rounded-3xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="bg-[#FCD34D] px-4 py-2 rounded-xl font-bold text-xl text-slate-800">
                    All
                </div>
                <div className="bg-[#FCD34D] px-6 py-2 rounded-xl font-bold text-lg text-slate-800">
                    History
                </div>
            </div>

            <h3 className="text-gray-500 font-bold mb-4">Pemasukan</h3>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm font-medium">
                    <span className="w-1/3 text-gray-600">Makanan</span>
                    <span className="w-1/3 text-center">{totalFood}</span>
                    <span className="w-1/3 text-right">--</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span className="w-1/3 text-gray-600">Minuman</span>
                    <span className="w-1/3 text-center">{totalDrink}</span>
                    <span className="w-1/3 text-right">--</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-dashed border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-lg text-black">Rp {totalRevenue.toLocaleString("id-ID")}</span>
            </div>
        </div>

        {/* RIGHT CARD: PIE CHART */}
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center relative">
             <div className="absolute top-6 bg-[#E8E87B] text-[#5A5A30] px-6 py-2 rounded-xl font-bold text-sm">
                Sales Distribution
            </div>

            <div className="w-full h-64 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={PIE_DATA}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                        >
                            {PIE_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* BOTTOM ROW: TRANSACTION LIST */}
      <div className="bg-white p-8 rounded-3xl shadow-sm">
        
        <div className="flex justify-end mb-6">
            <div className="bg-[#E4A583] px-6 py-2 rounded-xl font-bold text-slate-800 shadow-sm">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        <div className="bg-[#D1FAE5] rounded-xl py-3 px-6 flex justify-between items-center mb-6 font-bold text-gray-700">
            <span>Total Revenue:</span>
            <span>Rp {totalRevenue.toLocaleString("id-ID")}</span>
        </div>

        {/* Dynamic Table */}
        <table className="w-full">
            <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-100">
                    <th className="text-left pb-4 font-bold">Name</th>
                    <th className="text-center pb-4 font-bold">Qty</th>
                    <th className="text-right pb-4 font-bold">Income</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {transactions?.map((t) => (
                    <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-medium text-gray-700">{t.name}</td>
                        <td className="py-4 text-center text-gray-600">{t.qty} items</td>
                        <td className="py-4 text-right text-gray-600">Rp {t.income.toLocaleString("id-ID")}</td>
                    </tr>
                ))}
            </tbody>
        </table>

      </div>

    </div>
  );
}