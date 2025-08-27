import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GamePhase } from '../../models/game-state.model';
import { Player } from '../../models/player.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-controls',
  imports: [CommonModule],
  templateUrl: './game-controls.html',
  styleUrl: './game-controls.scss',
})
export class GameControls {
  @Input() gamePhase: GamePhase = GamePhase.SETUP;
  @Input() winner: Player | null = null;
  @Input() gameStartTime: number = Date.now();

  @Output() resetGame = new EventEmitter<void>();

  showRules = false;

  onResetGame() {
    this.resetGame.emit();
  }

  toggleRules() {
    this.showRules = !this.showRules;
  }

  getPhaseClass(): string {
    switch (this.gamePhase) {
      case GamePhase.SETUP:
        return 'phase-setup';
      case GamePhase.PLAYING:
        return 'phase-playing';
      case GamePhase.FINISHED:
        return 'phase-finished';
      default:
        return '';
    }
  }

  getPhaseIcon(): string {
    switch (this.gamePhase) {
      case GamePhase.SETUP:
        return '⚙️';
      case GamePhase.PLAYING:
        return '🎮';
      case GamePhase.FINISHED:
        return '🏁';
      default:
        return '❓';
    }
  }

  getPhaseText(): string {
    switch (this.gamePhase) {
      case GamePhase.SETUP:
        return 'Setting up game...';
      case GamePhase.PLAYING:
        return 'Game in progress';
      case GamePhase.FINISHED:
        return 'Game finished';
      default:
        return 'Unknown phase';
    }
  }

  getGameDuration(): string {
    // Change detection sometimes catches this and makes it stop
    // So you might notice the timer pause until you make a move
    const duration = Date.now() - this.gameStartTime;
    const seconds = Math.floor((duration % 60000) / 1000);
    const minutes = Math.floor(duration / 60000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
