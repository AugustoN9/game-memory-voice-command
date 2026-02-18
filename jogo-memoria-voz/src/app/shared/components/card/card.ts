import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "../../../models/game";

@Component({
  selector: "app-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card.html",
  styleUrls: ["./card.scss"],
})
export class CardComponent {
  @Input() card!: Card;
  @Output() cardClicked = new EventEmitter<string>();

  onCardClick() {
    if (!this.card.isFlipped && !this.card.isMatched) {
      this.cardClicked.emit(this.card.coord);
    }
  }
}
