
import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Monitor, 
  Shield, 
  Database, 
  Printer, 
  Globe, 
  Bell, 
  Cloud,
  ChevronRight,
  DollarSign,
  History,
  X,
  Clock,
  Check,
  BrainCircuit,
  Sparkles,
  Loader2,
  Settings,
  Send,
  User,
  Bot,
  AlertTriangle,
  Languages,
  Coins,
  Briefcase,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';
import { AppState, SettingHistoryEntry, PaymentAccount } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  state: AppState;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onUpdateCurrency: (code: string, symbol: string) => void;
  onUpdateConfig: (newConfig: Partial<AppState['config']>, section: string, details: string) => void;
  onUpdateAccount: (newAccount: Partial<AppState['businessAccount']>) => void;
  onUpdatePaymentAccounts: (accounts: PaymentAccount[]) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SettingsPage: React.FC<Props> = ({ state, isDarkMode, setIsDarkMode, onUpdateCurrency, onUpdateConfig, onUpdateAccount, onUpdatePaymentAccounts }) => {
  const [historySection, setHistorySection] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // AI Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Payment Account Form
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<PaymentAccount>>({
    provider: '',
    accountNumber: '',
    accountName: state.businessAccount.name
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const handleAskAi = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a world-class retail consultant. Analyze this business state: 
      Store Name: ${state.config.storeName}
      Low Stock Items: ${state.products.filter(p => p.stock < state.config.lowStockThreshold).length}
      Total Revenue: ${state.currency.symbol}${state.sales.reduce((a, b) => a + b.total, 0)}
      Sync Status: ${state.syncStatus}
      Provide 3 actionable tips in Markdown to improve this business's operations or configuration.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiAnalysis(response.text || "No insights available.");
    } catch (error) {
      setAiAnalysis("AI Consultant is offline.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `Context: This is a POS system called ${state.config.storeName}. Current products: ${state.products.length}. Total sales: ${state.sales.length}.`;
      const fullPrompt = `${context}\n\nUser Message: ${chatInput}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt
      });

      const assistantMsg: ChatMessage = { role: 'assistant', text: response.text || "I'm sorry, I couldn't process that." };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to AI assistant." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAddPaymentAccount = () => {
    if (!newAccount.provider || !newAccount.accountNumber || !newAccount.accountName) return;
    const account: PaymentAccount = {
      id: Date.now().toString(),
      provider: newAccount.provider,
      accountNumber: newAccount.accountNumber,
      accountName: newAccount.accountName
    };
    onUpdatePaymentAccounts([...state.paymentAccounts, account]);
    setNewAccount({ provider: '', accountNumber: '', accountName: state.businessAccount.name });
    setShowAddAccount(false);
  };

  const handleRemovePaymentAccount = (id: string) => {
    onUpdatePaymentAccounts(state.paymentAccounts.filter(a => a.id !== id));
  };

  const filteredHistory = state.settingsHistory.filter(h => !historySection || h.section === historySection);

  const SectionCard = ({ section, icon: Icon, title, children }: { section: string, icon: any, title: string, children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden h-fit">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <Icon size={20} />
          </div>
          <h4 className="font-bold text-lg">{title}</h4>
        </div>
        <button 
          onClick={() => setHistorySection(section)}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          title={`View history for ${title}`}
        >
          <History size={16} />
        </button>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Settings size={180} />
        </div>
        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md relative z-10">
          <Monitor size={48} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black">System Architecture</h2>
          <p className="text-indigo-100 opacity-80 font-medium">Configure branding, security, and smart capabilities.</p>
        </div>
        <div className="md:ml-auto relative z-10">
          <button onClick={handleAskAi} disabled={isAiLoading} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
            Quick Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Account Section */}
        <SectionCard section="Account" icon={Briefcase} title="Business Account">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Entity Name</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={state.businessAccount.name} onChange={(e) => onUpdateAccount({ name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Address</label>
              <textarea className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none resize-none h-20" value={state.businessAccount.address} onChange={(e) => onUpdateAccount({ address: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Phone</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={state.businessAccount.phone} onChange={(e) => onUpdateAccount({ phone: e.target.value })} />
            </div>
          </div>
        </SectionCard>

        {/* Payment Accounts Section */}
        <SectionCard section="Payments" icon={Building2} title="Accepted Accounts">
          <div className="space-y-3">
            {state.paymentAccounts.map(account => (
              <div key={account.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between group/account">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-indigo-600">{account.provider}</p>
                  <p className="text-sm font-bold truncate">{account.accountNumber}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{account.accountName}</p>
                </div>
                <button onClick={() => handleRemovePaymentAccount(account.id)} className="p-2 text-rose-500 opacity-0 group-hover/account:opacity-100 transition-opacity hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {!showAddAccount ? (
              <button 
                onClick={() => setShowAddAccount(true)}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Payment Option
              </button>
            ) : (
              <div className="p-4 border-2 border-indigo-500/30 rounded-2xl space-y-3 bg-indigo-50/20 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Provider (Opay, PalmPay...)" 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-none rounded-xl text-xs font-bold"
                  value={newAccount.provider}
                  onChange={e => setNewAccount({...newAccount, provider: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Account Number" 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-none rounded-xl text-xs font-bold"
                  value={newAccount.accountNumber}
                  onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Account Holder Name" 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-none rounded-xl text-xs font-bold"
                  value={newAccount.accountName}
                  onChange={e => setNewAccount({...newAccount, accountName: e.target.value})}
                />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddPaymentAccount} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Add</button>
                  <button onClick={() => setShowAddAccount(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Branding Section */}
        <SectionCard section="Branding" icon={Palette} title="Store Branding">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
            <input type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={state.config.storeName} onChange={(e) => onUpdateConfig({ storeName: e.target.value }, 'Branding', `Name changed to ${e.target.value}`)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Theme Accent</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-12 h-10 p-1 bg-white border rounded-lg cursor-pointer" value={state.config.primaryColor} onChange={(e) => onUpdateConfig({ primaryColor: e.target.value }, 'Branding', `Theme color updated to ${e.target.value}`)} />
              <span className="font-mono text-xs text-slate-500 uppercase">{state.config.primaryColor}</span>
            </div>
          </div>
        </SectionCard>

        {/* Regional Section */}
        <SectionCard section="Regional" icon={Globe} title="Regional & Currency">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Currency</label>
            <div className="relative">
              <select 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none appearance-none"
                value={state.currency.code}
                onChange={(e) => {
                  const selected = currencies.find(c => c.code === e.target.value);
                  if (selected) onUpdateCurrency(selected.code, selected.symbol);
                }}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                ))}
              </select>
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase leading-relaxed">
              Main Currency set to <span className="underline">{state.currency.code} ({state.currency.symbol})</span>. All sales, reports, and prices will reflect this format.
            </p>
          </div>
        </SectionCard>

        {/* Sync Section */}
        <SectionCard section="Cloud" icon={Cloud} title="Sync & Cloud">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Provider</label>
            <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm" value={state.config.cloudProvider} onChange={(e) => onUpdateConfig({ cloudProvider: e.target.value as any }, 'Cloud', `Cloud provider changed to ${e.target.value}`)}>
              <option value="gdrive">Google Drive</option>
              <option value="dropbox">Dropbox</option>
              <option value="s3">Amazon S3</option>
            </select>
          </div>
          <div className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg flex items-center gap-2">
            <Check size={14} /> Auto-Sync Active
          </div>
        </SectionCard>

        {/* AI Chat Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg"><Sparkles size={16}/></div>
              <h4 className="font-bold text-sm">AI Business Assistant</h4>
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">Online</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
                <BrainCircuit size={40} />
                <p className="text-xs font-medium">Ask me anything about your business metrics or help with configuration.</p>
              </div>
            ) : (
              chatMessages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-xl h-fit ${m.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                    {m.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'assistant' ? 'bg-slate-50 dark:bg-slate-900/40' : 'bg-indigo-600 text-white shadow-md'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white h-fit"><Bot size={16}/></div>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={isChatLoading} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50">
              <Send size={18}/>
            </button>
          </form>
        </div>

        {/* Notifications Section */}
        <SectionCard section="Notifications" icon={Bell} title="Alert Thresholds">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Global Low Stock Alert</label>
              <div className="relative group">
                <input 
                  type="number" 
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 rounded-2xl font-black text-sm outline-none transition-all" 
                  value={state.config.lowStockThreshold} 
                  onChange={(e) => onUpdateConfig({ lowStockThreshold: parseInt(e.target.value) || 0 }, 'Notifications', `Global stock threshold changed to ${e.target.value}`)} 
                />
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 group-focus-within:animate-pulse" size={18} />
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
               <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed uppercase tracking-tight">
                 System logic: Broadcasts "Stock Alerts" and visual warnings on Dashboard & Inventory when quantity falls below this value.
               </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* History Modal (Centralized Logic for Module Audit) */}
      {historySection && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="text-indigo-600" size={24} />
                <h3 className="font-bold text-xl">{historySection} Audit Log</h3>
              </div>
              <button onClick={() => setHistorySection(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">No events recorded.</div>
              ) : (
                filteredHistory.map((h) => (
                  <div key={h.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border relative overflow-hidden">
                    <div className="w-1 h-full bg-indigo-500 absolute left-0 top-0"></div>
                    <div className="flex-1 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-black text-indigo-600 text-xs uppercase">{h.action}</p>
                        <span className="text-[9px] text-slate-400 font-mono font-black uppercase">{new Date(h.date).toLocaleString()}</span>
                      </div>
                      <p className="font-medium mb-1">{h.details}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized By: {h.performer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
