import React, { useEffect, useState } from 'react';
import { getMarketNews } from '../services/geminiService';
import { NewsItem } from '../types';
import { BrutalButton } from './BrutalButton';

export const NewsView: React.FC = () => {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    const data = await getMarketNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="flex flex-col min-h-[500px]">
       <div className="bg-black text-white p-2 text-sm font-bold uppercase tracking-widest border-b-2 border-white flex justify-between">
          <span>Global Wire</span>
          <span>LIVE</span>
       </div>

       {loading ? (
         <div className="p-8 font-mono text-center animate-pulse">
            <div className="text-4xl font-black mb-4">LOADING...</div>
            SCANNING GLOBAL MARKETS<br/>
            PARSING RSS FEEDS<br/>
            DECRYPTING SIGNALS
         </div>
       ) : (
         <>
           {news && (
             <div className="flex-1 bg-neutral-100">
               <div className="p-4 whitespace-pre-line font-black text-2xl uppercase leading-none tracking-tight text-neutral-800">
                 {news.text}
               </div>
               
               {news.sources.length > 0 && (
                 <div className="p-4 border-t-2 border-black">
                   <h4 className="font-mono text-xs font-bold mb-2">VERIFIED SOURCES //</h4>
                   <div className="flex flex-wrap gap-2">
                     {news.sources.map((source, idx) => (
                       <a 
                         key={idx}
                         href={source.uri}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="block border border-black bg-white px-2 py-1 text-xs font-mono font-bold hover:bg-black hover:text-white transition-colors truncate max-w-[200px]"
                       >
                         [{idx + 1}] {source.title}
                       </a>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           )}
           
           <div className="p-4 border-t-4 border-black bg-white mt-auto">
             <BrutalButton onClick={fetchNews} className="w-full">
               REFRESH INTELLIGENCE
             </BrutalButton>
           </div>
         </>
       )}
    </div>
  );
};