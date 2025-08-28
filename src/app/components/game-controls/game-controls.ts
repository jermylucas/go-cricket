import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { GamePhase } from '../../models/game-state.model';
import { Player } from '../../models/player.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-controls',
  imports: [CommonModule],
  templateUrl: './game-controls.html',
  styleUrl: './game-controls.scss',
})
export class GameControls implements OnInit, OnDestroy {
  @Input() gamePhase: GamePhase = GamePhase.SETUP;
  @Input() winner: Player | null = null;
  @Input() winners: Player[] = [];
  @Input() gameStartTime: number = 0;

  @Output() resetGame = new EventEmitter<void>();

  showRules = false;
  private timerInterval: any = null;
  private currentDuration = '0:00';

  ngOnInit() {
    if (localStorage.getItem('hasVisited') === null) {
      this.showRules = true;
      localStorage.setItem('hasVisited', 'true');
    }
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  onResetGame() {
    this.resetGame.emit();
  }

  toggleRules() {
    this.showRules = !this.showRules;
  }

  private startTimer() {
    this.stopTimer(); // Clear any existing timer
    this.timerInterval = setInterval(() => {
      this.updateDuration();
    }, 1000);
    this.updateDuration(); // Update immediately
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateDuration() {
    if (this.gameStartTime > 0) {
      const duration = Date.now() - this.gameStartTime;
      const seconds = Math.floor((duration % 60000) / 1000);
      const minutes = Math.floor(duration / 60000);
      this.currentDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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

  getGameDuration() {
    return this.currentDuration;
  }
}
