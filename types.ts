export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  history: { time: string; price: number }[];
  description?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DETAIL = 'DETAIL',
  PORTFOLIO = 'PORTFOLIO',
  NEWS = 'NEWS',
}

export interface AnalysisResult {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
}

export interface NewsItem {
  text: string;
  sources: { title: string; uri: string }[];
}