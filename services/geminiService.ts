import { GoogleGenAI, Type } from "@google/genai";
import { StockData, AnalysisResult, NewsItem } from '../types';
import { generateHistory } from '../constants';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const analyzeStock = async (stock: StockData): Promise<AnalysisResult> => {
  if (!ai) {
    return {
      summary: "API KEY MISSING. UNABLE TO ANALYZE. SYSTEM OFFLINE.",
      sentiment: "NEUTRAL"
    };
  }

  const prompt = `
    Analyze this stock data immediately.
    Symbol: ${stock.symbol}
    Price: ${stock.price}
    Change: ${stock.change} (${stock.changePercent}%)
    Volume: ${stock.volume}
    
    STYLE: BRUTALIST, RAW, ROBOTIC. 
    NO FILLER WORDS. SHORT SENTENCES. UPPERCASE ONLY.
    Explain the movement. Predict the next hour based on volatility.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] }
          },
          required: ["summary", "sentiment"]
        }
      }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text) as AnalysisResult;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Analysis failed", error);
    return {
      summary: "CONNECTION ERROR. ANALYSIS FAILED. RETRY LATER.",
      sentiment: "NEUTRAL"
    };
  }
};

export const getMarketNews = async (): Promise<NewsItem> => {
  if (!ai) {
    return {
      text: "SYSTEM OFFLINE. CONNECT API KEY.",
      sources: []
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "List top 5 critical financial news headlines right now. Format as a raw list. Uppercase only. No numbering.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web)
      .filter(web => web !== undefined) as { title: string; uri: string }[] || [];

    return {
      text: response.text || "NO DATA",
      sources: sources
    };

  } catch (error) {
    console.error("News fetch failed", error);
    return {
      text: "NETWORK ERROR. UNABLE TO RETRIEVE INTEL.",
      sources: []
    };
  }
};

export const getBatchStockQuotes = async (symbols: string[]): Promise<Record<string, { price: number, change: number, changePercent: number, volume?: string }> | null> => {
  if (!ai) return null;

  try {
    const prompt = `
      Get the absolute latest real-time stock price (USD), numerical price change, percentage change, and volume for these symbols: ${symbols.join(', ')}.
      
      CRITICAL INSTRUCTION:
      Return ONLY a raw JSON string. Do not use Markdown code blocks. Do not add explanation.
      
      Required JSON Format:
      {
        "SYMBOL": { "price": number, "change": number, "changePercent": number, "volume": "string" },
        "SYMBOL2": { ... }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("Failed to fetch real-time quotes", error);
    return null;
  }
};

export const lookupStock = async (query: string): Promise<StockData | null> => {
  if (!ai) return null;

  try {
    const prompt = `
      Find the real-time stock market data for: "${query}".
      
      CRITICAL: Return ONLY a raw JSON string. No markdown.
      
      Required JSON Format:
      {
        "symbol": "TICKER_SYMBOL_UPPERCASE",
        "name": "SHORT_COMPANY_NAME_UPPERCASE",
        "price": number,
        "change": number,
        "changePercent": number,
        "volume": "string",
        "description": "Short description (max 10 words)"
      }
      
      If the symbol is ambiguous or not found, return null.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (text === "null" || !text) return null;

    const data = JSON.parse(text);
    
    // Validate shape
    if (!data.symbol || !data.price) return null;

    // Hydrate with local history generation since we can't fetch intraday points easily
    return {
      ...data,
      history: generateHistory(data.price)
    };

  } catch (error) {
    console.error("Lookup failed", error);
    return null;
  }
};