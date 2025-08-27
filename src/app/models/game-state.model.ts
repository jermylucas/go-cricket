import { Player } from './player.model';
import { Card, CardRequest } from './card.model';

export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  gamePhase: GamePhase;
  winner: Player | null;
  lastRequest: CardRequest | null;
  gameStartTime: number;
  turnCount: number;
  isAnimating: boolean;
  animatingCard: Card | null;
  animationType?: 'deck-draw' | 'card-transfer';
  transferInfo?: {
    fromPlayerId: string;
    toPlayerId: string;
    cards: Card[];
  };
}

export interface GameConfig {
  numberOfPlayers: number;
  cardsPerPlayer: number;
  playerNames: string[];
}

export interface GameMessage {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  playerId?: string;
}
