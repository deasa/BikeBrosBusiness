import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { Bike, Expense, CapitalEntry } from '../types';
import { TrendingUp, DollarSign, Package, Heart, Wallet } from 'lucide-react';

interface DashboardProps {
  bikes: Bike[];
  expenses: Expense[];
  capital: CapitalEntry[];
}

export const Dashboard: React.FC<DashboardProps> = ({ bikes, expenses, capital }) => {
  
  const metrics = useMemo(() => {
    const soldBikes = bikes.filter(b => b.status === 'Sold');
    const inventoryBikes = bikes.filter(b => b.status === 'In Inventory');
    const keptBikes = bikes.filter(b => b.status === 'Kept');

    // Net Profit Calculation (Accounting View)
    const revenue = soldBikes.reduce((acc, b) => acc + (b.sellPrice || 0), 0);
    const cogs = soldBikes.reduce((acc, b) => acc + b.buyPrice + b.otherCosts, 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const inventoryValue = inventoryBikes.reduce((acc, b) => acc + b.buyPrice + b.otherCosts, 0);

    // Free Cash Calculation (Cash Flow View)
    // Cash = (Capital In - Capital Out) + (Sales Revenue) - (Total Outflow for Bikes) - (Expenses)
    const capitalIn = capital.filter(c => c.type === 'Contribution').reduce((acc, c) => acc + c.amount, 0);
    const capitalOut = capital.filter(c => c.type === 'Withdrawal').reduce((acc, c) => acc + c.amount, 0);
    const netCapital = capitalIn - capitalOut;

    const totalBikeOutflow = bikes.reduce((acc, b) => acc + b.buyPrice + b.otherCosts, 0); // Cost of ALL bikes (Sold, Inv, Kept)
    
    // Note: If a bro paid for an expense, it is recorded as capital IN (+100) and expense (-100).
    // So the Free Cash formula remains: Cash = Capital + Revenue - Costs - Expenses.
    // The "Bro Paid" part cancels out in the free cash equation, correctly leaving business cash unchanged.
    const freeCash = netCapital + revenue - totalBikeOutflow - totalExpenses;

    return { 
      soldCount: soldBikes.length, 
      inventoryCount: inventoryBikes.length, 
      keptCount: keptBikes.length,
      netProfit, 
      inventoryValue,
      freeCash
    };
  }, [bikes, expenses, capital]);

  const profitData = useMemo(() => {
    return bikes
      .filter(b => b.status === 'Sold' || b.status === 'Kept')
      .map(b => ({
        name: b.nickname || b.model.substring(0, 15),
        // Kept bikes have 0 "profit" for the chart, but we'll render a heart
        profit: b.status === 'Kept' ? 0 : (b.sellPrice || 0) - (b.buyPrice + b.otherCosts),
        status: b.status
      }));
  }, [bikes]);

  // Custom Label for the Bar Chart to show Hearts
  const CustomLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const item = profitData[index];
    
    if (item.status === 'Kept') {
      return (
        <text x={x + width / 2} y={y - 10} fill="#ec4899" textAnchor="middle" fontSize="20">
          ❤️
        </text>
      );
    }
    // Optional: Show value for sold bikes if you want, or return null
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Free Cash Card - New! */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-md border border-slate-800 flex items-center space-x-4 text-white transform hover:scale-105 transition-transform">
          <div className="p-3 bg-slate-800 text-blue-400 rounded-full">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Free Cash</p>
            <h3 className={`text-2xl font-bold ${metrics.freeCash < 0 ? 'text-red-400' : 'text-white'}`}>
              ${metrics.freeCash.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Net Profit</p>
            <h3 className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              ${metrics.netProfit.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Inventory Value</p>
            <h3 className="text-2xl font-bold text-slate-900">${metrics.inventoryValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Bikes Sold</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics.soldCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-full">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Kept by Bros</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics.keptCount}</h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Profit Per Flip & Keepsakes</h3>
          <div className="h-80">
            {profitData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string, props: any) => {
                      if (props.payload.status === 'Kept') return ['Priceless (Kept)', 'Profit'];
                      return [`$${value}`, 'Profit'];
                    }}
                  />
                  <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="profit" content={<CustomLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Package size={48} className="mb-2 opacity-50" />
                <p>Sell or Keep some bikes to see data here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};