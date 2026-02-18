import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Card, GameLevel, GameStatus, Player } from "../../models/game";

@Injectable({
  providedIn: "root",
})
export class GameService {
  private http = inject(HttpClient);

  public cards = signal<Card[]>([]);
  public status = signal<GameStatus>(GameStatus.SETUP);
  public currentLevel = signal<GameLevel | null>(null);
  public players = signal<Player[]>([]);
  public currentPlayerIndex = signal<number>(0);

  private firstCardSelected: Card | null = null;
  private isChecking = false;
  private nivelAtualIndice = 0;

  private niveis: GameLevel[] = [
    { label: "Básico (2x2)", rows: 2, cols: 2, previewTime: 5 },
    { label: "Iniciante (3x4)", rows: 3, cols: 4, previewTime: 10 },
    { label: "Intermediário (3x6)", rows: 3, cols: 6, previewTime: 15 },
    { label: "Avançado I (3x8)", rows: 3, cols: 8, previewTime: 20 },
    { label: "Avançado II (3x10)", rows: 3, cols: 10, previewTime: 10 },
    { label: "Mestre (3x12)", rows: 3, cols: 12, previewTime: 10 },
  ];

  constructor() {}

  async generateBoard(level: GameLevel) {
    this.currentLevel.set(level);
    const totalPairs = (level.rows * level.cols) / 2;
    const pokemonUrls: string[] = [];
    const usedIds = new Set<number>();

    while (usedIds.size < totalPairs) {
      const randomId = Math.floor(Math.random() * 151) + 1;
      if (!usedIds.has(randomId)) {
        usedIds.add(randomId);
        pokemonUrls.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`);
      }
    }

    const gameIcons = this.shuffle([...pokemonUrls, ...pokemonUrls]);
    const newCards: Card[] = gameIcons.map((url, i) => ({
      id: i,
      value: url,
      coord: `${String.fromCharCode(65 + Math.floor(i / level.cols))}${(i % level.cols) + 1}`,
      isFlipped: true,
      isMatched: false,
    }));

    this.cards.set(newCards);
  }

  /**
   * Lógica da Máquina: Simula a jogada do Bot
   */
  async executarJogadaBot() {
    const cartasDisponiveis = this.cards().filter(c => !c.isFlipped && !c.isMatched);
    if (cartasDisponiveis.length < 2) return;

    const primeira = cartasDisponiveis[Math.floor(Math.random() * cartasDisponiveis.length)];
    this.flipCardByCoord(primeira.coord);

    await new Promise(r => setTimeout(r, 1000));

    const restantes = this.cards().filter(c => !c.isFlipped && !c.isMatched);
    const segunda = restantes[Math.floor(Math.random() * restantes.length)];
    this.flipCardByCoord(segunda.coord);
  }

  flipCardByCoord(coord: string) {
    if (this.isChecking || this.status() !== GameStatus.PLAYING) return;
    const currentCards = this.cards();
    const card = currentCards.find(c => c.coord === coord && !c.isFlipped && !c.isMatched);

    if (card) {
      card.isFlipped = true;
      this.cards.set([...currentCards]);
      if (!this.firstCardSelected) {
        this.firstCardSelected = card;
      } else {
        this.checkMatch(card);
      }
    }
  }

  private checkMatch(secondCard: Card) {
    this.isChecking = true;
    if (this.firstCardSelected?.value === secondCard.value) {
      const p = this.players();
      p[this.currentPlayerIndex()].score++;
      this.players.set([...p]);
      this.firstCardSelected.isMatched = true;
      secondCard.isMatched = true;
      this.finalizarTurno(false);
    } else {
      setTimeout(() => {
        if (this.firstCardSelected) this.firstCardSelected.isFlipped = false;
        secondCard.isFlipped = false;
        this.finalizarTurno(true);
      }, 1500);
    }
  }

  private finalizarTurno(trocarJogador: boolean) {
    this.firstCardSelected = null;
    this.isChecking = false;
    if (trocarJogador) {
      this.currentPlayerIndex.update(idx => (idx + 1) % this.players().length);
    }
    this.cards.set([...this.cards()]);
    this.verificarVitoria();
  }

  private verificarVitoria() {
    const allMatched = this.cards().every((c) => c.isMatched);
    if (allMatched && this.cards().length > 0) {
      const p = this.players();
      if (p[0].score !== p[1].score) {
        const vencedor = p[0].score > p[1].score ? 0 : 1;
        p[vencedor].stars++;
        this.players.set([...p]);
      }
      this.status.set(this.nivelAtualIndice === this.niveis.length - 1 ? GameStatus.CHAMPION : GameStatus.WON);
    }
  }

  public proximoNivel(): GameLevel {
    this.nivelAtualIndice++;
    if (this.nivelAtualIndice >= this.niveis.length) this.nivelAtualIndice = 0;
    this.players.set(this.players().map(p => ({ ...p, score: 0 })));
    return this.niveis[this.nivelAtualIndice];
  }

  public getProximoLabel() { return this.nivelAtualIndice + 1 < this.niveis.length ? this.niveis[this.nivelAtualIndice + 1].label : "Fim"; }
  public getCurrentLevel() { return this.niveis[this.nivelAtualIndice]; }
  public resetarNiveis() { this.nivelAtualIndice = 0; return this.niveis[0]; }
  public sortearJogadorInicial() { this.currentPlayerIndex.set(Math.floor(Math.random() * this.players().length)); }
  private shuffle(array: any[]) { return array.sort(() => Math.random() - 0.5); }
}
