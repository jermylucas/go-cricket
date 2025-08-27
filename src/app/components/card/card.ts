import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { Card, Suit } from '../../models/card.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class CardComponent {
  @Input() card!: Card;
  @Input() selectable = false;
  @Input() selected = false;
  @Input() isDealing = false;
  @Input() isMoving = false;

  @Output() cardClick = new EventEmitter<Card>();

  @HostBinding('class.card-container') cardContainer = true;

  onCardClick() {
    if (this.selectable) {
      this.cardClick.emit(this.card);
    }
  }

  getSuitSymbol(): string {
    switch (this.card.suit) {
      case Suit.HEARTS:
        return '♥';
      case Suit.DIAMONDS:
        return '♦';
      case Suit.CLUBS:
        return '♣';
      case Suit.SPADES:
        return '♠';
      default:
        return '';
    }
  }

  getSuitColor(): string {
    return this.card.suit === Suit.HEARTS || this.card.suit === Suit.DIAMONDS ? 'red' : 'black';
  }
}
