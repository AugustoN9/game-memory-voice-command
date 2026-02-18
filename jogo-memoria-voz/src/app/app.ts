import { Component, signal } from "@angular/core";
import { TabuleiroComponent } from "./features/tabuleiro/tabuleiro";

@Component({
  standalone: true,
  selector: "app-root",
  imports: [TabuleiroComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected readonly title = signal("jogo-memoria-voz");
}
