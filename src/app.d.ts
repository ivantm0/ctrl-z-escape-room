declare global {
  namespace App {
    // Pasillo del Archivo Perdido, guardado en el historial con shallow routing
    interface PageState {
      pasillo?: number;
    }
  }
}

export {};
