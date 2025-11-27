import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Bike, Expense, CapitalEntry } from '../types';
import { TrendingUp, DollarSign, Package, AlertCircle, Heart } from 'lucide-react';

interface DashboardProps {
  bikes: Bike[];
  expenses: Expense[];
  capital: CapitalEntry[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ bikes, expenses, capital }) => {
  
  const metrics = useMemo(() => {
    const soldBikes = bikes.filter(b => b.status === 'Sold');
    const inventoryBikes = bikes.filter(b => b.status === 'In Inventory');
    const keptBikes = bikes.filter(b => b.status === 'Kept');

    const revenue = soldBikes.reduce((acc, b) => acc + (b.sellPrice || 0), 0);
    const cogs = soldBikes.reduce((acc, b) => acc + b.buyPrice + b.otherCosts, 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const inventoryValue = inventoryBikes.reduce((acc, b) => acc + b.buyPrice + b.otherCosts, 0);

    return { 
      soldCount: soldBikes.length, 
      inventoryCount: inventoryBikes.length, 
      keptCount: keptBikes.length,
      netProfit, 
      inventoryValue 
    };
  }, [bikes, expenses]);

  const profitData = useMemo(() => {
    return bikes
      .filter(b => b.status === 'Sold')
      .map(b => ({
        name: b.nickname || b.model.substring(0, 10),
        profit: (b.sellPrice || 0) - (b.buyPrice + b.otherCosts)
      }));
  }, [bikes]);

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      // Default to 'General' if category is missing or empty due to form changes
      const cat = e.category || 'General';
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    return Object.keys(categories).map(cat => ({ name: cat, value: categories[cat] }));
  }, [expenses]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Profit Per Flip</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Breakdown</h3>
          <div className="h-64">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No expenses logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};