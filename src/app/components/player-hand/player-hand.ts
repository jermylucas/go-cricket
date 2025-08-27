import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Player } from '../../models/player.model';
import { Card, Rank } from '../../models/card.model';
import { Subject } from 'rxjs';
import { CardComponent } from '../card/card';
import { CommonModule } from '@angular/common';

interface CardRequestEvent {
  targetPlayerId: string;
  rank: Rank;
}

@Component({
  selector: 'app-player-hand',
  standalone: true,
  imports: [CardComponent, CommonModule],
  templateUrl: './player-hand.html',
  styleUrl: './player-hand.scss',
})
export class PlayerHand {
  // just setting a default player to prevent strictNullChecks concerns
  @Input() player: Player | null = {
    id: '',
    name: '',
    hand: [],
    books: [],
    isHuman: false,
    isCurrentPlayer: false,
    score: 0,
  };
  @Input() otherPlayers: Player[] = [];
  @Input() canPlay = false;

  @Output() cardRequest = new EventEmitter<CardRequestEvent>();

  selectedRank: Rank | null = null;
  private destroySubject = new Subject<void>();

  onCardSelect(card: Card) {
    if (!this.canPlay || !this.player?.isHuman) return;

    this.selectedRank = this.selectedRank === card.rank ? null : card.rank;
  }

  makeRequest(targetPlayerId: string) {
    if (!this.selectedRank) return;

    this.cardRequest.emit({
      targetPlayerId,
      rank: this.selectedRank,
    });

    this.clearSelection();
  }

  clearSelection() {
    this.selectedRank = null;
  }

  trackByCardId(_index: number, card: Card): string {
    return card.id;
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}
