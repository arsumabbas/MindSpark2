import { Card, SRSRating } from '../types';
import { SRS_CONFIG } from '../constants';

// Helper to add days to a date
const addDays = (date: number, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.getTime();
};

const addMinutes = (date: number, minutes: number) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result.getTime();
};

export const calculateNextReview = (card: Card, rating: SRSRating): Card => {
  let { ease, interval, status, step } = card;
  const now = Date.now();

  // If rating is AGAIN (fail)
  if (rating === SRSRating.AGAIN) {
    step = 0;
    status = 'learning';
    const nextDue = addMinutes(now, SRS_CONFIG.learningSteps[0]);
    
    // Penalty for ease
    ease = Math.max(1.3, ease - 0.2);
    interval = 0; // Reset interval
    
    return { ...card, ease, interval, status, step, dueDate: nextDue };
  }

  // Handle Learning Phase
  if (status === 'learning' || status === 'new') {
    if (rating === SRSRating.GOOD || rating === SRSRating.EASY) {
      if (step < SRS_CONFIG.learningSteps.length - 1) {
        // Move to next learning step
        step += 1;
        const nextDue = addMinutes(now, SRS_CONFIG.learningSteps[step]);
        return { ...card, step, status: 'learning', dueDate: nextDue };
      } else {
        // Graduate
        status = 'review';
        interval = SRS_CONFIG.graduatingInterval;
        if (rating === SRSRating.EASY) interval = SRS_CONFIG.easyInterval;
        const nextDue = addDays(now, interval);
        return { ...card, step: 0, status, interval, dueDate: nextDue };
      }
    } else if (rating === SRSRating.HARD) {
      // Repeat current step
      const nextDue = addMinutes(now, SRS_CONFIG.learningSteps[step]);
      return { ...card, dueDate: nextDue };
    }
  }

  // Handle Review Phase
  if (status === 'review') {
    let newInterval = interval;
    
    if (rating === SRSRating.HARD) {
      newInterval = Math.floor(interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === SRSRating.GOOD) {
      newInterval = Math.floor(interval * ease);
    } else if (rating === SRSRating.EASY) {
      newInterval = Math.floor(interval * ease * 1.3);
      ease += 0.15;
    }

    const nextDue = addDays(now, newInterval);
    return { ...card, interval: newInterval, ease, dueDate: nextDue };
  }

  return card;
};
