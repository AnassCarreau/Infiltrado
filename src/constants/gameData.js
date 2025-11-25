export const WORD_PACKS = [
  { category: "Lugares", words: ["Hospital", "Playa", "Escuela", "Biblioteca", "Aeropuerto", "Cine", "Gimnasio", "Cementerio"] },
  { category: "Comida", words: ["Pizza", "Sushi", "Tacos", "Paella", "Hamburguesa", "Helado", "Ensalada", "Curry"] },
  { category: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Pingüino", "Tiburón", "Águila", "Koala"] },
  { category: "Objetos", words: ["Teléfono", "Silla", "Lápiz", "Reloj", "Zapatos", "Gafas", "Llaves", "Paraguas"] },
];

export const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  TIMER_VOTE: 60,       // Tiempo para votar
  TIMER_TURN_TEXT: 30,  // Tiempo por turno en chat
  TIMER_GLOBAL_VOICE: 180 // 3 minutos de debate global
};

export const STATUS = {
  LOBBY: 'LOBBY',
  ASSIGN: 'ASSIGN',
  PLAYING: 'PLAYING',
  VOTING: 'VOTING',
  RESULTS: 'RESULTS'
};