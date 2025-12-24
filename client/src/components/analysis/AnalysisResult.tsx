import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, Info, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillItem {
  id: string;
  name: string;
  category: string;
  billedAmount: number;
  govtRate: number;
  status: 'fair' | 'overcharged' | 'suspicious' | 'undercharged';
  notes?: string;
}

interface AnalysisResultProps {
  data: {
    hospitalName: string;
    date: string;
    items: BillItem[];
    totalBilled: number;
    totalFair: number;
    tax: number;
  };
}

const COLORS = {
  medicine: 'hsl(213 94% 58%)',   // Primary Blue
  treatment: 'hsl(170 70% 45%)',  // Teal
  tests: 'hsl(240 60% 65%)',      // Indigo
  other: 'hsl(40 90% 60%)',       // Orange
};

export function AnalysisResult({ data }: AnalysisResultProps) {
  const chartData = [
    { name: 'Medicines', value: data.items.filter(i => i.category === 'Medicine').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.medicine },
    { name: 'Treatments', value: data.items.filter(i => i.category === 'Treatment').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.treatment },
    { name: 'Tests', value: data.items.filter(i => i.category === 'Test').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.tests },
    { name: 'Other', value: data.items.filter(i => i.category === 'Other').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.other },
  ].filter(d => d.value > 0);

  const getStatusBadge = (status: BillItem['status']) => {
    switch (status) {
      case 'fair':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> Fair Price</span>;
      case 'overcharged':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3" /> Overcharged</span>;
      case 'suspicious':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Suspicious</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">{data.hospitalName}</h2>
            <p className="text-sm text-slate-500">Bill Date: {data.date} • ID: #MED-2024-8892</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Total Billed Amount</p>
            <p className="text-3xl font-display font-bold text-slate-900">${data.totalBilled.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-600 mb-1">Govt. Standard Rate</p>
            <p className="text-3xl font-display font-bold text-blue-700">${data.totalFair.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-xl border ${data.totalBilled > data.totalFair ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
            <p className={`text-sm mb-1 ${data.totalBilled > data.totalFair ? 'text-amber-700' : 'text-green-700'}`}>
              {data.totalBilled > data.totalFair ? 'Potential Overcharge' : 'Savings'}
            </p>
            <p className={`text-3xl font-display font-bold ${data.totalBilled > data.totalFair ? 'text-amber-700' : 'text-green-700'}`}>
              ${Math.abs(data.totalBilled - data.totalFair).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Itemized List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Itemized Breakdown</h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                {data.items.length} Items
              </span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {data.items.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900 flex items-center gap-2">
                        {item.name}
                        {item.notes && <Info className="w-3 h-3 text-slate-400" />}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${item.billedAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Govt: ${item.govtRate.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    {getStatusBadge(item.status)}
                    {item.status === 'overcharged' && (
                      <span className="text-xs text-amber-600 font-medium">
                        +${(item.billedAmount - item.govtRate).toFixed(2)} excess
                      </span>
                    )}
                  </div>
                  
                  {/* Expansion for details (Visual only for now) */}
                  <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-300">
                    <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      Comparison based on Regional Health Authority Pricing Index 2024.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts & Tax */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Cost Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Tax Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">State Tax (GST)</span>
                <span className="font-medium text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Central Tax</span>
                <span className="font-medium text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-semibold">
                <span className="text-slate-900">Total Tax</span>
                <span className="text-primary">${data.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg text-xs text-blue-700">
              <Info className="w-3 h-3 inline mr-1 mb-0.5" />
              Tax calculated based on medical goods & services category exemption list.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
