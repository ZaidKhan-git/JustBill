import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle2, AlertCircle, Download, Info, TrendingDown, Shield } from 'lucide-react';
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
  medicine: 'hsl(210 100% 50%)',
  treatment: 'hsl(150 80% 40%)',
  tests: 'hsl(260 85% 55%)',
  other: 'hsl(40 95% 55%)',
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
  const fairItems = data.items.filter(i => i.status === 'fair').length;
  const savingsPercent = ((overchargeTotal / data.totalBilled) * 100).toFixed(1);

  const comparisonData = data.items.map(item => ({
    name: item.name.split('(')[0].trim().substring(0, 12),
    billed: item.billedAmount,
    standard: item.govtRate,
  }));

  const getStatusBadge = (status: BillItem['status']) => {
    switch (status) {
      case 'fair':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> Fair</span>;
      case 'overcharged':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" /> Overcharged</span>;
      case 'suspicious':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" /> Suspicious</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">TOTAL BILLED</p>
              <p className="text-3xl font-bold text-slate-950">${data.totalBilled.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">{data.items.length} line items</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">STANDARD RATE</p>
              <p className="text-3xl font-bold text-slate-950">${data.totalFair.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">{fairItems}/{data.items.length} fair prices</p>
        </div>

        <div className={`relative overflow-hidden rounded-xl border p-6 shadow-md card-hover ${hasOvercharges ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-xs mb-1 font-medium ${hasOvercharges ? 'text-amber-700' : 'text-green-700'}`}>
                {hasOvercharges ? 'POTENTIAL OVERCHARGE' : 'FAIR PRICING'}
              </p>
              <p className={`text-3xl font-bold ${hasOvercharges ? 'text-amber-900' : 'text-green-900'}`}>
                ${overchargeTotal.toFixed(2)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${hasOvercharges ? 'bg-amber-100' : 'bg-green-100'}`}>
              <TrendingDown className={`w-5 h-5 ${hasOvercharges ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
          </div>
          <p className={`text-xs ${hasOvercharges ? 'text-amber-600' : 'text-green-600'}`}>{savingsPercent}% of total bill</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Items List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-950 text-sm">Line Items Analysis</h3>
              <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full font-medium border border-slate-200">{data.items.length} items</span>
            </div>
            
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {data.items.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="p-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-950 text-sm">{item.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-semibold text-slate-950 text-sm">${item.billedAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">std: ${item.govtRate.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {getStatusBadge(item.status)}
                    {item.status === 'overcharged' && (
                      <span className="text-xs text-amber-600 font-semibold">
                        +${(item.billedAmount - item.govtRate).toFixed(2)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts & Tax */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md">
            <h3 className="font-semibold text-slate-950 text-sm mb-4">Cost Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="white" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', background: '#ffffff' }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-md">
            <h3 className="font-semibold text-slate-950 text-sm mb-4">Tax Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">State Tax (GST)</span>
                <span className="font-semibold text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Central Tax</span>
                <span className="font-semibold text-slate-900">${(data.tax * 0.5).toFixed(2)}</span>
              </div>
              <div className="border-t border-blue-200 pt-3 flex justify-between font-bold">
                <span className="text-slate-900">Total Tax</span>
                <span className="text-blue-600">${data.tax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-md"
      >
        <h3 className="font-semibold text-slate-950 text-sm mb-4">Price Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                formatter={(value: any) => `$${Number(value).toFixed(2)}`}
              />
              <Bar dataKey="billed" fill="hsl(40 95% 55%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="standard" fill="hsl(150 80% 40%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex gap-3 justify-center"
      >
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
          <Download className="w-4 h-4" /> Download Report
        </button>
        <button className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          Share Results
        </button>
      </motion.div>
    </div>
  );
}
