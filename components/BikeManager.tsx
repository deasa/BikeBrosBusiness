import React, { useState, useEffect } from 'react';
import { Bike, BikeStatus, Expense } from '../types';
import { Plus, Tag, Calendar, DollarSign, PenTool, Trash2, Heart } from 'lucide-react';
import { addItem, updateItem, deleteItem, COLLECTIONS } from '../services/firestoreService';

interface BikeManagerProps {
  bikes: Bike[];
  expenses: Expense[];
}

export const BikeManager: React.FC<BikeManagerProps> = ({ bikes, expenses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Partial<Bike>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Bike>>({
    status: 'In Inventory',
    otherCosts: 0
  });

  // Handle Celebration Timer
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const handleOpenModal = (bike?: Bike) => {
    if (bike) {
      setFormData(bike);
      setEditingBike(bike);
    } else {
      setFormData({
        status: 'In Inventory',
        buyDate: new Date().toISOString().split('T')[0],
        otherCosts: 0,
        id: crypto.randomUUID()
      });
      setEditingBike({});
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.model || !formData.buyPrice) return; // Simple validation

    const newBike = formData as Bike;
    
    // Check if status changed to 'Kept' from something else (or is new and kept)
    const oldBike = bikes.find(b => b.id === newBike.id);
    if (newBike.status === 'Kept' && (!oldBike || oldBike.status !== 'Kept')) {
      setShowCelebration(true);
    }

    try {
      if (oldBike) {
        // Update existing
        await updateItem(COLLECTIONS.BIKES, newBike.id, newBike);
      } else {
        // Add new
        await addItem(COLLECTIONS.BIKES, newBike);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Failed to save bike. Check console.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bike record?')) {
      await deleteItem(COLLECTIONS.BIKES, id);
    }
  };

  const getBikeExpenses = (bikeId: string) => {
    return expenses.filter(e => e.bikeId === bikeId).reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateTotalCost = (bike: Bike) => {
    // Legacy otherCosts + buyPrice + linked expenses
    return bike.buyPrice + (bike.otherCosts || 0) + getBikeExpenses(bike.id);
  };

  const calculateProfit = (bike: Bike) => {
    const totalCost = calculateTotalCost(bike);
    if (bike.status === 'Sold' && bike.sellPrice !== undefined) {
      return bike.sellPrice - totalCost;
    }
    if (bike.status === 'Kept') {
      return 0; // Treated as break-even (sold at cost)
    }
    return null;
  };

  return (
    <div className="space-y-6 relative">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"></div>
          <div className="relative transform transition-all animate-bounce-in text-center p-8 bg-white rounded-3xl shadow-2xl border-4 border-yellow-400">
             <div className="text-6xl mb-4 animate-pulse">🚲 💖 🚲</div>
             <h2 className="text-4xl font-black text-slate-900 mb-2">Sweet Ride!</h2>
             <p className="text-xl text-slate-600 font-medium">You kept this one for the family!</p>
             <div className="mt-4 flex justify-center gap-2">
                <span className="inline-block animate-ping text-yellow-500">✨</span>
                <span className="inline-block animate-ping text-yellow-500 delay-100">✨</span>
                <span className="inline-block animate-ping text-yellow-500 delay-200">✨</span>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Bikes</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} /> Add Bike
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Bike / Model</th>
                <th className="p-4 border-b text-right">Buy Date</th>
                <th className="p-4 border-b text-right">Total Cost</th>
                <th className="p-4 border-b text-right">Sell Date</th>
                <th className="p-4 border-b text-right">Sell Price</th>
                <th className="p-4 border-b text-right">Profit / (Loss)</th>
                <th className="p-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bikes.map(bike => {
                const profit = calculateProfit(bike);
                const totalCost = calculateTotalCost(bike);
                
                let statusColor = 'bg-yellow-100 text-yellow-800';
                if (bike.status === 'Sold') statusColor = 'bg-green-100 text-green-800';
                if (bike.status === 'Kept') statusColor = 'bg-pink-100 text-pink-800';

                // For Kept bikes, sell price is conceptually equal to cost
                const displaySellPrice = bike.status === 'Kept' ? totalCost : bike.sellPrice;

                return (
                  <tr key={bike.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {bike.status === 'Kept' && <Heart size={10} className="mr-1 fill-current" />}
                        {bike.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{bike.nickname || 'No Nickname'}</div>
                      <div className="text-sm text-slate-500">{bike.model}</div>
                    </td>
                    <td className="p-4 text-right text-sm text-slate-600">{bike.buyDate}</td>
                    <td className="p-4 text-right text-sm font-medium">
                      ${totalCost.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-sm text-slate-600">{bike.sellDate || '-'}</td>
                    <td className="p-4 text-right text-sm font-medium">
                      {displaySellPrice ? `$${displaySellPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className={`p-4 text-right font-bold text-sm ${
                      profit !== null && profit > 0 ? 'text-green-600' : 
                      profit !== null && profit < 0 ? 'text-red-600' : 'text-slate-400'
                    }`}>
                      {profit !== null ? `$${profit.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(bike)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                          <PenTool size={16} />
                        </button>
                        <button onClick={() => handleDelete(bike.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingBike.id ? 'Edit Bike' : 'Add New Bike'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    type="text" 
                    value={formData.model || ''} 
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 2023 YT Capra"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.nickname || ''} 
                    onChange={e => setFormData({...formData, nickname: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Con Fuego"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as BikeStatus})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="In Inventory">In Inventory</option>
                    <option value="Sold">Sold</option>
                    <option value="Kept">Kept (Personal Use)</option>
                  </select>
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-4">
                   <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Purchase Details</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buy Price ($)</label>
                  <input 
                    type="number" 
                    value={formData.buyPrice || ''} 
                    onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Buy Date</label>
                   <input 
                    type="date"
                    value={formData.buyDate || ''}
                    onChange={e => setFormData({...formData, buyDate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>

                {formData.status === 'Sold' && (
                  <>
                    <div className="col-span-2 border-t border-slate-100 pt-4">
                       <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Sale Details</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sell Price ($)</label>
                      <input 
                        type="number" 
                        value={formData.sellPrice || ''} 
                        onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Sell Date</label>
                       <input 
                        type="date"
                        value={formData.sellDate || ''}
                        onChange={e => setFormData({...formData, sellDate: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm"
              >
                Save Bike
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};