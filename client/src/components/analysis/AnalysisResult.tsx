import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, Download, TrendingDown, Shield, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { JargonChip } from './JargonChip';
import { JargonBusterDrawer } from './JargonBusterDrawer';
import { AnimatedGradient } from '@/components/ui/animated-gradient-with-svg';

interface BillItem {
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalBilled: number;
  govtCeilingPrice: number | null;
  overchargeAmount: number;
  status: 'fair' | 'overcharged' | 'suspicious' | 'not_found';
  priceSource: string | null;
  sourceDate: string | null;
  notes?: string;
}

interface AnalysisResultProps {
  data: {
    id: string;
    hospitalName: string;
    billDate: string;
    billNumber?: string;
    state: { name: string; tier: number };
    summary: {
      totalBilled: number;
      totalFairPrice: number;
      overchargeAmount: number;
      discount: number;
      cgst: number;
      sgst: number;
      itemCount: number;
      overchargedCount: number;
      fairCount: number;
      notFoundCount: number;
      savingsPercent: number;
    };
    items: BillItem[];
    ocrConfidence: number;
  };
}

const COLORS = {
  medicine: 'hsl(210 100% 50%)',
  treatment: 'hsl(150 80% 40%)',
  test: 'hsl(260 85% 55%)',
  room: 'hsl(40 95% 55%)',
  consultation: 'hsl(320 70% 50%)',
  nursing: 'hsl(180 60% 45%)',
  consumable: 'hsl(30 90% 55%)',
  other: 'hsl(0 0% 60%)',
};

export function AnalysisResult({ data }: AnalysisResultProps) {
  const { summary, items, hospitalName, billDate, state } = data;

  // Jargon Buster state
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleExplainTerm = (term: string) => {
    setSelectedTerm(term);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Build chart data by category
  const categoryTotals: Record<string, number> = {};
  items.forEach(item => {
    const cat = item.category.toLowerCase();
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.totalBilled;
  });

  const chartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || COLORS.other,
    }))
    .filter(d => d.value > 0);

  const hasOvercharges = summary.overchargeAmount > 0;

  // Comparison chart data
  const comparisonData = items
    .filter(item => item.govtCeilingPrice !== null)
    .slice(0, 6)
    .map(item => ({
      name: item.itemName.split('(')[0].trim().substring(0, 15),
      billed: item.unitPrice,
      standard: item.govtCeilingPrice,
    }));

  const getStatusBadge = (status: BillItem['status']) => {
    switch (status) {
      case 'fair':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Fair
          </span>
        );
      case 'overcharged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
            <AlertCircle className="w-3 h-3" /> Overcharged
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" /> Suspicious
          </span>
        );
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
            <HelpCircle className="w-3 h-3" /> No Reference
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 relative">
      {/* Animated Background - Fixed Full Screen */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <AnimatedGradient
          colors={["#3B82F6", "#60A5FA", "#93C5FD", "#A5B4FC"]}
          speed={0.05}
          blur="medium"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-md"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{hospitalName}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {billDate}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 rounded">
                {state.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">OCR Confidence</p>
            <p className="text-lg font-semibold text-slate-900">{data.ocrConfidence}%</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">TOTAL BILLED</p>
              <p className="text-3xl font-bold text-slate-950">{formatCurrency(summary.totalBilled)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">{summary.itemCount} line items</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">FAIR PRICE (GOVT RATES)</p>
              <p className="text-3xl font-bold text-slate-950">{formatCurrency(summary.totalFairPrice)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">{summary.fairCount} items at fair price</p>
        </div>

        <div className={`relative overflow-hidden rounded-xl border p-6 shadow-md ${hasOvercharges ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-xs mb-1 font-medium ${hasOvercharges ? 'text-amber-700' : 'text-green-700'}`}>
                {hasOvercharges ? 'POTENTIAL OVERCHARGE' : 'FAIR PRICING'}
              </p>
              <p className={`text-3xl font-bold ${hasOvercharges ? 'text-amber-900' : 'text-green-900'}`}>
                {formatCurrency(summary.overchargeAmount)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${hasOvercharges ? 'bg-amber-100' : 'bg-green-100'}`}>
              <TrendingDown className={`w-5 h-5 ${hasOvercharges ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
          </div>
          <p className={`text-xs ${hasOvercharges ? 'text-amber-600' : 'text-green-600'}`}>
            {summary.overchargedCount} items above ceiling price
          </p>
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
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{summary.fairCount} Fair</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{summary.overchargedCount} Overcharged</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{summary.notFoundCount} No Ref</span>
              </div>
            </div>

            <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                  className={`p-4 hover:bg-slate-50/50 transition-colors ${item.status === 'overcharged' || item.status === 'suspicious' ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <JargonChip term={item.itemName} onExplain={handleExplainTerm} />
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="capitalize">{item.category}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-semibold text-slate-950 text-sm">{formatCurrency(item.totalBilled)}</p>
                      {item.govtCeilingPrice && (
                        <p className="text-xs text-slate-400">
                          Ceiling: {formatCurrency(item.govtCeilingPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price breakdown and source */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      {item.priceSource && item.sourceDate && (
                        <span className="text-blue-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {item.priceSource} (Published: {item.sourceDate})
                        </span>
                      )}
                    </div>
                    {(item.status === 'overcharged' || item.status === 'suspicious') && (
                      <span className={`font-semibold ${item.status === 'suspicious' ? 'text-red-600' : 'text-amber-600'}`}>
                        +{formatCurrency(item.overchargeAmount)}
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">{item.notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts & Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Pie Chart */}
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
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {chartData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-md">
            <h3 className="font-semibold text-slate-950 text-sm mb-4">Bill Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(summary.totalBilled - summary.cgst - summary.sgst + summary.discount)}</span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCurrency(summary.discount)}</span>
                </div>
              )}
              {(summary.cgst > 0 || summary.sgst > 0) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CGST</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(summary.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">SGST</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(summary.sgst)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-blue-200 pt-3 flex justify-between font-bold">
                <span className="text-slate-900">Total Billed</span>
                <span className="text-blue-600">{formatCurrency(summary.totalBilled)}</span>
              </div>
              {hasOvercharges && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Potential Overcharge</span>
                  <span>{formatCurrency(summary.overchargeAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison Chart */}
      {comparisonData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-md"
        >
          <h3 className="font-semibold text-slate-950 text-sm mb-4">Price Comparison (Unit Price)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="billed" name="Billed Price" fill="hsl(40 95% 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="standard" name="Govt Ceiling" fill="hsl(150 80% 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(40 95% 55%)' }} />
              Billed Price
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(150 80% 40%)' }} />
              Govt Ceiling Price
            </span>
          </div>
        </motion.div>
      )}

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

      {/* Jargon Buster Drawer */}
      <JargonBusterDrawer
        term={selectedTerm}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
