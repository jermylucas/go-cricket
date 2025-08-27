export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Cards should all be different, so this is just the suit-rank combo
  faceUp?: boolean;
}

export interface CardRequest {
  fromPlayerId: string;
  toPlayerId: string;
  rank: Rank;
  result: 'success' | 'go-cricket';
  cardsReceived?: Card[];
}

export interface Book {
  rank: Rank;
  cards: Card[];
  playerId: string;
}
