/**
 * Patico Wrapped 🌻 - Sistema de Presencia Compartida
 */

(function() {
  class PresenceService {
    constructor() {
      this.config = window.CONFIG.presence;
      this.currentUser = window.storage.getCurrentUser();
      this.listeners = [];
      this.heartbeatTimer = null;
      
      this.state = {
        provider: this.config.provider,
        users: {
          Kevin: {
            online: false,
            lastSeen: null,
            lastSeenFormatted: 'No disponible'
          },
          Wendy: {
            online: false,
            lastSeen: null,
            lastSeenFormatted: 'No disponible'
          }
        },
        summary: 'Modo local: presencia compartida no configurada',
        isLocal: true,
        lastError: null
      };

      this.init();
    }

    init() {
      this.loadLocalPresence();

      if (this.config.provider === 'local') {
        this.initLocalMode();
      } else if (this.config.provider === 'firebase') {
        this.initFirebaseMode();
      } else {
        this.initLocalMode();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.sendHeartbeat();
        } else {
          this.handleTabHidden();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.handleTabClosing();
      });
    }

    loadLocalPresence() {
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      const now = new Date().toISOString();

      localData[this.currentUser] = {
        lastSeen: now,
        online: true
      };
      window.storage.set(window.CONFIG.storageKeys.localPresence, localData);

      window.CONFIG.users.forEach(user => {
        const uData = localData[user];
        if (uData && uData.lastSeen) {
          this.state.users[user] = {
            online: user === this.currentUser,
            lastSeen: uData.lastSeen,
            lastSeenFormatted: window.Utils.formatDateTimeES(uData.lastSeen)
          };
        }
      });

      this.updateSummary();
    }

    initLocalMode() {
      this.state.isLocal = true;
      this.state.provider = 'local';
      this.sendHeartbeat();

      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat();
      }, this.config.heartbeatIntervalMs);
    }

    initFirebaseMode() {
      this.state.isLocal = false;
      this.state.provider = 'firebase';
      
      if (!this.config.firebaseConfig || !this.config.firebaseConfig.databaseURL || !window.firebase) {
        this.state.lastError = 'Configuración de Firebase incompleta. Operando en Modo Local.';
        this.initLocalMode();
        return;
      }

      try {
        if (!firebase.apps.length) firebase.initializeApp(this.config.firebaseConfig);
        const db = firebase.database();
        const roomId = this.config.roomId;
        this.presenceRef = db.ref(`rooms/${roomId}/presence`);
        this.userPresenceRef = db.ref(`rooms/${roomId}/presence/${this.currentUser}`);

        const connectedRef = db.ref('.info/connected');
        connectedRef.on('value', (snap) => {
          if (snap.val() === true && this.userPresenceRef) {
            this.userPresenceRef.onDisconnect().set({
              online: false,
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            this.userPresenceRef.set({
              online: true,
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          }
        });

        this.presenceRef.on('value', (snapshot) => {
          const val = snapshot.val() || {};
          window.CONFIG.users.forEach(user => {
            const uData = val[user];
            if (uData) {
              const lastSeenDate = uData.lastSeen ? new Date(uData.lastSeen).toISOString() : null;
              this.state.users[user] = {
                online: Boolean(uData.online),
                lastSeen: lastSeenDate,
                lastSeenFormatted: lastSeenDate ? window.Utils.formatDateTimeES(lastSeenDate) : 'Desconectado'
              };
            } else {
              this.state.users[user] = {
                online: false,
                lastSeen: null,
                lastSeenFormatted: 'Desconectado'
              };
            }
          });
          this.updateSummary();
          this.notify();
        });

        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (this.userPresenceRef && !document.hidden) {
            this.userPresenceRef.update({
              online: true,
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          }
        }, 25000);
      } catch (err) {
        console.error('Error inicializando presencia Firebase:', err);
        this.initLocalMode();
      }
    }

    sendHeartbeat() {
      const now = new Date().toISOString();
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      
      localData[this.currentUser] = {
        lastSeen: now,
        online: true,
        roomId: this.config.roomId
      };
      window.storage.set(window.CONFIG.storageKeys.localPresence, localData);

      if (this.state.isLocal) {
        window.CONFIG.users.forEach(user => {
          const uData = localData[user];
          if (user === this.currentUser) {
            this.state.users[user] = {
              online: true,
              lastSeen: now,
              lastSeenFormatted: window.Utils.formatDateTimeES(now)
            };
          } else {
            const lastSeen = uData ? uData.lastSeen : null;
            this.state.users[user] = {
              online: false,
              lastSeen: lastSeen,
              lastSeenFormatted: lastSeen ? window.Utils.formatDateTimeES(lastSeen) : 'Sin registros'
            };
          }
        });
      }

      this.updateSummary();
      this.notify();
    }

    handleTabHidden() {
      if (this.userPresenceRef) {
        this.userPresenceRef.update({
          online: false,
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }

    handleTabClosing() {
      if (this.userPresenceRef) {
        this.userPresenceRef.set({
          online: false,
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }

    updateSummary() {
      const kevinOnline = Boolean(this.state.users.Kevin?.online);
      const wendyOnline = Boolean(this.state.users.Wendy?.online);

      if (kevinOnline && wendyOnline) {
        this.state.summary = '✨ Ambos en línea';
      } else if (kevinOnline) {
        this.state.summary = '🟢 Kevin en línea';
      } else if (wendyOnline) {
        this.state.summary = '🟢 Wendy en línea';
      } else {
        this.state.summary = '💤 Desconectados';
      }
    }

    switchUser(newUser) {
      if (!window.CONFIG.users.includes(newUser)) return false;
      
      if (this.userPresenceRef) {
        this.userPresenceRef.set({
          online: false,
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }

      this.currentUser = newUser;
      window.storage.setCurrentUser(newUser);

      if (this.state.provider === 'firebase' && window.firebase) {
        this.userPresenceRef = firebase.database().ref(`rooms/${this.config.roomId}/presence/${newUser}`);
        this.userPresenceRef.onDisconnect().set({
          online: false,
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        this.userPresenceRef.set({
          online: true,
          lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
      }

      this.sendHeartbeat();
      return true;
    }

    getState() {
      return {
        ...this.state,
        currentUser: this.currentUser
      };
    }

    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.getState());
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      const currentState = this.getState();
      this.listeners.forEach(cb => {
        try {
          cb(currentState);
        } catch (e) {
          console.error('Error en listener de presencia:', e);
        }
      });
    }
  }

  window.presence = new PresenceService();
})();
