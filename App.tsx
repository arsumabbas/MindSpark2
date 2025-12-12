import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Deck, Card } from './types';
import { db } from './lib/db';
import { DECK_COLORS } from './constants';
import { Plus, Settings, BarChart2, ChevronLeft, MoreVertical, Play, Edit3, Trash2, Download, Upload, Zap, Check, X } from 'lucide-react';
import { Button } from './components/ui/Button';
import { ReviewSession } from './components/ReviewSession';
import { AIDialog } from './components/AIDialog';
import { EditCardDialog } from './components/EditCardDialog';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Home Screen ---
const Home = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const navigate = useNavigate();

  const loadDecks = async () => {
    const data = await db.getDecks();
    setDecks(data);
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const createDeck = async () => {
    const name = prompt("Deck Name:");
    if (!name) return;
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cardCount: 0,
      dueCount: 0,
      newCount: 0,
    };
    await db.saveDeck(newDeck);
    loadDecks();
  };

  return (
    <div className="pb-24">
      <header className="px-6 py-6 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-slate-50">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Decks</h1>
           <p className="text-slate-400 text-sm mt-0.5">Today's Goals</p>
        </div>
        <div className="flex gap-3">
          <Link to="/settings" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Settings size={20} />
          </Link>
          <Link to="/stats" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <BarChart2 size={20} />
          </Link>
        </div>
      </header>

      <div className="px-6 py-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck, i) => {
          const theme = DECK_COLORS[i % DECK_COLORS.length];
          return (
            <div 
              key={deck.id} 
              onClick={() => navigate(`/deck/${deck.id}`)}
              className="group relative bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] transition-all cursor-pointer border border-transparent hover:border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center font-bold text-lg`}>
                  {deck.name.charAt(0).toUpperCase()}
                </div>
                {deck.dueCount > 0 && (
                   <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                     {deck.dueCount} Due
                   </span>
                )}
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{deck.name}</h3>
              <p className="text-slate-400 text-sm">{deck.cardCount} cards</p>

              <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                   className={`h-full ${theme.bar}`} 
                   style={{ width: `${deck.cardCount > 0 ? ((deck.cardCount - deck.newCount) / deck.cardCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}

        <button 
          onClick={createDeck}
          className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all gap-2"
        >
          <Plus size={24} />
          <span className="font-medium text-sm">Create Deck</span>
        </button>
      </div>
    </div>
  );
};

// --- Deck Details & Card Management ---
const DeckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  useEffect(() => {
    if (id) {
      db.getDecks().then(ds => setDeck(ds.find(d => d.id === id) || null));
      db.getCards(id).then(setCards);
    }
  }, [id]);

  const handleReview = () => {
    const dueCards = cards.filter(c => c.dueDate <= Date.now() || c.status === 'new' || c.status === 'learning').sort((a,b) => a.dueDate - b.dueDate);
    if (dueCards.length === 0) {
      alert("No cards due for review!");
      return;
    }
    navigate(`/review/${id}`);
  };

  const addCard = async (front: string, back: string) => {
    if (!id) return;
    const newCard: Card = {
      id: crypto.randomUUID(),
      deckId: id,
      front,
      back,
      tags: [],
      createdAt: Date.now(),
      ease: 2.5,
      interval: 0,
      dueDate: Date.now(),
      status: 'new',
      step: 0
    };
    await db.saveCard(newCard);
    setCards([...cards, newCard]);
  };

  const handleUpdateCard = async (updatedCard: Card) => {
    await db.saveCard(updatedCard);
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const deleteDeck = async () => {
      if(!id || !confirm("Delete this deck and all cards?")) return;
      await db.deleteDeck(id);
      navigate('/');
  }

  if (!deck) return <div>Loading...</div>;

  return (
    <div className="pb-20 min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ChevronLeft className="text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{deck.name}</h1>
          </div>
          <div className="flex gap-2">
             <button onClick={deleteDeck} className="p-2 text-red-400 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
           <div className="bg-indigo-50 p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold text-indigo-600">{cards.filter(c => c.status === 'new').length}</div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">New</div>
           </div>
           <div className="bg-emerald-50 p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold text-emerald-600">{cards.filter(c => c.status === 'learning').length}</div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Learning</div>
           </div>
           <div className="bg-amber-50 p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold text-amber-600">{cards.filter(c => c.dueDate <= Date.now()).length}</div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Due</div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
           <Button onClick={handleReview} size="lg" className="flex-1 shadow-indigo-200 shadow-lg">
             <Play className="w-5 h-5 mr-2 fill-current" /> Study Now
           </Button>
           <Button variant="pastel" onClick={() => setAIModalOpen(true)} className="px-4">
             <Zap className="w-5 h-5" />
           </Button>
        </div>

        {/* Card List */}
        <div className="space-y-3">
           <h3 className="font-bold text-slate-800 text-lg mb-4">Cards ({cards.length})</h3>
           {cards.map(card => (
             <div key={card.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate mb-1">{card.front}</p>
                  <p className="text-sm text-slate-400 truncate">{card.back}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => setEditingCard(card)}
                    className="p-2 text-slate-400 hover:text-indigo-600"
                   >
                     <Edit3 size={16}/>
                   </button>
                </div>
             </div>
           ))}
           <div 
             onClick={() => {
                const f = prompt("Front:");
                const b = prompt("Back:");
                if(f && b) addCard(f,b);
             }}
             className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center text-slate-400 font-medium cursor-pointer hover:border-indigo-300 hover:text-indigo-500 transition-all"
           >
             <Plus className="w-5 h-5 mr-2" /> Add Manually
           </div>
        </div>
      </div>

      <AIDialog 
        isOpen={isAIModalOpen} 
        onClose={() => setAIModalOpen(false)} 
        onSave={(generated) => generated.forEach(g => addCard(g.front, g.back))}
      />
      <EditCardDialog 
        isOpen={!!editingCard} 
        onClose={() => setEditingCard(null)} 
        card={editingCard} 
        onSave={handleUpdateCard} 
      />
    </div>
  );
};

// --- Review Screen ---
const Review = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    if (deckId) {
      db.getCards(deckId).then(allCards => {
        const due = allCards.filter(c => c.dueDate <= Date.now() || c.status === 'new').sort((a,b) => a.dueDate - b.dueDate);
        setCards(due);
      });
    }
  }, [deckId]);

  if (!cards) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/></div>;

  if (cards.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
           <Check size={40} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">All caught up!</h2>
        <p className="text-slate-500 mb-8 max-w-xs">You've finished all your reviews for this deck today.</p>
        <Button onClick={() => navigate(-1)}>Back to Deck</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <div className="px-4 py-4 flex items-center">
         <button onClick={() => navigate(-1)}><X className="text-slate-400" /></button>
      </div>
      <ReviewSession cards={cards} onComplete={() => setCards([])} />
    </div>
  );
};

// --- Settings / Data Management ---
const SettingsPage = () => {
  const navigate = useNavigate();
  
  const handleExport = async () => {
    const json = await db.exportData();
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noji-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const text = await file.text();
    try {
      await db.importData(text);
      alert("Import successful!");
      navigate('/');
    } catch(err) {
      alert("Invalid backup file.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
         <button onClick={() => navigate('/')}><ChevronLeft/></button>
         <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Download size={20} className="text-indigo-500"/> Data Management
           </h3>
           <div className="space-y-3">
             <Button variant="secondary" onClick={handleExport} className="w-full justify-start">
               Export Backup (JSON)
             </Button>
             <div className="relative">
                <Button variant="secondary" className="w-full justify-start">
                   <Upload size={18} className="mr-2"/> Import Backup
                </Button>
                <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer"/>
             </div>
           </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl">
          <h3 className="font-bold text-indigo-900 mb-2">About</h3>
          <p className="text-indigo-700 text-sm">
             Replicated Noji UI with React & Tailwind. Data is stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Stats ---
const Stats = () => {
  const navigate = useNavigate();
  // Mock data for visualization
  const data = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 19 },
    { name: 'Wed', count: 3 },
    { name: 'Thu', count: 25 },
    { name: 'Fri', count: 15 },
    { name: 'Sat', count: 8 },
    { name: 'Sun', count: 30 },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto pb-20">
       <div className="flex items-center gap-3 mb-8">
         <button onClick={() => navigate('/')}><ChevronLeft/></button>
         <h1 className="text-2xl font-bold">Statistics</h1>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h3 className="font-bold text-slate-800 mb-6">Activity (This Week)</h3>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data}>
               <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
               <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
               <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-400 text-sm font-medium mb-1">Total Reviews</div>
             <div className="text-3xl font-bold text-slate-800">142</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-400 text-sm font-medium mb-1">Current Streak</div>
             <div className="text-3xl font-bold text-slate-800">5 <span className="text-sm text-slate-400 font-normal">days</span></div>
          </div>
       </div>
    </div>
  );
};


const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deck/:id" element={<DeckDetail />} />
        <Route path="/review/:deckId" element={<Review />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </HashRouter>
  );
};

export default App;