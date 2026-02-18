import { Injectable, signal } from "@angular/core";
import { Card, GameLevel, GameStatus, Player } from "../../models/game";

@Injectable({
  providedIn: "root",
})
export class GameService {
  // Sinais para estado reativo
  public cards = signal<Card[]>([]);
  public status = signal<GameStatus>(GameStatus.SETUP);
  public currentLevel = signal<GameLevel | null>(null);
  public players = signal<Player[]>([]);
  public currentPlayerIndex = signal<number>(0);

  // Controle interno de turnos
  private firstCardSelected: Card | null = null;
  private isChecking = false;
  private icons = [
    "🍎",
    "🍌",
    "🍇",
    "🍓",
    "🍒",
    "🍍",
    "🥭",
    "🍉",
    "🥝",
    "🍋",
    "🍐",
    "🫐",
  ];

  private niveis: GameLevel[] = [
    { label: "Básico (2x2)", rows: 2, cols: 2, previewTime: 10 },
    { label: "Iniciante (3x4)", rows: 3, cols: 4, previewTime: 15 },
    { label: "Intermediário (3x6)", rows: 3, cols: 6, previewTime: 20 },
    { label: "Avançado I (3x8)", rows: 3, cols: 8, previewTime: 15 },
    { label: "Avançado II (3x8)", rows: 3, cols: 8, previewTime: 10 },
    { label: "Mestre (3x8)", rows: 3, cols: 8, previewTime: 5 },
  ];

  private nivelAtualIndice = 0;

  constructor() {}

  /**
   * Gera o tabuleiro e define as cartas como viradas para a fase de PREVIEW
   */
  generateBoard(level: GameLevel) {
    this.currentLevel.set(level);
    const totalCards = level.rows * level.cols;
    const selectedIcons = this.icons.slice(0, totalCards / 2);
    const gameIcons = this.shuffle([...selectedIcons, ...selectedIcons]);

    const newCards: Card[] = gameIcons.map((icon, i) => ({
      id: i,
      value: icon,
      coord: `${String.fromCharCode(65 + Math.floor(i / level.cols))}${
        (i % level.cols) + 1
      }`,
      isFlipped: true, // Importante: começam viradas para a fase de memorização
      isMatched: false,
    }));

    this.cards.set(newCards);
  }

  /**
   * Lógica acionada por Voz ou Clique
   */
  flipCardByCoord(coord: string) {
    if (this.isChecking || this.status() !== GameStatus.PLAYING) return;

    const currentCards = this.cards();
    const card = currentCards.find(
      (c) => c.coord === coord && !c.isFlipped && !c.isMatched
    );

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

  /**
   * Valida se as duas cartas escolhidas são um par
   */
  private checkMatch(secondCard: Card) {
    this.isChecking = true;

    if (this.firstCardSelected?.value === secondCard.value) {
      // ACERTOU: Incrementa score do jogador atual
      const players = this.players();
      players[this.currentPlayerIndex()].score++;
      this.players.set([...players]);

      this.firstCardSelected.isMatched = true;
      secondCard.isMatched = true;

      this.finalizarTurno(false); // Mantém o mesmo jogador
    } else {
      // ERROU: Aguarda 1.5s e desvira as cartas
      setTimeout(() => {
        if (this.firstCardSelected) this.firstCardSelected.isFlipped = false;
        secondCard.isFlipped = false;
        this.finalizarTurno(true); // Passa a vez
      }, 1500);
    }
  }

  private finalizarTurno(trocarJogador: boolean) {
    this.firstCardSelected = null;
    this.isChecking = false;

    if (trocarJogador) {
      this.currentPlayerIndex.update(
        (idx) => (idx + 1) % this.players().length
      );
    }

    this.cards.set([...this.cards()]);
    this.verificarVitoria();
  }

  sortearJogadorInicial() {
    const index = Math.floor(Math.random() * this.players().length);
    this.currentPlayerIndex.set(index);
  }

  private shuffle(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  /**
   * Avança para o próximo nível ou reseta se chegar ao fim
   */
  public resetarPontosParaNovaFase() {
    const p = this.players().map((player) => ({
      ...player,
      score: 0, // Zera os pontos da rodada
    }));
    this.players.set(p);
  }

  public proximoNivel(): GameLevel {
    this.nivelAtualIndice++;
    if (this.nivelAtualIndice >= this.niveis.length) {
      this.nivelAtualIndice = 0;
    }

    // Chamamos o reset de pontos aqui
    this.resetarPontosParaNovaFase();

    return this.niveis[this.nivelAtualIndice];
  }

  public getProximoLabel(): string {
    const proximoIndice = this.nivelAtualIndice + 1;
    return proximoIndice < this.niveis.length
      ? this.niveis[proximoIndice].label
      : "Fim do Jogo";
  }

  private verificarVitoria() {
    const allMatched = this.cards().every((c) => c.isMatched);
    if (allMatched && this.cards().length > 0) {
      // Lógica das Estrelas: O jogador com mais pontos no nível ganha uma estrela
      const players = this.players();
      if (players[0].score !== players[1].score) {
        const vencedorIndice = players[0].score > players[1].score ? 0 : 1;
        players[vencedorIndice].stars++;
        this.players.set([...players]);
      }
      if (this.nivelAtualIndice === 5) {
        // Índice do nível 3x8
        this.status.set(GameStatus.CHAMPION);
      } else {
        this.status.set(GameStatus.WON);
      }
    }
  }

  resetarNiveis() {
    this.nivelAtualIndice = 0;
    return this.niveis[0];
  }

  public getCurrentLevel(): GameLevel {
    return this.niveis[this.nivelAtualIndice];
  }
}
