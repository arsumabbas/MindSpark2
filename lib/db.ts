import { Deck, Card, ReviewLog } from '../types';

const DB_NAME = 'NojiCloneDB';
const DB_VERSION = 1;

export class StorageService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('decks')) {
          db.createObjectStore('decks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('deckId', 'deckId', { unique: false });
          cardStore.createIndex('dueDate', 'dueDate', { unique: false });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewStore.createIndex('reviewedAt', 'reviewedAt', { unique: false });
        }
      };
    });
  }

  async getDecks(): Promise<Deck[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['decks', 'cards'], 'readonly');
      const deckStore = tx.objectStore('decks');
      const cardStore = tx.objectStore('cards');
      
      const decksRequest = deckStore.getAll();

      decksRequest.onsuccess = async () => {
        const decks = decksRequest.result as Deck[];
        // Enrich with card counts
        const cardsRequest = cardStore.getAll();
        cardsRequest.onsuccess = () => {
          const cards = cardsRequest.result as Card[];
          const now = Date.now();
          
          const enrichedDecks = decks.map(deck => {
            const deckCards = cards.filter(c => c.deckId === deck.id);
            const dueCount = deckCards.filter(c => c.dueDate <= now).length;
            const newCount = deckCards.filter(c => c.status === 'new').length;
            return {
              ...deck,
              cardCount: deckCards.length,
              dueCount,
              newCount
            };
          });
          resolve(enrichedDecks);
        };
      };
      decksRequest.onerror = () => reject(decksRequest.error);
    });
  }

  async saveDeck(deck: Deck): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('decks', 'readwrite');
      const store = tx.objectStore('decks');
      store.put(deck);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteDeck(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['decks', 'cards'], 'readwrite');
      
      // Delete deck
      tx.objectStore('decks').delete(id);
      
      // Delete associated cards
      const cardStore = tx.objectStore('cards');
      const index = cardStore.index('deckId');
      const request = index.getAllKeys(id);
      
      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach(key => cardStore.delete(key));
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCards(deckId: string): Promise<Card[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cards', 'readonly');
      const store = tx.objectStore('cards');
      const index = store.index('deckId');
      const request = index.getAll(deckId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCard(card: Card): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cards', 'readwrite');
      const store = tx.objectStore('cards');
      store.put(card);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async logReview(review: ReviewLog): Promise<void> {
     const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      store.put(review);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getReviewStats(): Promise<ReviewLog[]> {
    const db = await this.dbPromise;
     return new Promise((resolve, reject) => {
      const tx = db.transaction('reviews', 'readonly');
      const store = tx.objectStore('reviews');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Backup/Restore
  async exportData(): Promise<string> {
    const decks = await this.getDecks();
    const db = await this.dbPromise;
    const cards = await new Promise<Card[]>((resolve) => {
        const tx = db.transaction('cards', 'readonly');
        tx.objectStore('cards').getAll().onsuccess = (e) => resolve((e.target as IDBRequest).result);
    });
    const reviews = await this.getReviewStats();
    
    return JSON.stringify({ decks, cards, reviews, exportedAt: Date.now() });
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    const db = await this.dbPromise;
    const tx = db.transaction(['decks', 'cards', 'reviews'], 'readwrite');
    
    // Clear existing
    tx.objectStore('decks').clear();
    tx.objectStore('cards').clear();
    tx.objectStore('reviews').clear();

    // Import new
    data.decks.forEach((d: Deck) => tx.objectStore('decks').put(d));
    data.cards.forEach((c: Card) => tx.objectStore('cards').put(c));
    data.reviews.forEach((r: ReviewLog) => tx.objectStore('reviews').put(r));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new StorageService();
