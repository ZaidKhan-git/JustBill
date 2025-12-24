import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle2, AlertCircle, Download, Info } from 'lucide-react';
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
  medicine: 'hsl(200 100% 50%)',
  treatment: 'hsl(162 72% 42%)',
  tests: 'hsl(220 90% 56%)',
  other: 'hsl(38 92% 50%)',
};

export function AnalysisResult({ data }: AnalysisResultProps) {
  const chartData = [
    { name: 'Medicines', value: data.items.filter(i => i.category === 'Medicine').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.medicine },
    { name: 'Treatments', value: data.items.filter(i => i.category === 'Treatment').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.treatment },
    { name: 'Tests', value: data.items.filter(i => i.category === 'Test').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.tests },
    { name: 'Other', value: data.items.filter(i => i.category === 'Other').reduce((acc, i) => acc + i.billedAmount, 0), color: COLORS.other },
  ].filter(d => d.value > 0);

  const overchargeTotal = data.items.reduce((acc, item) => item.status === 'overcharged' ? acc + (item.billedAmount - item.govtRate) : acc, 0);
  const hasOvercharges = overchargeTotal > 0;

  const getStatusBadge = (status: BillItem['status']) => {
    switch (status) {
      case 'fair':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3" /> Fair</span>;
      case 'overcharged':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3" /> Overcharged</span>;
      case 'suspicious':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700"><AlertCircle className="w-3 h-3" /> Suspicious</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{data.hospitalName}</h2>
            <p className="text-sm text-slate-500">Billed: {data.date}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600 mb-1 font-medium">TOTAL BILLED</p>
            <p className="text-2xl font-semibold text-slate-950">${data.totalBilled.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600 mb-1 font-medium">STANDARD RATE</p>
            <p className="text-2xl font-semibold text-slate-950">${data.totalFair.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg border ${hasOvercharges ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-xs mb-1 font-medium ${hasOvercharges ? 'text-amber-700' : 'text-green-700'}`}>
              {hasOvercharges ? 'POTENTIAL OVERCHARGE' : 'FAIR PRICING'}
            </p>
            <p className={`text-2xl font-semibold ${hasOvercharges ? 'text-amber-700' : 'text-green-700'}`}>
              ${overchargeTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-950 text-sm">Line Items</h3>
              <span className="text-xs text-slate-500">{data.items.length} items</span>
            </div>
            
            <div className="divide-y divide-slate-200">
              {data.items.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-slate-950 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950 text-sm">${item.billedAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">std: ${item.govtRate.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {getStatusBadge(item.status)}
                    {item.status === 'overcharged' && (
                      <span className="text-xs text-amber-600 font-medium">
                        +${(item.billedAmount - item.govtRate).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts & Tax */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-950 text-sm mb-4">Cost Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-950 text-sm mb-4">Tax Calculation</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">State Tax</span>
                <span className="font-medium text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Central Tax</span>
                <span className="font-medium text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-semibold">
                <span className="text-slate-900">Total Tax</span>
                <span className="text-primary">${data.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex gap-2">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Calculated per medical goods exemption classification.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
