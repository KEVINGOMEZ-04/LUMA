/**
 * LUMA 🌟 - Configuración Centralizada
 * "Comparte · Guarda · Revive"
 * Plataforma social de grupos privados.
 */
window.CONFIG = {
  appName: 'LUMA',
  slogan: 'Comparte · Guarda · Revive',
  version: '2.0.0',

  // Claves de LocalStorage (Namespace LUMA)
  storageKeys: {
    userProfile: 'luma_user_profile_v1',
    activeGroupId: 'luma_active_group_id_v1',
    groups: 'luma_groups_v1',
    cachedGroupData: 'luma_cached_group_data_v1',
    localPresence: 'luma_presence_local_v1',
    gdriveConfig: 'luma_gdrive_config_v1',
    audioSettings: 'luma_audio_settings_v1'
  },

  // Firebase Realtime Database
  presence: {
    provider: 'firebase',
    heartbeatIntervalMs: 15000,
    presenceTimeoutMs: 60000,
    firebaseConfig: {
      apiKey: "AIzaSyB4unckqqD22fDXpgicoogBJn2K00MgbDI",
      authDomain: "patico-diario.firebaseapp.com",
      databaseURL: "https://patico-diario-default-rtdb.firebaseio.com",
      projectId: "patico-diario",
      storageBucket: "patico-diario.firebasestorage.app",
      messagingSenderId: "209914552110",
      appId: "1:209914552110:web:fc718cd6fd49356b14e4bf"
    }
  },

  // Google Drive para almacenamiento de fotos y videos
  googleDrive: {
    enabled: true,
    parentFolderId: '1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm',
    folderPrefix: 'LUMA Archivos',
    mainFolderUrl: 'https://drive.google.com/drive/folders/1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm?usp=sharing',
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwlvCsQoPOFWsE1JEirVv16Fy2IFwzsOAUxwJtFn-QRg9u4HWpv8JowqniTGZ72OY4o/exec'
  },

  // The Movie Database (TMDB)
  media: {
    tmdbApiKey: '3fd2be6f0c70a2a598f084ddfb75487c',
    tmdbImageBaseUrl: 'https://image.tmdb.org/t/p/w500'
  },

  // Paleta Oficial LUMA
  palette: {
    primary: '#7C3AED',
    secondary: '#3B82F6',
    accent: '#22D3EE',
    highlight: '#FACC15',
    background: '#F8FAFC',
    dark: '#0F172A',
    surface: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444'
  },

  // Categorías de Objetivos Compartidos
  goalCategories: ['Viajes', 'Hogar', 'Eventos', 'Compras', 'General'],

  // Tipos de Notas Colaborativas
  noteTypes: ['Nota', 'Idea', 'Recordatorio', 'Carta'],

  // Módulos / Secciones de la aplicación
  sections: [
    { id: 'inicio', label: 'Inicio', icon: '🏡' },
    { id: 'recuerdos', label: 'Recuerdos', icon: '📸' },
    { id: 'musica', label: 'Música', icon: '🎵' },
    { id: 'cine', label: 'Películas', icon: '🎬' },
    { id: 'series', label: 'Series', icon: '📺' },
    { id: 'notas', label: 'Notas', icon: '📝' },
    { id: 'objetivos', label: 'Objetivos', icon: '✨' },
    { id: 'insights', label: 'Insights', icon: '📊' }
  ]
};
