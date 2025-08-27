import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';

import { GameState, GamePhase, GameMessage } from '../models/game-state.model';
import { Player, PlayerAction } from '../models/player.model';
import { Card, Rank, Book, CardRequest } from '../models/card.model';
import { DeckService } from './deck';
import { CPUService } from './cpu';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly CARDS_PER_PLAYER = 7;

  private gameStateSubject = new BehaviorSubject<GameState>({
    players: [],
    currentPlayerIndex: 0,
    deck: [],
    gamePhase: GamePhase.SETUP,
    winner: null,
    lastRequest: null,
    gameStartTime: Date.now(),
    turnCount: 0,
    isAnimating: false,
    animatingCard: null,
  });

  private messagesSubject = new BehaviorSubject<GameMessage[]>([]);

  // Observables
  public gameState$ = this.gameStateSubject
    .asObservable()
    .pipe(map((state) => this.sanitizeGameStateForClient(state)));
  public messages$ = this.messagesSubject.asObservable();

  currentPlayer$ = this.gameState$.pipe(
    map((state) => state.players[state.currentPlayerIndex] || null)
  );

  winner$ = this.gameState$.pipe(
    map((state) => state.winner),
    filter((winner) => winner !== null)
  );

  gamePhase$ = this.gameState$.pipe(
    map((state) => state.gamePhase),
    distinctUntilChanged()
  );

  constructor(private deckService: DeckService, private cpuService: CPUService) {}

  // Sanitize the game before the client sees it, so they can't see CPU or other player cards
  private sanitizeGameStateForClient(state: GameState): GameState {
    const sanitizedPlayers = state.players.map((player) => {
      if (player.isHuman) {
        return player;
      } else {
        // CPU cards (in the future could add other players too)
        return {
          ...player,
          hand: player.hand.map((_, index) => ({
            id: `hidden-${player.id}-${index}`,
            suit: 'hearts' as any,
            rank: 'A' as any,
            faceUp: false,
          })),
        };
      }
    });

    return {
      ...state,
      players: sanitizedPlayers,
    };
  }

  initializeGame(playerNames: string[]) {
    let currentDeck = this.deckService.createDeck();
    const players: Player[] = [];

    // Create players and deal cards sequentially
    playerNames.forEach((name, index) => {
      const { dealtCards, remainingDeck } = this.deckService.dealCards(
        currentDeck,
        this.CARDS_PER_PLAYER
      );

      // TODO 2025-08-25 jpl
      // The app file makes the index 0 the human
      // Works fine for now but might want to change if it was a multiplayer or something
      players.push({
        id: `player-${index}`,
        name,
        hand: dealtCards,
        books: [],
        isHuman: index === 0,
        isCurrentPlayer: index === 0,
        score: 0,
        knownCards: new Map(),
      });

      // Update deck so the next player gets from where it was left off
      currentDeck = remainingDeck;
    });

    players.forEach((player) => {
      // Initialize CPU (computer) players
      if (!player.isHuman) {
        this.cpuService.initializeCPU(player.id);
      }
    });

    // Check for initial books
    players.forEach((player) => {
      this.checkAndFormBooks(player);
    });

    this.gameStateSubject.next({
      ...this.gameStateSubject.value,
      players,
      deck: currentDeck, // What remains after dealing to all players
      gamePhase: GamePhase.PLAYING,
      gameStartTime: Date.now(),
      turnCount: 1,
    });

    this.addMessage('info', 'Game started! Ask other players for cards.');
  }

  requestCards(targetPlayerId: string, rank: Rank) {
    const currentState = this.gameStateSubject.value;
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];
    const targetPlayer = currentState.players.find((p) => p.id === targetPlayerId);

    if (!currentPlayer || !targetPlayer || currentState.gamePhase !== GamePhase.PLAYING) {
      return;
    }

    const hasRank = currentPlayer.hand.some((card) => card.rank === rank);
    if (!hasRank) {
      // Shouldn't be possible to reach here, but good to check
      this.addMessage('warning', 'You can only ask for ranks you have in your hand!');
      return;
    }

    const requestedCards = targetPlayer.hand.filter((card) => card.rank === rank);

    if (requestedCards.length > 0) {
      this.addMessage(
        'success',
        `${currentPlayer.name} got ${requestedCards.length} ${rank}(s) from ${targetPlayer.name}!`
      );

      // Transfer cards immediately so they appear in the player's hand
      this.transferCards(targetPlayer.id, currentPlayer.id, requestedCards);

      // Check for books after receiving cards
      const updatedState = this.gameStateSubject.value;
      const updatedPlayer = updatedState.players.find((p) => p.id === currentPlayer.id);
      if (updatedPlayer) {
        this.checkAndFormBooks(updatedPlayer);
      }

      // For human players, add delay to let them see the new cards in their hand
      if (currentPlayer.isHuman) {
        setTimeout(() => {
          this.nextTurn();
          this.checkWinCondition();
        }, 1500);
      } else {
        this.nextTurn();
        this.checkWinCondition();
      }
    } else {
      this.addMessage('info', `${targetPlayer.name} says "Go Cricket!" to ${currentPlayer.name}`);

      if (currentPlayer.isHuman) {
        // For human players, show animation before drawing card
        this.animateGoCricket(currentPlayer.id);
      } else {
        // For the CPU don't wait just draw the card
        this.goCricket(currentPlayer.id);
        this.nextTurn();
        this.checkWinCondition();
      }
    }
  }

  private transferCards(fromPlayerId: string, toPlayerId: string, cards: Card[]) {
    const currentState = this.gameStateSubject.value;
    const updatedPlayers = currentState.players.map((player) => {
      if (player.id === fromPlayerId) {
        return {
          ...player,
          hand: player.hand.filter((card) => !cards.some((c) => c.id === card.id)),
        };
      } else if (player.id === toPlayerId) {
        return {
          ...player,
          hand: [...player.hand, ...cards],
        };
      }
      return player;
    });

    this.gameStateSubject.next({
      ...currentState,
      players: updatedPlayers,
    });
  }

  private animateGoCricket(playerId: string) {
    const currentState = this.gameStateSubject.value;
    const { drawnCard, remainingDeck } = this.deckService.drawCard(currentState.deck);

    if (drawnCard) {
      // Start animation - show the card being drawn
      this.gameStateSubject.next({
        ...currentState,
        isAnimating: true,
        animatingCard: drawnCard,
        deck: remainingDeck,
      });

      // After animation delay, add card to player's hand
      setTimeout(() => {
        this.completeGoCricket(playerId, drawnCard);
      }, 1500); // Let them see the new card
    } else {
      // No cards left in deck
      this.nextTurn();
      this.checkWinCondition();
    }
  }

  private completeGoCricket(playerId: string, drawnCard: Card) {
    const currentState = this.gameStateSubject.value;
    const updatedPlayers = currentState.players.map((player) => {
      if (player.id === playerId) {
        return {
          ...player,
          hand: [...player.hand, drawnCard],
        };
      }
      return player;
    });

    this.gameStateSubject.next({
      ...currentState,
      players: updatedPlayers,
      isAnimating: false,
      animatingCard: null,
    });

    // Check for books after drawing
    const updatedPlayer = updatedPlayers.find((p) => p.id === playerId);
    if (updatedPlayer) {
      this.checkAndFormBooks(updatedPlayer);
    }

    // End turn after animation completes
    this.nextTurn();
    this.checkWinCondition();
  }

  private goCricket(playerId: string) {
    const currentState = this.gameStateSubject.value;
    const { drawnCard, remainingDeck } = this.deckService.drawCard(currentState.deck);

    if (drawnCard) {
      const updatedPlayers = currentState.players.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            hand: [...player.hand, drawnCard],
          };
        }
        return player;
      });

      this.gameStateSubject.next({
        ...currentState,
        players: updatedPlayers,
        deck: remainingDeck,
      });

      // Check for books after drawing
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerId);
      if (updatedPlayer) {
        this.checkAndFormBooks(updatedPlayer);
      }
    }
  }

  private checkAndFormBooks(player: Player) {
    const rankCounts = new Map<Rank, Card[]>();

    // Count cards by rank
    player.hand.forEach((card) => {
      if (!rankCounts.has(card.rank)) {
        rankCounts.set(card.rank, []);
      }
      rankCounts.get(card.rank)!.push(card);
    });

    // Find books (4 of a kind)
    const newBooks: Book[] = [];
    const cardsToRemove: Card[] = [];

    rankCounts.forEach((cards, rank) => {
      if (cards.length === 4) {
        newBooks.push({
          rank,
          cards,
          playerId: player.id,
        });
        cardsToRemove.push(...cards);
      }
    });

    if (newBooks.length > 0) {
      const currentState = this.gameStateSubject.value;
      const updatedPlayers = currentState.players.map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            hand: p.hand.filter((card) => !cardsToRemove.some((c) => c.id === card.id)),
            books: [...p.books, ...newBooks],
            score: p.books.length + newBooks.length,
          };
        }
        return p;
      });

      this.gameStateSubject.next({
        ...currentState,
        players: updatedPlayers,
      });

      newBooks.forEach((book) => {
        this.addMessage('success', `${player.name} formed a book of ${book.rank}s!`);
      });
    }
  }

  private nextTurn() {
    const currentState = this.gameStateSubject.value;
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    const updatedPlayers = currentState.players.map((player, index) => ({
      ...player,
      isCurrentPlayer: index === nextPlayerIndex,
    }));

    this.gameStateSubject.next({
      ...currentState,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnCount: currentState.turnCount + 1,
    });

    // If it's a computer player's turn, make them play
    const nextPlayer = updatedPlayers[nextPlayerIndex];
    if (!nextPlayer.isHuman && nextPlayer.hand.length > 0) {
      setTimeout(() => this.makeComputerMove(nextPlayer), 1500);
    }
  }

  private makeComputerMove(player: Player) {
    const currentState = this.gameStateSubject.value;
    const otherPlayers = currentState.players.filter(
      (p) => p.id !== player.id && p.hand.length > 0
    );

    if (otherPlayers.length === 0) {
      this.nextTurn();
      return;
    }

    // Use AI service to make intelligent decisions
    const aiDecision = this.cpuService.makeAIDecision(player, otherPlayers);

    if (!aiDecision) {
      this.nextTurn();
      return;
    }

    const targetPlayer = otherPlayers.find((p) => p.id === aiDecision.targetPlayerId);
    if (!targetPlayer) {
      this.nextTurn();
      return;
    }

    this.addMessage('info', `${player.name} asks ${targetPlayer.name} for ${aiDecision.rank}s`);

    // Record the CPU's action
    // Might use this to make the CPU smarter and learn from its mistakes
    const action: PlayerAction = {
      playerId: player.id,
      type: 'request',
      targetPlayerId: aiDecision.targetPlayerId,
      rank: aiDecision.rank,
      timestamp: Date.now(),
    };

    this.cpuService.updateAIMemory(player.id, action);

    setTimeout(() => {
      this.requestCards(aiDecision.targetPlayerId, aiDecision.rank);
    }, 1000);
  }

  private checkWinCondition() {
    const currentState = this.gameStateSubject.value;
    const playersWithCards = currentState.players.filter((p) => p.hand.length > 0);

    if (playersWithCards.length <= 1) {
      // Check to see if there is a tiebreaker
      const maxBooks = Math.max(...currentState.players.map((p) => p.books.length));
      const playersWithMaxBooks = currentState.players.filter((p) => p.books.length === maxBooks);

      if (playersWithMaxBooks.length > 1) {
        // Find these players
        const tiebreakerPlayers = currentState.players.filter((p) => p.books.length === maxBooks);

        this.addMessage(
          'info',
          `Tiebreaker! ${tiebreakerPlayers
            .map((p) => p.name)
            .join(', ')} have the same number of books.`
        );
      }

      const winner = currentState.players.reduce((prev, current) =>
        prev.books.length > current.books.length ? prev : current
      );

      this.gameStateSubject.next({
        ...currentState,
        gamePhase: GamePhase.FINISHED,
        winner,
      });

      this.addMessage(
        'success',
        `Game Over! ${winner.name} wins with ${winner.books.length} books!`
      );
    }
  }

  private addMessage(type: GameMessage['type'], message: string, playerId?: string) {
    const currentMessages = this.messagesSubject.value;
    const newMessage: GameMessage = {
      type,
      message,
      timestamp: Date.now(),
      playerId,
    };

    this.messagesSubject.next([...currentMessages, newMessage]);

    // Remove msgs after 8 seconds, because sometimes they get in the way
    setTimeout(() => {
      const messages = this.messagesSubject.value;
      const filteredMessages = messages.filter((msg) => msg.timestamp !== newMessage.timestamp);
      this.messagesSubject.next(filteredMessages);
    }, 8000);
  }

  resetGame() {
    this.gameStateSubject.next({
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      gamePhase: GamePhase.SETUP,
      winner: null,
      lastRequest: null,
      gameStartTime: Date.now(),
      turnCount: 0,
      isAnimating: false,
      animatingCard: null,
    });

    this.messagesSubject.next([]);
    this.cpuService.clearAllMemories();
  }
}
