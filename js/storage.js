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
    color: '#6366F1',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    host: { id: 'luma_host_1', name: 'Alex' },
    members: [
      { id: 'usr_me', name: 'Usuario LUMA', color: '#6366F1', avatar: '', statusMsg: '✨ Explorando LUMA', joinedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'luma_host_1', name: 'Alex', color: '#7C3AED', avatar: '', statusMsg: '🎬 Listo para el cine', joinedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
      { id: 'luma_member_2', name: 'Sam', color: '#3B82F6', avatar: '', statusMsg: '🎵 Escuchando música', joinedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'luma_member_3', name: 'Dani', color: '#06B6D4', avatar: '', statusMsg: '🏖️ Planeando viaje', joinedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'luma_member_4', name: 'KEVIN', color: '#10B981', avatar: '', statusMsg: '🚀 Diseñando LUMA', joinedAt: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  };

  const DEMO_DATA = {
    memories: [
      {
        id: 'mem_1',
        title: 'Atardecer en la playa',
        date: '2025-09-21',
        location: 'Playa Blanca, Barú',
        description: 'El cielo se pintó de colores y todo se sintió perfecto contigo.',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        photos: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'
        ],
        photosCount: 12,
        isFeatured: true,
        auraColor: '#F59E0B',
        author: { id: 'usr_kevin', name: 'Kevin', color: '#6366F1', avatar: '' },
        song: {
          title: 'Golden Hour',
          artist: 'JVKE',
          artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/91/3d/8c/913d8cb8-726d-2234-4537-586718cf27bf/197187123961.jpg/600x600bb.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/4a/12/32/4a123281-2244-12ea-98eb-6cb405391c13/mzaf_16382103417757962879.plus.aac.p.m4a'
        },
        comments: [
          { id: 'c1', authorName: 'Wendy', authorRole: 'wendy', text: '¡Ese atardecer fue inolvidable mi amor! 🌅❤️', time: 'Hace 1 día', reactions: { heart: 3 } },
          { id: 'c2', authorName: 'Kevin', authorRole: 'kevin', text: 'El mejor día de todos ✨', time: 'Hace 18 horas', reactions: { heart: 2 } }
        ],
        commentsCount: 8,
        createdAt: '2025-09-21T18:30:00Z'
      },
      {
        id: 'mem_2',
        title: 'Café y risas',
        date: '2025-09-14',
        location: 'Café de la Montaña',
        description: 'Conversaciones que se quedan guardadas en el corazón.',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        photos: [
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80'
        ],
        photosCount: 8,
        isFeatured: false,
        auraColor: '#6366F1',
        author: { id: 'usr_wendy', name: 'Wendy', color: '#EC4899', avatar: '' },
        audioNote: {
          duration: '0:45',
          audioUrl: ''
        },
        comments: [
          { id: 'c3', authorName: 'Kevin', authorRole: 'kevin', text: 'Me encanta escuchar esta nota de voz ☕', time: 'Hace 2 días', reactions: { heart: 4 } }
        ],
        commentsCount: 5,
        createdAt: '2025-09-14T15:00:00Z'
      },
      {
        id: 'mem_3',
        title: 'Noche de estrellas',
        date: '2025-09-05',
        location: 'Desierto de la Tatacoa',
        description: 'Acampamos, contamos historias y pedimos deseos.',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
        photos: [
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
        ],
        photosCount: 15,
        isFeatured: true,
        auraColor: '#F59E0B',
        author: { id: 'usr_kevin', name: 'Kevin', color: '#6366F1', avatar: '' },
        song: {
          title: 'A Sky Full of Stars',
          artist: 'Coldplay',
          artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/d4/0b/bfd40b3c-dc09-8473-b3c0-038827943c2c/0094639534658.jpg/600x600bb.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/cf/48/05cf4867-b5bf-734f-0131-bb96dafead21/mzaf_12411036066270632599.plus.aac.p.m4a'
        },
        comments: [
          { id: 'c4', authorName: 'Wendy', authorRole: 'wendy', text: 'La noche más mágica bajo las estrellas ✨⛺', time: 'Hace 3 días', reactions: { heart: 5 } }
        ],
        commentsCount: 12,
        createdAt: '2025-09-05T23:15:00Z'
      },
      {
        id: 'mem_4',
        title: 'Caminata por el bosque nublado',
        date: '2025-08-18',
        location: 'Parque Arví, Medellín',
        description: 'El olor a pino, la neblina suave y un sendero lleno de magia.',
        coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        photos: [],
        photosCount: 6,
        isFeatured: false,
        auraColor: '#10B981',
        author: { id: 'usr_wendy', name: 'Wendy', color: '#EC4899', avatar: '' },
        song: {
          title: 'Holocene',
          artist: 'Bon Iver',
          artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/d4/0b/bfd40b3c-dc09-8473-b3c0-038827943c2c/0094639534658.jpg/600x600bb.jpg',
          previewUrl: ''
        },
        commentsCount: 3,
        createdAt: '2025-08-18T14:20:00Z'
      },
      {
        id: 'mem_5',
        title: 'Tarde de cocina y pizzas caseras',
        date: '2025-07-10',
        location: 'En Casa',
        description: 'Harina por todas partes pero las mejores pizzas que hemos probado.',
        coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        photos: [],
        photosCount: 4,
        isFeatured: false,
        auraColor: '#F43F5E',
        author: { id: 'usr_kevin', name: 'Kevin', color: '#6366F1', avatar: '' },
        commentsCount: 4,
        createdAt: '2025-07-10T20:00:00Z'
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
          usr_me: '10',
          luma_host_1: '10',
          luma_member_2: '9.5',
          luma_member_3: '10'
        },
        comments: {
          usr_me: 'Obra maestra absoluta de la ciencia ficción.'
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
        participants: ['Usuario LUMA', 'Alex', 'Sam', 'Dani'],
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
    ],

    plans: [
      {
        id: 'plan_1',
        title: 'Cena y Noche de Películas',
        date: '2026-10-15',
        time: '19:30',
        location: 'Restaurante Central',
        category: 'Cena',
        icon: '🍽️',
        description: 'Reservar mesa con anticipación y llevar el postre favorito.',
        author: { id: 'usr_kevin', name: 'Kevin', color: '#6366F1' },
        createdAt: '2026-02-20T12:00:00Z'
      }
    ]
  };

  const DEFAULT_USER_PROFILE = {
    id: 'usr_me',
    name: 'Usuario LUMA',
    handle: '@usuario',
    avatar: '',
    presetAvatar: 'astronaut',
    statusMsg: '✨ Explorando LUMA',
    bio: '¡Hola! Compartiendo momentos increíbles en LUMA 🌟',
    gender: 'No especificado',
    favoriteColor: '#6366F1',
    banner: ''
  };

  class LumaStorage {
    constructor() {
      this.listeners = [];
      this.memoryCache = {};
      this.init();
    }

    init() {
      // 1. Inicializar Perfil por defecto si no existe
      if (!this.hasStoredProfile()) {
        this.saveUserProfile(DEFAULT_USER_PROFILE);
      }

      // 2. Inicializar Grupos por defecto si no existen
      const groups = this.getGroups();
      if (!groups || groups.length === 0) {
        this.saveGroups([DEMO_GROUP]);
        this.setActiveGroupId(DEMO_GROUP.id);
        this.saveGroupData(DEMO_GROUP.id, DEMO_DATA);
      } else if (!this.getActiveGroupId()) {
        this.setActiveGroupId(groups[0].id);
      }
    }

    subscribe(callback) {
      this.listeners.push(callback);
    }

    notify(key) {
      this.listeners.forEach(fn => {
        try { fn(key); } catch (e) { console.error('Storage notify error:', e); }
      });
    }

    // --- PERFIL GLOBAL ---
    hasStoredProfile() {
      return Boolean(localStorage.getItem(window.CONFIG.storageKeys.userProfile));
    }

    getUserProfile() {
      const raw = localStorage.getItem(window.CONFIG.storageKeys.userProfile);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.name) return parsed;
        } catch (_) {}
      }
      return DEFAULT_USER_PROFILE;
    }

    saveUserProfile(profile) {
      const existing = this.getUserProfile();
      const updated = {
        ...existing,
        ...profile,
        id: existing.id || 'usr_' + Date.now().toString(36),
        name: (profile.name || existing.name || 'Usuario LUMA').trim(),
        handle: profile.handle !== undefined ? profile.handle : (existing.handle || '@usuario'),
        avatar: profile.avatar !== undefined ? profile.avatar : (existing.avatar || ''),
        presetAvatar: profile.presetAvatar !== undefined ? profile.presetAvatar : (existing.presetAvatar || 'astronaut'),
        statusMsg: profile.statusMsg !== undefined ? profile.statusMsg : (existing.statusMsg || '✨ En línea'),
        bio: profile.bio !== undefined ? profile.bio : (existing.bio || ''),
        gender: profile.gender || existing.gender || 'No especificado',
        favoriteColor: profile.favoriteColor || existing.favoriteColor || '#6366F1',
        banner: profile.banner !== undefined ? profile.banner : (existing.banner || ''),
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
      return localStorage.getItem(window.CONFIG.storageKeys.activeGroup) || (this.getGroups()[0]?.id) || DEFAULT_INITIAL_GROUP_ID;
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

    switchGroup(groupId) {
      this.setActiveGroupId(groupId);
      return this.getActiveGroup();
    }

    createGroup(name, icon = '🌟', color = '#6366F1', coverImage = '', iconImage = '') {
      const user = this.getUserProfile();
      const now = new Date().toISOString();
      const newGroup = {
        id: 'group_' + Date.now().toString(36),
        name: name || 'Nuevo Grupo',
        icon: icon || '🌟',
        iconImage: iconImage || '',
        code: window.Utils.generateGroupCode(),
        color: color || '#6366F1',
        coverImage: coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        createdAt: now,
        host: { id: user.id, name: user.name },
        members: [{
          id: user.id,
          name: user.name,
          color: user.favoriteColor || color,
          avatar: user.avatar || '',
          statusMsg: user.statusMsg || '✨ En línea',
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

    joinGroupByCode(code) {
      const cleanCode = (code || '').trim().toUpperCase();
      if (!cleanCode || cleanCode.length !== 6) {
        throw new Error('El código debe tener 6 caracteres');
      }

      const groups = this.getGroups();
      let group = groups.find(g => g.code === cleanCode);
      const user = this.getUserProfile();
      const now = new Date().toISOString();

      if (!group) {
        group = {
          id: 'group_remote_' + cleanCode.toLowerCase(),
          name: `Grupo #${cleanCode}`,
          icon: '✨',
          iconImage: '',
          code: cleanCode,
          color: '#3B82F6',
          coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          createdAt: now,
          host: { id: 'remote_host', name: 'Administrador' },
          members: [
            { id: user.id, name: user.name, color: user.favoriteColor || '#3B82F6', avatar: user.avatar || '', statusMsg: user.statusMsg || '✨ En línea', joinedAt: now }
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
            statusMsg: user.statusMsg || '✨ En línea',
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
        statusMsg: userProfile.statusMsg,
        joinedAt: idx >= 0 && group.members[idx].joinedAt ? group.members[idx].joinedAt : new Date().toISOString()
      };

      if (idx >= 0) {
        group.members[idx] = memberObj;
      } else {
        group.members.push(memberObj);
      }
      this.saveGroups(groups);
    }

    // --- DATOS DEL GRUPO ACTIVO CON PROTECCIÓN DE CUOTA E INDEXEDDB ---
    getGroupData(groupId) {
      const gid = groupId || this.getActiveGroupId();
      if (this.memoryCache && this.memoryCache[gid]) {
        return this.memoryCache[gid];
      }
      const raw = localStorage.getItem(window.CONFIG.storageKeys.groupData + gid);
      if (!raw) return { memories: [], songs: [], movies: [], series: [], goals: [], notes: [] };
      try {
        const parsed = JSON.parse(raw);
        if (!this.memoryCache) this.memoryCache = {};
        this.memoryCache[gid] = parsed;
        return parsed;
      } catch (_) {
        return { memories: [], songs: [], movies: [], series: [], goals: [], notes: [] };
      }
    }

    saveGroupData(groupId, data) {
      const gid = groupId || this.getActiveGroupId();
      if (!this.memoryCache) this.memoryCache = {};
      this.memoryCache[gid] = data;

      try {
        localStorage.setItem(window.CONFIG.storageKeys.groupData + gid, JSON.stringify(data));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.warn('LUMA Storage: Quota exceeded in localStorage. Optimizing payload safely.');
          const optimized = this.optimizeGroupDataForStorage(data);
          try {
            localStorage.setItem(window.CONFIG.storageKeys.groupData + gid, JSON.stringify(optimized));
          } catch (_) {
            console.warn('LUMA Storage: Saved in memory cache.');
          }
        }
      }
      this.saveToIndexedDB(gid, data);
      this.notify('groupData');
    }

    optimizeGroupDataForStorage(data) {
      if (!data) return data;
      const clone = JSON.parse(JSON.stringify(data));
      if (clone.memories && Array.isArray(clone.memories)) {
        clone.memories = clone.memories.map(m => {
          if (m.photos && m.photos.length > 4) {
            m.photos = m.photos.slice(0, 4);
          }
          return m;
        });
      }
      return clone;
    }

    saveToIndexedDB(groupId, data) {
      try {
        if (!window.indexedDB) return;
        const request = window.indexedDB.open('LUMAPersistenceDB', 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('groups')) {
            db.createObjectStore('groups', { keyPath: 'id' });
          }
        };
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('groups', 'readwrite');
          const store = tx.objectStore('groups');
          store.put({ id: groupId, data: data, updatedAt: new Date().toISOString() });
        };
      } catch (_) {}
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

    addMemoryComment(memoryId, text) {
      const data = this.getGroupData();
      const mem = (data.memories || []).find(m => m.id === memoryId);
      const user = this.getUserProfile();
      if (mem) {
        if (!mem.comments) mem.comments = [];
        mem.comments.push({
          id: window.Utils.generateId(),
          author: user.name,
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
      const user = this.getUserProfile();
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

    getPlans() { return this.getGroupData().plans || []; }
    savePlan(plan) {
      const data = this.getGroupData();
      if (!data.plans) data.plans = [];
      if (!plan.id) plan.id = 'plan_' + window.Utils.generateId();
      if (!plan.createdAt) plan.createdAt = new Date().toISOString();
      const idx = data.plans.findIndex(p => p.id === plan.id);
      if (idx >= 0) data.plans[idx] = plan;
      else data.plans.unshift(plan);
      this.saveGroupData(null, data);
      return plan;
    }
    deletePlan(id) {
      const data = this.getGroupData();
      data.plans = (data.plans || []).filter(p => p.id !== id);
      this.saveGroupData(null, data);
    }

    getDriveFolder() {
      const data = this.getGroupData();
      return data.driveFolder || '';
    }

    getDriveWebhook() {
      const data = this.getGroupData();
      return data.driveWebhook || '';
    }

    saveDriveFolder(url, webhookUrl = null) {
      const data = this.getGroupData();
      data.driveFolder = url ? url.trim() : '';
      if (webhookUrl !== null) {
        data.driveWebhook = webhookUrl ? webhookUrl.trim() : '';
      }
      this.saveGroupData(null, data);
      return data.driveFolder;
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

      let maxMonthIdx = 1; // Default Feb
      let maxMonthCount = 0;
      for (let m = 0; m < 12; m++) {
        const cnt = monthCounts[m] || 0;
        if (cnt > maxMonthCount) {
          maxMonthCount = cnt;
          maxMonthIdx = m;
        }
      }
      const mostActiveMonth = monthsName[maxMonthIdx];

      let topMovie = 'Interestelar ⭐ 9.8';
      let highestScore = -1;
      movies.forEach(m => {
        const avg = parseFloat(m.groupAverage || 0);
        if (avg > highestScore) {
          highestScore = avg;
          topMovie = `${m.title} ⭐ ${m.groupAverage}`;
        }
      });

      const artistCounts = {};
      songs.forEach(s => {
        if (s.artist) artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
      });
      let topArtist = 'Coldplay';
      let maxArtistCount = 0;
      Object.entries(artistCounts).forEach(([art, cnt]) => {
        if (cnt > maxArtistCount) {
          maxArtistCount = cnt;
          topArtist = art;
        }
      });

      let topSeries = 'Arcane (T2:C1)';
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