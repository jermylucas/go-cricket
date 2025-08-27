import { Card, Rank, Book } from './card.model';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  books: Book[];
  isHuman: boolean;
  isCurrentPlayer: boolean;
  score: number;
  knownCards?: Map<string, Rank[]>;
}

export interface PlayerAction {
  playerId: string;
  type: 'request' | 'go-cricket' | 'book-formed';
  targetPlayerId?: string;
  rank?: Rank;
  cardsInvolved?: Card[];
  timestamp: number;
}

export interface GameHistory {
  actions: PlayerAction[];
  currentTurn: number;
}
