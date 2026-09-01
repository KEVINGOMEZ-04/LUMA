/**
 * LUMA 🌟 - Configuración Centralizada
 */

window.CONFIG = {
  appName: 'LUMA',
  tagline: 'Comparte · Guarda · Revive',
  version: '1.0.0',

  // TMDb API (The Movie Database)
  tmdb: {
    apiKey: '900355444a10e6e76cf0e359c19b023f',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    language: 'es-ES'
  },

  // Firebase Realtime Database
  firebase: {
    enabled: true,
    config: {
      apiKey: "AIzaSyDummyKeyForPresenceOnly_LUMA2026",
      authDomain: "luma-social-app.firebaseapp.com",
      databaseURL: "https://luma-social-app-default-rtdb.firebaseio.com",
      projectId: "luma-social-app",
      storageBucket: "luma-social-app.appspot.com",
      messagingSenderId: "1029384756",
      appId: "1:1029384756:web:luma2026app"
    }
  },

  // Módulos / Secciones del Menú (Insights integrado en Inicio)
  sections: [
    { id: 'inicio', label: 'Inicio', icon: '🏠' },
    { id: 'recuerdos', label: 'Recuerdos', icon: '📸' },
    { id: 'musica', label: 'Música', icon: '🎵' },
    { id: 'cine', label: 'Cine', icon: '🎬' },
    { id: 'series', label: 'Series', icon: '📺' },
    { id: 'notas', label: 'Notas', icon: '📝' },
    { id: 'objetivos', label: 'Objetivos', icon: '✨' }
  ],

  // Claves de LocalStorage
  storageKeys: {
    userProfile: 'luma_user_profile',
    activeGroup: 'luma_active_group_id',
    groups: 'luma_user_groups',
    groupData: 'luma_data_'
  }
};