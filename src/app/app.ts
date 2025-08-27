import { Component, OnInit, OnDestroy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { GameService } from './services/game';
import { Player } from './models/player.model';
import { GameState, GamePhase, GameMessage } from './models/game-state.model';
import { Rank } from './models/card.model';

import { CardComponent } from './components/card/card';
import { ScoreBoard } from './components/score-board/score-board';
import { PlayerHand } from './components/player-hand/player-hand';
import { GameControls } from './components/game-controls/game-controls';
@Component({
  selector: 'app-root',
  imports: [ScoreBoard, PlayerHand, CardComponent, GameControls, CommonModule, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  playerName: string = 'User';

  // Destroy subject for easy ondestroy method
  private destroySubject = new Subject<void>();
  GamePhase = GamePhase;
  currentTime = Date.now();

  // Observables for game
  gameState$!: Observable<GameState>;
  currentPlayer$!: Observable<Player | null>;
  winner$!: Observable<Player | null>;
  messages$!: Observable<GameMessage[]>;
  players$!: Observable<Player[]>;
  otherPlayers$!: Observable<Player[]>;
  canPlay$!: Observable<boolean>;
  gamePhase$!: Observable<GamePhase>;

  constructor(private gameService: GameService) {
    // Initialize observables
    this.gameState$ = this.gameService.gameState$;
    this.currentPlayer$ = this.gameService.currentPlayer$;
    this.winner$ = this.gameService.winner$;
    this.messages$ = this.gameService.messages$;

    this.players$ = this.gameState$.pipe(map((state) => state.players));

    this.otherPlayers$ = combineLatest([this.gameState$, this.currentPlayer$]).pipe(
      map(([state, currentPlayer]) =>
        state.players.filter((player) => player.id !== currentPlayer?.id)
      )
    );

    this.canPlay$ = combineLatest([this.gameState$, this.currentPlayer$]).pipe(
      map(
        ([state, currentPlayer]) =>
          state.gamePhase === GamePhase.PLAYING &&
          !!currentPlayer?.isHuman &&
          (currentPlayer?.hand.length || 0) > 0
      )
    );

    this.gamePhase$ = this.gameState$.pipe(map((state) => state.gamePhase));
  }

  ngOnInit() {
    this.playerName = prompt('What is your name?', 'User') || 'User';

    this.startNewGame();

    this.gameState$.pipe(takeUntil(this.destroySubject)).subscribe((state) => {
      // Handle any game state changes if needed
      console.log('game state', state);
      if (state.gamePhase === GamePhase.FINISHED && state.winner) {
        this.playWinSound();
      }
    });
  }

  startNewGame() {
    const playerNames = [this.playerName, 'CPU Alice', 'CPU Bob', 'CPU Charlie'];
    this.gameService.initializeGame(playerNames);
  }

  onCardRequest(event: { targetPlayerId: string; rank: Rank }) {
    this.gameService.requestCards(event.targetPlayerId, event.rank);
  }

  resetGame() {
    this.gameService.resetGame();
    // Start a new game after reset
    setTimeout(() => {
      this.startNewGame();
    }, 100);
  }

  getRecentMessages(messages: GameMessage[] | null): GameMessage[] {
    if (!messages) return [];
    return messages.slice(-5); // Show last 5 messages
  }

  trackByMessageId(_index: number, message: GameMessage): number {
    return message.timestamp;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  createDeckCard(): any {
    return {
      id: 'deck-back',
      suit: 'hearts',
      rank: 'A',
      faceUp: false,
    };
  }

  private playWinSound() {
    // Simple audio feedback for winning
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Audio not supported or blocked
      console.log('Audio not available');
    }
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}
