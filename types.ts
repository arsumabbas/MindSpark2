export interface Deck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  cardCount: number;
  dueCount: number;
  newCount: number;
  color?: string; // Hex code for pastel theme
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  createdAt: number;
  
  // SRS Stats
  ease: number; // Default 2.5
  interval: number; // In days
  dueDate: number; // Timestamp
  status: 'new' | 'learning' | 'review' | 'relearning';
  step: number; // For learning steps (0, 1, etc.)
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  reviewedAt: number;
  timeTaken: number; // ms
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  count: number;
}

export enum SRSRating {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

export interface AIRequest {
  topic?: string;
  content?: string;
  cardCount: number;
}
