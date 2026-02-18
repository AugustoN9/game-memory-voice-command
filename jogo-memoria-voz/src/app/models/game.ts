export interface Card {
  id: number;          // ID único para controle interno e trackBy
  value: string;       // O conteúdo da carta (ex: '🍎', '🚗' ou nome de imagem)
  coord: string;       // Coordenada para comando de voz (ex: 'A1', 'B2', 'C3')
  isFlipped: boolean;  // Estado atual da carta (virada ou não)
  isMatched: boolean;  // Indica se o par já foi encontrado com sucesso
}

export interface GameLevel {
 label: string;       // Nome exibido (Ex: "Nível 1", "Intermediário")
  rows: number;        // Quantidade de linhas (A, B, C...)
  cols: number;        // Quantidade de colunas (1, 2, 3...)
  previewTime: number; // Tempo de memorização em segundos (10s)
}

export enum GameStatus {
  SETUP = 'SETUP',           // Tela inicial de nomes
  STARTING = 'STARTING',     // Timer de 10s para preparativos
  PREVIEW = 'PREVIEW',       // 10s memorizando as figuras
  PLAYING = 'PLAYING',       // Jogo ativo (voz/clique)
  WON = 'WON',                // Fim de jogo
  CHAMPION = 'CHAMPION'
}

export interface Player {
  name: string;
  score: number;
  stars: number;
  isBot?: boolean;
}
