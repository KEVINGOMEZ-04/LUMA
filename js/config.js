/**
 * ATRIA ✨ - Configuración Centralizada
 * La puerta de entrada a nuestro mundo compartido: Kevin & Wendy
 */
window.CONFIG = {
  appName: 'ATRIA ✨',
  version: '1.0.0',
  
  // Claves de LocalStorage
  storageKeys: {
    unlocked: 'patico_unlocked_v2',
    currentUser: 'patico_current_user_v1',
    memories: 'patico_memories_v1',
    movies: 'patico_movies_v1',
    series: 'patico_series_v1',
    notes: 'patico_notes_v1',
    dreams: 'patico_dreams_v1',
    songs: 'patico_songs_v1',
    dailyPrompts: 'patico_daily_prompts_v1',
    timeCapsules: 'patico_time_capsules_v1',
    credentials: 'patico_credentials_v1',
    profiles: 'patico_profiles_v1',
    localPresence: 'patico_presence_local_v1',
    remoteConfig: 'patico_presence_remote_config_v1',
    googleDrive: 'patico_gdrive_config_v1'
  },

  // Configuración de Presencia Compartida y Sincronización en Tiempo Real
  presence: {
    provider: 'firebase',
    roomId: 'kevin-wendy-wrapped-room',
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

  // Configuración de Google Drive para Recuerdos
  googleDrive: {
    enabled: true,
    parentFolderId: '1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm',
    folderPrefix: 'Patico Recuerdos',
    mainFolderUrl: 'https://drive.google.com/drive/folders/1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm?usp=sharing',
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwlvCsQoPOFWsE1JEirVv16Fy2IFwzsOAUxwJtFn-QRg9u4HWpv8JowqniTGZ72OY4o/exec',
    get folderUrl() {
      return localStorage.getItem('patico_gdrive_main_url') || this.mainFolderUrl;
    }
  },

  // Configuración de sincronización en la nube (GitHub & Remote Sync)
  cloudSync: {
    enabled: true,
    repoOwner: 'KEVINGOMEZ-04',
    repoName: 'wendy',
    filePath: 'data/journal.json',
    branch: 'main',
    get token() {
      return localStorage.getItem('patico_github_token') || '';
    },
    syncIntervalMs: 25000
  },

  // Usuarios del diario compartido
  users: ['Kevin', 'Wendy'],
  defaultUser: 'Kevin',

  // Conexión con The Movie Database (TMDB) para pósters en HD y sinopsis oficiales
  media: {
    tmdbApiKey: '3fd2be6f0c70a2a598f084ddfb75487c',
    omdbApiKey: '',
    tmdbImageBaseUrl: 'https://image.tmdb.org/t/p/w500'
  },

  // Paleta oficial
  theme: {
    bg: '#120E1C',
    purple: '#6D4A99',
    lilac: '#B98EE6',
    sunflowerGold: '#F4C542',
    lightYellow: '#F8D96B',
    textMain: '#F1E9FB',
    textSecondary: '#B7A7CC',
    kevinColor: '#00E5FF',
    wendyColor: '#E040FB',
    dualBlendColor: '#7092FD'
  },

  // Secciones
  sections: [
    { id: 'inicio', number: 1, label: 'Inicio', icon: '🏡' },
    { id: 'recuerdos', number: 2, label: 'Recuerdos', icon: '🌻' },
    { id: 'musica', number: 3, label: 'Música', icon: '🎵' },
    { id: 'cine', number: 4, label: 'Películas', icon: '🎬' },
    { id: 'series', number: 5, label: 'Series', icon: '📺' },
    { id: 'muro', number: 6, label: 'Notas', icon: '💌' },
    { id: 'suenos', number: 7, label: 'Sueños', icon: '🌟' }
  ]
};
