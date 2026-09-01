/**
 * LUMA 🌟 - Configuración Centralizada
 */

window.CONFIG = {
  app: {
    name: "LUMA",
    version: "1.0.0",
    slogan: "Comparte · Guarda · Revive",
    badge: "LUMA 🌟",
    author: "LUMA Team"
  },

  storageKeys: {
    userProfile: "luma_user_profile",
    groups: "luma_groups",
    activeGroup: "luma_active_group_id",
    groupData: "luma_group_data_"
  },

  sections: [
    { id: "inicio", label: "Inicio", icon: "🌟" },
    { id: "recuerdos", label: "Recuerdos", icon: "📸" },
    { id: "musica", label: "Música", icon: "🎵" },
    { id: "cine", label: "Cine", icon: "🎬" },
    { id: "series", label: "Series", icon: "📺" },
    { id: "notas", label: "Notas", icon: "📝" },
    { id: "objetivos", label: "Objetivos", icon: "✨" },
    { id: "insights", label: "Insights", icon: "📊" }
  ],

  firebase: {
    enabled: true,
    config: {
      apiKey: "AIzaSyDummyKeyForLumaApp1234567890",
      authDomain: "patico-diario.firebaseapp.com",
      databaseURL: "https://patico-diario-default-rtdb.firebaseio.com",
      projectId: "patico-diario",
      storageBucket: "patico-diario.firebasestorage.app",
      messagingSenderId: "103948572910",
      appId: "1:103948572910:web:8a9b0c1d2e3f4a5b6c7d8e"
    }
  },

  tmdb: {
    apiKey: "4e44d9029b1270a757cddc766a1bcb63",
    baseUrl: "https://api.themoviedb.org/3",
    imageBaseUrl: "https://image.tmdb.org/t/p/w500",
    language: "es-ES"
  }
};