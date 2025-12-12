import React, { useState } from 'react';
import { X, Sparkles, Loader2, FileText, Type } from 'lucide-react';
import { generateFlashcards } from '../services/geminiService';
import { Button } from './ui/Button';

interface AIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cards: Array<{front: string, back: string}>) => void;
}

export const AIDialog: React.FC<AIDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const cards = await generateFlashcards(text);
      onSave(cards);
      onClose();
      setText('');
    } catch (e) {
      setError('Failed to generate cards. Check API Key or try shorter text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6 text-indigo-600">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-bold">Generate with AI</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste Content (Notes, Article, PDF Text)
            </label>
            <textarea
              className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm leading-relaxed"
              placeholder="Paste your study notes here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button 
            onClick={handleGenerate} 
            disabled={loading || !text.trim()} 
            className="w-full flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Cards'}
          </Button>
          
          <p className="text-xs text-center text-slate-400 mt-2">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
};
