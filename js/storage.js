/**
 * LUMA 🌟 - Capa de Persistencia y Datos Multi-Grupo
 * Gestiona Perfil Global, Grupos Privados y Datos Aislados en Firebase RTDB + LocalStorage.
 */

(function() {
  const INITIAL_SEED_GROUP = {
    id: 'group-demo-luma',
    code: 'LUMA01',
    name: 'Universo Principal',
    icon: '🌟',
    color: '#7C3AED',
    coverImage: '',
    hostUserId: 'user-demo-1',
    members: [
      { id: 'user-demo-1', name: 'Alex', avatar: '', color: '#7C3AED', bio: 'Explorador de memorias ✨' },
      { id: 'user-demo-2', name: 'Sam', avatar: '', color: '#3B82F6', bio: 'Amante de la buena música y el cine 🎬' }
    ],
    createdAt: new Date().toISOString()
  };

  const INITIAL_SEED_DATA = {
    memories: [
      {
        id: 'mem-1',
        title: 'Atardecer en la montaña',
        date: new Date().toISOString().split('T')[0],
        description: 'Una tarde increíble compartiendo historias y viendo caer el sol tras los cerros.',
        location: 'Mirador del Valle',
        coverImage: '',
        photos: [],
        author: { id: 'user-demo-1', name: 'Alex' },
        song: {
          title: 'Viva La Vida',
          artist: 'Coldplay',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/97/ae/1f/97ae1f7c-3f9d-7db0-5e36-224403310ce2/mzaf_10344405786851253457.plus.aac.p.m4a'
        },
        comments: [
          { id: 'c1', authorName: 'Sam', text: '¡Un momento inolvidable!', createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString()
      }
    ],
    songs: [
      {
        id: 'song-1',
        title: 'Viva La Vida',
        artist: 'Coldplay',
        artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/a4/0b/bfa40b3c-ebc4-91b5-829d-4357c91ad556/0094639534558.jpg/600x600bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/97/ae/1f/97ae1f7c-3f9d-7db0-5e36-224403310ce2/mzaf_10344405786851253457.plus.aac.p.m4a',
        addedBy: 'Alex',
        rating: 5,
        review: 'Himno absoluto para motivarse cada día.',
        createdAt: new Date().toISOString()
      }
    ],
    movies: [
      {
        id: 'mov-1',
        title: 'Interstellar',
        year: '2014',
        poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        synopsis: 'Un grupo de científicos y exploradores viajan a través de un agujero de gusano para asegurar la supervivencia de la humanidad.',
        proposedBy: 'Sam',
        platform: 'HBO Max / Prime',
        status: 'Vista',
        ratings: {
          'user-demo-1': 10,
          'user-demo-2': 9.5
        },
        comments: {
          'user-demo-1': 'Obra maestra de la ciencia ficción y banda sonora sublime.',
          'user-demo-2': 'Emocionante de principio a fin.'
        },
        groupAverage: 9.8,
        createdAt: new Date().toISOString()
      }
    ],
    series: [
      {
        id: 'ser-1',
        title: 'Arcane',
        year: '2021',
        poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397FvC2GLIx.jpg',
        synopsis: 'En medio del conflicto entre las ciudades gemelas de Piltóver y Zaun, dos hermanas luchan en bandos opuestos de una guerra.',
        proposedBy: 'Alex',
        platform: 'Netflix',
        currentSeason: 2,
        currentEpisode: 6,
        totalEpisodes: 9,
        status: 'Viendo',
        ratings: {
          'user-demo-1': 10,
          'user-demo-2': 10
        },
        createdAt: new Date().toISOString()
      }
    ],
    goals: [
      {
        id: 'goal-1',
        title: 'Roadtrip por la Costa 🌊',
        category: 'Viajes',
        targetDate: '2026-12-31',
        status: 'Pendiente',
        participants: ['Alex', 'Sam'],
        photos: [],
        createdAt: new Date().toISOString()
      }
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Ideas para la próxima reunión 💡',
        content: 'Traer listas de películas pendientes, recetas nuevas y organizar las fechas del próximo viaje.',
        type: 'Idea',
        author: 'Alex',
        image: '',
        createdAt: new Date().toISOString()
      }
    ]
  };

  class StorageManager {
    constructor() {
      this.keys = window.CONFIG.storageKeys;
      this.listeners = [];
      this.firebaseDb = null;
      this.activeGroupData = null;

      this.initFirebase();
      this.initDefaults();
    }

    initFirebase() {
      if (window.firebase && window.CONFIG.presence?.firebaseConfig) {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp(window.CONFIG.presence.firebaseConfig);
          }
          this.firebaseDb = firebase.database();
        } catch (e) {
          console.warn('Firebase DB no disponible, operando en LocalStorage:', e);
        }
      }
    }

    initDefaults() {
      // 1. Perfil de Usuario
      if (!this.getUserProfile()) {
        const defaultProfile = {
          id: window.Utils.generateUUID(),
          name: '',
          avatar: '',
          bio: '',
          gender: 'No especificado',
          favoriteColor: '#7C3AED',
          createdAt: new Date().toISOString()
        };
        this.saveUserProfile(defaultProfile);
      }

      // 2. Grupos
      let groups = this.getGroups();
      if (!groups || groups.length === 0) {
        groups = [INITIAL_SEED_GROUP];
        this.set(this.keys.groups, groups);
        this.setActiveGroupId(INITIAL_SEED_GROUP.id);
        this.setGroupData(INITIAL_SEED_GROUP.id, INITIAL_SEED_DATA);
      }
    }

    // --- MANEJO DE LOCALSTORAGE ---
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    }

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        this.notify(key);
      } catch (e) {
        console.warn('Error guardando en LocalStorage:', e);
      }
    }

    // --- PERFIL GLOBAL ---
    getUserProfile() {
      return this.get(this.keys.userProfile, null);
    }

    saveUserProfile(profile) {
      if (!profile.id) profile.id = window.Utils.generateUUID();
      this.set(this.keys.userProfile, profile);

      // Sincronizar en Firebase si está disponible
      if (this.firebaseDb && profile.id) {
        this.firebaseDb.ref(`users/${profile.id}`).set(profile).catch(() => {});
      }

      // Actualizar en el grupo activo
      const activeGroup = this.getActiveGroup();
      if (activeGroup && profile.name) {
        const existingIdx = (activeGroup.members || []).findIndex(m => m.id === profile.id);
        if (existingIdx >= 0) {
          activeGroup.members[existingIdx] = {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar || '',
            color: profile.favoriteColor || '#7C3AED',
            bio: profile.bio || ''
          };
        } else {
          activeGroup.members = activeGroup.members || [];
          activeGroup.members.push({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar || '',
            color: profile.favoriteColor || '#7C3AED',
            bio: profile.bio || ''
          });
        }
        this.updateGroup(activeGroup);
      }

      return profile;
    }

    // --- GESTIÓN DE GRUPOS ---
    getGroups() {
      return this.get(this.keys.groups, []);
    }

    getActiveGroupId() {
      return localStorage.getItem(this.keys.activeGroupId) || (this.getGroups()[0]?.id || '');
    }

    setActiveGroupId(groupId) {
      localStorage.setItem(this.keys.activeGroupId, groupId);
      this.bindFirebaseGroupData(groupId);
      this.notify('activeGroup');
    }

    getActiveGroup() {
      const activeId = this.getActiveGroupId();
      const groups = this.getGroups();
      return groups.find(g => g.id === activeId) || groups[0] || null;
    }

    createGroup(name, icon = '🌟', color = '#7C3AED', coverImage = '') {
      const user = this.getUserProfile();
      const newGroup = {
        id: 'group-' + window.Utils.generateUUID(),
        code: window.Utils.generateGroupCode(),
        name: name || 'Mi Nuevo Grupo',
        icon: icon || '🌟',
        color: color || '#7C3AED',
        coverImage: coverImage || '',
        hostUserId: user?.id || 'host-user',
        members: user && user.name ? [{
          id: user.id,
          name: user.name,
          avatar: user.avatar || '',
          color: user.favoriteColor || '#7C3AED',
          bio: user.bio || ''
        }] : [],
        createdAt: new Date().toISOString()
      };

      const groups = this.getGroups();
      groups.push(newGroup);
      this.set(this.keys.groups, groups);
      this.setActiveGroupId(newGroup.id);

      // Crear data inicial para el grupo
      const initialData = {
        memories: [],
        songs: [],
        movies: [],
        series: [],
        goals: [],
        notes: []
      };
      this.setGroupData(newGroup.id, initialData);

      // Sincronizar en Firebase
      if (this.firebaseDb) {
        this.firebaseDb.ref(`groups/${newGroup.id}`).set(newGroup).catch(() => {});
        this.firebaseDb.ref(`groupData/${newGroup.id}`).set(initialData).catch(() => {});
      }

      return newGroup;
    }

    joinGroupByCode(code) {
      if (!code) return Promise.reject(new Error('Código requerido'));
      const cleanCode = code.trim().toUpperCase();

      return new Promise((resolve, reject) => {
        if (!this.firebaseDb) {
          // Búsqueda local
          const localMatch = this.getGroups().find(g => g.code === cleanCode);
          if (localMatch) {
            this.setActiveGroupId(localMatch.id);
            return resolve(localMatch);
          }
          return reject(new Error('Grupo no encontrado'));
        }

        // Búsqueda en Firebase
        this.firebaseDb.ref('groups').orderByChild('code').equalTo(cleanCode).once('value', (snap) => {
          const val = snap.val();
          if (!val) {
            return reject(new Error('Código inválido o grupo no encontrado'));
          }

          const groupId = Object.keys(val)[0];
          const groupData = val[groupId];

          // Agregar el grupo a la lista local si no estaba
          const groups = this.getGroups();
          const exists = groups.some(g => g.id === groupId);
          if (!exists) {
            const user = this.getUserProfile();
            if (user && user.name) {
              groupData.members = groupData.members || [];
              if (!groupData.members.some(m => m.id === user.id)) {
                groupData.members.push({
                  id: user.id,
                  name: user.name,
                  avatar: user.avatar || '',
                  color: user.favoriteColor || '#7C3AED',
                  bio: user.bio || ''
                });
                this.firebaseDb.ref(`groups/${groupId}/members`).set(groupData.members).catch(() => {});
              }
            }
            groups.push(groupData);
            this.set(this.keys.groups, groups);
          }

          this.setActiveGroupId(groupId);
          resolve(groupData);
        }, (err) => {
          reject(err);
        });
      });
    }

    updateGroup(group) {
      const groups = this.getGroups();
      const idx = groups.findIndex(g => g.id === group.id);
      if (idx >= 0) {
        groups[idx] = group;
        this.set(this.keys.groups, groups);
        if (this.firebaseDb) {
          this.firebaseDb.ref(`groups/${group.id}`).set(group).catch(() => {});
        }
      }
    }

    // --- DATOS DEL GRUPO ACTIVO ---
    getGroupDataKey(groupId) {
      return `luma_group_data_${groupId}`;
    }

    getGroupData(groupId = this.getActiveGroupId()) {
      return this.get(this.getGroupDataKey(groupId), {
        memories: [],
        songs: [],
        movies: [],
        series: [],
        goals: [],
        notes: []
      });
    }

    setGroupData(groupId, data) {
      this.set(this.getGroupDataKey(groupId), data);
      if (this.firebaseDb && groupId) {
        this.firebaseDb.ref(`groupData/${groupId}`).set(data).catch(() => {});
      }
      this.notify('groupData');
    }

    bindFirebaseGroupData(groupId) {
      if (!this.firebaseDb || !groupId) return;

      if (this.currentGroupDataRef) {
        this.currentGroupDataRef.off();
      }

      this.currentGroupDataRef = this.firebaseDb.ref(`groupData/${groupId}`);
      this.currentGroupDataRef.on('value', (snap) => {
        const val = snap.val();
        if (val) {
          this.set(this.getGroupDataKey(groupId), val);
          this.notify('groupData');
        }
      });
    }

    // --- MÓDULOS ESPECÍFICOS ---

    // 1. Recuerdos
    getMemories() {
      return this.getGroupData().memories || [];
    }
    saveMemory(memory) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.memories = data.memories || [];
      if (!memory.id) memory.id = window.Utils.generateUUID();
      memory.updatedAt = new Date().toISOString();

      const idx = data.memories.findIndex(m => m.id === memory.id);
      if (idx >= 0) data.memories[idx] = memory;
      else data.memories.unshift(memory);

      this.setGroupData(gId, data);
      return memory;
    }
    deleteMemory(memoryId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.memories = (data.memories || []).filter(m => m.id !== memoryId);
      this.setGroupData(gId, data);
    }
    addCommentToMemory(memoryId, authorName, text) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      const memory = (data.memories || []).find(m => m.id === memoryId);
      if (memory) {
        memory.comments = memory.comments || [];
        memory.comments.push({
          id: window.Utils.generateUUID(),
          authorName: authorName || 'Anónimo',
          text: text,
          createdAt: new Date().toISOString()
        });
        this.setGroupData(gId, data);
      }
    }

    // 2. Música
    getSongs() {
      return this.getGroupData().songs || [];
    }
    saveSong(song) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.songs = data.songs || [];
      if (!song.id) song.id = window.Utils.generateUUID();
      song.createdAt = song.createdAt || new Date().toISOString();

      const idx = data.songs.findIndex(s => s.id === song.id);
      if (idx >= 0) data.songs[idx] = song;
      else data.songs.unshift(song);

      this.setGroupData(gId, data);
      return song;
    }
    deleteSong(songId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.songs = (data.songs || []).filter(s => s.id !== songId);
      this.setGroupData(gId, data);
    }

    // 3. Películas
    getMovies() {
      return this.getGroupData().movies || [];
    }
    saveMovie(movie) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.movies = data.movies || [];
      if (!movie.id) movie.id = window.Utils.generateUUID();
      movie.createdAt = movie.createdAt || new Date().toISOString();

      // Calcular promedio grupal
      const ratings = Object.values(movie.ratings || {});
      if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + Number(b), 0);
        movie.groupAverage = Number((sum / ratings.length).toFixed(1));
      } else {
        movie.groupAverage = null;
      }

      const idx = data.movies.findIndex(m => m.id === movie.id);
      if (idx >= 0) data.movies[idx] = movie;
      else data.movies.unshift(movie);

      this.setGroupData(gId, data);
      return movie;
    }
    rateMovie(movieId, userId, rating, comment = '') {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      const movie = (data.movies || []).find(m => m.id === movieId);
      if (movie) {
        movie.ratings = movie.ratings || {};
        movie.ratings[userId] = Number(rating);
        if (comment) {
          movie.comments = movie.comments || {};
          movie.comments[userId] = comment;
        }
        this.saveMovie(movie);
      }
    }
    deleteMovie(movieId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.movies = (data.movies || []).filter(m => m.id !== movieId);
      this.setGroupData(gId, data);
    }

    // 4. Series
    getSeries() {
      return this.getGroupData().series || [];
    }
    saveSeries(series) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.series = data.series || [];
      if (!series.id) series.id = window.Utils.generateUUID();
      series.createdAt = series.createdAt || new Date().toISOString();

      const idx = data.series.findIndex(s => s.id === series.id);
      if (idx >= 0) data.series[idx] = series;
      else data.series.unshift(series);

      this.setGroupData(gId, data);
      return series;
    }
    deleteSeries(seriesId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.series = (data.series || []).filter(s => s.id !== seriesId);
      this.setGroupData(gId, data);
    }

    // 5. Objetivos Compartidos
    getGoals() {
      return this.getGroupData().goals || [];
    }
    saveGoal(goal) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.goals = data.goals || [];
      if (!goal.id) goal.id = window.Utils.generateUUID();
      goal.createdAt = goal.createdAt || new Date().toISOString();

      const idx = data.goals.findIndex(g => g.id === goal.id);
      if (idx >= 0) data.goals[idx] = goal;
      else data.goals.unshift(goal);

      this.setGroupData(gId, data);
      return goal;
    }
    toggleGoalStatus(goalId, photoUrl = '') {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      const goal = (data.goals || []).find(g => g.id === goalId);
      if (goal) {
        goal.status = goal.status === 'Cumplido' ? 'Pendiente' : 'Cumplido';
        if (goal.status === 'Cumplido') {
          goal.completedAt = new Date().toISOString();
          if (photoUrl) {
            goal.photos = goal.photos || [];
            goal.photos.push(photoUrl);
          }
        }
        this.setGroupData(gId, data);
      }
    }
    deleteGoal(goalId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.goals = (data.goals || []).filter(g => g.id !== goalId);
      this.setGroupData(gId, data);
    }

    // 6. Notas Colaborativas
    getNotes() {
      return this.getGroupData().notes || [];
    }
    saveNote(note) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.notes = data.notes || [];
      if (!note.id) note.id = window.Utils.generateUUID();
      note.createdAt = note.createdAt || new Date().toISOString();

      const idx = data.notes.findIndex(n => n.id === note.id);
      if (idx >= 0) data.notes[idx] = note;
      else data.notes.unshift(note);

      this.setGroupData(gId, data);
      return note;
    }
    deleteNote(noteId) {
      const gId = this.getActiveGroupId();
      const data = this.getGroupData(gId);
      data.notes = (data.notes || []).filter(n => n.id !== noteId);
      this.setGroupData(gId, data);
    }

    // 7. Cálculos para LUMA Insights
    calculateInsights() {
      const data = this.getGroupData();
      const memories = data.memories || [];
      const movies = data.movies || [];
      const songs = data.songs || [];
      const series = data.series || [];
      const goals = data.goals || [];
      const notes = data.notes || [];

      // Total de Recuerdos
      const totalMemories = memories.length;

      // Mes más activo (basado en recuerdos y notas)
      const monthCounts = {};
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      [...memories, ...notes, ...songs, ...movies].forEach(item => {
        const dateStr = item.date || item.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const m = d.getMonth();
            monthCounts[m] = (monthCounts[m] || 0) + 1;
          }
        }
      });

      let mostActiveMonthIdx = 0;
      let maxMonthCount = 0;
      for (let i = 0; i < 12; i++) {
        if ((monthCounts[i] || 0) > maxMonthCount) {
          maxMonthCount = monthCounts[i];
          mostActiveMonthIdx = i;
        }
      }
      const mostActiveMonth = maxMonthCount > 0 ? monthNames[mostActiveMonthIdx] : 'N/A';

      // Película mejor valorada
      let topMovie = 'Sin calificar';
      let topMovieRating = 0;
      movies.forEach(m => {
        if (m.groupAverage && m.groupAverage > topMovieRating) {
          topMovieRating = m.groupAverage;
          topMovie = `${m.title} (⭐ ${m.groupAverage})`;
        }
      });

      // Artista más repetido
      const artistCounts = {};
      songs.forEach(s => {
        if (s.artist) {
          artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
        }
      });
      let topArtist = 'N/A';
      let maxArtistCount = 0;
      Object.entries(artistCounts).forEach(([artist, count]) => {
        if (count > maxArtistCount) {
          maxArtistCount = count;
          topArtist = artist;
        }
      });

      // Serie más avanzada
      let topSeries = 'N/A';
      let maxEp = 0;
      series.forEach(s => {
        const ep = (s.currentSeason || 1) * 10 + (s.currentEpisode || 1);
        if (ep > maxEp) {
          maxEp = ep;
          topSeries = `${s.title} (T${s.currentSeason}E${s.currentEpisode})`;
        }
      });

      // Objetivos cumplidos
      const completedGoals = goals.filter(g => g.status === 'Cumplido').length;
      const totalGoals = goals.length;
      const goalsPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Datos mensuales para gráfico
      const monthlyData = monthNames.map((name, idx) => ({
        month: name,
        count: monthCounts[idx] || 0
      }));

      return {
        totalMemories,
        mostActiveMonth,
        topMovie,
        topArtist,
        topSeries,
        completedGoals,
        totalGoals,
        goalsPct,
        monthlyData
      };
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify(changedKey) {
      this.listeners.forEach(cb => {
        try { cb(changedKey); } catch (e) {}
      });
    }
  }

  window.storage = new StorageManager();
})();
