import React, { useState, useEffect } from 'react';
import { ViewState, StockData, AnalysisResult, PortfolioPosition } from './types';
import { INITIAL_STOCKS, generateHistory } from './constants';
import { TickerItem } from './components/TickerItem';
import { BrutalButton } from './components/BrutalButton';
import { StockChart } from './components/StockChart';
import { TradeModal } from './components/TradeModal';
import { PortfolioView } from './components/PortfolioView';
import { NewsView } from './components/NewsView';
import { analyzeStock, getBatchStockQuotes, lookupStock } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Stock Data State
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // AI/Data State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("INITIALIZING...");
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // Portfolio State
  const [cash, setCash] = useState<number>(10000);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  
  // Trade Modal State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    refreshMarketData();
  }, []);

  const refreshMarketData = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    const symbols = stocks.map(s => s.symbol);
    // Batch in chunks if list gets too long, but for now 20 is fine for Gemini
    const quotes = await getBatchStockQuotes(symbols);

    if (quotes) {
      setStocks(prevStocks => prevStocks.map(stock => {
        const quote = quotes[stock.symbol] || quotes[stock.symbol.toUpperCase()];
        if (quote) {
          return {
            ...stock,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume || stock.volume,
            // Regenerate history graph to match the new price level roughly
            history: generateHistory(quote.price) 
          };
        }
        return stock;
      }));
      setLastUpdated(new Date().toLocaleTimeString());
    } else {
      setLastUpdated("UPDATE FAILED");
    }
    
    setIsUpdating(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    
    // Check if already exists
    const existing = stocks.find(s => s.symbol.toUpperCase() === searchQuery.toUpperCase());
    if (existing) {
      document.getElementById(`ticker-${existing.symbol}`)?.scrollIntoView({ behavior: 'smooth' });
      setSearchQuery('');
      return;
    }

    setIsSearching(true);
    const result = await lookupStock(searchQuery);
    
    if (result) {
      setStocks(prev => [result, ...prev]);
      setSearchQuery('');
    } else {
      alert("TICKER NOT FOUND OR DATA UNAVAILABLE");
    }
    setIsSearching(false);
  };

  const handleStockClick = (stock: StockData) => {
    setSelectedStock(stock);
    setAnalysis(null);
    setView(ViewState.DETAIL);
  };

  const handleBack = () => {
    setView(ViewState.DASHBOARD);
    setSelectedStock(null);
    setAnalysis(null);
  };

  const handleAnalysis = async () => {
    if (!selectedStock) return;
    setIsAnalyzing(true);
    const result = await analyzeStock(selectedStock);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const openTradeModal = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  const executeTrade = (quantity: number) => {
    if (!selectedStock) return;

    if (tradeType === 'BUY') {
      const cost = quantity * selectedStock.price;
      if (cost > cash) return; 

      setCash(prev => prev - cost);
      
      setPortfolio(prev => {
        const existing = prev.find(p => p.symbol === selectedStock.symbol);
        if (existing) {
          const totalCost = (existing.quantity * existing.averageEntryPrice) + cost;
          const totalQty = existing.quantity + quantity;
          return prev.map(p => p.symbol === selectedStock.symbol ? { ...p, quantity: totalQty, averageEntryPrice: totalCost / totalQty } : p);
        } else {
          return [...prev, { symbol: selectedStock.symbol, quantity, averageEntryPrice: selectedStock.price }];
        }
      });
    } else {
      // SELL
      const existing = portfolio.find(p => p.symbol === selectedStock.symbol);
      if (!existing || existing.quantity < quantity) return;

      const revenue = quantity * selectedStock.price;
      setCash(prev => prev + revenue);

      setPortfolio(prev => {
        if (existing.quantity === quantity) {
          return prev.filter(p => p.symbol !== selectedStock.symbol);
        }
        return prev.map(p => p.symbol === selectedStock.symbol ? { ...p, quantity: p.quantity - quantity } : p);
      });
    }
    setShowTradeModal(false);
  };

  const getOwnedQuantity = (symbol: string) => {
    return portfolio.find(p => p.symbol === symbol)?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-black selection:bg-black selection:text-white pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black flex justify-between items-center p-4 shadow-sm">
        <div className="flex flex-col cursor-pointer" onClick={() => setView(ViewState.DASHBOARD)}>
          <h1 className="text-4xl font-black italic tracking-tighter leading-none">
            BRUTAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-neutral-600">.TICKER</span>
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold">{currentTime}</span>
            {isUpdating ? (
               <span className="text-xs font-mono font-bold text-orange-600 animate-pulse"> // SYNCING...</span>
            ) : (
               <span className="text-xs font-mono font-bold text-neutral-400"> // UPDATED: {lastUpdated}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
             <button 
                onClick={refreshMarketData} 
                disabled={isUpdating}
                className="hidden sm:block border-2 border-black bg-white hover:bg-black hover:text-white px-2 py-1 font-mono font-bold text-xs uppercase transition-colors disabled:opacity-50"
             >
                REFRESH
             </button>
            <div className="hidden sm:block font-mono font-bold text-xs bg-neutral-200 px-2 py-1">
                LIQUID: ${cash.toLocaleString()}
            </div>
            <div className={`w-4 h-4 border border-black ${isUpdating ? 'bg-orange-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
        </div>
      </header>

      {/* VIEW CONTROLLER */}
      <main className="max-w-md mx-auto min-h-[calc(100vh-80px)] border-x-4 border-black bg-white shadow-2xl relative">
        
        {/* DASHBOARD VIEW */}
        {view === ViewState.DASHBOARD && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <div className="bg-black text-white p-2 text-sm font-bold uppercase tracking-widest border-b-2 border-white flex justify-between">
              <span>Market Overview</span>
              <span className="cursor-pointer hover:underline" onClick={refreshMarketData}>
                 {isUpdating ? 'FETCHING...' : 'LIVE DATA'}
              </span>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="p-4 border-b-2 border-black bg-neutral-100 flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearching ? "SCANNING NETWORK..." : "ADD_TICKER..."}
                disabled={isSearching}
                className="w-full bg-white border-2 border-black p-3 font-mono font-bold uppercase placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#000] transition-shadow disabled:bg-neutral-200"
              />
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-black text-white border-2 border-black px-4 font-bold active:translate-x-[2px] active:translate-y-[2px]"
              >
                {isSearching ? '...' : '+'}
              </button>
            </form>

            <div className="flex flex-col">
              {stocks.map((stock) => (
                <div key={stock.symbol} id={`ticker-${stock.symbol}`}>
                  <TickerItem stock={stock} onClick={handleStockClick} />
                </div>
              ))}
            </div>

            <div className="p-8 text-center opacity-50 font-mono text-xs">
              GLOBAL EXCHANGES CONNECTED //
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === ViewState.DETAIL && selectedStock && (
          <div className="flex flex-col animate-in slide-in-from-right duration-200 relative">
            {/* NAV */}
            <div className="flex border-b-4 border-black sticky top-0 bg-white z-30">
              <button 
                onClick={handleBack}
                className="bg-neutral-200 hover:bg-neutral-300 border-r-2 border-black p-4 font-bold text-xl w-16 flex items-center justify-center transition-colors"
              >
                ←
              </button>
              <div className="flex-1 p-2 flex items-center justify-center bg-black text-white">
                 <span className="font-mono text-xl tracking-widest">{selectedStock.symbol}</span>
              </div>
            </div>

            {/* MAIN STATS */}
            <div className="p-6 flex flex-col items-center justify-center border-b-2 border-black bg-neutral-50 space-y-2">
              <span className="text-6xl font-black tracking-tighter">
                {selectedStock.price.toFixed(2)}
              </span>
              <div className={`flex items-center space-x-2 font-bold text-xl ${selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="bg-black text-white px-2 py-0.5 text-sm font-mono">
                   {selectedStock.change >= 0 ? 'UP' : 'DOWN'}
                </span>
                <span>{Math.abs(selectedStock.changePercent).toFixed(2)}%</span>
              </div>
              <div className="text-xs font-mono font-bold text-neutral-500 mt-2">
                  OWNED: {getOwnedQuantity(selectedStock.symbol)}
              </div>
            </div>

            {/* CHART SECTION */}
            <div className="p-4 border-b-2 border-black">
               <div className="mb-2 flex justify-between font-mono text-xs font-bold uppercase">
                  <span>Intraday Volatility</span>
                  <span>Vol: {selectedStock.volume}</span>
               </div>
               <StockChart 
                 data={selectedStock.history} 
                 color={selectedStock.change >= 0 ? '#16a34a' : '#dc2626'} 
               />
            </div>

            {/* DESCRIPTION */}
             <div className="p-4 border-b-2 border-black font-mono text-sm leading-relaxed">
               <span className="bg-black text-white px-1 mr-2 font-bold">INFO</span>
               {selectedStock.description?.toUpperCase()}
            </div>

            {/* AI ANALYSIS SECTION */}
            <div className="p-4 bg-neutral-100 min-h-[200px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-2xl uppercase italic">Analysis</h3>
                {analysis && (
                   <span className={`border-2 border-black px-2 py-1 font-bold text-xs ${
                     analysis.sentiment === 'BULLISH' ? 'bg-green-400' : 
                     analysis.sentiment === 'BEARISH' ? 'bg-red-400' : 'bg-gray-300'
                   }`}>
                     {analysis.sentiment}
                   </span>
                )}
              </div>

              {!analysis && !isAnalyzing && (
                 <BrutalButton onClick={handleAnalysis} className="w-full">
                   Initialize AI Protocol
                 </BrutalButton>
              )}

              {isAnalyzing && (
                <div className="border-2 border-black p-4 bg-white font-mono text-xs animate-pulse">
                  CONNECTING TO NEURAL NET...
                  <br/>
                  PARSING MARKET SENTIMENT...
                  <br/>
                  CALCULATING ALPHA...
                </div>
              )}

              {analysis && (
                <div className="border-2 border-black bg-white p-0">
                  <div className="bg-black text-white p-1 text-xs font-mono font-bold flex justify-between">
                     <span>GEMINI_V2.5</span>
                     <span>CONFIDENCE: 98%</span>
                  </div>
                  <div className="p-4 font-mono text-sm font-bold uppercase leading-tight">
                    {analysis.summary}
                  </div>
                  <button 
                    onClick={() => setAnalysis(null)}
                    className="w-full border-t-2 border-black p-2 hover:bg-neutral-200 font-bold text-xs"
                  >
                    RESET_STREAM
                  </button>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="p-4 grid grid-cols-2 gap-4">
               <BrutalButton variant="success" onClick={() => openTradeModal('BUY')}>BUY</BrutalButton>
               <BrutalButton 
                  variant="danger" 
                  onClick={() => openTradeModal('SELL')}
                  disabled={getOwnedQuantity(selectedStock.symbol) <= 0}
                  className={getOwnedQuantity(selectedStock.symbol) <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  SELL
               </BrutalButton>
            </div>
          </div>
        )}

        {/* PORTFOLIO VIEW */}
        {view === ViewState.PORTFOLIO && (
          <PortfolioView 
            portfolio={portfolio} 
            stocks={stocks} 
            cash={cash} 
          />
        )}

        {/* NEWS VIEW */}
        {view === ViewState.NEWS && (
          <NewsView />
        )}

      </main>

      {/* STICKY BOTTOM BAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t-4 border-black p-2 flex justify-around z-50 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
        <button 
          className={`flex-1 p-2 font-black uppercase text-center border-2 border-transparent transition-all ${view === ViewState.DASHBOARD || view === ViewState.DETAIL ? 'bg-black text-white border-black' : 'hover:border-black hover:bg-neutral-100'}`}
          onClick={() => {
             setView(ViewState.DASHBOARD);
             setSelectedStock(null);
          }}
        >
          Markets
        </button>
        <div className="w-px bg-black mx-2"></div>
        <button 
          className={`flex-1 p-2 font-black uppercase text-center border-2 border-transparent transition-all ${view === ViewState.PORTFOLIO ? 'bg-black text-white border-black' : 'hover:border-black hover:bg-neutral-100'}`}
          onClick={() => setView(ViewState.PORTFOLIO)}
        >
          Portfolio
        </button>
        <div className="w-px bg-black mx-2"></div>
         <button 
           className={`flex-1 p-2 font-black uppercase text-center border-2 border-transparent transition-all ${view === ViewState.NEWS ? 'bg-black text-white border-black' : 'hover:border-black hover:bg-neutral-100'}`}
           onClick={() => setView(ViewState.NEWS)}
         >
          News
        </button>
      </nav>

      {/* MODALS */}
      {showTradeModal && selectedStock && (
        <TradeModal 
          stock={selectedStock}
          type={tradeType}
          cashAvailable={cash}
          maxQuantity={getOwnedQuantity(selectedStock.symbol)}
          onConfirm={executeTrade}
          onCancel={() => setShowTradeModal(false)}
        />
      )}

    </div>
  );
};

export default App;