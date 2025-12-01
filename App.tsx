import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Bike, PieChart, Sparkles } from 'lucide-react';
import { Bike as BikeType, Expense, CapitalEntry, Bro } from './types';
import { Dashboard } from './components/Dashboard';
import { BikeManager } from './components/BikeManager';
import { FinanceTracker } from './components/FinanceTracker';
import { AIModal } from './components/AIModal';
import { subscribeToCollection, COLLECTIONS } from './services/firestoreService';

const SecurityGate = ({ onVerified }: { onVerified: () => void }) => {
  const [answer, setAnswer] = useState('');
  const [failed, setFailed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.toLowerCase().trim() === 'snot rocket') {
      onVerified();
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4 z-[200] text-white animate-fade-in">
        <h1 className="text-4xl font-black mb-6 text-red-500 tracking-widest uppercase">Access Denied</h1>
        <div className="relative mb-6 rounded-xl overflow-hidden shadow-2xl border-4 border-red-600">
           <img 
            src="https://media.giphy.com/media/3o6ZtpRo66rF1lKxHO/giphy.gif" 
            alt="Bike Crash" 
            className="w-full max-w-md h-auto"
          />
        </div>
        <p className="text-xl font-medium mb-8 text-center">That is incorrect. You are clearly not a true Bike Bro.</p>
        <button 
          onClick={() => { setFailed(false); setAnswer(''); }}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors uppercase tracking-wide"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-[200]">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-8">
           <div className="inline-flex p-4 bg-blue-100 rounded-full text-blue-600 mb-4">
              <Bike size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900">Security Check</h2>
           <p className="text-slate-500 mt-2">Verify your identity to access the books.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What was the nickname of the 2021 Canyon Spectral CF7?
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="Enter nickname..."
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Verify Identity
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'finance'>('dashboard');
  const [verified, setVerified] = useState(false);
  
  // State is now managed by Firestore subscriptions
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [capital, setCapital] = useState<CapitalEntry[]>([]);
  const [bros, setBros] = useState<Bro[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Check verification status
  useEffect(() => {
    const isVerified = sessionStorage.getItem('bike_bros_verified');
    if (isVerified) setVerified(true);
  }, []);

  const handleVerified = () => {
    sessionStorage.setItem('bike_bros_verified', 'true');
    setVerified(true);
  };

  // Set up real-time listeners
  useEffect(() => {
    if (!verified) return; // Don't subscribe until verified to save reads? Or just subscribe anyway. Subscribing anyway is fine.
    
    const unsubBikes = subscribeToCollection(COLLECTIONS.BIKES, (data) => setBikes(data as BikeType[]));
    const unsubExpenses = subscribeToCollection(COLLECTIONS.EXPENSES, (data) => setExpenses(data as Expense[]));
    const unsubCapital = subscribeToCollection(COLLECTIONS.CAPITAL, (data) => setCapital(data as CapitalEntry[]));
    const unsubBros = subscribeToCollection(COLLECTIONS.BROS, (data) => setBros(data as Bro[]));

    setLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubBikes();
      unsubExpenses();
      unsubCapital();
      unsubBros();
    };
  }, [verified]);

  if (!verified) {
    return <SecurityGate onVerified={handleVerified} />;
  }

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
            <BikeManager bikes={bikes} expenses={expenses} />
          )}

          {activeView === 'finance' && (
            <FinanceTracker 
              expenses={expenses}
              capital={capital}
              bros={bros}
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