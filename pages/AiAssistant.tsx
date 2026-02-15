
import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  BrainCircuit, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingBag,
  Loader2,
  Maximize2,
  Trash2
} from 'lucide-react';

interface Props {
  state: AppState;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const AiAssistant: React.FC<Props> = ({ state }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: `Hello ${state.adminUser.name}! I'm your Gemini business consultant. I've analyzed your current state: you have ${state.products.length} products and have processed ${state.sales.length} sales. How can I help you optimize your business today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inventorySummary = state.products.map(p => `${p.name} (Stock: ${p.stock}, Price: ${state.currency.symbol}${p.price})`).join(', ');
      const salesSummary = state.sales.slice(0, 5).map(s => `Sale of ${state.currency.symbol}${s.total}`).join(', ');
      
      const context = `
        You are a smart business assistant for a POS system named ${state.config.storeName}. 
        Business Details:
        - Products: ${inventorySummary}
        - Recent Sales: ${salesSummary}
        - Low Stock Threshold: ${state.config.lowStockThreshold}
        
        Answer user questions about their business metrics, inventory optimization, or retail strategy. Keep answers concise, actionable, and professional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nUser Question: ${input}`
      });

      setMessages(prev => [...prev, { role: 'assistant', text: response.text || "I apologize, I encountered an issue processing that query." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connectivity Error: AI services are currently unavailable. Please check your network and API configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Chat Interface */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl text-white shadow-lg" style={{ backgroundColor: state.config.primaryColor }}>
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Google Gemini Assistant</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Professional Business Consulting</p>
              </div>
            </div>
            <button onClick={clearHistory} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Clear Chat">
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'assistant' ? 'text-white' : 'bg-slate-100 dark:bg-slate-700'}`} style={m.role === 'assistant' ? { backgroundColor: state.config.primaryColor } : {}}>
                  {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'assistant' ? 'bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700' : 'text-white'}`} style={m.role === 'user' ? { backgroundColor: state.config.primaryColor } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white" style={{ backgroundColor: state.config.primaryColor }}>
                  <Bot size={20} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: state.config.primaryColor }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce delay-75" style={{ backgroundColor: state.config.primaryColor }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce delay-150" style={{ backgroundColor: state.config.primaryColor }}></div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSend} className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
            <input 
              type="text" 
              placeholder="Ask about restock timing, sales trends, or store configuration..." 
              className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-700 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" disabled={isLoading} className="px-8 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50" style={{ backgroundColor: state.config.primaryColor }}>
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              Consult
            </button>
          </form>
        </div>

        {/* AI Quick Stats Panel */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Sparkles size={14} /> AI Context Metrics
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold">Total Items</span>
                </div>
                <span className="text-xs font-black">{state.products.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold">Total Sales</span>
                </div>
                <span className="text-xs font-black">{state.sales.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-600">Low Stock</span>
                </div>
                <span className="text-xs font-black text-rose-600">{state.products.filter(p => p.stock < state.config.lowStockThreshold).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
            <h4 className="font-black text-sm mb-2">Need a Pro Tip?</h4>
            <p className="text-xs text-indigo-100 opacity-80 leading-relaxed mb-6">Ask me "What should I restock first?" to see which high-performing items are running low.</p>
            <button 
              onClick={() => { setInput("What should I restock first?"); handleSend(); }}
              className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black backdrop-blur-sm transition-all"
            >
              Analyze Restock Priority
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
