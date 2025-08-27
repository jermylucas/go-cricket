import { Injectable } from '@angular/core';
import { Card, Suit, Rank } from '../models/card.model';

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  createDeck(): Card[] {
    // Init the deck
    const deck: Card[] = [];
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank);

    // Loop through all the suits and ranks to create the deck of cards
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}`,
          faceUp: false,
        });
      });
    });
    // Shuffle
    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck: Card[]): Card[] {
    console.log('deck', deck);
    let shuffled = [...deck];

    let currentIndex = deck.length;

    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [shuffled[currentIndex], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[currentIndex],
      ];
    }
    console.log('shuffled', deck);

    return shuffled;
  }

  dealCards(deck: Card[], numberOfCards: number): { dealtCards: Card[]; remainingDeck: Card[] } {
    const dealtCards = deck.slice(0, numberOfCards);
    const remainingDeck = deck.slice(numberOfCards);

    return {
      dealtCards: dealtCards.map((card) => ({ ...card, faceUp: true })),
      remainingDeck,
    };
  }

  drawCard(deck: Card[]): { drawnCard: Card | null; remainingDeck: Card[] } {
    if (deck.length === 0) {
      return { drawnCard: null, remainingDeck: [] };
    }

    const drawnCard = { ...deck[0], faceUp: true };
    const remainingDeck = deck.slice(1);

    return { drawnCard, remainingDeck };
  }
}
