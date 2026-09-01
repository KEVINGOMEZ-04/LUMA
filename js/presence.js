/**
 * LUMA 🌟 - Sistema de Presencia en Tiempo Real Multi-Usuario
 */

(function() {
  class PresenceService {
    constructor() {
      this.config = window.CONFIG.presence;
      this.listeners = [];
      this.heartbeatTimer = null;
      this.currentGroupPresenceRef = null;
      this.userPresenceRef = null;
      this.groupMembersPresence = {};

      this.init();
    }

    init() {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.setOnlineStatus(true);
        } else {
          this.setAwayStatus();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.setOnlineStatus(false);
      });
    }

    // Conectar la presencia al grupo activo
    bindGroup(groupId, userProfile) {
      if (!groupId || !userProfile || !userProfile.id) return;

      this.currentGroupId = groupId;
      this.currentUser = userProfile;

      if (window.firebase && this.config.firebaseConfig && this.config.firebaseConfig.databaseURL) {
        this.initFirebasePresence(groupId, userProfile);
      } else {
        this.initLocalPresence(groupId, userProfile);
      }
    }

    initFirebasePresence(groupId, userProfile) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(this.config.firebaseConfig);
        }

        const db = firebase.database();
        this.currentGroupPresenceRef = db.ref(`presence/${groupId}`);
        this.userPresenceRef = db.ref(`presence/${groupId}/${userProfile.id}`);

        const connectedRef = db.ref('.info/connected');
        connectedRef.on('value', (snap) => {
          if (snap.val() === true && this.userPresenceRef) {
            this.userPresenceRef.onDisconnect().set({
              online: false,
              state: 'offline',
              userName: userProfile.name,
              userAvatar: userProfile.avatar || '',
              userColor: userProfile.favoriteColor || '#7C3AED',
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });

            this.userPresenceRef.set({
              online: true,
              state: 'online',
              userName: userProfile.name,
              userAvatar: userProfile.avatar || '',
              userColor: userProfile.favoriteColor || '#7C3AED',
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          }
        });

        // Escuchar cambios de todos los miembros del grupo
        this.currentGroupPresenceRef.on('value', (snapshot) => {
          const val = snapshot.val() || {};
          this.groupMembersPresence = val;
          this.notify();
        });

        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (this.userPresenceRef && !document.hidden) {
            this.userPresenceRef.update({
              online: true,
              state: 'online',
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          }
        }, this.config.heartbeatIntervalMs);

      } catch (err) {
        console.warn('Error inicializando presencia en Firebase:', err);
        this.initLocalPresence(groupId, userProfile);
      }
    }

    initLocalPresence(groupId, userProfile) {
      this.groupMembersPresence[userProfile.id] = {
        online: true,
        state: 'online',
        userName: userProfile.name,
        userAvatar: userProfile.avatar || '',
        userColor: userProfile.favoriteColor || '#7C3AED',
        lastSeen: new Date().toISOString()
      };
      this.notify();
    }

    setOnlineStatus(isOnline) {
      if (this.userPresenceRef && window.firebase) {
        this.userPresenceRef.update({
          online: Boolean(isOnline),
          state: isOnline ? 'online' : 'offline',
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }

    setAwayStatus() {
      if (this.userPresenceRef && window.firebase) {
        this.userPresenceRef.update({
          online: false,
          state: 'away',
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }

    getMembersPresence() {
      return this.groupMembersPresence || {};
    }

    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.getMembersPresence());
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      const presence = this.getMembersPresence();
      this.listeners.forEach(cb => {
        try { cb(presence); } catch (e) {}
      });
    }
  }

  window.presence = new PresenceService();
})();
