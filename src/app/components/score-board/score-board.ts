import { Component, Input } from '@angular/core';
import { Player } from '../../models/player.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-board',
  imports: [CommonModule],
  templateUrl: './score-board.html',
  styleUrl: './score-board.scss',
})
export class ScoreBoard {
  @Input() players: Player[] = [];
  @Input() currentPlayer: Player | null = null;

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  getTotalBooks(): number {
    return this.players.reduce((total, player) => total + player.books.length, 0);
  }

  getTotalCards(): number {
    return this.players.reduce((total, player) => total + player.hand.length, 0);
  }

  getCardsLeft(): number {
    return 52 - (this.getTotalCards() + this.getTotalBooks() * 4);
  }

  getLeader(): Player | null {
    if (this.players.length === 0) return null;

    // check for a tie
    const maxBooks = Math.max(...this.players.map((p) => p.books.length));
    const playersWithMaxBooks = this.players.filter((p) => p.books.length === maxBooks);
    if (playersWithMaxBooks.length > 1) {
      return null;
    }

    return this.players.reduce((leader, player) => {
      if (!leader || player.books.length > leader.books.length) {
        return player;
      }
      return leader;
    });
  }
}
