import { Component, OnInit, effect, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardComponent } from "../../shared/components/card/card";
import { GameService } from "../../core/services/game";
import { SpeechRecognitionService } from "../../core/services/speech-recognition";
import { GameStatus } from "../../models/game";
import confetti from "canvas-confetti";

@Component({
  selector: "app-tabuleiro",
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: "./tabuleiro.html",
  styleUrls: ["./tabuleiro.scss"],
})
export class TabuleiroComponent implements OnInit {
  public gameService = inject(GameService);
  public speechService = inject(SpeechRecognitionService);

  public readonly GameStatus = GameStatus;
  public Math = Math;

  public cards = this.gameService.cards;
  public status = this.gameService.status;
  public currentLevel = this.gameService.currentLevel;
  public players = this.gameService.players;
  public currentPlayerIndex = this.gameService.currentPlayerIndex;
  public isListening = this.speechService.isListening;

  public timer = signal<number>(3);
  public testeVozSucesso = signal<boolean>(false);
  public isContraMaquina = signal<boolean>(false);

  constructor() {
    effect(async () => {
      const comando = this.speechService.transcript();

      if (comando.includes("TESTE") && this.status() === GameStatus.SETUP) {
        this.testeVozSucesso.set(true);
      }

      if (comando && this.status() === GameStatus.PLAYING) {
        this.gameService.flipCardByCoord(comando);
      }

      if (this.status() === GameStatus.CHAMPION) {
        this.dispararConfete();
        this.speechService.stop();
      }

      // LÓGICA DO BOT E CONTROLE DE MICROFONE
      const playerAtual = this.players()[this.currentPlayerIndex()];
      if (this.status() === GameStatus.PLAYING && playerAtual?.isBot) {
        this.speechService.stop(); // Desativa no turno da IA
        await new Promise(resolve => setTimeout(resolve, 1500));
        await this.gameService.executarJogadaBot();
        this.speechService.start(); // Reativa para o humano
      }
    });
  }

  ngOnInit(): void {
    this.status.set(GameStatus.SETUP);
    this.speechService.start();
  }

  /**
   * Alterna modo e desativa microfone se for Máquina
   */
  public setModoJogo(maquina: boolean): void {
    this.isContraMaquina.set(maquina);
    if (maquina) {
      this.speechService.stop();
      this.testeVozSucesso.set(true); // Auto-valida para modo bot
    } else {
      this.speechService.start();
      this.testeVozSucesso.set(false);
    }
  }

  public iniciarFasePreparacao(n1: string, n2: string): void {
    const nomeP2 = this.isContraMaquina() ? "Máquina 🤖" : (n2 || "Treinador 2");
    this.gameService.players.set([
      { name: n1 || "Treinador 1", score: 0, stars: 0, isBot: false },
      { name: nomeP2, score: 0, stars: 0, isBot: this.isContraMaquina() },
    ]);
    this.status.set(GameStatus.STARTING);
    this.contagemRegressiva(10, () => this.iniciarFaseMemorizacao());
  }

  async iniciarFaseMemorizacao() {
    const nivel = this.gameService.getCurrentLevel();
    await this.gameService.generateBoard(nivel);
    this.status.set(GameStatus.PREVIEW);
    this.contagemRegressiva(nivel.previewTime, () => this.comecarPraValer());
  }

  comecarPraValer() {
    this.gameService.cards.update(cards => cards.map(c => ({ ...c, isFlipped: false })));
    this.status.set(GameStatus.PLAYING);
    this.gameService.sortearJogadorInicial();
  }

  avancarParaProximoNivel() {
    this.gameService.proximoNivel();
    this.status.set(GameStatus.STARTING);
    this.contagemRegressiva(10, () => this.iniciarFaseMemorizacao());
  }

  reiniciarJogoTotal() {
    this.gameService.resetarNiveis();
    this.testeVozSucesso.set(false);
    this.status.set(GameStatus.SETUP);
  }

  aoSelecionarCarta(coordenada: string): void {
    this.gameService.flipCardByCoord(coordenada);
  }

  private contagemRegressiva(segundos: number, callback: Function) {
    this.timer.set(segundos);
    const interval = setInterval(() => {
      this.timer.update(v => v - 1);
      if (this.timer() <= 0) {
        clearInterval(interval);
        callback();
      }
    }, 1000);
  }

  private dispararConfete() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
  }

  trackByCardId(index: number, card: any): number { return card.id; }
}
