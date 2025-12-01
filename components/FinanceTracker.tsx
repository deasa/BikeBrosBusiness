import React, { useState, useMemo } from 'react';
import { Expense, CapitalEntry, CapitalType, Bro, Bike } from '../types';
import { Plus, Trash2, Wallet, Receipt, Users, Edit2, Check, X, CreditCard, Bike as BikeIcon, AlertTriangle } from 'lucide-react';
import { addItem, updateItem, deleteItem, COLLECTIONS } from '../services/firestoreService';

interface FinanceTrackerProps {
  expenses: Expense[];
  capital: CapitalEntry[];
  bros: Bro[];
  bikes: Bike[];
}

export const FinanceTracker: React.FC<FinanceTrackerProps> = ({ 
  expenses, capital, bros, bikes
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'capital'>('expenses');
  
  // Expense Form State
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    paidBy: 'Business',
    bikeId: ''
  });

  // Capital Form State
  const [capitalForm, setCapitalForm] = useState<Partial<CapitalEntry>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Contribution',
    partnerName: bros.length > 0 ? bros[0].name : '',
    description: ''
  });

  // Bros Management State
  const [isManagingBros, setIsManagingBros] = useState(false);
  const [newBroName, setNewBroName] = useState('');
  const [editingBroId, setEditingBroId] = useState<string | null>(null);
  const [editBroName, setEditBroName] = useState('');

  // Delete confirmations
  const [confirmDeleteBroId, setConfirmDeleteBroId] = useState<string | null>(null);

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) return;
    
    const payer = expenseForm.paidBy || 'Business';
    
    const newExpense: Expense = {
      ...expenseForm as Expense,
      id: crypto.randomUUID(),
      category: 'General', 
      paidBy: payer,
      bikeId: expenseForm.bikeId || undefined 
    };
    
    await addItem(COLLECTIONS.EXPENSES, newExpense);

    // If paid by a Bro, auto-add Capital Contribution
    if (payer !== 'Business') {
      const newCapital: CapitalEntry = {
        id: crypto.randomUUID(),
        partnerName: payer,
        type: 'Contribution',
        amount: newExpense.amount,
        date: newExpense.date,
        description: `Expense: ${newExpense.description}`
      };
      await addItem(COLLECTIONS.CAPITAL, newCapital);
    }

    setExpenseForm({ 
      date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      description: '', 
      paidBy: 'Business',
      bikeId: ''
    });
  };

  const handleAddCapital = async () => {
    if (!capitalForm.amount || !capitalForm.partnerName) return;
    const newEntry: CapitalEntry = {
      ...capitalForm as CapitalEntry,
      id: crypto.randomUUID()
    };
    await addItem(COLLECTIONS.CAPITAL, newEntry);
    
    setCapitalForm({ 
      date: new Date().toISOString().split('T')[0], 
      type: 'Contribution', 
      partnerName: bros.length > 0 ? bros[0].name : '', 
      amount: 0,
      description: ''
    });
  };

  // Bro Management Handlers
  const handleAddBro = async () => {
    if (!newBroName.trim()) return;
    const newBro = { id: crypto.randomUUID(), name: newBroName.trim() };
    await addItem(COLLECTIONS.BROS, newBro);
    setNewBroName('');
  };

  const initiateDeleteBro = (id: string) => {
    if (confirmDeleteBroId === id) {
       // Second click - actually delete
       deleteItem(COLLECTIONS.BROS, id);
       setConfirmDeleteBroId(null);
    } else {
       // First click - ask for confirmation
       setConfirmDeleteBroId(id);
       // Auto reset after 3 seconds
       setTimeout(() => setConfirmDeleteBroId(null), 3000);
    }
  };

  const startEditBro = (bro: Bro) => {
    setEditingBroId(bro.id);
    setEditBroName(bro.name);
  };

  const saveEditBro = async () => {
    if (!editBroName.trim() || !editingBroId) return;
    await updateItem(COLLECTIONS.BROS, editingBroId, { name: editBroName });
    setEditingBroId(null);
  };

  const deleteExpense = (id: string) => deleteItem(COLLECTIONS.EXPENSES, id);
  const deleteCapital = (id: string) => deleteItem(COLLECTIONS.CAPITAL, id);

  const getBikeName = (id?: string) => {
    if (!id) return null;
    const bike = bikes.find(b => b.id === id);
    return bike ? (bike.nickname || bike.model) : 'Unknown Bike';
  };

  // Partner Summary Calculation
  const partnerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    // Initialize with 0 for all current bros
    bros.forEach(b => balances[b.name] = 0);
    
    capital.forEach(entry => {
      if (balances[entry.partnerName] === undefined) balances[entry.partnerName] = 0;
      if (entry.type === 'Contribution') {
        balances[entry.partnerName] += entry.amount;
      } else {
        balances[entry.partnerName] -= entry.amount;
      }
    });
    return balances;
  }, [capital, bros]);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'expenses' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt size={18} /> General Expenses
        </button>
        <button
          onClick={() => setActiveTab('capital')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'capital' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wallet size={18} /> Capital & Bros
        </button>
      </div>

      {activeTab === 'expenses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Expense Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Log Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={expenseForm.description || ''}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. New wrench set"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Link to Bike (Optional)</label>
                <div className="relative">
                  <select
                    value={expenseForm.bikeId || ''}
                    onChange={e => setExpenseForm({...expenseForm, bikeId: e.target.value})}
                    className="w-full p-2 pl-9 border border-slate-300 rounded-lg text-sm appearance-none bg-white"
                  >
                    <option value="">General Business Expense</option>
                    {bikes.map(bike => (
                      <option key={bike.id} value={bike.id}>
                        {bike.nickname ? `${bike.nickname} (${bike.model})` : bike.model}
                      </option>
                    ))}
                  </select>
                  <BikeIcon size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Paid By</label>
                <div className="relative">
                  <select
                    value={expenseForm.paidBy}
                    onChange={e => setExpenseForm({...expenseForm, paidBy: e.target.value})}
                    className="w-full p-2 pl-9 border border-slate-300 rounded-lg text-sm appearance-none bg-white"
                  >
                    <option value="Business">Business Account</option>
                    {bros.map(bro => (
                      <option key={bro.id} value={bro.name}>{bro.name} (Investor)</option>
                    ))}
                  </select>
                  <CreditCard size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                {expenseForm.paidBy !== 'Business' && (
                  <p className="text-xs text-blue-600 mt-1">
                    * This will also record a capital contribution for {expenseForm.paidBy}.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={expenseForm.amount || ''}
                    onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddExpense}
                className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold mt-2"
              >
                Add Expense
              </button>
            </div>
          </div>


          {/* Expense List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Related Bike</th>
                    <th className="p-4">Paid By</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{exp.date}</td>
                      <td className="p-4 font-medium text-slate-800">{exp.description}</td>
                      <td className="p-4 text-slate-500 text-xs">
                        {exp.bikeId ? (
                           <span className="flex items-center gap-1">
                             <BikeIcon size={12} /> {getBikeName(exp.bikeId)}
                           </span>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          !exp.paidBy || exp.paidBy === 'Business' 
                            ? 'bg-slate-100 text-slate-600' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {(!exp.paidBy || exp.paidBy === 'Business') ? 'Business' : exp.paidBy}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-900">${exp.amount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteExpense(exp.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800">Capital Overview</h3>
             <button 
                onClick={() => setIsManagingBros(!isManagingBros)}
                className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
             >
               <Users size={16} /> {isManagingBros ? 'Done Managing Bros' : 'Manage Bros'}
             </button>
          </div>

          {/* Manage Bros Section */}
          {isManagingBros && (
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 animate-fade-in">
              <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-4">Manage Bros (Investors)</h4>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newBroName}
                  onChange={(e) => setNewBroName(e.target.value)}
                  placeholder="Enter Bro Name"
                  className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm"
                />
                <button 
                  onClick={handleAddBro}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Add Bro
                </button>
              </div>
              <div className="space-y-2">
                {bros.map(bro => (
                  <div key={bro.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                    {editingBroId === bro.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          type="text" 
                          value={editBroName}
                          onChange={(e) => setEditBroName(e.target.value)}
                          className="flex-1 p-1 border border-indigo-200 rounded text-sm"
                        />
                        <button onClick={saveEditBro} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16} /></button>
                        <button onClick={() => setEditingBroId(null)} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><X size={16} /></button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-800">{bro.name}</span>
                    )}
                    
                    {!editingBroId && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditBro(bro)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                        <button 
                          onClick={() => initiateDeleteBro(bro.id)} 
                          className={`p-1 rounded transition-colors ${
                            confirmDeleteBroId === bro.id 
                            ? 'text-red-600 bg-red-100 font-bold px-2' 
                            : 'text-slate-400 hover:text-red-600'
                          }`}
                        >
                          {confirmDeleteBroId === bro.id ? 'Sure?' : <Trash2 size={16}/>}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partner Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(partnerBalances).map(([partner, balance]: [string, number]) => (
              <div key={partner} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <p className="text-sm text-slate-500 font-medium mb-1">Partner Capital</p>
                 <h3 className="text-xl font-bold text-slate-900">{partner}</h3>
                 <div className="mt-4 flex items-end justify-between">
                   <span className={`text-3xl font-bold ${balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>${balance.toLocaleString()}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{width: '100%'}}></div>
                 </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Capital Form */}
             <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Record Capital</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Bro (Investor)</label>
                  <select
                    value={capitalForm.partnerName}
                    onChange={e => setCapitalForm({...capitalForm, partnerName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="" disabled>Select a Bro</option>
                    {bros.map(bro => (
                      <option key={bro.id} value={bro.name}>{bro.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Transaction Type</label>
                  <select
                    value={capitalForm.type}
                    onChange={e => setCapitalForm({...capitalForm, type: e.target.value as CapitalType})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Contribution">Contribution (In)</option>
                    <option value="Withdrawal">Withdrawal (Out)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={capitalForm.description || ''}
                    onChange={e => setCapitalForm({...capitalForm, description: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. Initial investment"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Amount ($)</label>
                    <input
                      type="number"
                      value={capitalForm.amount || ''}
                      onChange={e => setCapitalForm({...capitalForm, amount: parseFloat(e.target.value)})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                    <input
                      type="date"
                      value={capitalForm.date}
                      onChange={e => setCapitalForm({...capitalForm, date: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddCapital}
                  className={`w-full py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                    capitalForm.type === 'Contribution' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  Record {capitalForm.type}
                </button>
              </div>
            </div>

            {/* Ledger */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Bro</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {capital.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(cap => (
                    <tr key={cap.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{cap.date}</td>
                      <td className="p-4 font-medium text-slate-800">{cap.partnerName}</td>
                      <td className="p-4 text-slate-600 truncate max-w-[150px]">{cap.description || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cap.type === 'Contribution' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {cap.type}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-medium ${
                         cap.type === 'Contribution' ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {cap.type === 'Contribution' ? '+' : '-'}${cap.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteCapital(cap.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                   {capital.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No capital history recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};