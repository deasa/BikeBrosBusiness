
export type BikeStatus = 'Sold' | 'In Inventory' | 'Kept';

export interface Bike {
  id: string;
  nickname: string;
  model: string;
  status: BikeStatus;
  buyDate: string;
  buyPrice: number;
  otherCosts: number; // Kept for backward compatibility, though UI will hide it
  sellDate?: string;
  sellPrice?: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paidBy: string; // 'Business' or Bro Name
  bikeId?: string; // Optional link to a specific bike
}

export type CapitalType = 'Contribution' | 'Withdrawal';

export interface Bro {
  id: string;
  name: string;
}

export interface CapitalEntry {
  id: string;
  partnerName: string; 
  type: CapitalType;
  amount: number;
  date: string;
  description?: string;
}

export interface BusinessData {
  bikes: Bike[];
  expenses: Expense[];
  capitalEntries: CapitalEntry[];
  bros: Bro[];
}
