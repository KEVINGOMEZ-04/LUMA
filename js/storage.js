/**
 * LUMA 🌟 - Capa de Persistencia y Multi-Grupos
 */

(function() {
  const DEFAULT_INITIAL_GROUP_ID = 'luma_main_group';
  
  const DEMO_GROUP = {
    id: DEFAULT_INITIAL_GROUP_ID,
    name: 'Grupo LUMA',
    icon: '🌟',
    iconImage: '',
    code: 'LUMA01',
    color: '#7C3AED',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    host: { id: 'luma_host_1', name: 'Alex' },
    members: [
      { id: 'luma_host_1', name: 'Alex', color: '#7C3AED', avatar: '', joinedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'luma_member_2', name: 'Sam', color: '#3B82F6', avatar: '', joinedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'luma_member_3', name: 'Dani', color: '#22D3EE', avatar: '', joinedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'luma_member_4', name: 'KEVIN', color: '#10B981', avatar: '', joinedAt: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  };

  const DEMO_DATA = {
    memories: [
      {
        id: 'mem_1',
        title: 'Noche de Estrellas y Risas',
        date: '2026-02-20',
        location: 'Mirador del Valle',
        description: 'Una velada increíble donde compartimos anécdotas, buena música y planes para este año.',
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        photos: [],
        author: { id: 'luma_host_1', name: 'Alex' },
        song: {
          title: 'Midnight City',
          artist: 'M83',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/91/9f/5d/919f5de7-2035-7170-c0eb-4993883a429a/mzaf_10574069818816568228.plus.aac.p.m4a'
        },
        comments: [
          { id: 'c1', authorName: 'Sam', text: '¡Tenemos que repetir muy pronto! 🙌', createdAt: '2026-02-21T10:00:00Z' }
        ],
        createdAt: '2026-02-20T22:00:00Z'
      }
    ],

    songs: [
      {
        id: 'song_1',
        title: 'Viva La Vida',
        artist: 'Coldplay',
        rating: 5,
        addedBy: 'Sam',
        review: 'Un himno que nunca pasa de moda en nuestras reuniones.',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/cf/48/05cf4867-b5bf-734f-0131-bb96dafead21/mzaf_12411036066270632599.plus.aac.p.m4a',
        artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/d4/0b/bfd40b3c-dc09-8473-b3c0-038827943c2c/0094639534658.jpg/600x600bb.jpg',
        createdAt: '2026-02-15T18:00:00Z'
      }
    ],

    movies: [
      {
        id: 'mov_1',
        title: 'Interstellar',
        year: '2014',
        poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        synopsis: 'Un grupo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.',
        proposedBy: 'Alex',
        platform: 'HBO Max',
        status: 'Vista',
        groupAverage: '9.8',
        ratings: {
          luma_host_1: '10',
          luma_member_2: '9.5',
          luma_member_3: '10'
        },
        comments: {
          luma_host_1: 'Obra maestra de la ciencia ficción.'
        },
        createdAt: '2026-01-20T20:00:00Z'
      }
    ],

    series: [
      {
        id: 'ser_1',
        title: 'Arcane',
        year: '2021',
        poster: 'https://image.tmdb.org/t/p/w500/abPQHGHp0kLwNq2q6p8v3s1H37x.jpg',
        synopsis: 'En medio del conflicto entre las ciudades gemelas de Piltóver y Zaun, dos hermanas luchan en bandos opuestos de una guerra.',
        proposedBy: 'Dani',
        platform: 'Netflix',
        currentSeason: 2,
        currentEpisode: 6,
        totalEpisodes: 9,
        status: 'Viendo',
        createdAt: '2026-02-01T21:00:00Z'
      }
    ],

    goals: [
      {
        id: 'goal_1',
        title: 'Viaje a la Costa en Verano',
        category: 'Viajes',
        targetDate: '2026-07-15',
        participants: ['Alex', 'Sam', 'Dani'],
        status: 'Pendiente',
        createdAt: '2026-02-01T12:00:00Z'
      }
    ],

    notes: [
      {
        id: 'note_1',
        title: 'Ideas para la próxima reunión',
        type: 'Idea',
        content: '¿Hacemos noche de juegos de mesa o maratón de películas con palomitas?',
        author: 'Dani',
        image: '',
        createdAt: '2026-02-18T16:30:00Z'
      }
    ]
  };

  class LumaStorage {
    constructor() {
      this.listeners = [];
      this.init();
    }

    init() {
      const groups = this.getGroups();
      if (!groups || groups.length === 0) {
        this.saveGroups([DEMO_GROUP]);
        this.setActiveGroupId(DEMO_GROUP.id);
        this.saveGroupData(DEMO_GROUP.id, DEMO_DATA);
      }
    }

    subscribe(callback) {
      this.listeners.push(callback);
    }

    notify(key) {
      this.listeners.forEach(fn => fn(key));
    }

    // --- PERFIL GLOBAL ---
    getUserProfile() {
      const raw = localStorage.getItem(window.CONFIG.storageKeys.userProfile);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (_) { return null; }
    }

    saveUserProfile(profile) {
      const existing = this.getUserProfile() || {};
      const updated = {
        id: existing.id || 'usr_' + Date.now().toString(36),
        name: profile.name || existing.name || 'Miembro',
        avatar: profile.avatar !== undefined ? profile.avatar : (existing.avatar || ''),
        bio: profile.bio !== undefined ? profile.bio : (existing.bio || ''),
        gender: profile.gender || existing.gender || 'No especificado',
        favoriteColor: profile.favoriteColor || existing.favoriteColor || '#7C3AED',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(window.CONFIG.storageKeys.userProfile, JSON.stringify(updated));
      
      this.updateMemberInCurrentGroup(updated);
      this.notify('profile');
      return updated;
    }

    // --- GRUPOS ---
    getGroups() {
      const raw = localStorage.getItem(window.CONFIG.storageKeys.groups);
      if (!raw) return [];
      try { return JSON.parse(raw); } catch (_) { return []; }
    }

    saveGroups(groups) {
      localStorage.setItem(window.CONFIG.storageKeys.groups, JSON.stringify(groups));
      this.notify('groups');
    }

    getActiveGroupId() {
      return localStorage.getItem(window.CONFIG.storageKeys.activeGroup) || DEFAULT_INITIAL_GROUP_ID;
    }

    setActiveGroupId(id) {
      localStorage.setItem(window.CONFIG.storageKeys.activeGroup, id);
      this.notify('activeGroup');
    }

    getActiveGroup() {
      const groups = this.getGroups();
      const activeId = this.getActiveGroupId();
      return groups.find(g => g.id === activeId) || groups[0] || null;
    }

    createGroup(name, icon = '🌟', color = '#7C3AED', coverImage = '', iconImage = '') {
      const user = this.getUserProfile() || { id: 'usr_host_' + Date.now().toString(36), name: 'Host' };
      const now = new Date().toISOString();
      const newGroup = {
        id: 'group_' + Date.now().toString(36),
        name: name,
        icon: icon,
        iconImage: iconImage,
        code: window.Utils.generateGroupCode(),
        color: color,
        coverImage: coverImage,
        createdAt: now,
        host: { id: user.id, name: user.name },
        members: [{
          id: user.id,
          name: user.name,
          color: user.favoriteColor || color,
          avatar: user.avatar || '',
          joinedAt: now
        }]
      };

      const groups = this.getGroups();
      groups.push(newGroup);
      this.saveGroups(groups);
      this.setActiveGroupId(newGroup.id);
      this.saveGroupData(newGroup.id, {
        memories: [], songs: [], movies: [], series: [], goals: [], notes: []
      });

      return newGroup;
    }

    updateGroup(groupId, updates) {
      const groups = this.getGroups();
      const targetId = groupId || this.getActiveGroupId();
      const idx = groups.findIndex(g => g.id === targetId);
      if (idx >= 0) {
        groups[idx] = {
          ...groups[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.saveGroups(groups);
        this.notify('activeGroup');
        return groups[idx];
      }
      return null;
    }

    leaveGroup(groupId) {
      const targetId = groupId || this.getActiveGroupId();
      let groups = this.getGroups();
      groups = groups.filter(g => g.id !== targetId);
      this.saveGroups(groups);

      if (groups.length > 0) {
        this.setActiveGroupId(groups[0].id);
      } else {
        localStorage.removeItem(window.CONFIG.storageKeys.activeGroup);
      }
      this.notify('groups');
    }

    async joinGroupByCode(code) {
      const cleanCode = (code || '').trim().toUpperCase();
      if (!cleanCode || cleanCode.length !== 6) {
        throw new Error('El código debe tener 6 caracteres');
      }

      const groups = this.getGroups();
      let group = groups.find(g => g.code === cleanCode);
      const user = this.getUserProfile() || { id: 'usr_' + Date.now().toString(36), name: 'Miembro' };
      const now = new Date().toISOString();

      if (!group) {
        group = {
          id: 'group_remote_' + cleanCode.toLowerCase(),
          name: `Grupo #${cleanCode}`,
          icon: '✨',
          iconImage: '',
          code: cleanCode,
          color: '#3B82F6',
          coverImage: '',
          createdAt: now,
          host: { id: 'remote_host', name: 'Administrador' },
          members: [
            { id: user.id, name: user.name, color: user.favoriteColor || '#3B82F6', avatar: user.avatar || '', joinedAt: now }
          ]
        };
        groups.push(group);
        this.saveGroups(groups);
        this.saveGroupData(group.id, {
          memories: [], songs: [], movies: [], series: [], goals: [], notes: []
        });
      } else {
        if (!group.members) group.members = [];
        if (!group.members.some(m => m.id === user.id)) {
          group.members.push({
            id: user.id,
            name: user.name,
            color: user.favoriteColor || group.color,
            avatar: user.avatar || '',
            joinedAt: now
          });
          this.saveGroups(groups);
        }
      }

      this.setActiveGroupId(group.id);
      return group;
    }

    updateMemberInCurrentGroup(userProfile) {
      const groups = this.getGroups();
      const activeId = this.getActiveGroupId();
      const group = groups.find(g => g.id === activeId);
      if (!group) return;

      if (!group.members) group.members = [];
      const idx = group.members.findIndex(m => m.id === userProfile.id);
      const memberObj = {
        id: userProfile.id,
        name: userProfile.name,
        color: userProfile.favoriteColor,
        avatar: userProfile.avatar,
        joinedAt: idx >= 0 && group.members[idx].joinedAt ? group.members[idx].joinedAt : new Date().toISOString()
      };

      if (idx >= 0) {
        group.members[idx] = memberObj;
      } else {
        group.members.push(memberObj);
      }
      this.saveGroups(groups);
    }

    // --- DATOS DEL GRUPO ACTIVO ---
    getGroupData(groupId) {
      const gid = groupId || this.getActiveGroupId();
      const raw = localStorage.getItem(window.CONFIG.storageKeys.groupData + gid);
      if (!raw) return { memories: [], songs: [], movies: [], series: [], goals: [], notes: [] };
      try {
        return JSON.parse(raw);
      } catch (_) {
        return { memories: [], songs: [], movies: [], series: [], goals: [], notes: [] };
      }
    }

    saveGroupData(groupId, data) {
      const gid = groupId || this.getActiveGroupId();
      localStorage.setItem(window.CONFIG.storageKeys.groupData + gid, JSON.stringify(data));
      this.notify('groupData');
    }

    // Módulos Individuales
    getMemories() { return this.getGroupData().memories || []; }
    saveMemory(memory) {
      const data = this.getGroupData();
      if (!data.memories) data.memories = [];
      if (!memory.id) memory.id = window.Utils.generateId();
      if (!memory.createdAt) memory.createdAt = new Date().toISOString();
      const idx = data.memories.findIndex(m => m.id === memory.id);
      if (idx >= 0) data.memories[idx] = memory;
      else data.memories.unshift(memory);
      this.saveGroupData(null, data);
      return memory;
    }
    deleteMemory(id) {
      const data = this.getGroupData();
      data.memories = (data.memories || []).filter(m => m.id !== id);
      this.saveGroupData(null, data);
    }

    addCommentToMemory(memoryId, authorName, text) {
      const data = this.getGroupData();
      const mem = (data.memories || []).find(m => m.id === memoryId);
      if (mem) {
        if (!mem.comments) mem.comments = [];
        mem.comments.push({
          id: window.Utils.generateId(),
          authorName,
          text,
          createdAt: new Date().toISOString()
        });
        this.saveGroupData(null, data);
      }
    }

    getSongs() { return this.getGroupData().songs || []; }
    saveSong(song) {
      const data = this.getGroupData();
      if (!data.songs) data.songs = [];
      if (!song.id) song.id = window.Utils.generateId();
      if (!song.createdAt) song.createdAt = new Date().toISOString();
      data.songs.unshift(song);
      this.saveGroupData(null, data);
      return song;
    }

    getMovies() { return this.getGroupData().movies || []; }
    saveMovie(movie) {
      const data = this.getGroupData();
      if (!data.movies) data.movies = [];
      if (!movie.id) movie.id = window.Utils.generateId();
      if (!movie.createdAt) movie.createdAt = new Date().toISOString();
      const idx = data.movies.findIndex(m => m.id === movie.id);
      if (idx >= 0) data.movies[idx] = movie;
      else data.movies.unshift(movie);
      this.saveGroupData(null, data);
      return movie;
    }
    addMovieRating(movieId, rating, comment) {
      const user = this.getUserProfile() || { id: 'usr_anon' };
      return this.rateMovie(movieId, user.id, rating, comment);
    }
    rateMovie(movieId, userId, rating, comment) {
      const data = this.getGroupData();
      const movie = (data.movies || []).find(m => m.id === movieId);
      if (movie) {
        if (!movie.ratings) movie.ratings = {};
        if (!movie.comments) movie.comments = {};
        movie.ratings[userId] = rating;
        if (comment) movie.comments[userId] = comment;
        
        const values = Object.values(movie.ratings).map(Number).filter(n => !isNaN(n));
        const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null;
        movie.groupAverage = avg;
        
        this.saveGroupData(null, data);
      }
    }
    deleteMovie(id) {
      const data = this.getGroupData();
      data.movies = (data.movies || []).filter(m => m.id !== id);
      this.saveGroupData(null, data);
    }

    getSeries() { return this.getGroupData().series || []; }
    saveSeries(series) {
      const data = this.getGroupData();
      if (!data.series) data.series = [];
      if (!series.id) series.id = window.Utils.generateId();
      if (!series.createdAt) series.createdAt = new Date().toISOString();
      const idx = data.series.findIndex(s => s.id === series.id);
      if (idx >= 0) data.series[idx] = series;
      else data.series.unshift(series);
      this.saveGroupData(null, data);
      return series;
    }

    getGoals() { return this.getGroupData().goals || []; }
    saveGoal(goal) {
      const data = this.getGroupData();
      if (!data.goals) data.goals = [];
      if (!goal.id) goal.id = window.Utils.generateId();
      if (!goal.createdAt) goal.createdAt = new Date().toISOString();
      data.goals.unshift(goal);
      this.saveGroupData(null, data);
      return goal;
    }
    toggleGoalStatus(id) {
      const data = this.getGroupData();
      const goal = (data.goals || []).find(g => g.id === id);
      if (goal) {
        goal.status = goal.status === 'Cumplido' ? 'Pendiente' : 'Cumplido';
        goal.completedAt = goal.status === 'Cumplido' ? new Date().toISOString() : null;
        this.saveGroupData(null, data);
      }
    }
    deleteGoal(id) {
      const data = this.getGroupData();
      data.goals = (data.goals || []).filter(g => g.id !== id);
      this.saveGroupData(null, data);
    }

    getNotes() { return this.getGroupData().notes || []; }
    saveNote(note) {
      const data = this.getGroupData();
      if (!data.notes) data.notes = [];
      if (!note.id) note.id = window.Utils.generateId();
      if (!note.createdAt) note.createdAt = new Date().toISOString();
      data.notes.unshift(note);
      this.saveGroupData(null, data);
      return note;
    }
    deleteNote(id) {
      const data = this.getGroupData();
      data.notes = (data.notes || []).filter(n => n.id !== id);
      this.saveGroupData(null, data);
    }

    // --- CÁLCULO DINÁMICO DE INSIGHTS ---
    calculateInsights() {
      const data = this.getGroupData();
      const memories = data.memories || [];
      const songs = data.songs || [];
      const movies = data.movies || [];
      const series = data.series || [];
      const goals = data.goals || [];

      const totalMemories = memories.length;

      const monthCounts = {};
      const monthsName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      const allDated = [...memories, ...songs, ...movies, ...goals];
      allDated.forEach(item => {
        const d = new Date(item.date || item.createdAt);
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth();
          monthCounts[mIdx] = (monthCounts[mIdx] || 0) + 1;
        }
      });

      let maxMonthIdx = 0;
      let maxMonthCount = 0;
      for (let m = 0; m < 12; m++) {
        const cnt = monthCounts[m] || 0;
        if (cnt > maxMonthCount) {
          maxMonthCount = cnt;
          maxMonthIdx = m;
        }
      }
      const mostActiveMonth = maxMonthCount > 0 ? monthsName[maxMonthIdx] : 'N/A';

      let topMovie = 'Sin calificar';
      let highestScore = -1;
      movies.forEach(m => {
        const avg = parseFloat(m.groupAverage || 0);
        if (avg > highestScore) {
          highestScore = avg;
          topMovie = `${m.title} (⭐${m.groupAverage})`;
        }
      });

      const artistCounts = {};
      songs.forEach(s => {
        if (s.artist) artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
      });
      let topArtist = 'N/A';
      let maxArtistCount = 0;
      Object.entries(artistCounts).forEach(([art, cnt]) => {
        if (cnt > maxArtistCount) {
          maxArtistCount = cnt;
          topArtist = art;
        }
      });

      let topSeries = 'N/A';
      let maxEp = -1;
      series.forEach(s => {
        const ep = (s.currentSeason || 1) * 10 + (s.currentEpisode || 1);
        if (ep > maxEp) {
          maxEp = ep;
          topSeries = `${s.title} (T${s.currentSeason || 1}:C${s.currentEpisode || 1})`;
        }
      });

      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.status === 'Cumplido').length;
      const goalsPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      const monthlyData = monthsName.map((name, idx) => ({
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
  }

  window.storage = new LumaStorage();
})();