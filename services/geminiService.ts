import { GoogleGenAI } from "@google/genai";
import { BusinessData, Bike } from "../types";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const generateBusinessReport = async (data: BusinessData): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const getBikeTotalCost = (bike: Bike) => {
    const linkedExpenses = data.expenses.filter(e => e.bikeId === bike.id).reduce((sum, e) => sum + e.amount, 0);
    return bike.buyPrice + (bike.otherCosts || 0) + linkedExpenses;
  };

  // Prepare a summary string for the prompt
  const soldBikes = data.bikes.filter(b => b.status === 'Sold');
  const inventoryBikes = data.bikes.filter(b => b.status === 'In Inventory');
  const keptBikes = data.bikes.filter(b => b.status === 'Kept');
  
  // Revenue: Sold price + (Cost of Kept bikes, as they are "sold" at cost)
  const revenueSold = soldBikes.reduce((sum, b) => sum + (b.sellPrice || 0), 0);
  const revenueKept = keptBikes.reduce((sum, b) => sum + getBikeTotalCost(b), 0);
  const totalRevenue = revenueSold + revenueKept;

  // COGS: Cost of Sold + Cost of Kept
  const cogsSold = soldBikes.reduce((sum, b) => sum + getBikeTotalCost(b), 0);
  const cogsKept = keptBikes.reduce((sum, b) => sum + getBikeTotalCost(b), 0);
  const totalCostOfGoodsSold = cogsSold + cogsKept;
  
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  
  // General expenses are those NOT tied to a specific bike
  const generalExpenses = data.expenses.filter(e => !e.bikeId).reduce((sum, e) => sum + e.amount, 0);
  
  const netIncome = grossProfit - generalExpenses;

  // SANITIZATION: Explicitly construct simple objects to avoid circular references (DOM nodes, etc.)
  // occurring during JSON.stringify. We convert values to primitives explicitly.
  const sanitizedBikes = data.bikes.map(b => {
    const totalCost = getBikeTotalCost(b);
    return {
      model: String(b.model || 'Unknown'),
      buy: Number(b.buyPrice || 0),
      totalCost: Number(totalCost),
      sell: b.status === 'Kept' ? Number(totalCost) : Number(b.sellPrice || 0),
      profit: b.status === 'Sold' ? (Number(b.sellPrice || 0) - totalCost) : (b.status === 'Kept' ? 0 : 'N/A'),
      status: String(b.status)
    };
  });

  const sanitizedExpenses = data.expenses.map(e => ({
    date: String(e.date),
    amount: Number(e.amount),
    category: String(e.category),
    description: String(e.description),
    paidBy: String(e.paidBy || 'Business'),
    linkedBike: e.bikeId ? 'Yes' : 'No'
  }));

  const sanitizedCapital = data.capitalEntries.map(c => ({
    date: String(c.date),
    type: String(c.type),
    amount: Number(c.amount),
    partnerName: String(c.partnerName),
    description: String(c.description || '')
  }));

  const sanitizedBros = data.bros.map(b => ({
    name: String(b.name)
  }));

  const summary = `
    Business Financial Summary:
    - Total Sold Bikes: ${soldBikes.length}
    - Current Inventory Count: ${inventoryBikes.length}
    - Bikes Kept for Personal Use: ${keptBikes.length} (Treated as break-even sales)
    - Gross Profit from Sales (Revenue - COGS): ${formatCurrency(grossProfit)}
    - Total General Expenses (Not tied to bikes): ${formatCurrency(generalExpenses)}
    - Net Business Income: ${formatCurrency(netIncome)}
    
    Bike Details: ${JSON.stringify(sanitizedBikes)}
    
    Expenses: ${JSON.stringify(sanitizedExpenses)}
    
    Capital: ${JSON.stringify(sanitizedCapital)}
    Bros (Partners): ${JSON.stringify(sanitizedBros)}
  `;

  const prompt = `
    You are a savvy business consultant for a small used bike flipping business run by brothers (bros).
    Analyze the following financial data and provide a concise, actionable report.
    
    Note: Expenses paid by specific Bros (partners) are counted as Capital Contributions for them.
    Note: Bikes "Kept" for personal use are treated as break-even sales (Sold at Cost) for accounting purposes, resulting in $0 profit but reimbursing the cash flow.
    Note: Some expenses are linked to specific bikes, increasing their Cost of Goods Sold (COGS).
    
    Data:
    ${summary}

    Structure your response as follows (in Markdown):
    1. **Financial Health**: Are we making money? (Mention Net Income and margins).
    2. **Inventory Analysis**: Which bikes were the best/worst flips? Any red flags in current inventory?
    3. **Operational Advice**: specific advice based on the expenses or capital flow.
    4. **The "Ride" Ahead**: A motivational closing sentence using bike puns.

    Keep it professional but encouraging. Mention the kept bikes as a perk.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate report at this time. Please check your API key configuration.";
  }
};