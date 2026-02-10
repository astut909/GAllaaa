
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Wallet,
  Search,
  CheckCircle2,
  Database,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Transaction, Customer, TransactionType, VoiceExtractionResult } from './types';
import { extractTransactionFromAudio } from './services/geminiService';
import VoiceRecorder from './components/VoiceRecorder';

// Mock DB Initial State (Usually from MySQL)
const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ramesh Kumar', balance: 1200, lastTransactionDate: new Date().toISOString() },
  { id: '2', name: 'Suresh Raina', balance: -450, lastTransactionDate: new Date().toISOString() },
  { id: '3', name: 'Priya Sharma', balance: 0, lastTransactionDate: new Date().toISOString() },
];

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('khaata_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('khaata_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'history'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  // Persistence
  useEffect(() => {
    localStorage.setItem('khaata_customers', JSON.stringify(customers));
    localStorage.setItem('khaata_transactions', JSON.stringify(transactions));
  }, [customers, transactions]);

  const handleVoiceResult = (result: VoiceExtractionResult | null) => {
    if (!result) {
      alert("Couldn't understand the transaction. Please try again.");
      return;
    }

    // Find or create customer
    const existingCustomer = customers.find(c => c.name.toLowerCase() === result.customerName.toLowerCase());
    const customerId = existingCustomer ? existingCustomer.id : Math.random().toString(36).substr(2, 9);
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      customerName: result.customerName,
      amount: result.amount,
      type: result.type,
      date: new Date().toISOString(),
      note: result.note,
    };

    // Update Transactions
    setTransactions(prev => [newTransaction, ...prev]);

    // Update Customer Balance
    setCustomers(prev => {
      if (existingCustomer) {
        return prev.map(c => {
          if (c.id === existingCustomer.id) {
            const balanceDelta = result.type === TransactionType.CREDIT ? result.amount : -result.amount;
            return { 
              ...c, 
              balance: c.balance + balanceDelta,
              lastTransactionDate: newTransaction.date
            };
          }
          return c;
        });
      } else {
        return [...prev, {
          id: customerId,
          name: result.customerName,
          balance: result.type === TransactionType.CREDIT ? result.amount : -result.amount,
          lastTransactionDate: newTransaction.date
        }];
      }
    });

    // Show quick feedback
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const stats = useMemo(() => {
    const youWillGive = customers.filter(c => c.balance < 0).reduce((acc, curr) => acc + Math.abs(curr.balance), 0);
    const youWillGet = customers.filter(c => c.balance > 0).reduce((acc, curr) => acc + curr.balance, 0);
    return { youWillGive, youWillGet };
  }, [customers]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime());

  const handleSyncToMySQL = () => {
    setSyncStatus('syncing');
    // Simulate API call to MySQL backend
    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-6 shadow-lg rounded-b-[2.5rem]">
        <div className="max-w-4xl mx-auto flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7" />
              GALLAA
            </h1>
            <p className="text-indigo-100 text-sm mt-1 opacity-80">AI-Powered Digital Ledger</p>
          </div>
          <button 
            onClick={handleSyncToMySQL}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : syncStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {syncStatus === 'syncing' ? 'Saving to MySQL...' : 'Sync Data'}
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">You will give</p>
            <p className="text-2xl font-bold">₹{stats.youWillGive.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-300">
              <TrendingDown className="w-3 h-3" />
              <span>Outward debt</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold mb-1">You will get</p>
            <p className="text-2xl font-bold">₹{stats.youWillGet.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-300">
              <TrendingUp className="w-3 h-3" />
              <span>Receivable credit</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Customers</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4" />
            <span className="font-semibold text-sm">History</span>
          </button>
        </div>

        {activeTab === 'customers' ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customers by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Customer List */}
            <div className="grid gap-3">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div key={customer.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{customer.name}</h3>
                        <p className="text-xs text-slate-400">Last activity: {new Date(customer.lastTransactionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className={`font-bold text-lg ${customer.balance > 0 ? 'text-green-600' : customer.balance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {customer.balance === 0 ? 'Settled' : `₹${Math.abs(customer.balance).toLocaleString()}`}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
                          {customer.balance > 0 ? 'You Get' : customer.balance < 0 ? 'You Give' : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-600 font-medium">No customers found</h3>
                  <p className="text-slate-400 text-sm">Use voice command to add your first transaction</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${tx.type === TransactionType.CREDIT ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {tx.type === TransactionType.CREDIT ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{tx.customerName}</h4>
                      <p className="text-sm text-slate-500 mb-1">{tx.note}</p>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {new Date(tx.date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${tx.type === TransactionType.CREDIT ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === TransactionType.CREDIT ? '-' : '+'} ₹{tx.amount.toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-600 font-medium">No history yet</h3>
                <p className="text-slate-400 text-sm">Every voice transaction will appear here</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Bar / Voice Input */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg glass border border-white/50 rounded-[3rem] p-6 shadow-2xl ring-1 ring-black/5">
          <VoiceRecorder 
            onProcessing={setIsProcessing}
            onResult={handleVoiceResult}
            processAudio={extractTransactionFromAudio}
          />
        </div>
      </div>

      {/* Sync Status Toast (Mini) */}
      {syncStatus === 'success' && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-[60]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Transaction Saved!</span>
        </div>
      )}
    </div>
  );
};

export default App;
