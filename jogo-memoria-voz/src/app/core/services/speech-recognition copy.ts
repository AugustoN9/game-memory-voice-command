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

    if (!webkitSpeechRecognition) {
      console.error('Este navegador não suporta a Web Speech API.');
      return;
    }

    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1][0].transcript;

      // Ajuste: Mantemos os espaços e apenas removemos excessos nas pontas
      // Facilitamos a leitura para coordenadas como "A 1" ou comandos como "Teste"
      const normalized = result.trim().toUpperCase();
      this.transcript.set(normalized);
    };

    this.recognition.onstart = () => this.isListening.set(true);
    this.recognition.onend = () => this.isListening.set(false);
    this.recognition.onerror = (event: any) => console.error('Erro na voz:', event.error);
  }

  start() {
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Reconhecimento já estava ativo');
    }
  }

  stop() {
    this.recognition.stop();
  }
}
