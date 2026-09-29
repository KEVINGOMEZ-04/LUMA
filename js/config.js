/**
 * LUMA 🌟 - Configuración Centralizada
 */

window.CONFIG = {
  appName: 'LUMA',
  tagline: 'Comparte · Guarda · Revive',
  version: '1.0.0',

  // TMDb API (The Movie Database)
  tmdb: {
    apiKey: 'e9e9d8da18ae29fc430845952232787c',
    backupKeys: [
      '8265bd1679663a7ea12ac168da84d2e8',
      'cfe422613b250f702980a3bbf9e90716'
    ],
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    language: 'es-ES'
  },

  // Firebase Realtime Database & Hosting
  firebase: {
    enabled: true,
    config: {
      apiKey: "AIzaSy_YOUR_API_KEY_HERE",
      authDomain: "luma-f53ee.firebaseapp.com",
      databaseURL: "https://luma-f53ee-default-rtdb.firebaseio.com",
      projectId: "luma-f53ee",
      storageBucket: "luma-f53ee.firebasestorage.app",
      messagingSenderId: "854351141592",
      appId: "1:854351141592:web:29c2a15b898638a00655ad"
    }
  },

  // Google Drive Master Cloud Bridge
  googleDrive: {
    defaultBridgeUrl: 'https://script.google.com/macros/s/AKfycbx3nWf8YgIzkq1Kna1yfB9rv0d3gjr9xvV1yiE-qb5qwzaV6rFujoacsFjOgMkRrbOFiQ/exec'
  },

  // Módulos / Secciones del Menú (Insights integrado en Inicio)
  sections: [
    { id: 'inicio', label: 'Inicio', icon: '🏠' },
    { id: 'recuerdos', label: 'Recuerdos', icon: '📸' },
    { id: 'musica', label: 'Música', icon: '🎵' },
    { id: 'cine', label: 'Cine', icon: '🎬' },
    { id: 'series', label: 'Series', icon: '📺' },
    { id: 'notas', label: 'Notas', icon: '📝' },
    { id: 'mensajes', label: 'Mensajes', icon: '💬' }
  ],

  // Claves de LocalStorage
  storageKeys: {
    userProfile: 'luma_user_profile',
    activeGroup: 'luma_active_group_id',
    groups: 'luma_user_groups',
    groupData: 'luma_data_',
    notifications: 'luma_user_notifications'
  }
};