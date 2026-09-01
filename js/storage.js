/**
 * Patico Wrapped 🌻 - Capa de Persistencia Local (LocalStorage)
 */

(function() {
  const INITIAL_DATA = {
    memories: [
      {
        id: 'demo-memory-1',
        date: '2026-02-14',
        title: 'Nuestro primer picnic',
        description: 'Bajo la sombra de los árboles, compartiendo risas, fresas y la promesa silenciosa de que este era solo el comienzo de nuestra historia.',
        photo: '',
        status: 'Destacado',
        createdAt: '2026-02-14T15:30:00.000Z',
        updatedAt: '2026-02-14T15:30:00.000Z',
        isDemo: true
      }
    ],

    movies: [
      {
        id: 'demo-movie-1',
        title: 'Elementos',
        year: 2023,
        proposedBy: 'Kevin',
        priority: 5,
        status: 'Me encantó',
        kevinRating: 10,
        wendyRating: 10,
        kevinComment: 'La película donde empezó a escribirse lo nuestro.',
        wendyComment: 'Nuestra primera película juntos, inolvidable.',
        poster: '',
        synopsis: 'En una ciudad donde conviven los residentes de fuego, agua, tierra y aire, una joven apasionada y un chico que se deja llevar descubren cuánto tienen en común.',
        platforms: ['Disney+'],
        imdbRating: '7.0',
        imdbUrl: 'https://www.imdb.com/title/tt15789038/',
        addedAt: '2026-01-10T20:00:00.000Z',
        watchedAt: '2026-01-15T22:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-movie-2',
        title: 'Enredados',
        year: 2010,
        proposedBy: 'Wendy',
        priority: 5,
        status: 'Vista',
        kevinRating: 9.5,
        wendyRating: 10,
        kevinComment: 'La escena de las linternas flotantes nos recordó nuestro propio brillo.',
        wendyComment: 'Ver la luz y los girasoles brillar juntos.',
        poster: '',
        synopsis: 'La princesa Rapunzel, de largo y mágico cabello dorado, ha estado encerrada en una torre durante toda su vida. Cuando un astuto ladrón se topa con ella, hacen un trato para escapar al mundo exterior.',
        platforms: ['Disney+'],
        imdbRating: '7.7',
        imdbUrl: 'https://www.imdb.com/title/tt0398286/',
        addedAt: '2026-02-01T18:00:00.000Z',
        watchedAt: '2026-02-10T21:30:00.000Z',
        isDemo: true
      }
    ],

    notes: [
      {
        id: 'demo-note-1',
        author: 'Kevin',
        message: 'Gracias por convertir cada día ordinario en algo que merece ser recordado con una sonrisa.',
        createdAt: '2026-02-14T09:15:00.000Z',
        updatedAt: '2026-02-14T09:15:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-note-2',
        author: 'Wendy',
        message: 'Me encanta que el camino que estamos construyendo esté lleno de girasoles y noches compartidas.',
        createdAt: '2026-02-14T11:40:00.000Z',
        updatedAt: '2026-02-14T11:40:00.000Z',
        isDemo: true
      }
    ],

    dreams: [
      {
        id: 'demo-dream-1',
        title: 'Ver una lluvia de estrellas',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-2',
        title: 'Viajar juntos',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-3',
        title: 'Aprender algo nuevo',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-4',
        title: 'Ver 100 películas',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      }
    ],
    songs: [],
    series: []
  };

  class StorageManager {
    constructor() {
      this.keys = window.CONFIG.storageKeys;
      this.listeners = [];
      this.remoteKeys = ['memories', 'movies', 'series', 'notes', 'dreams', 'songs', 'dailyPrompts', 'timeCapsules'];
      this.remoteRef = null;
      this.initDefaults();
      this.initRemoteSync();
      this.initCloudSync();
    }

    initDefaults() {
      if (!localStorage.getItem(this.keys.memories)) {
        this.set(this.keys.memories, INITIAL_DATA.memories);
      }
      if (!localStorage.getItem(this.keys.movies)) {
        this.set(this.keys.movies, INITIAL_DATA.movies);
      }
      if (!localStorage.getItem(this.keys.series)) {
        this.set(this.keys.series, INITIAL_DATA.series);
      }
      if (!localStorage.getItem(this.keys.notes)) {
        this.set(this.keys.notes, INITIAL_DATA.notes);
      }
      if (!localStorage.getItem(this.keys.dreams)) {
        this.set(this.keys.dreams, INITIAL_DATA.dreams);
      }
      if (!localStorage.getItem(this.keys.songs)) this.set(this.keys.songs, INITIAL_DATA.songs);
      if (!localStorage.getItem(this.keys.dailyPrompts)) this.set(this.keys.dailyPrompts, {});
      if (!localStorage.getItem(this.keys.timeCapsules)) this.set(this.keys.timeCapsules, []);
      if (!localStorage.getItem(this.keys.currentUser)) {
        localStorage.setItem(this.keys.currentUser, window.CONFIG.defaultUser);
      }
    }

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error(`Error leyendo clave ${key} de localStorage:`, e);
        return defaultValue;
      }
    }

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Aviso de cuota en almacenamiento local (${e.name}):`, e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          try {
            if (key === this.keys.memories && Array.isArray(value)) {
              // Si la memoria del navegador está llena, conservar portadas y fotos esenciales
              const streamlined = value.map(m => ({
                ...m,
                gallery: Array.isArray(m.gallery) ? m.gallery.slice(0, 8) : []
              }));
              localStorage.setItem(key, JSON.stringify(streamlined));
            }
          } catch (retryErr) {
            console.error('No se pudo guardar copia reducida en localStorage:', retryErr);
          }
        }
      }
      this.notify(key);
      const remoteName = Object.keys(this.keys).find(name => this.keys[name] === key);
      if (this.remoteRef && this.remoteKeys.includes(remoteName)) {
        this.remoteRef.child(remoteName).set(value).catch(error => console.error('Error al sincronizar con Firebase:', error));
      }
      // Solo programar subida a GitHub si Firebase NO está activo
      if (window.CONFIG.presence?.provider !== 'firebase' && this.remoteKeys.includes(remoteName) && this.scheduleCloudPush) {
        this.scheduleCloudPush();
      }
      return true;
    }

    subscribe(listener) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter(item => item !== listener); }; }
    notify(key) { this.listeners.forEach(listener => listener(key)); }

    // --- Sincronización en la Nube con GitHub & Cloud Engine ---
    initCloudSync() {
      this.cloudConfig = window.CONFIG.cloudSync || {};
      this.lastCloudSyncTime = null;
      this.isSyncing = false;
      this.lastFileSha = null;
      this.pendingPushTimeout = null;

      // Si Firebase está activo, Firebase maneja el tiempo real. No hacemos polling redundante a GitHub.
      if (window.CONFIG.presence?.provider === 'firebase') {
        return;
      }

      // Cargar datos de la nube inmediatamente
      setTimeout(() => {
        this.syncCloudPull().catch(e => console.warn('Auto-pull inicial diferido:', e));
      }, 500);

      // Sincronización periódica cada intervalo
      if (this.cloudConfig.enabled && this.cloudConfig.syncIntervalMs) {
        setInterval(() => {
          if (!this.isSyncing) {
            this.syncCloudPull().catch(e => console.warn('Sync background pull:', e));
          }
        }, this.cloudConfig.syncIntervalMs);
      }
    }

    notifySyncState(state, message = '') {
      if (this.onSyncStateChange) {
        this.onSyncStateChange({
          state,
          message,
          lastSync: this.lastCloudSyncTime,
          isSyncing: this.isSyncing
        });
      }
    }

    async syncCloudPull() {
      if (!this.cloudConfig || !this.cloudConfig.enabled) return null;
      this.isSyncing = true;
      this.notifySyncState('syncing');

      try {
        const { repoOwner, repoName, filePath, branch, token } = this.cloudConfig;
        const headers = {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Patico-App'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let remoteData = null;
        let fileSha = null;

        // Intento 1: GitHub API pública
        try {
          const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}&t=${Date.now()}`;
          const response = await fetch(url, { headers });
          if (response.ok) {
            const data = await response.json();
            fileSha = data.sha;
            const binaryStr = atob(data.content.replace(/\s/g, ''));
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const jsonText = new TextDecoder('utf-8').decode(bytes);
            remoteData = JSON.parse(jsonText);
          }
        } catch (apiErr) {
          console.warn('Fallo consulta API GitHub, intentando archivo local:', apiErr);
        }

        // Intento 2: Archivo estático relativo
        if (!remoteData) {
          try {
            const staticRes = await fetch(`./${filePath}?t=${Date.now()}`);
            if (staticRes.ok) {
              remoteData = await staticRes.json();
            }
          } catch(statErr) {}
        }

        if (!remoteData) {
          this.isSyncing = false;
          this.notifySyncState('synced');
          return { success: false, error: 'No se pudo contactar el servidor' };
        }

        if (fileSha) this.lastFileSha = fileSha;

        let hasChanges = false;
        this.remoteKeys.forEach(name => {
          if (Array.isArray(remoteData[name])) {
            const localList = this.get(this.keys[name], []);
            const mergedList = this.mergeDataLists(localList, remoteData[name]);
            if (JSON.stringify(localList) !== JSON.stringify(mergedList)) {
              localStorage.setItem(this.keys[name], JSON.stringify(mergedList));
              this.notify(this.keys[name]);
              hasChanges = true;
            }
          }
        });

        this.lastCloudSyncTime = new Date();
        this.isSyncing = false;
        this.notifySyncState('synced');
        return { success: true, hasChanges, lastSync: this.lastCloudSyncTime };
      } catch (error) {
        console.error('Error en syncCloudPull:', error);
        this.isSyncing = false;
        this.notifySyncState('error', error.message);
        return { success: false, error: error.message };
      }
    }

    async syncCloudPush() {
      if (!this.cloudConfig || !this.cloudConfig.enabled || !this.cloudConfig.token) return null;
      this.isSyncing = true;
      this.notifySyncState('syncing');

      try {
        const { repoOwner, repoName, filePath, branch, token } = this.cloudConfig;
        
        // 1. Obtener SHA actual si no lo tenemos
        if (!this.lastFileSha) {
          try {
            const checkRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              this.lastFileSha = checkData.sha;
            }
          } catch(e) {}
        }

        const payload = {
          version: '1.0',
          updatedAt: new Date().toISOString(),
          updatedBy: this.getCurrentUser(),
          memories: this.get(this.keys.memories, []),
          movies: this.get(this.keys.movies, []),
          series: this.get(this.keys.series, []),
          notes: this.get(this.keys.notes, []),
          dreams: this.get(this.keys.dreams, []),
          songs: this.get(this.keys.songs, [])
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        // UTF-8 a Base64 seguro
        const bytes = new TextEncoder().encode(jsonStr);
        let binaryStr = '';
        bytes.forEach(b => binaryStr += String.fromCharCode(b));
        const base64Content = btoa(binaryStr);

        const bodyData = {
          message: `sync: Actualizar recuerdos y diario (${this.getCurrentUser()})`,
          content: base64Content,
          branch: branch || 'main'
        };
        if (this.lastFileSha) bodyData.sha = this.lastFileSha;

        const putRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ATRIA-App'
          },
          body: JSON.stringify(bodyData)
        });

        if (!putRes.ok) {
          if (putRes.status === 409 || putRes.status === 422) {
            this.lastFileSha = null;
            await this.syncCloudPull();
            return await this.syncCloudPush();
          }
          throw new Error(`Error ${putRes.status} al subir a la nube`);
        }

        const resData = await putRes.json();
        this.lastFileSha = resData.content?.sha || null;
        this.lastCloudSyncTime = new Date();
        this.isSyncing = false;
        this.notifySyncState('synced');
        return { success: true, lastSync: this.lastCloudSyncTime };
      } catch (error) {
        console.error('Error en syncCloudPush:', error);
        this.isSyncing = false;
        this.notifySyncState('error', error.message);
        return { success: false, error: error.message };
      }
    }

    scheduleCloudPush() {
      if (this.pendingPushTimeout) clearTimeout(this.pendingPushTimeout);
      this.pendingPushTimeout = setTimeout(() => {
        this.syncCloudPush().catch(e => console.warn('Background push error:', e));
      }, 1500);
    }

    mergeDataLists(localList, remoteList) {
      const mergedMap = new Map();
      
      remoteList.forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });

      localList.forEach(item => {
        if (!item || !item.id) return;
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
        } else {
          const remoteItem = mergedMap.get(item.id);
          const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            mergedMap.set(item.id, item);
          }
        }
      });

      return Array.from(mergedMap.values());
    }

    exportTransferCode() {
      const data = {
        timestamp: Date.now(),
        user: this.getCurrentUser(),
        memories: this.get(this.keys.memories, []),
        movies: this.get(this.keys.movies, []),
        series: this.get(this.keys.series, []),
        notes: this.get(this.keys.notes, []),
        dreams: this.get(this.keys.dreams, []),
        songs: this.get(this.keys.songs, [])
      };
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      return 'ATRIA_SYNC::' + btoa(binary);
    }

    importTransferCode(codeString) {
      if (!codeString || typeof codeString !== 'string') return { success: false, error: 'Código vacío o inválido' };
      try {
        const clean = codeString.trim();
        const rawB64 = clean.startsWith('ATRIA_SYNC::') ? clean.slice(12) : (clean.startsWith('PATICO_SYNC::') ? clean.slice(13) : clean);
        
        const binary = atob(rawB64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const json = new TextDecoder('utf-8').decode(bytes);
        const imported = JSON.parse(json);

        let importedCount = 0;
        this.remoteKeys.forEach(name => {
          if (Array.isArray(imported[name])) {
            const current = this.get(this.keys[name], []);
            const merged = this.mergeDataLists(current, imported[name]);
            this.set(this.keys[name], merged);
            importedCount += imported[name].length;
          }
        });

        this.scheduleCloudPush();
        return { success: true, count: importedCount };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    initRemoteSync() {
      const config = window.CONFIG.presence;
      if (config.provider !== 'firebase' || !config.firebaseConfig?.databaseURL || !window.firebase) return;
      try {
        if (!firebase.apps.length) firebase.initializeApp(config.firebaseConfig);
        const db = firebase.database();
        this.remoteRef = db.ref(`rooms/${config.roomId}/journal`);
        this.profilesRef = db.ref(`rooms/${config.roomId}/profiles`);
        this.presenceRef = db.ref(`rooms/${config.roomId}/presence`);
        this.nudgeRef = db.ref(`rooms/${config.roomId}/nudge`);
        
        // Handshake inicial
        this.remoteRef.once('value').then(snapshot => {
          const val = snapshot.val();
          if (!val) {
            const initial = {};
            this.remoteKeys.forEach(name => { initial[name] = this.get(this.keys[name], []); });
            return this.remoteRef.set(initial);
          } else {
            let hasNew = false;
            this.remoteKeys.forEach(name => {
              if (Array.isArray(val[name])) {
                const currentStr = localStorage.getItem(this.keys[name]);
                const newStr = JSON.stringify(val[name]);
                if (currentStr !== newStr) {
                  localStorage.setItem(this.keys[name], newStr);
                  this.notify(this.keys[name]);
                  hasNew = true;
                }
              }
            });
            this.lastCloudSyncTime = new Date();
            this.notifySyncState('synced');
            if (this.onRemoteReady) this.onRemoteReady();
          }
        }).catch(error => console.error('No se pudo iniciar Firebase Realtime Database:', error));

        // Escucha activa en tiempo real de datos del diario
        this.remoteRef.on('value', snapshot => {
          const data = snapshot.val();
          if (!data) return;
          this.remoteKeys.forEach(name => {
            if (Array.isArray(data[name])) {
              const currentStr = localStorage.getItem(this.keys[name]);
              const newStr = JSON.stringify(data[name]);
              if (currentStr !== newStr) {
                localStorage.setItem(this.keys[name], newStr);
                this.notify(this.keys[name]);
              }
            }
          });
          this.lastCloudSyncTime = new Date();
          this.notifySyncState('synced');
          if (this.onRemoteReady) this.onRemoteReady();
        });

        // Escucha de perfiles y apodos
        this.profilesRef.on('value', snapshot => {
          const remoteProfiles = snapshot.val();
          if (remoteProfiles) {
            localStorage.setItem(this.keys.profiles, JSON.stringify(remoteProfiles));
            this.notify(this.keys.profiles);
            if (this.onProfilesChange) this.onProfilesChange(remoteProfiles);
          }
        });

        // Escucha de Presencia estilo WhatsApp (Online / Última vez)
        this.initPresenceListeners();

        // Escucha de credenciales personalizadas y Cierre de Sesión Global en todos los dispositivos
        this.credentialsRef = db.ref(`rooms/${config.roomId}/credentials`);
        this.credentialsRef.on('value', snapshot => {
          const creds = snapshot.val();
          if (creds && typeof creds === 'object') {
            localStorage.setItem(this.keys.credentials, JSON.stringify(creds));
            
            const localSessionToken = localStorage.getItem('patico_session_token');
            const currentUser = this.getCurrentUser();
            const userCred = creds[currentUser];
            const changeTime = (userCred && userCred.updatedAt) || creds.lastGlobalPasswordChange || 0;

            if (this.isUnlocked() && changeTime > 0) {
              if (!localSessionToken || parseInt(localSessionToken, 10) < changeTime) {
                this.setUnlocked(false);
                localStorage.removeItem('patico_session_token');
                if (this.onForceLogout) {
                  this.onForceLogout('🔒 La contraseña fue cambiada. Se cerró la sesión en todos los dispositivos por seguridad.');
                }
              }
            }
          }
        });

        // Escucha de Toquecito de Amor (Nudge)
        let lastNudgeTime = Date.now();
        this.nudgeRef.on('value', snapshot => {
          const nudge = snapshot.val();
          if (nudge && nudge.timestamp && nudge.timestamp > lastNudgeTime) {
            lastNudgeTime = nudge.timestamp;
            if (nudge.from && nudge.from !== this.getCurrentUser()) {
              if (this.onNudgeReceived) this.onNudgeReceived(nudge);
            }
          }
        });

        // Escucha de Actividades Cruzadas en Tiempo Real (Películas, Series, Notas, Sueños, Música, Recuerdos)
        this.activityRef = db.ref(`rooms/${config.roomId}/lastActivity`);
        let lastActivityTime = Date.now();
        this.activityRef.on('value', snapshot => {
          const act = snapshot.val();
          if (act && act.timestamp && act.timestamp > lastActivityTime) {
            lastActivityTime = act.timestamp;
            if (act.user && act.user !== this.getCurrentUser()) {
              if (this.onActivityReceived) this.onActivityReceived(act);
            }
          }
        });

      } catch (error) {
        console.error('Firebase no pudo inicializarse:', error);
        this.remoteRef = null;
      }
    }

    initPresenceListeners() {
      if (!window.firebase || !window.CONFIG.presence?.firebaseConfig) return;
      const db = firebase.database();
      const config = window.CONFIG.presence;
      const connectedRef = db.ref('.info/connected');

      connectedRef.on('value', snap => {
        if (snap.val() === true) {
          const currentUser = this.getCurrentUser();
          const myPresenceRef = db.ref(`rooms/${config.roomId}/presence/${currentUser}`);
          
          myPresenceRef.onDisconnect().set({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
          }).then(() => {
            myPresenceRef.set({
              online: true,
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          });
        }
      });

      // Escuchar presencia de Kevin y Wendy
      this.presenceRef.on('value', snap => {
        const presence = snap.val() || {};
        this.presenceState = presence;
        if (this.onPresenceUpdate) this.onPresenceUpdate(presence);
      });
    }

    sendNudge() {
      if (!this.nudgeRef) return false;
      const currentUser = this.getCurrentUser();
      const profiles = this.getProfiles();
      const senderNickname = profiles[currentUser]?.nickname || currentUser;

      const nudgeData = {
        from: currentUser,
        fromNickname: senderNickname,
        timestamp: Date.now(),
        id: window.Utils.generateUUID()
      };
      this.nudgeRef.set(nudgeData).catch(e => console.warn('Error enviando toquecito:', e));
      return true;
    }

    broadcastActivity(type, title, action = 'añadió') {
      if (!this.activityRef) return false;
      const currentUser = this.getCurrentUser();
      const profiles = this.getProfiles();
      const userProfile = profiles[currentUser] || {};
      const userDisplayName = userProfile.nickname || currentUser;

      const actData = {
        id: window.Utils.generateUUID(),
        user: currentUser,
        userName: userDisplayName,
        type: type, // 'película', 'serie', 'canción', 'nota', 'sueño', 'recuerdo'
        title: title || 'un elemento',
        action: action,
        timestamp: Date.now()
      };
      this.activityRef.set(actData).catch(e => console.warn('Error emitiendo notificación de actividad:', e));
      return true;
    }

    getProfiles() {
      const defaultProfiles = {
        Kevin: {
          name: 'Kevin',
          nickname: 'Kevin',
          avatar: '',
          color: '#00E5FF'
        },
        Wendy: {
          name: 'Wendy',
          nickname: 'Patico ♥️',
          avatar: '',
          color: '#E040FB'
        }
      };
      const stored = this.get(this.keys.profiles, defaultProfiles);
      return {
        Kevin: { ...defaultProfiles.Kevin, ...(stored?.Kevin || {}) },
        Wendy: { ...defaultProfiles.Wendy, ...(stored?.Wendy || {}) }
      };
    }

    saveProfiles(profilesData) {
      const current = this.getProfiles();
      const updated = {
        Kevin: { ...current.Kevin, ...(profilesData.Kevin || {}) },
        Wendy: { ...current.Wendy, ...(profilesData.Wendy || {}) }
      };
      this.set(this.keys.profiles, updated);
      if (this.profilesRef) {
        this.profilesRef.set(updated).catch(e => console.warn('Error guardando perfiles en Firebase:', e));
      }
      return updated;
    }

    isUnlocked() {
      return localStorage.getItem(this.keys.unlocked) === 'true';
    }

    setUnlocked(unlocked) {
      if (unlocked) {
        localStorage.setItem(this.keys.unlocked, 'true');
      } else {
        localStorage.removeItem(this.keys.unlocked);
      }
    }

    getCurrentUser() {
      return localStorage.getItem(this.keys.currentUser) || window.CONFIG.defaultUser;
    }

    setCurrentUser(user) {
      if (window.CONFIG.users.includes(user)) {
        localStorage.setItem(this.keys.currentUser, user);
        return true;
      }
      return false;
    }

    getCredentials() {
      const defaultCreds = {
        Kevin: { passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', updatedAt: 1700000000000 },
        Wendy: { passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', updatedAt: 1700000000000 },
        lastGlobalPasswordChange: 1700000000000
      };
      return this.get(this.keys.credentials, defaultCreds);
    }

    async hashPassword(password) {
      const bytes = new TextEncoder().encode(password);
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async verifyCredentials(username, password) {
      if (!username || !window.CONFIG.users.includes(username)) {
        return false;
      }
      if (!password || typeof password !== 'string') {
        return false;
      }
      const trimmed = password.trim();
      if (!trimmed) {
        return false;
      }

      const credentials = this.getCredentials();
      const userCred = credentials[username];
      const enteredHash = await this.hashPassword(trimmed);

      if (userCred && userCred.passwordHash) {
        return userCred.passwordHash === enteredHash;
      }

      // Si aún no ha cambiado su contraseña, la clave por defecto es 1234
      return trimmed === '1234' || enteredHash === '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    }

    async changePassword(username, currentPassword, newPassword) {
      if (!newPassword || newPassword.length < 4 || !(await this.verifyCredentials(username, currentPassword))) {
        return false;
      }
      const credentials = this.getCredentials();
      const now = Date.now();
      const newHash = await this.hashPassword(newPassword.trim());

      credentials[username] = {
        passwordHash: newHash,
        updatedAt: now
      };
      credentials.lastGlobalPasswordChange = now;

      // Guardar token local en este dispositivo para mantener su sesión activa
      const saved = this.set(this.keys.credentials, credentials);
      localStorage.setItem('patico_session_token', now.toString());

      // Sincronizar en Firebase para forzar cierre de sesión en todos los demás dispositivos
      if (this.credentialsRef) {
        this.credentialsRef.set(credentials).catch(e => console.warn('Error sincronizando credenciales:', e));
      }
      return saved;
    }

    getMemories() {
      const list = this.get(this.keys.memories, []);
      return list.map(m => ({
        ...m,
        author: m.author || 'Kevin',
        color: m.color || '#F4C542',
        coverMedia: m.coverMedia || m.photo || '',
        coverType: m.coverType || (m.coverMedia && m.coverMedia.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image'),
        gallery: Array.isArray(m.gallery) ? m.gallery : [],
        comments: Array.isArray(m.comments) ? m.comments : [],
        songId: m.songId || null,
        songTitle: m.songTitle || '',
        songArtist: m.songArtist || '',
        songCover: m.songCover || '',
        songAudioUrl: m.songAudioUrl || '',
        voiceNoteUrl: m.voiceNoteUrl || '',
        voiceNoteDuration: m.voiceNoteDuration || 0
      }));
    }

    saveMemory(memoryData) {
      const list = this.getMemories();
      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();

      if (memoryData.id) {
        const index = list.findIndex(m => m.id === memoryData.id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            ...memoryData,
            author: list[index].author || memoryData.author || currentUser,
            color: memoryData.color || list[index].color || '#F4C542',
            coverMedia: memoryData.coverMedia !== undefined ? memoryData.coverMedia : (list[index].coverMedia || ''),
            coverType: memoryData.coverType || list[index].coverType || 'image',
            gallery: Array.isArray(memoryData.gallery) ? memoryData.gallery : (list[index].gallery || []),
            comments: Array.isArray(memoryData.comments) ? memoryData.comments : (list[index].comments || []),
            songId: memoryData.songId !== undefined ? memoryData.songId : (list[index].songId || null),
            songTitle: memoryData.songTitle !== undefined ? memoryData.songTitle : (list[index].songTitle || ''),
            songArtist: memoryData.songArtist !== undefined ? memoryData.songArtist : (list[index].songArtist || ''),
            songCover: memoryData.songCover !== undefined ? memoryData.songCover : (list[index].songCover || ''),
            songAudioUrl: memoryData.songAudioUrl !== undefined ? memoryData.songAudioUrl : (list[index].songAudioUrl || ''),
            voiceNoteUrl: memoryData.voiceNoteUrl !== undefined ? memoryData.voiceNoteUrl : (list[index].voiceNoteUrl || ''),
            voiceNoteDuration: memoryData.voiceNoteDuration !== undefined ? memoryData.voiceNoteDuration : (list[index].voiceNoteDuration || 0),
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newMemory = {
          id: window.Utils.generateUUID(),
          date: memoryData.date,
          title: memoryData.title.trim(),
          description: memoryData.description.trim(),
          author: memoryData.author || currentUser,
          color: memoryData.color || '#F4C542',
          coverMedia: memoryData.coverMedia || memoryData.photo || '',
          coverType: memoryData.coverType || 'image',
          gallery: Array.isArray(memoryData.gallery) ? memoryData.gallery : [],
          comments: Array.isArray(memoryData.comments) ? memoryData.comments : [],
          songId: memoryData.songId || null,
          songTitle: memoryData.songTitle || '',
          songArtist: memoryData.songArtist || '',
          songCover: memoryData.songCover || '',
          songAudioUrl: memoryData.songAudioUrl || '',
          voiceNoteUrl: memoryData.voiceNoteUrl || '',
          voiceNoteDuration: memoryData.voiceNoteDuration || 0,
          status: memoryData.status || 'Guardado',
          createdAt: now,
          updatedAt: now,
          isDemo: false
        };
        list.push(newMemory);
      }

      this.set(this.keys.memories, list);
      this.broadcastActivity('recuerdo', memoryData.title, memoryData.id ? 'actualizó el' : 'guardó el');
      return list;
    }

    addMemoryComment(memoryId, commentData) {
      const list = this.getMemories();
      const index = list.findIndex(m => m.id === memoryId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.memories, list);
      return newComment;
    }

    deleteMemoryComment(memoryId, commentId) {
      const list = this.getMemories();
      const index = list.findIndex(m => m.id === memoryId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        this.set(this.keys.memories, list);
        return true;
      }
      return false;
    }

    deleteMemory(id) {
      const list = this.getMemories().filter(m => m.id !== id);
      this.set(this.keys.memories, list);
      return list;
    }

    getMovies() {
      return this.get(this.keys.movies, []).map(m => {
        const kRating = m.kevinRating !== null && m.kevinRating !== undefined && m.kevinRating !== '' ? parseFloat(m.kevinRating) : 0;
        const wRating = m.wendyRating !== null && m.wendyRating !== undefined && m.wendyRating !== '' ? parseFloat(m.wendyRating) : 0;
        const comments = Array.isArray(m.comments) ? [...m.comments] : [];
        
        if (!comments.length) {
          if (m.kevinComment) {
            comments.push({ id: 'legacy-kevin-' + m.id, author: 'Kevin', message: m.kevinComment, createdAt: m.updatedAt || m.addedAt || new Date().toISOString() });
          }
          if (m.wendyComment) {
            comments.push({ id: 'legacy-wendy-' + m.id, author: 'Wendy', message: m.wendyComment, createdAt: m.updatedAt || m.addedAt || new Date().toISOString() });
          }
        }

        return {
          ...m,
          genre: m.genre || '',
          status: m.status === 'Favorita' ? 'Me encantó' : (m.status || 'Por ver'),
          platforms: Array.isArray(m.platforms) ? m.platforms : (typeof m.platforms === 'string' && m.platforms ? m.platforms.split(',').map(s => s.trim()).filter(Boolean) : []),
          kevinRating: kRating,
          wendyRating: wRating,
          rating: m.rating || (kRating > 0 && wRating > 0 ? Math.round((kRating + wRating) / 2) : (kRating || wRating || 5)),
          comments: comments
        };
      });
    }

    saveMovie(movieData) {
      const list = this.getMovies();
      const now = new Date().toISOString();

      const kevinScore = movieData.kevinRating !== '' && movieData.kevinRating !== null && movieData.kevinRating !== undefined
        ? parseFloat(movieData.kevinRating)
        : 0;
      const wendyScore = movieData.wendyRating !== '' && movieData.wendyRating !== null && movieData.wendyRating !== undefined
        ? parseFloat(movieData.wendyRating)
        : 0;

      const normalizedStatus = movieData.status === 'Favorita' ? 'Me encantó' : (movieData.status || 'Por ver');
      let platforms = movieData.platforms || [];
      if (typeof platforms === 'string') {
        platforms = platforms.split(',').map(s => s.trim()).filter(Boolean);
      }

      const comments = Array.isArray(movieData.comments) ? movieData.comments : [];

      if (movieData.id) {
        const index = list.findIndex(m => m.id === movieData.id);
        if (index !== -1) {
          const existing = list[index];
          list[index] = {
            ...existing,
            title: movieData.title.trim(),
            genre: movieData.genre !== undefined ? movieData.genre : (existing.genre || ''),
            year: parseInt(movieData.year, 10) || existing.year || new Date().getFullYear(),
            proposedBy: movieData.proposedBy || existing.proposedBy || this.getCurrentUser() || 'Kevin',
            priority: parseInt(movieData.priority, 10) || existing.priority || 5,
            status: normalizedStatus,
            kevinRating: kevinScore,
            wendyRating: wendyScore,
            rating: typeof movieData.rating === 'number' ? movieData.rating : (parseInt(movieData.rating, 10) || (kevinScore || wendyScore || 5)),
            comments: comments.length ? comments : (existing.comments || []),
            poster: movieData.poster !== undefined ? movieData.poster : (existing.poster || ''),
            synopsis: movieData.synopsis !== undefined ? movieData.synopsis : (existing.synopsis || ''),
            platforms: platforms.length ? platforms : (existing.platforms || []),
            imdbRating: movieData.imdbRating !== undefined ? movieData.imdbRating : (existing.imdbRating || ''),
            imdbUrl: movieData.imdbUrl !== undefined ? movieData.imdbUrl : (existing.imdbUrl || ''),
            watchedAt: (normalizedStatus === 'Vista' || normalizedStatus === 'Me encantó')
              ? (existing.watchedAt || now)
              : null,
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newMovie = {
          id: window.Utils.generateUUID(),
          title: movieData.title.trim(),
          genre: movieData.genre || '',
          year: parseInt(movieData.year, 10) || new Date().getFullYear(),
          proposedBy: movieData.proposedBy || this.getCurrentUser() || 'Kevin',
          priority: parseInt(movieData.priority, 10) || 5,
          status: normalizedStatus,
          kevinRating: kevinScore,
          wendyRating: wendyScore,
          rating: typeof movieData.rating === 'number' ? movieData.rating : 5,
          comments: comments,
          poster: movieData.poster || '',
          synopsis: movieData.synopsis || '',
          platforms: platforms,
          imdbRating: movieData.imdbRating || '',
          imdbUrl: movieData.imdbUrl || '',
          addedAt: now,
          watchedAt: (normalizedStatus === 'Vista' || normalizedStatus === 'Me encantó') ? now : null,
          updatedAt: now,
          isDemo: false
        };
        list.push(newMovie);
      }

      this.set(this.keys.movies, list);
      this.broadcastActivity('película', movieData.title, movieData.id ? 'actualizó la' : 'añadió la');
      return list;
    }

    rateMovie(movieId, ratingValue, user) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return false;

      const val = Math.max(0, Math.min(5, parseInt(ratingValue, 10) || 0));
      const targetUser = user || this.getCurrentUser();
      
      if (targetUser.toLowerCase() === 'wendy') {
        list[index].wendyRating = val;
      } else {
        list[index].kevinRating = val;
      }

      const k = list[index].kevinRating || 0;
      const w = list[index].wendyRating || 0;
      if (k > 0 && w > 0) {
        list[index].rating = Math.round((k + w) / 2);
      } else {
        list[index].rating = k > 0 ? k : w;
      }

      list[index].updatedAt = new Date().toISOString();
      this.set(this.keys.movies, list);
      return list[index];
    }

    addMovieComment(movieId, commentData) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.movies, list);
      return newComment;
    }

    deleteMovieComment(movieId, commentId) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        list[index].updatedAt = new Date().toISOString();
        this.set(this.keys.movies, list);
        return true;
      }
      return false;
    }

    deleteMovie(id) {
      const list = this.getMovies().filter(m => m.id !== id);
      this.set(this.keys.movies, list);
      return list;
    }

    getSongs() {
      return this.get(this.keys.songs, []).map(song => ({
        ...song,
        lyrics: song.lyrics || '',
        previewUrl: song.previewUrl || '',
        album: song.album || '',
        year: song.year || '',
        rating: song.rating || (song.kevinRating || song.wendyRating || 5),
        kevinRating: song.kevinRating !== undefined ? song.kevinRating : 5,
        wendyRating: song.wendyRating !== undefined ? song.wendyRating : 0,
        comments: Array.isArray(song.comments) ? song.comments : []
      }));
    }

    saveSong(songData) {
      const list = this.getSongs();
      const now = new Date().toISOString();
      const cleanSong = {
        title: songData.title ? songData.title.trim() : 'Canción',
        artist: songData.artist ? songData.artist.trim() : 'Artista',
        album: songData.album ? songData.album.trim() : '',
        year: songData.year || '',
        cover: songData.cover ? songData.cover.trim() : '',
        previewUrl: songData.previewUrl || '',
        lyrics: songData.lyrics ? songData.lyrics.trim() : '',
        spotifyUrl: songData.spotifyUrl ? songData.spotifyUrl.trim() : window.MediaService.spotifyUrl(songData.title, songData.artist),
        youtubeUrl: songData.youtubeUrl ? songData.youtubeUrl.trim() : window.MediaService.youtubeUrl(songData.title, songData.artist),
        lyricsUrl: songData.lyricsUrl ? songData.lyricsUrl.trim() : window.MediaService.geniusUrl(songData.title, songData.artist),
        proposedBy: songData.proposedBy || this.getCurrentUser() || 'Kevin',
        rating: typeof songData.rating === 'number' ? songData.rating : (parseInt(songData.rating, 10) || 5),
        kevinRating: songData.kevinRating !== undefined ? (parseInt(songData.kevinRating, 10) || 0) : 5,
        wendyRating: songData.wendyRating !== undefined ? (parseInt(songData.wendyRating, 10) || 0) : 0,
        comments: Array.isArray(songData.comments) ? songData.comments : []
      };

      if (songData.id) {
        const index = list.findIndex(song => song.id === songData.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            ...cleanSong, 
            comments: Array.isArray(songData.comments) ? songData.comments : (list[index].comments || []),
            updatedAt: now 
          };
        }
      } else {
        list.unshift({ ...cleanSong, id: window.Utils.generateUUID(), addedAt: now, updatedAt: now });
      }
      this.set(this.keys.songs, list);
      this.broadcastActivity('canción', songData.title, songData.id ? 'actualizó la' : 'recomendó la');
      return list;
    }

    rateSong(songId, ratingValue, user) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return false;

      const val = Math.max(0, Math.min(5, parseInt(ratingValue, 10) || 0));
      const targetUser = user || this.getCurrentUser();
      
      if (targetUser.toLowerCase() === 'wendy') {
        list[index].wendyRating = val;
      } else {
        list[index].kevinRating = val;
      }

      const k = list[index].kevinRating || 0;
      const w = list[index].wendyRating || 0;
      if (k > 0 && w > 0) {
        list[index].rating = Math.round((k + w) / 2);
      } else {
        list[index].rating = k > 0 ? k : w;
      }

      list[index].updatedAt = new Date().toISOString();
      this.set(this.keys.songs, list);
      return list[index];
    }

    addSongComment(songId, commentData) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.songs, list);
      return newComment;
    }

    deleteSongComment(songId, commentId) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        list[index].updatedAt = new Date().toISOString();
        this.set(this.keys.songs, list);
        return true;
      }
      return false;
    }

    deleteSong(id) {
      const list = this.getSongs().filter(song => song.id !== id);
      this.set(this.keys.songs, list);
      return list;
    }

    getNotes() {
      return this.get(this.keys.notes, []).map(n => ({
        ...n,
        voiceNoteUrl: n.voiceNoteUrl || '',
        voiceNoteDuration: n.voiceNoteDuration || 0
      }));
    }

    saveNote(noteData) {
      const list = this.getNotes();
      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();

      if (noteData.id) {
        const index = list.findIndex(n => n.id === noteData.id);
        if (index !== -1) {
          const existing = list[index];
          // Solo el autor original o el creador puede editar su propia nota
          if (existing.author && existing.author.toLowerCase() !== currentUser.toLowerCase() && !existing.isDemo) {
            throw new Error('Solo puedes editar las notas que tú mismo has creado.');
          }

          list[index] = {
            ...existing,
            message: (noteData.message || '').trim(),
            style: noteData.style || existing.style || 'sunflower',
            sticker: noteData.sticker !== undefined ? noteData.sticker : (existing.sticker || ''),
            photoUrl: noteData.photoUrl !== undefined ? noteData.photoUrl : (existing.photoUrl || ''),
            voiceNoteUrl: noteData.voiceNoteUrl !== undefined ? noteData.voiceNoteUrl : (existing.voiceNoteUrl || ''),
            voiceNoteDuration: noteData.voiceNoteDuration !== undefined ? noteData.voiceNoteDuration : (existing.voiceNoteDuration || 0),
            isPinned: noteData.isPinned !== undefined ? Boolean(noteData.isPinned) : (existing.isPinned || false),
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newNote = {
          id: window.Utils.generateUUID(),
          author: currentUser,
          message: (noteData.message || '').trim(),
          style: noteData.style || 'sunflower',
          sticker: noteData.sticker || '',
          photoUrl: noteData.photoUrl || '',
          voiceNoteUrl: noteData.voiceNoteUrl || '',
          voiceNoteDuration: noteData.voiceNoteDuration || 0,
          isPinned: Boolean(noteData.isPinned),
          isRevealed: noteData.style === 'surprise' ? false : true,
          reactions: {},
          createdAt: now,
          updatedAt: now,
          isDemo: false
        };
        list.push(newNote);
      }

      this.set(this.keys.notes, list);
      const noteSnippet = (noteData.message || 'una cartita').substring(0, 35) + '...';
      this.broadcastActivity('nota', noteSnippet, noteData.id ? 'editó la' : 'dejó una nueva');
      return list;
    }

    deleteNote(id) {
      const list = this.getNotes();
      const currentUser = this.getCurrentUser();
      const note = list.find(n => n.id === id);

      if (note && note.author && note.author.toLowerCase() !== currentUser.toLowerCase() && !note.isDemo) {
        throw new Error('Solo puedes eliminar las notas que tú mismo has creado.');
      }

      const filtered = list.filter(n => n.id !== id);
      this.set(this.keys.notes, filtered);
      return filtered;
    }

    toggleNotePin(id) {
      const list = this.getNotes();
      const note = list.find(n => n.id === id);
      if (note) {
        note.isPinned = !note.isPinned;
        note.updatedAt = new Date().toISOString();
        this.set(this.keys.notes, list);
      }
      return list;
    }

    reactToNote(id, emoji, user) {
      const list = this.getNotes();
      const note = list.find(n => n.id === id);
      if (!note) return list;

      if (!note.reactions) note.reactions = {};
      if (!Array.isArray(note.reactions[emoji])) note.reactions[emoji] = [];

      const activeUser = user || this.getCurrentUser();
      const userIndex = note.reactions[emoji].indexOf(activeUser);

      if (userIndex !== -1) {
        note.reactions[emoji].splice(userIndex, 1);
        if (note.reactions[emoji].length === 0) {
          delete note.reactions[emoji];
        }
      } else {
        note.reactions[emoji].push(activeUser);
      }

      note.updatedAt = new Date().toISOString();
      this.set(this.keys.notes, list);
      return list;
    }

    revealSurpriseNote(id) {
      const list = this.getNotes();
      const note = list.find(n => n.id === id);
      if (note) {
        note.isRevealed = true;
        note.updatedAt = new Date().toISOString();
        this.set(this.keys.notes, list);
      }
      return list;
    }

    getDreams() {
      return this.get(this.keys.dreams, []).map(d => ({
        ...d,
        category: d.category || '✨ General',
        desireLevel: parseInt(d.desireLevel, 10) || 3,
        photo: d.photo || '',
        notes: d.notes || '',
        status: d.status || 'Pendiente',
        proposedBy: d.proposedBy || 'Kevin'
      }));
    }

    saveDream(dreamData) {
      const list = this.getDreams();
      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();

      if (dreamData.id) {
        const index = list.findIndex(d => d.id === dreamData.id);
        if (index !== -1) {
          const existing = list[index];
          const isCompleted = dreamData.status === 'Cumplido';
          list[index] = {
            ...existing,
            title: (dreamData.title || '').trim(),
            category: dreamData.category || existing.category || '✨ General',
            desireLevel: parseInt(dreamData.desireLevel, 10) || existing.desireLevel || 3,
            status: dreamData.status || existing.status || 'Pendiente',
            completedAt: isCompleted ? (dreamData.completedAt || existing.completedAt || now) : null,
            photo: dreamData.photo !== undefined ? dreamData.photo : (existing.photo || ''),
            notes: dreamData.notes !== undefined ? dreamData.notes : (existing.notes || ''),
            proposedBy: existing.proposedBy || currentUser,
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const isCompleted = dreamData.status === 'Cumplido';
        const newDream = {
          id: window.Utils.generateUUID(),
          title: (dreamData.title || '').trim(),
          category: dreamData.category || '✨ General',
          desireLevel: parseInt(dreamData.desireLevel, 10) || 3,
          status: dreamData.status || 'Pendiente',
          createdAt: now,
          completedAt: isCompleted ? (dreamData.completedAt || now) : null,
          photo: dreamData.photo || '',
          notes: dreamData.notes || '',
          proposedBy: currentUser,
          updatedAt: now,
          isDemo: false
        };
        list.push(newDream);
      }

      this.set(this.keys.dreams, list);
      this.broadcastActivity('sueño', dreamData.title, dreamData.id ? 'actualizó el' : 'añadió al Frasco el');
      return list;
    }

    toggleDreamStatus(id) {
      const list = this.getDreams();
      const now = new Date().toISOString();
      const index = list.findIndex(d => d.id === id);
      let justCompleted = false;

      if (index !== -1) {
        const dream = list[index];
        if (dream.status === 'Pendiente') {
          dream.status = 'Cumplido';
          dream.completedAt = now;
          justCompleted = true;
          this.broadcastActivity('sueño', dream.title, '¡cumplió el');
        } else {
          dream.status = 'Pendiente';
          dream.completedAt = null;
        }
        dream.updatedAt = now;
        this.set(this.keys.dreams, list);
      }
      return { list, justCompleted };
    }

    deleteDream(id) {
      const list = this.getDreams().filter(d => d.id !== id);
      this.set(this.keys.dreams, list);
      return list;
    }

    // =========================================
    // MÓDULO DE SERIES & ANIME 📺
    // =========================================

    getSeries() {
      return this.get(this.keys.series, []).map(s => ({
        ...s,
        genre: s.genre || ''
      }));
    }

    saveSeries(serieData) {
      const list = this.getSeries();
      const now = new Date().toISOString();

      if (serieData.id) {
        const index = list.findIndex(s => s.id === serieData.id);
        if (index !== -1) {
          const existing = list[index];
          list[index] = {
            ...existing,
            ...serieData,
            genre: serieData.genre !== undefined ? serieData.genre : (existing.genre || ''),
            updatedAt: now
          };
          this.recalculateSeriesCompletion(list[index]);
        }
      } else {
        const newSerie = {
          id: window.Utils.generateUUID(),
          tmdbId: serieData.tmdbId || null,
          title: (serieData.title || '').trim(),
          originalTitle: (serieData.originalTitle || serieData.title || '').trim(),
          genre: serieData.genre || '',
          year: serieData.year || new Date().getFullYear(),
          poster: serieData.poster || '',
          synopsis: serieData.synopsis || '',
          platforms: Array.isArray(serieData.platforms) ? serieData.platforms : (serieData.platforms ? [serieData.platforms] : ['Streaming']),
          imdbRating: serieData.imdbRating || '',
          imdbUrl: serieData.imdbUrl || '',
          seasonsCount: serieData.seasonsCount || 1,
          episodesCount: serieData.episodesCount || 0,
          seasons: serieData.seasons || [],
          proposedBy: serieData.proposedBy || this.getCurrentUser(),
          status: serieData.status || 'Por ver', // Empieza como 'Por ver'
          kevinRating: serieData.kevinRating || 0,
          wendyRating: serieData.wendyRating || 0,
          kevinReview: serieData.kevinReview || '',
          wendyReview: serieData.wendyReview || '',
          comments: Array.isArray(serieData.comments) ? serieData.comments : [],
          createdAt: now,
          updatedAt: now
        };
        this.recalculateSeriesCompletion(newSerie);
        list.push(newSerie);
      }

      this.set(this.keys.series, list);
      this.broadcastActivity('serie', serieData.title, serieData.id ? 'actualizó la' : 'añadió la');
      return list;
    }

    deleteSeries(id) {
      const list = this.getSeries().filter(s => s.id !== id);
      this.set(this.keys.series, list);
      return list;
    }

    recalculateSeriesCompletion(serie) {
      if (!serie.seasons || !serie.seasons.length) {
        serie.progressKevin = 0;
        serie.progressWendy = 0;
        serie.progressBoth = 0;
        serie.isFullyCompletedByKevin = false;
        serie.isFullyCompletedByWendy = false;
        serie.isFullyCompletedByBoth = false;
        serie.totalEpisodes = 0;
        return;
      }

      // 1. Calcular el total real de capítulos de la serie completa
      let realTotalEpisodes = serie.episodesCount || 0;
      if (!realTotalEpisodes || realTotalEpisodes <= 0) {
        realTotalEpisodes = 0;
        serie.seasons.forEach(season => {
          realTotalEpisodes += (season.episodesCount || (season.episodes ? season.episodes.length : 0));
        });
      }

      let seenKevin = 0;
      let seenWendy = 0;
      let seenBoth = 0;

      serie.seasons.forEach(season => {
        if (season.episodes && season.episodes.length) {
          season.episodes.forEach(ep => {
            const k = ep.watchedByKevin === true;
            const w = ep.watchedByWendy === true;
            if (k) seenKevin++;
            if (w) seenWendy++;
            if (k && w) seenBoth++;
          });
        }
      });

      if (realTotalEpisodes < Math.max(seenKevin, seenWendy, seenBoth)) {
        realTotalEpisodes = Math.max(seenKevin, seenWendy, seenBoth);
      }

      serie.totalEpisodes = realTotalEpisodes;
      serie.progressKevin = realTotalEpisodes > 0 ? Math.round((seenKevin / realTotalEpisodes) * 100) : 0;
      serie.progressWendy = realTotalEpisodes > 0 ? Math.round((seenWendy / realTotalEpisodes) * 100) : 0;
      serie.progressBoth = realTotalEpisodes > 0 ? Math.round((seenBoth / realTotalEpisodes) * 100) : 0;

      serie.isFullyCompletedByKevin = realTotalEpisodes > 0 && seenKevin >= realTotalEpisodes;
      serie.isFullyCompletedByWendy = realTotalEpisodes > 0 && seenWendy >= realTotalEpisodes;
      serie.isFullyCompletedByBoth = realTotalEpisodes > 0 && seenBoth >= realTotalEpisodes;

      // Estado automático: "Por ver" si no hay capítulos vistos, "Viendo" al marcar al menos 1, "Completada" si ambos terminaron
      if (serie.isFullyCompletedByBoth) {
        serie.status = 'Completada';
      } else if (seenKevin > 0 || seenWendy > 0) {
        serie.status = 'Viendo';
      } else {
        serie.status = 'Por ver';
      }
    }

    toggleEpisodeWatched(seriesId, seasonNumber, episodeNumber, user) {
      const list = this.getSeries();
      const serie = list.find(s => s.id === seriesId);
      if (!serie) return null;

      const season = (serie.seasons || []).find(s => s.seasonNumber === seasonNumber);
      if (!season || !season.episodes) return null;

      const episode = season.episodes.find(e => e.episodeNumber === episodeNumber);
      if (!episode) return null;

      const now = new Date().toISOString();
      const isWendy = (user || this.getCurrentUser()).toLowerCase() === 'wendy';

      if (isWendy) {
        episode.watchedByWendy = !episode.watchedByWendy;
        episode.watchedAtWendy = episode.watchedByWendy ? now : null;
      } else {
        episode.watchedByKevin = !episode.watchedByKevin;
        episode.watchedAtKevin = episode.watchedByKevin ? now : null;
      }

      this.recalculateSeriesCompletion(serie);
      serie.updatedAt = now;

      this.set(this.keys.series, list);
      return { serie, episode };
    }

    markEpisodesUpTo(seriesId, targetSeasonNumber, targetEpisodeNumber, user) {
      const list = this.getSeries();
      const serie = list.find(s => s.id === seriesId);
      if (!serie || !serie.seasons) return null;

      const now = new Date().toISOString();
      const isWendy = (user || this.getCurrentUser()).toLowerCase() === 'wendy';

      for (const season of serie.seasons) {
        // Asegurar que season.episodes exista
        if (!season.episodes || !season.episodes.length) {
          const epCount = season.episodesCount || 10;
          season.episodes = [];
          for (let i = 1; i <= epCount; i++) {
            season.episodes.push({
              episodeNumber: i,
              name: `Episodio ${i}`,
              overview: '',
              airDate: '',
              stillPath: '',
              watchedByKevin: false,
              watchedByWendy: false,
              watchedAtKevin: null,
              watchedAtWendy: null
            });
          }
        }

        if (season.seasonNumber < targetSeasonNumber) {
          // Marcar todos los de temporadas anteriores
          for (const ep of season.episodes) {
            if (isWendy) {
              ep.watchedByWendy = true;
              ep.watchedAtWendy = ep.watchedAtWendy || now;
            } else {
              ep.watchedByKevin = true;
              ep.watchedAtKevin = ep.watchedAtKevin || now;
            }
          }
        } else if (season.seasonNumber === targetSeasonNumber) {
          // Marcar hasta el capítulo indicado
          for (const ep of season.episodes) {
            if (ep.episodeNumber <= targetEpisodeNumber) {
              if (isWendy) {
                ep.watchedByWendy = true;
                ep.watchedAtWendy = ep.watchedAtWendy || now;
              } else {
                ep.watchedByKevin = true;
                ep.watchedAtKevin = ep.watchedAtKevin || now;
              }
            }
          }
        }
      }

      this.recalculateSeriesCompletion(serie);
      serie.updatedAt = now;
      this.set(this.keys.series, list);
      return serie;
    }

    getUserCurrentProgress(serie, user) {
      if (!serie || !serie.seasons || !serie.seasons.length) return 'Sin empezar';
      const isWendy = user.toLowerCase() === 'wendy';

      let lastWatched = null;
      for (const season of serie.seasons) {
        if (season.episodes) {
          for (const ep of season.episodes) {
            const watched = isWendy ? ep.watchedByWendy : ep.watchedByKevin;
            if (watched) {
              lastWatched = `T${season.seasonNumber}:E${ep.episodeNumber}`;
            }
          }
        }
      }

      return lastWatched || 'T1:E1';
    }

    addSeriesComment(seriesId, { author, message, rating = 0 }) {
      const list = this.getSeries();
      const serie = list.find(s => s.id === seriesId);
      if (!serie) return null;

      if (!Array.isArray(serie.comments)) serie.comments = [];

      const currentProgress = this.getUserCurrentProgress(serie, author);
      const isCompleted = author.toLowerCase() === 'wendy' ? serie.isFullyCompletedByWendy : serie.isFullyCompletedByKevin;

      const newComment = {
        id: window.Utils.generateUUID(),
        author: author || this.getCurrentUser(),
        message: message.trim(),
        currentProgress: currentProgress,
        isCompleted: isCompleted,
        rating: rating || 0,
        createdAt: new Date().toISOString()
      };

      serie.comments.push(newComment);
      serie.updatedAt = new Date().toISOString();

      this.set(this.keys.series, list);
      return newComment;
    }

    deleteSeriesComment(seriesId, commentId) {
      const list = this.getSeries();
      const serie = list.find(s => s.id === seriesId);
      if (!serie || !Array.isArray(serie.comments)) return null;

      serie.comments = serie.comments.filter(c => c.id !== commentId);
      serie.updatedAt = new Date().toISOString();

      this.set(this.keys.series, list);
      return serie;
    }

    rateSeries(seriesId, user, rating, review = '') {
      const list = this.getSeries();
      const serie = list.find(s => s.id === seriesId);
      if (!serie) return null;

      const isWendy = user.toLowerCase() === 'wendy';
      const isCompleted = isWendy ? serie.isFullyCompletedByWendy : serie.isFullyCompletedByKevin;

      if (!isCompleted) {
        throw new Error('Solo puedes calificar la serie cuando hayas visto todos los capítulos 🌻📺');
      }

      if (isWendy) {
        serie.wendyRating = rating;
        if (review) serie.wendyReview = review;
      } else {
        serie.kevinRating = rating;
        if (review) serie.kevinReview = review;
      }

      serie.updatedAt = new Date().toISOString();
      this.set(this.keys.series, list);
      return serie;
    }

    // =========================================
    // MÓDULO DE LA PREGUNTA DIARIA 💌✨
    // =========================================

    getDailyPromptsMap() {
      return this.get(this.keys.dailyPrompts, {}) || {};
    }

    getDailyPrompt(dateStr = null) {
      if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
      }
      const map = this.getDailyPromptsMap();
      const existing = map[dateStr];

      const defaultQuestion = window.MediaService?.DailyQuestions?.getQuestionForDate(dateStr) || '¿Qué es lo que más agradeces de nosotros hoy?';

      if (existing) {
        return {
          date: dateStr,
          question: existing.question || defaultQuestion,
          kevinAnswer: existing.kevinAnswer || '',
          wendyAnswer: existing.wendyAnswer || '',
          kevinAnsweredAt: existing.kevinAnsweredAt || null,
          wendyAnsweredAt: existing.wendyAnsweredAt || null,
          revealed: !!(existing.kevinAnswer && existing.wendyAnswer) || !!existing.revealed
        };
      }

      return {
        date: dateStr,
        question: defaultQuestion,
        kevinAnswer: '',
        wendyAnswer: '',
        kevinAnsweredAt: null,
        wendyAnsweredAt: null,
        revealed: false
      };
    }

    saveDailyAnswer(dateStr, author, answerText) {
      if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
      const map = this.getDailyPromptsMap();
      const current = this.getDailyPrompt(dateStr);
      const now = new Date().toISOString();

      const isWendy = (author || this.getCurrentUser()).toLowerCase() === 'wendy';

      if (isWendy) {
        current.wendyAnswer = (answerText || '').trim();
        current.wendyAnsweredAt = now;
      } else {
        current.kevinAnswer = (answerText || '').trim();
        current.kevinAnsweredAt = now;
      }

      const isBothAnswered = Boolean(current.kevinAnswer && current.wendyAnswer);
      current.revealed = isBothAnswered;

      map[dateStr] = current;
      this.set(this.keys.dailyPrompts, map);

      if (isBothAnswered) {
        this.broadcastActivity('pregunta', '¡Ambos han respondido la pregunta de hoy!', 'reveló que');
      } else {
        this.broadcastActivity('pregunta', 'respondió la pregunta del día. ¡Faltas tú!', 'ya');
      }

      return current;
    }

    getDailyPromptsHistory() {
      const map = this.getDailyPromptsMap();
      const list = Object.keys(map).map(dateStr => map[dateStr]);
      // Ordenar por fecha descendente
      return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    // =========================================
    // MÓDULO DE CÁPSULAS DEL TIEMPO ⏳💎
    // =========================================

    getTimeCapsules() {
      return this.get(this.keys.timeCapsules, []).map(c => ({
        ...c,
        photos: Array.isArray(c.photos) ? c.photos : (c.photoUrl ? [c.photoUrl] : []),
        voiceNoteUrl: c.voiceNoteUrl || '',
        voiceNoteDuration: c.voiceNoteDuration || 0,
        isOpened: Boolean(c.isOpened)
      }));
    }

    saveTimeCapsule(capsuleData) {
      const list = this.getTimeCapsules();
      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();

      if (capsuleData.id) {
        const index = list.findIndex(c => c.id === capsuleData.id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            ...capsuleData,
            updatedAt: now
          };
        }
      } else {
        const newCapsule = {
          id: window.Utils.generateUUID(),
          title: (capsuleData.title || '').trim() || 'Cápsula de Amor Secreta ✨',
          message: (capsuleData.message || '').trim(),
          unlockDate: capsuleData.unlockDate, // ISO o YYYY-MM-DD
          creator: capsuleData.creator || currentUser,
          photoUrl: capsuleData.photoUrl || '',
          photos: Array.isArray(capsuleData.photos) ? capsuleData.photos : [],
          voiceNoteUrl: capsuleData.voiceNoteUrl || '',
          voiceNoteDuration: capsuleData.voiceNoteDuration || 0,
          theme: capsuleData.theme || 'gold', // gold, galaxy, rose
          isOpened: false,
          openedAt: null,
          createdAt: now,
          updatedAt: now
        };
        list.push(newCapsule);
      }

      this.set(this.keys.timeCapsules, list);
      this.broadcastActivity('cápsula', capsuleData.title || 'una cápsula del tiempo', capsuleData.id ? 'actualizó la' : 'selló');
      return list;
    }

    deleteTimeCapsule(id) {
      const list = this.getTimeCapsules().filter(c => c.id !== id);
      this.set(this.keys.timeCapsules, list);
      return list;
    }

    openTimeCapsule(id) {
      const list = this.getTimeCapsules();
      const capsule = list.find(c => c.id === id);
      if (!capsule) return null;

      capsule.isOpened = true;
      capsule.openedAt = new Date().toISOString();
      capsule.updatedAt = new Date().toISOString();
      this.set(this.keys.timeCapsules, list);
      this.broadcastActivity('cápsula', capsule.title, 'abrió la');
      return capsule;
    }
  }

  window.storage = new StorageManager();
})();
