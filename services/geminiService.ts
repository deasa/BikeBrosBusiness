import { GoogleGenAI } from "@google/genai";
import { BusinessData } from "../types";

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

  // Prepare a summary string for the prompt
  const soldBikes = data.bikes.filter(b => b.status === 'Sold');
  const inventoryBikes = data.bikes.filter(b => b.status === 'In Inventory');
  const keptBikes = data.bikes.filter(b => b.status === 'Kept');
  
  const totalRevenue = soldBikes.reduce((sum, b) => sum + (b.sellPrice || 0), 0);
  const totalCostOfGoodsSold = soldBikes.reduce((sum, b) => sum + b.buyPrice + b.otherCosts, 0);
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = grossProfit - totalExpenses;

  const summary = `
    Business Financial Summary:
    - Total Sold Bikes: ${soldBikes.length}
    - Current Inventory Count: ${inventoryBikes.length}
    - Bikes Kept for Personal Use: ${keptBikes.length}
    - Gross Profit from Sales: ${formatCurrency(grossProfit)}
    - Total General Expenses: ${formatCurrency(totalExpenses)}
    - Net Business Income: ${formatCurrency(netIncome)}
    
    Bike Details: ${JSON.stringify(data.bikes.map(b => ({
      model: b.model,
      buy: b.buyPrice,
      sell: b.sellPrice,
      profit: b.status === 'Sold' ? (b.sellPrice || 0) - (b.buyPrice + b.otherCosts) : 'N/A',
      status: b.status
    })))}
    
    Expenses: ${JSON.stringify(data.expenses.map(e => ({
      ...e,
      paidBy: e.paidBy || 'Business'
    })))}
    
    Capital: ${JSON.stringify(data.capitalEntries)}
    Bros (Partners): ${JSON.stringify(data.bros)}
  `;

  const prompt = `
    You are a savvy business consultant for a small used bike flipping business run by brothers (bros).
    Analyze the following financial data and provide a concise, actionable report.
    
    Note: Expenses paid by specific Bros (partners) are counted as Capital Contributions for them.
    
    Data:
    ${summary}

    Structure your response as follows (in Markdown):
    1. **Financial Health**: Are we making money? (Mention Net Income and margins).
    2. **Inventory Analysis**: Which bikes were the best/worst flips? Any red flags in current inventory?
    3. **Operational Advice**: specific advice based on the expenses or capital flow.
    4. **The "Ride" Ahead**: A motivational closing sentence using bike puns.

    Keep it professional but encouraging. If bikes were "Kept", mention that it's a perk of the job but affects cash flow.
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