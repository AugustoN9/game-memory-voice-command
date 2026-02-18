import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  public transcript = signal<string>('');
  public isListening = signal<boolean>(false);
  private recognition: any;

  constructor() {
    const { webkitSpeechRecognition }: any = window as any;

    if (!webkitSpeechRecognition) return;

    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'pt-BR';

    // CONFIGURAÇÕES CRÍTICAS PARA VELOCIDADE E ESTABILIDADE
    this.recognition.continuous = true; // Não para de ouvir após uma frase
    this.recognition.interimResults = true; // Captura o áudio enquanto você fala (mais rápido)

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const normalized = finalTranscript.trim().toUpperCase();
        this.transcript.set(normalized);
        // Limpa o sinal após 1s para permitir comandos repetidos (ex: A1, A1)
        setTimeout(() => this.transcript.set(''), 1000);
      }
    };

    // Auto-restart: Se o microfone desligar sozinho, ele religa imediatamente
    this.recognition.onend = () => {
      this.isListening.set(false);
      if (this.statusEscutaAtiva) this.start();
    };

    this.recognition.onstart = () => this.isListening.set(true);
    this.recognition.onerror = (event: any) => console.error('Erro na voz:', event.error);
  }

  private statusEscutaAtiva = false;

  start() {
    this.statusEscutaAtiva = true;
    try { this.recognition.start(); } catch(e) {}
  }

  stop() {
    this.statusEscutaAtiva = false;
    this.recognition.stop();
  }
}
