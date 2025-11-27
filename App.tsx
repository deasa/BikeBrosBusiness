import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Bike, PieChart, Sparkles } from 'lucide-react';
import { INITIAL_BIKES, INITIAL_EXPENSES, INITIAL_CAPITAL, INITIAL_BROS } from './constants';
import { Bike as BikeType, Expense, CapitalEntry, Bro } from './types';
import { Dashboard } from './components/Dashboard';
import { BikeManager } from './components/BikeManager';
import { FinanceTracker } from './components/FinanceTracker';
import { AIModal } from './components/AIModal';

// Local Storage Helper
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'finance'>('dashboard');
  
  // State
  const [bikes, setBikes] = useLocalStorage<BikeType[]>('bikebros_bikes', INITIAL_BIKES);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('bikebros_expenses', INITIAL_EXPENSES);
  const [capital, setCapital] = useLocalStorage<CapitalEntry[]>('bikebros_capital', INITIAL_CAPITAL);
  const [bros, setBros] = useLocalStorage<Bro[]>('bikebros_bros', INITIAL_BROS);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">Bike <span className="text-blue-400">Bros</span></h1>
          <p className="text-xs text-slate-400 mt-1">Bike Flip Tracker</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveView('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bike size={20} />
            <span className="font-medium">Bikes</span>
          </button>
          
          <button
            onClick={() => setActiveView('finance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'finance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PieChart size={20} />
            <span className="font-medium">Expenses & Capital</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button
            onClick={() => setIsAIModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:shadow-lg hover:opacity-90 transition-all"
           >
             <Sparkles size={18} />
             <span>AI Insights</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header for Mobile */}
          <div className="md:hidden mb-6 flex justify-between items-center">
             <h1 className="text-xl font-bold text-slate-900">Bike Bros</h1>
          </div>

          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                <p className="text-slate-500">Welcome back. Here's how business is looking.</p>
              </div>
              <Dashboard bikes={bikes} expenses={expenses} capital={capital} />
            </div>
          )}

          {activeView === 'inventory' && (
            <BikeManager bikes={bikes} setBikes={setBikes} expenses={expenses} />
          )}

          {activeView === 'finance' && (
            <FinanceTracker 
              expenses={expenses} setExpenses={setExpenses}
              capital={capital} setCapital={setCapital}
              bros={bros} setBros={setBros}
              bikes={bikes}
            />
          )}

        </div>
      </main>

      {/* AI Modal */}
      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        data={{ bikes, expenses, capitalEntries: capital, bros }} 
      />

    </div>
  );
};

export default App;