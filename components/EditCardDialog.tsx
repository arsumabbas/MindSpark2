import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { Card } from '../types';
import { Button } from './ui/Button';

interface EditCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onSave: (updatedCard: Card) => Promise<void>;
}

export const EditCardDialog: React.FC<EditCardDialogProps> = ({ isOpen, onClose, card, onSave }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
      setTags(card.tags ? card.tags.join(', ') : '');
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return;
    setLoading(true);
    try {
      const updatedCard: Card = {
        ...card,
        front,
        back,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await onSave(updatedCard);
      onClose();
    } catch (error) {
      console.error("Failed to save card", error);
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
          <Edit3 className="w-5 h-5" />
          <h2 className="text-lg font-bold">Edit Card</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Front (Question)
            </label>
            <textarea
              className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm leading-relaxed"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. What is the capital of France?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Back (Answer)
            </label>
            <textarea
              className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm leading-relaxed"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. Paris"
            />
          </div>

           <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. geography, easy"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading || !front.trim() || !back.trim()} 
            className="w-full flex items-center gap-2 justify-center"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
