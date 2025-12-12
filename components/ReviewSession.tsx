import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, SRSRating } from '../types';
import { db } from '../lib/db';
import { calculateNextReview } from '../lib/srs';
import { Button } from './ui/Button';
import { X, Check, Clock, ThumbsUp } from 'lucide-react';

interface ReviewSessionProps {
  cards: Card[];
  onComplete: () => void;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({ cards, onComplete }) => {
  const [queue, setQueue] = useState<Card[]>(cards);
  const [currentCard, setCurrentCard] = useState<Card | null>(cards[0] || null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  useEffect(() => {
    if (queue.length > 0) {
      setCurrentCard(queue[0]);
      setIsFlipped(false);
    } else {
      onComplete();
    }
  }, [queue, onComplete]);

  const handleRate = async (rating: SRSRating) => {
    if (!currentCard) return;

    // Calculate next state
    const nextCardState = calculateNextReview(currentCard, rating);
    
    // Save to DB
    await db.saveCard(nextCardState);
    await db.logReview({
      id: crypto.randomUUID(),
      cardId: currentCard.id,
      rating: ['again', 'hard', 'good', 'easy'][rating] as any,
      reviewedAt: Date.now(),
      timeTaken: 0 // Simplification
    });

    // Update Queue
    if (rating === SRSRating.AGAIN) {
      // Re-queue card at end if failed
      setQueue(prev => [...prev.slice(1), nextCardState]);
    } else {
      setQueue(prev => prev.slice(1));
      setSessionStats(prev => ({ ...prev, reviewed: prev.reviewed + 1, correct: prev.correct + 1 }));
    }
  };

  if (!currentCard) return null;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4">
      {/* Progress */}
      <div className="flex justify-between text-sm text-slate-400 mb-4 font-medium">
        <span>Remaining: {queue.length}</span>
        <span>Done: {sessionStats.reviewed}</span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300" 
          style={{ width: `${(sessionStats.reviewed / (sessionStats.reviewed + queue.length)) * 100}%` }}
        />
      </div>

      {/* Card Area */}
      <div className="flex-1 perspective-1000 relative">
        <motion.div
          className="w-full h-[60vh] relative cursor-pointer"
          onClick={() => !isFlipped && setIsFlipped(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className={`w-full h-full absolute top-0 left-0 backface-hidden transition-all duration-500 transform border border-slate-100 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center p-8 text-center ${isFlipped ? 'rotate-y-180 opacity-0 pointer-events-none' : 'rotate-y-0 opacity-100'}`}
          >
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Question</h3>
            <div className="prose prose-lg text-slate-800 font-medium">
               {currentCard.front}
            </div>
            <p className="absolute bottom-8 text-slate-400 text-sm animate-pulse">Tap to flip</p>
          </div>

          <div 
            className={`w-full h-full absolute top-0 left-0 backface-hidden transition-all duration-500 transform border border-slate-100 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center p-8 text-center ${isFlipped ? 'rotate-y-0 opacity-100' : '-rotate-y-180 opacity-0 pointer-events-none'}`}
          >
             <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Answer</h3>
             <div className="prose prose-lg text-slate-800 font-medium">
               {currentCard.back}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-8 h-24">
        {!isFlipped ? (
           <Button className="w-full py-4 bg-slate-800 text-white rounded-2xl shadow-lg" onClick={() => setIsFlipped(true)}>
             Show Answer
           </Button>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleRate(SRSRating.AGAIN)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <span className="font-bold text-sm">Again</span>
                <span className="text-xs opacity-70">1m</span>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleRate(SRSRating.HARD)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <span className="font-bold text-sm">Hard</span>
                <span className="text-xs opacity-70">2d</span>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleRate(SRSRating.GOOD)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                <span className="font-bold text-sm">Good</span>
                <span className="text-xs opacity-70">4d</span>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleRate(SRSRating.EASY)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <span className="font-bold text-sm">Easy</span>
                <span className="text-xs opacity-70">7d</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
