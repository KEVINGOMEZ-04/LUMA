/**
 * LUMA 🌟 - Sistema de Presencia Multi-Usuario en Grupo
 */

(function() {
  class GroupPresence {
    constructor() {
      this.currentGroupId = null;
      this.currentUser = null;
      this.presenceRef = null;
      this.userPresenceRef = null;
      this.listeners = [];
      this.presenceMap = {};
      this.awayTimer = null;
      this.isOnline = false;

      this.initFirebase();
      this.setupAwayDetection();
    }

    initFirebase() {
      try {
        if (typeof firebase !== 'undefined' && window.CONFIG?.firebase?.enabled) {
          if (!firebase.apps.length) {
            firebase.initializeApp(window.CONFIG.firebase.config);
          }
          this.db = firebase.database();
        }
      } catch (err) {
        console.warn('Firebase RTDB no inicializado en presencia:', err);
      }
    }

    subscribe(callback) {
      this.listeners.push(callback);
      callback(this.presenceMap);
    }

    notify() {
      this.listeners.forEach(fn => fn(this.presenceMap));
    }

    bindGroup(groupId, userProfile) {
      if (!groupId || !userProfile || !userProfile.id) return;
      this.currentGroupId = groupId;
      this.currentUser = userProfile;

      if (!this.db) return;

      if (this.userPresenceRef) {
        this.userPresenceRef.set({
          online: false,
          state: 'offline',
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }

      const presencePath = `presence/${groupId}/${userProfile.id}`;
      this.userPresenceRef = this.db.ref(presencePath);

      const connectedRef = this.db.ref('.info/connected');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          this.isOnline = true;
          this.userPresenceRef.onDisconnect().set({
            online: false,
            state: 'offline',
            lastSeen: firebase.database.ServerValue.TIMESTAMP
          });

          this.updateState('online');
        } else {
          this.isOnline = false;
        }
      });

      // Escuchar presencia de todos los miembros del grupo
      this.presenceRef = this.db.ref(`presence/${groupId}`);
      this.presenceRef.on('value', (snap) => {
        this.presenceMap = snap.val() || {};
        this.notify();
      });
    }

    updateState(state) {
      if (!this.userPresenceRef || !this.currentUser) return;
      this.userPresenceRef.set({
        online: state !== 'offline',
        state: state,
        name: this.currentUser.name || 'Miembro',
        avatar: this.currentUser.avatar || '',
        color: this.currentUser.favoriteColor || '#7C3AED',
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      });
    }

    setupAwayDetection() {
      const resetAway = () => {
        if (!this.userPresenceRef) return;
        this.updateState('online');
        if (this.awayTimer) clearTimeout(this.awayTimer);
        this.awayTimer = setTimeout(() => {
          this.updateState('away');
        }, 180000); // 3 minutos sin interacción -> Ausente
      };

      window.addEventListener('mousemove', resetAway, { passive: true });
      window.addEventListener('keydown', resetAway, { passive: true });
      window.addEventListener('touchstart', resetAway, { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.updateState('away');
        } else {
          this.updateState('online');
        }
      });
    }
  }

  window.presence = new GroupPresence();
})();