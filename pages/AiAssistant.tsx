
import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
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
  Trash2,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface Props {
  state: AppState;
  onLogAudit: (section: string, action: string, details: string) => void;
  onUpdateConfig: (newConfig: Partial<AppState['config']>, section: string, details: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const AiAssistant: React.FC<Props> = ({ state, onLogAudit, onUpdateConfig }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi ${state.adminUser.name}! 👋 I'm your Realink AI consultant. I've been looking over your store data—you've got ${state.products.length} products in stock and we've already tracked ${state.sales.length} sales. How's the business feeling today? Anything on your mind that we should look into together?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateSettingsTool: FunctionDeclaration = {
    name: "updateSettings",
    parameters: {
      type: Type.OBJECT,
      description: "Update the store configuration settings such as store name, primary color, or low stock threshold.",
      properties: {
        storeName: {
          type: Type.STRING,
          description: "The name of the store."
        },
        primaryColor: {
          type: Type.STRING,
          description: "The primary brand color in hex format (e.g., #4f46e5)."
        },
        lowStockThreshold: {
          type: Type.NUMBER,
          description: "The threshold for low stock alerts."
        },
        receiptHeader: {
          type: Type.STRING,
          description: "The text displayed at the top of receipts."
        },
        receiptFooter: {
          type: Type.STRING,
          description: "The text displayed at the bottom of receipts."
        }
      }
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inventorySummary = state.products.slice(0, 20).map(p => `${p.name} (Stock: ${p.stock}, Price: ${state.currency.symbol}${p.price})`).join(', ');
      const salesSummary = state.sales.slice(0, 5).map(s => `Sale of ${state.currency.symbol}${s.total}`).join(', ');
      
      const systemInstruction = `
        You are "Realink AI", a warm, conversational, and highly intelligent business consultant for ${state.config.storeName}. 
        Your goal is to help the store manager, ${state.adminUser.name}, succeed.
        
        Tone Guidelines:
        - Be friendly and approachable, like a trusted partner, not a robotic interface.
        - Use ${state.adminUser.name}'s name occasionally to build rapport.
        - Instead of just listing raw data, provide context and explain "why" a metric matters.
        - Use helpful analogies if they clarify complex business concepts.
        - If the user seems concerned (e.g., about low stock), be reassuring but clear about the urgency.
        - Keep your language natural. Use contractions (it's, you're) and conversational transitions.
        
        Business Context:
        - Inventory: ${inventorySummary}
        - Recent Activity: ${salesSummary}
        - Thresholds: Low stock is flagged at ${state.config.lowStockThreshold} units.
        - Brand: Your primary color is ${state.config.primaryColor}.
        
        Capabilities:
        - You can analyze sales trends and inventory health.
        - You can update store settings (name, colors, thresholds) using the 'updateSettings' tool.
        - If you update settings, explain your reasoning clearly.
        
        Constraints:
        - Keep responses scannable using bullet points for data.
        - Stay focused on business growth, operations, and strategy.
        - Don't be overly verbose; get to the point with a friendly touch.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [updateSettingsTool] }]
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: input });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'updateSettings') {
            const args = call.args as any;
            const updatedFields = Object.keys(args).join(', ');
            onUpdateConfig(args, 'AI Assistant', `Updated settings via AI: ${updatedFields}`);
            
            const assistantMsg: ChatMessage = { 
              role: 'model', 
              text: `I've gone ahead and updated those settings for you (${updatedFields}). It should make things run a bit smoother! Is there anything else we should tweak?` 
            };
            setMessages(prev => [...prev, assistantMsg]);
          }
        }
      } else {
        const assistantMsg: ChatMessage = { role: 'model', text: response.text || "I'm sorry, I hit a snag processing that. Could you try rephrasing?" };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a bit of trouble connecting to my brain right now. 🧠 Check your internet connection and let's try again in a moment!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const lowStock = state.products.filter(p => p.stock < state.config.lowStockThreshold);
      const topSales = [...state.sales]
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      
      // Customer specific context
      const selectedCustomer = state.config.lastSelectedCustomerId 
        ? state.customers.find(c => c.id === state.config.lastSelectedCustomerId)
        : null;
      
      const customerSales = selectedCustomer 
        ? state.sales.filter(s => s.customerId === selectedCustomer.id)
        : [];
      
      const customerPurchasedItems = customerSales.flatMap(s => s.items.map(i => i.name));
      
      const prompt = `
        Analyze this POS data and provide 4-5 short, actionable business insights or product recommendations.
        
        General Data:
        - Low Stock Items: ${lowStock.map(p => p.name).join(', ')}
        - Recent High Value Sales: ${topSales.map(s => `${state.currency.symbol}${s.total}`).join(', ')}
        - Total Inventory Items: ${state.products.length}
        
        ${selectedCustomer ? `
        Target Customer Context:
        - Name: ${selectedCustomer.name}
        - Total Purchases: ${customerSales.length}
        - Items previously bought: ${[...new Set(customerPurchasedItems)].join(', ')}
        
        Please include specific product recommendations for ${selectedCustomer.name} based on their purchase history (e.g., complementary items or upgrades).
        ` : ''}
        
        Focus on:
        1. Which products to restock immediately.
        2. Cross-selling opportunities.
        3. Pricing adjustments.
        4. ${selectedCustomer ? `Personalized recommendations for ${selectedCustomer.name}.` : 'General customer trends.'}
        
        Return the response as a JSON array of strings. Each string should be one actionable insight.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "[]");
      setInsights(result);
      
      if (selectedCustomer) {
        // Log AI interaction for specific customer recommendation
        onLogAudit('AI Assistant', 'Customer Recommendation', `Generated personalized product suggestions for ${selectedCustomer.name}`);
      }
    } catch (error) {
      console.error("Insight error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (insights.length === 0 && state.sales.length > 0) {
      generateInsights();
    }
  }, []);

  const clearHistory = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([
        { role: 'model', text: `Hi ${state.adminUser.name}! 👋 I've reset our conversation. How can I help you with your business today?` }
      ]);
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
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'model' ? 'text-white' : 'bg-slate-100 dark:bg-slate-700'}`} style={m.role === 'model' ? { backgroundColor: state.config.primaryColor } : {}}>
                  {m.role === 'model' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'model' ? 'bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700' : 'text-white'}`} style={m.role === 'user' ? { backgroundColor: state.config.primaryColor } : {}}>
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

          {/* Actionable Insights Panel */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" /> Actionable Insights
              </h4>
              <button 
                onClick={generateInsights} 
                disabled={isAnalyzing}
                className="text-[10px] font-black text-indigo-600 uppercase hover:underline disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="space-y-3">
              {isAnalyzing && insights.length === 0 ? (
                <div className="flex flex-col items-center py-4 space-y-2">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Generating recommendations...</p>
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 flex gap-2">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">{insight}</p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No insights available yet. Process more sales to get recommendations.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
