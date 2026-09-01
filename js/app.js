/**
 * Patico Wrapped 🌻 - Controlador Principal de la Aplicación
 */

(function() {
  class PaticoApp {
    constructor() {
      this.currentSectionId = "inicio";
      this.init();
    }

    init() {
      new window.StarfieldBackground("stars-canvas");
      this.initUnlockSystem();
      this.initWhatsAppPresenceUI();
      this.initProfilesModal();
      this.initNudgeFeature();
      this.initSystemNotifications();
      this.initUploadMonitorUI();
      this.initNavigation();
      this.initSections();
      this.initModals();
      this.initLightbox();
      this.initWrappedSystem();
      this.initDailyPrompt();
      this.initTimeCapsules();
      this.initVoiceRecorders();
      
      // Registro de PWA Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration note:', err));
        });
      }

      window.storage.subscribe((key) => {
        if (key === window.CONFIG.storageKeys.memories) {
          this.renderMemories();
          this.renderAnnualCalendar();
        }
        if (key === window.CONFIG.storageKeys.movies) this.renderMovies();
        if (key === window.CONFIG.storageKeys.series) this.renderSeries();
        if (key === window.CONFIG.storageKeys.songs) this.renderSongs();
        if (key === window.CONFIG.storageKeys.notes) this.renderNotes();
        if (key === window.CONFIG.storageKeys.dreams) this.renderDreams();
        if (key === window.CONFIG.storageKeys.dailyPrompts) this.renderDailyPromptWidget();
        if (key === window.CONFIG.storageKeys.timeCapsules) this.renderTimeCapsules();
        if (key === window.CONFIG.storageKeys.profiles) {
          this.initWhatsAppPresenceUI();
          this.renderDailyDashboard();
        }
        this.renderDailyDashboard();
      });

      window.storage.onRemoteReady = () => {
        this.renderMemories();
        this.renderAnnualCalendar();
        this.renderMovies();
        this.renderSeries();
        this.renderSongs();
        this.renderNotes();
        this.renderDreams();
        this.renderDailyPromptWidget();
        this.renderTimeCapsules();
        this.renderDailyDashboard();
        this.initWhatsAppPresenceUI();
      };
    }

    // --- 1. Desbloqueo y Seguridad ---
    initUnlockSystem() {
      const lockScreen   = document.getElementById('lock-screen');
      const lockCard     = document.getElementById('lock-card');
      const appContainer = document.getElementById('app-container');
      const lockForm     = document.getElementById('lock-form');
      const usernameInput = document.getElementById('lock-username');
      const passwordInput = document.getElementById('lock-password');
      const lockError    = document.getElementById('lock-error');
      const btnReLock    = document.getElementById('btn-re-lock');
      const btnToggleEye = document.getElementById('btn-toggle-lock-password');
      const submitBtn    = document.getElementById('btn-submit-lock');

      // Recordar último usuario seleccionado
      const lastUser = window.storage.getCurrentUser() || 'Kevin';
      if (usernameInput) usernameInput.value = lastUser;

      // Actualizar tarjetas de usuario y permitir seleccionar con un toque
      const cards = document.querySelectorAll('.lock-user-card');
      const selectUserCard = (user) => {
        if (usernameInput) usernameInput.value = user;
        cards.forEach(c => {
          if (c.dataset.user === user) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
        if (lockError) lockError.textContent = '';
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      };

      cards.forEach(card => {
        if (card.dataset.user === lastUser) card.classList.add('active');
        else card.classList.remove('active');

        card.addEventListener('click', () => {
          const user = card.dataset.user;
          if (user) selectUserCard(user);
        });
      });

      // Actualizar apodos en subtítulos de las tarjetas
      const updateNicknamesOnCards = () => {
        try {
          const profiles = window.storage.getProfiles ? window.storage.getProfiles() : {};
          const kevinSub = document.getElementById('lock-kevin-subtag');
          const wendySub = document.getElementById('lock-wendy-subtag');
          if (kevinSub && profiles.Wendy?.nicknameForKevin) {
            kevinSub.textContent = profiles.Wendy.nicknameForKevin;
          }
          if (wendySub && profiles.Kevin?.nicknameForWendy) {
            wendySub.textContent = profiles.Kevin.nicknameForWendy;
          }
        } catch (_) {}
      };
      updateNicknamesOnCards();

      // Botón Ver/Ocultar contraseña
      btnToggleEye?.addEventListener('click', () => {
        if (!passwordInput) return;
        const isPass = passwordInput.type === 'password';
        passwordInput.type = isPass ? 'text' : 'password';
        btnToggleEye.textContent = isPass ? '🙈' : '👁️';
      });

      // Función de desbloqueo garantizado
      const unlockAndOpen = (username) => {
        window.storage.setCurrentUser(username);
        window.storage.setUnlocked(true);
        localStorage.setItem('patico_session_token', Date.now().toString());

        try {
          if (window.presence?.switchUser) window.presence.switchUser(username);
        } catch (e) {
          console.warn('Presence error ignored on unlock:', e);
        }

        if (lockError) lockError.textContent = '';
        lockCard?.classList.add('blooming');

        setTimeout(() => {
          lockScreen?.classList.add('unlocked-fade');
          setTimeout(() => {
            if (lockScreen) {
              lockScreen.style.display = 'none';
              lockScreen.classList.remove('unlocked-fade');
            }
            if (lockCard) lockCard.classList.remove('blooming');
            if (appContainer) appContainer.style.display = 'flex';

            try { this.handleRouting(); } catch (_) {}
            try { this.initWhatsAppPresenceUI(); } catch (_) {}
            try { this.renderDailyDashboard(); } catch (_) {}

            if (submitBtn) submitBtn.disabled = false;
            window.Utils.showToast(`¡Bienvenido(a), ${username}! 🌻✨`, 'success');
          }, 350);
        }, 250);
      };

      // Si ya está desbloqueado en la sesión
      if (window.storage.isUnlocked()) {
        if (lockScreen) lockScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        try { this.handleRouting(); } catch (_) {}
      } else {
        if (lockScreen) lockScreen.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
      }

      // Procesar Login al enviar el formulario
      lockForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput ? usernameInput.value : 'Kevin';
        const enteredPassword = passwordInput ? passwordInput.value : '';
        if (!enteredPassword) {
          if (lockError) lockError.textContent = 'Por favor, ingresa tu contraseña.';
          if (passwordInput) passwordInput.focus();
          return;
        }
        if (submitBtn) submitBtn.disabled = true;

        const valid = await window.storage.verifyCredentials(username, enteredPassword);
        if (valid) {
          unlockAndOpen(username);
        } else {
          if (submitBtn) submitBtn.disabled = false;
          if (lockError) lockError.textContent = '❌ Contraseña incorrecta. (Clave por defecto: 1234)';
          if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
          }
        }
      });

      // Botón Bloquear de nuevo
      btnReLock?.addEventListener('click', () => {
        window.storage.setUnlocked(false);
        if (appContainer) appContainer.style.display = 'none';
        if (lockScreen) lockScreen.style.display = 'flex';
        if (passwordInput) passwordInput.value = '';
        if (lockError) lockError.textContent = '';
        updateNicknamesOnCards();
        window.Utils.showToast('Sesión bloqueada de forma segura', 'info');
      });
    }

    // --- 2. Barra de Presencia en Tiempo Real Estilo WhatsApp ---
    formatWhatsAppLastSeen(timestamp) {
      if (!timestamp) return 'desconectado(a)';
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      if (diffMs < 75000) return 'en línea';

      const isToday = date.getDate() === now.getDate() &&
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() &&
                          date.getMonth() === yesterday.getMonth() &&
                          date.getFullYear() === yesterday.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      hours = hours % 12 || 12;
      const timeStr = `${hours}:${minutes} ${ampm}`;

      if (isToday) {
        return `últ. vez hoy a las ${timeStr}`;
      } else if (isYesterday) {
        return `últ. vez ayer a las ${timeStr}`;
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `últ. vez el ${day}/${month} a las ${timeStr}`;
      }
    }

    initWhatsAppPresenceUI() {
      const updatePresenceBar = () => {
        const currentUser = window.storage.getCurrentUser();
        const profiles = window.storage.getProfiles();
        const presence = window.storage.presenceState || {};

        const kevinProfile = profiles.Kevin || { name: 'Kevin', nickname: 'Kevin', avatar: '' };
        const wendyProfile = profiles.Wendy || { name: 'Wendy', nickname: 'Patico ♥️', avatar: '' };

        // 1. Nombres de la pareja en la barra
        const namesEl = document.getElementById('whatsapp-couple-names');
        if (namesEl) {
          namesEl.textContent = `${kevinProfile.nickname} & ${wendyProfile.nickname}`;
        }

        // 2. Avatares
        const kevinImg = document.getElementById('header-avatar-kevin-img');
        const kevinFallback = document.getElementById('header-avatar-kevin-fallback');
        if (kevinImg && kevinFallback) {
          if (kevinProfile.avatar) {
            kevinImg.src = kevinProfile.avatar;
            kevinImg.style.display = 'block';
            kevinFallback.style.display = 'none';
          } else {
            kevinImg.style.display = 'none';
            kevinFallback.style.display = 'flex';
            kevinFallback.textContent = kevinProfile.nickname ? kevinProfile.nickname.charAt(0).toUpperCase() : 'K';
          }
        }

        const wendyImg = document.getElementById('header-avatar-wendy-img');
        const wendyFallback = document.getElementById('header-avatar-wendy-fallback');
        if (wendyImg && wendyFallback) {
          if (wendyProfile.avatar) {
            wendyImg.src = wendyProfile.avatar;
            wendyImg.style.display = 'block';
            wendyFallback.style.display = 'none';
          } else {
            wendyImg.style.display = 'none';
            wendyFallback.style.display = 'flex';
            wendyFallback.textContent = wendyProfile.nickname ? wendyProfile.nickname.charAt(0).toUpperCase() : 'W';
          }
        }

        // 3. Puntos de conexión (Verde brillante)
        const kevinOnline = presence.Kevin?.online === true || (presence.Kevin?.lastSeen && (Date.now() - presence.Kevin.lastSeen < 75000));
        const wendyOnline = presence.Wendy?.online === true || (presence.Wendy?.lastSeen && (Date.now() - presence.Wendy.lastSeen < 75000));

        const kevinDot = document.getElementById('header-dot-kevin');
        if (kevinDot) {
          kevinDot.className = 'whatsapp-online-dot ' + (kevinOnline ? 'online' : '');
          kevinDot.title = `Kevin: ${kevinOnline ? 'En línea' : this.formatWhatsAppLastSeen(presence.Kevin?.lastSeen)}`;
        }

        const wendyDot = document.getElementById('header-dot-wendy');
        if (wendyDot) {
          wendyDot.className = 'whatsapp-online-dot ' + (wendyOnline ? 'online' : '');
          wendyDot.title = `Wendy: ${wendyOnline ? 'En línea' : this.formatWhatsAppLastSeen(presence.Wendy?.lastSeen)}`;
        }

        // 4. Subtítulo con estado de la otra persona estilo WhatsApp
        const statusEl = document.getElementById('whatsapp-status-text');
        if (!statusEl) return;

        const otherUser = currentUser.toLowerCase() === 'wendy' ? 'Kevin' : 'Wendy';
        const otherProfile = otherUser === 'Kevin' ? kevinProfile : wendyProfile;
        const otherOnline = otherUser === 'Kevin' ? kevinOnline : wendyOnline;
        const otherLastSeen = otherUser === 'Kevin' ? presence.Kevin?.lastSeen : presence.Wendy?.lastSeen;

        if (kevinOnline && wendyOnline) {
          statusEl.innerHTML = `<span class="status-online-text">🟢 ¡Ambos en línea ahora! 💖</span>`;
        } else if (otherOnline) {
          statusEl.innerHTML = `<span class="status-online-text">🟢 ${window.Utils.sanitizeHTML(otherProfile.nickname)} en línea</span>`;
        } else {
          const lastSeenStr = this.formatWhatsAppLastSeen(otherLastSeen);
          statusEl.innerHTML = `<span class="status-offline-text">${window.Utils.sanitizeHTML(otherProfile.nickname)} ${window.Utils.sanitizeHTML(lastSeenStr)}</span>`;
        }
      };

      if (window.storage) {
        window.storage.onPresenceUpdate = () => updatePresenceBar();
        window.storage.onProfilesChange = () => {
          updatePresenceBar();
          this.renderDailyDashboard();
        };
        window.storage.onNudgeReceived = (nudge) => this.showNudgeReceivedAnimation(nudge);
        window.storage.onActivityReceived = (act) => this.showActivityNotification(act);
        window.storage.onForceLogout = (msg) => this.forceLogout(msg);
      }

      if (!this.presenceInterval) {
        this.presenceInterval = setInterval(updatePresenceBar, 15000);
      }
      updatePresenceBar();
    }

    forceLogout(msg = 'La sesión se ha cerrado por seguridad.') {
      window.storage.setUnlocked(false);
      const appContainer = document.getElementById('app-container');
      const lockScreen = document.getElementById('lock-screen');
      const passwordInput = document.getElementById('lock-password');
      const lockError = document.getElementById('lock-error');

      if (appContainer) appContainer.style.display = 'none';
      if (lockScreen) lockScreen.style.display = 'flex';
      if (passwordInput) passwordInput.value = '';
      if (lockError) lockError.textContent = msg;

      window.Utils.showToast(msg, 'warning');
    }

    showActivityNotification(act) {
      if (!act) return;
      const typeIcons = {
        'película': '🍿',
        'serie': '📺',
        'canción': '🎵',
        'nota': '💌',
        'sueño': '🌟',
        'recuerdo': '🌻'
      };
      const icon = typeIcons[act.type] || '✨';
      const senderName = act.userName || act.user || 'Tu amor';
      const actionText = `${act.action} ${act.type}: "${act.title}"`;
      const toastMsg = `${icon} <strong>${window.Utils.sanitizeHTML(senderName)}</strong> ${window.Utils.sanitizeHTML(act.action)} ${window.Utils.sanitizeHTML(act.type)}: <em>"${window.Utils.sanitizeHTML(act.title)}"</em>`;
      
      window.Utils.showToast(toastMsg, 'info');
      this.playNudgeSound();
      if (navigator.vibrate) {
        try { navigator.vibrate([150, 80, 150]); } catch (_) {}
      }

      // 📱 Notificación nativa en la barra superior del sistema (WhatsApp / YouTube style)
      const sectionMap = {
        'película': './#peliculas',
        'serie': './#series',
        'canción': './#musica',
        'nota': './#muro',
        'sueño': './#suenos',
        'recuerdo': './#recuerdos'
      };
      const targetUrl = sectionMap[act.type] || './';
      this.sendSystemNotification(`${senderName} · ATRIA ✨`, `${icon} ${actionText}`, targetUrl);
    }

    // Generador de sonido celestial / campana de amor con Web Audio API
    playNudgeSound() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Arpegio celestial de campana dorada (Do5, Mi5, Sol5, Do6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.11);

          gain.gain.setValueAtTime(0, now + i * 0.11);
          gain.gain.linearRampToValueAtTime(0.28, now + i * 0.11 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.85);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.11);
          osc.stop(now + i * 0.11 + 0.9);
        });
      } catch (e) {
        console.warn('AudioContext notice:', e);
      }
    }

    initNudgeFeature() {
      const btnNudge = document.getElementById('btn-send-nudge');
      if (!btnNudge) return;

      btnNudge.addEventListener('click', () => {
        const currentUser = window.storage.getCurrentUser();
        const storageKey = `atria_last_nudge_${currentUser}`;
        const lastSent = parseInt(localStorage.getItem(storageKey), 10) || 0;
        const now = Date.now();
        const cooldownMs = 20 * 60 * 1000; // Límite de 20 minutos
        const elapsed = now - lastSent;

        if (elapsed < cooldownMs) {
          const remainingMinutes = Math.ceil((cooldownMs - elapsed) / (60 * 1000));
          window.Utils.showToast(`⏳ Podrás enviar otro toquecito en ${remainingMinutes} min (límite: 1 cada 20 min).`, 'info');
          return;
        }

        // Guardar timestamp del toquecito
        localStorage.setItem(storageKey, now.toString());

        // Enviar a través de Firebase Realtime Database
        if (window.storage.sendNudge) {
          window.storage.sendNudge();
        }

        // Sonido y feedback táctil
        this.playNudgeSound();
        if (navigator.vibrate) {
          try { navigator.vibrate([100, 50, 100]); } catch (_) {}
        }

        const otherName = currentUser.toLowerCase() === 'wendy' ? 'Kevin' : 'Wendy';
        window.Utils.showToast(`🌻 ¡Toquecito de amor enviado a ${otherName}! 💖✨`, 'success');
      });
    }

    showNudgeReceivedAnimation(nudge) {
      // 1. Sonido celestial
      this.playNudgeSound();

      // 2. Vibración suave en dispositivos móviles
      if (navigator.vibrate) {
        try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (_) {}
      }

      // 3. Notificación nativa en la barra superior del sistema
      const sender = nudge.fromNickname || nudge.from || 'Tu amor';
      this.sendSystemNotification('🔔 ¡Toquecito de amor! 💕', `${sender} te acaba de mandar un toquecito en ATRIA ✨`, './#inicio');

      // 4. Notificación flotante luminosa
      const floater = document.createElement('div');
      floater.className = 'nudge-floater';
      floater.innerHTML = `<span>🌻</span><span>¡<strong>${window.Utils.sanitizeHTML(sender)}</strong> te envió un toquecito de amor!</span><span>💖</span>`;
      document.body.appendChild(floater);

      // 5. Lluvia de confeti
      if (window.confetti) {
        window.confetti({
          particleCount: 60,
          spread: 85,
          origin: { y: 0.2 },
          colors: ['#F4C542', '#E040FB', '#00E5FF', '#FF4081']
        });
      }

      setTimeout(() => floater.remove(), 6000);
    }

    // --- Sistema de Notificaciones del Sistema / Barra de Estado (WhatsApp / YouTube style) ---
    async initSystemNotifications() {
      // 1. Pedir permisos nativos en Capacitor si está corriendo como APK
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        try {
          const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
          await LocalNotifications.requestPermissions();
          await LocalNotifications.createChannel({
            id: 'atria_channel',
            name: 'Notificaciones ATRIA',
            description: 'Alertas de amor y novedades de Kevin y Wendy',
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: 'default'
          });
        } catch (err) {
          console.warn('LocalNotifications perm notice:', err);
        }
      }

      const btnAlerts = document.getElementById('btn-enable-notifications');
      btnAlerts?.addEventListener('click', async () => {
        try {
          if (window.Capacitor?.Plugins?.LocalNotifications) {
            const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            await LocalNotifications.requestPermissions();
            await LocalNotifications.createChannel({
              id: 'atria_channel',
              name: 'Notificaciones ATRIA',
              description: 'Alertas de amor y novedades de Kevin y Wendy',
              importance: 5,
              visibility: 1,
              vibration: true,
              sound: 'default'
            });
            this.sendSystemNotification('🔔 Notificaciones Activadas ✨', '¡Listo! Recibirás alertas en la barra de tu teléfono cuando tu amor interactúe 💕');
            window.Utils.showToast('¡Notificaciones en la barra de tu teléfono activadas! 🔔✨', 'success');
            return;
          }
          if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
              this.sendSystemNotification('🔔 Notificaciones Activadas ✨', '¡Listo! Recibirás alertas en la barra de tu teléfono cuando tu amor interactúe 💕');
              window.Utils.showToast('¡Notificaciones en la barra de tu teléfono activadas! 🔔✨', 'success');
              return;
            }
          }
          window.Utils.showToast('¡Notificaciones configuradas! ✨', 'success');
        } catch (e) {
          window.Utils.showToast('No se pudo activar permisos de notificación.', 'warning');
        }
      });

      // Solicitar permiso al primer toque o interacción
      const reqPerm = async () => {
        if (window.Capacitor?.Plugins?.LocalNotifications) {
          try {
            const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            await LocalNotifications.requestPermissions();
            await LocalNotifications.createChannel({
              id: 'atria_channel',
              name: 'Notificaciones ATRIA',
              description: 'Alertas de amor y novedades de Kevin y Wendy',
              importance: 5,
              visibility: 1,
              vibration: true,
              sound: 'default'
            });
          } catch (_) {}
        }
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (_) {}
        }
      };

      document.addEventListener('click', reqPerm, { once: true });
      document.addEventListener('touchstart', reqPerm, { once: true });
    }

    async sendSystemNotification(title, body, url = './#inicio') {
      // 1. Capacitor Native LocalNotifications (APK Android - Barra de estado nativa)
      if (window.Capacitor?.Plugins?.LocalNotifications) {
        try {
          const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
          
          try {
            const check = await LocalNotifications.checkPermissions();
            if (check.display !== 'granted') {
              await LocalNotifications.requestPermissions();
            }
          } catch (_) {}

          try {
            await LocalNotifications.createChannel({
              id: 'atria_channel',
              name: 'Notificaciones ATRIA',
              description: 'Alertas de amor y novedades de Kevin y Wendy',
              importance: 5,
              visibility: 1,
              vibration: true,
              sound: 'default'
            });
          } catch (_) {}

          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 900000) + 100000,
                title: title,
                body: body,
                channelId: 'atria_channel',
                sound: 'default',
                actionTypeId: '',
                extra: { url: url }
              }
            ]
          });
          return;
        } catch (err) {
          console.warn('Capacitor notification error:', err);
        }
      }

      // 2. Web / ServiceWorker Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              reg.showNotification(title, {
                body: body,
                icon: 'assets/icon.jpg',
                badge: 'assets/icon.jpg',
                vibrate: [200, 100, 200],
                data: { url: url }
              });
              return;
            }
          }
          new Notification(title, {
            body: body,
            icon: 'assets/icon.jpg'
          });
        } catch (e) {
          console.warn('Web notification notice:', e);
        }
      }
    }

    initUploadMonitorUI() {
      const btnMonitor = document.getElementById('btn-upload-monitor');
      const iconEl = document.getElementById('upload-monitor-icon');
      const labelEl = document.getElementById('upload-monitor-label');
      const pulseEl = document.getElementById('upload-monitor-indicator');
      const modal = document.getElementById('modal-upload-monitor');

      const mainStatusEl = document.getElementById('upload-monitor-main-status');
      const percentBadgeEl = document.getElementById('upload-monitor-percent-badge');
      const progressFillEl = document.getElementById('upload-monitor-progress-fill');
      const detailTextEl = document.getElementById('upload-monitor-detail-text');
      const jobsListEl = document.getElementById('upload-monitor-jobs-list');

      btnMonitor?.addEventListener('click', () => {
        modal?.classList.add('active');
      });

      if (window.GoogleDriveService?.subscribe) {
        window.GoogleDriveService.subscribe((state) => {
          const { isUploading, activeJob, queue, completedJobs, percent, statusSummary } = state;

          if (isUploading) {
            btnMonitor?.classList.add('uploading');
            if (iconEl) iconEl.textContent = '⏳';
            if (labelEl) labelEl.textContent = `${percent}%`;
            if (pulseEl) pulseEl.style.display = 'inline-block';
            if (mainStatusEl) mainStatusEl.textContent = statusSummary;
            if (percentBadgeEl) percentBadgeEl.textContent = `${percent}%`;
            if (progressFillEl) progressFillEl.style.width = `${percent}%`;
            if (detailTextEl) detailTextEl.textContent = `Subiendo archivos a Google Drive... (${(activeJob?.uploadedCount || 0)}/${(activeJob?.files.length || 0)} fotos procesadas)`;
          } else {
            btnMonitor?.classList.remove('uploading');
            if (iconEl) iconEl.textContent = '☁️';
            if (labelEl) labelEl.textContent = 'Sincronizado';
            if (pulseEl) pulseEl.style.display = 'none';
            if (mainStatusEl) mainStatusEl.textContent = completedJobs.length > 0 ? 'Todo sincronizado con Google Drive ☁️' : 'Sin subidas activas';
            if (percentBadgeEl) percentBadgeEl.textContent = '100%';
            if (progressFillEl) progressFillEl.style.width = '100%';
            if (detailTextEl) detailTextEl.textContent = 'Tus fotos y videos se respaldan de forma segura en Google Drive.';
          }

          // Renderizar lista de trabajos
          if (jobsListEl) {
            const allTasks = [];
            if (activeJob) allTasks.push(activeJob);
            if (queue && queue.length) allTasks.push(...queue);
            if (completedJobs && completedJobs.length) allTasks.push(...completedJobs);

            if (allTasks.length === 0) {
              jobsListEl.innerHTML = `<div style="font-size: 0.82rem; color: var(--color-text-muted); text-align: center; padding: 1rem;">No hay tareas pendientes en la cola.</div>`;
            } else {
              jobsListEl.innerHTML = allTasks.map(t => {
                const isCompleted = t.status === 'completed';
                const isCurrent = t.status === 'uploading';
                const isErr = t.status === 'error';
                return `
                  <div class="glass-card upload-task-row ${isCurrent ? 'active-upload' : ''}" style="padding: 0.6rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; font-size: 0.84rem;">
                    <div style="min-width: 0; flex: 1;">
                      <div style="font-weight: 600; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${t.type === 'dream' ? '✨ Sueño: ' : '🌻 Recuerdo: '} ${window.Utils.sanitizeHTML(t.title)}
                      </div>
                      <div style="font-size: 0.74rem; color: var(--color-text-secondary);">
                        📁 ${window.Utils.sanitizeHTML(t.folderName)} (${t.uploadedCount || t.files.length}/${t.files.length} archivos)
                      </div>
                    </div>
                    <div>
                      ${isCurrent ? `<span class="badge-pill" style="background: rgba(0, 229, 255, 0.2); color: #00E5FF; font-size: 0.74rem;">Subiendo ${t.percent || 0}% ⏳</span>` : ''}
                      ${isCompleted ? `<span class="badge-pill" style="background: rgba(76, 175, 80, 0.2); color: #81C784; font-size: 0.74rem;">Completado ✅</span>` : ''}
                      ${isErr ? `<span class="badge-pill" style="background: rgba(244, 67, 54, 0.2); color: #EF5350; font-size: 0.74rem;">Error ⚠️</span>` : ''}
                      ${t.status === 'pending' ? `<span class="badge-pill" style="background: rgba(185, 142, 230, 0.2); color: var(--color-lilac); font-size: 0.74rem;">En cola 🕒</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('');
            }
          }
        });
      }
    }

    playAudioPreview(audioUrl, triggerBtn = null) {
      if (!audioUrl) return;

      // Si ya hay un audio reproduciéndose y es el mismo, pausar
      if (this.currentPlayingAudio && this.currentPlayingAudio.src === audioUrl && !this.currentPlayingAudio.paused) {
        this.currentPlayingAudio.pause();
        if (this.currentPlayBtn) this.currentPlayBtn.innerHTML = '▶️';
        return;
      }

      // Detener cualquier audio previo
      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        if (this.currentPlayBtn) this.currentPlayBtn.innerHTML = '▶️';
      }

      const audio = new Audio(audioUrl);
      this.currentPlayingAudio = audio;
      this.currentPlayBtn = triggerBtn;

      if (triggerBtn) triggerBtn.innerHTML = '⏸️';

      audio.play().catch(e => {
        console.warn('Error al reproducir preview:', e);
        if (triggerBtn) triggerBtn.innerHTML = '▶️';
      });

      audio.onended = () => {
        if (triggerBtn) triggerBtn.innerHTML = '▶️';
        this.currentPlayingAudio = null;
      };

      audio.onpause = () => {
        if (triggerBtn) triggerBtn.innerHTML = '▶️';
      };
    }

    // --- 3. Navegación y Enrutamiento Hash ---
    initNavigation() {
      const navContainer = document.getElementById("nav-pills-container");
      if (!navContainer) return;
      navContainer.innerHTML = window.CONFIG.sections.map(sec => `
        <a href="#${sec.id}" class="nav-pill-btn" id="tab-${sec.id}" role="tab" aria-controls="section-${sec.id}" aria-selected="false">
          <span>${sec.icon}</span>
          <span>${sec.label}</span>
        </a>
      `).join("");

      navContainer.querySelectorAll('.nav-pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = btn.getAttribute('href').replace('#', '');
          window.location.hash = targetId;
          this.activateSection(targetId);
        });
      });

      window.addEventListener("hashchange", () => this.handleRouting());
    }

    handleRouting() {
      const hash = (window.location.hash || "#inicio").replace("#", "");
      const targetSection = window.CONFIG.sections.find(s => s.id === hash) || window.CONFIG.sections[0];
      this.activateSection(targetSection.id);
    }

    activateSection(sectionId) {
      this.currentSectionId = sectionId;
      const targetConfig = window.CONFIG.sections.find(s => s.id === sectionId) || window.CONFIG.sections[0];

      document.querySelectorAll(".wrapped-section").forEach(sec => {
        sec.classList.remove("active");
      });

      const activeEl = document.getElementById(`section-${sectionId}`);
      if (activeEl) {
        activeEl.classList.add("active");
      }

      document.querySelectorAll(".nav-pill-btn").forEach(btn => {
        btn.classList.remove("active");
        btn.removeAttribute("aria-current");
        btn.setAttribute("aria-selected", "false");
      });

      const activeTab = document.getElementById(`tab-${sectionId}`);
      if (activeTab) {
        activeTab.classList.add("active");
        activeTab.setAttribute("aria-current", "page");
        activeTab.setAttribute("aria-selected", "true");
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }

      if (sectionId === 'inicio') this.renderDailyDashboard();
    }
    // --- Inicialización de secciones interactivas ---
    initSections() {
      this.initAnnualCalendar();
      this.renderMemories();
      this.renderMovies();
      this.renderSeries();
      this.renderSongs();
      this.renderNotes();
      this.renderDreams();
      this.renderDailyDashboard();
    }

    // --- Motor de Fechas Especiales y Recordatorios Anticipados ---
    getSpecialDates() {
      return [
        {
          id: 'bday-wendy',
          title: 'Cumpleaños de Wendy',
          subtitle: 'Patico ♥️ 👧🏻',
          month: 6, // 26 de Junio
          day: 26,
          color: '#E040FB',
          themeClass: 'wendy-theme',
          emoji: '🎂💜',
          forUser: 'Kevin',
          celebrant: 'Wendy'
        },
        {
          id: 'bday-kevin',
          title: 'Cumpleaños de Kevin',
          subtitle: 'Kevin 👦🏻',
          month: 8, // 2 de Agosto
          day: 2,
          color: '#00E5FF',
          themeClass: 'kevin-theme',
          emoji: '🎂💙',
          forUser: 'Wendy',
          celebrant: 'Kevin'
        }
      ];
    }

    calculateSpecialDateRemaining(dateItem) {
      const now = new Date();
      const currentYear = now.getFullYear();
      let targetDate = new Date(currentYear, dateItem.month - 1, dateItem.day, 0, 0, 0, 0);

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      if (targetDate.getTime() < todayStart.getTime()) {
        targetDate = new Date(currentYear + 1, dateItem.month - 1, dateItem.day, 0, 0, 0, 0);
      }

      const diffTime = targetDate.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const monthNamesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const dateText = `${dateItem.day} de ${monthNamesES[dateItem.month - 1]}`;

      let alertType = 'normal';
      let alertLabel = `Faltan ${diffDays} días`;
      let alertMessage = `Fecha especial de <strong>${dateItem.celebrant}</strong> el <strong>${dateText}</strong>.`;

      if (diffDays === 0) {
        alertType = 'today';
        alertLabel = `🎉 ¡HOY ES EL CUMPLEAÑOS! 🎂`;
        alertMessage = `¡Hoy celebramos el cumpleaños de <strong>${dateItem.celebrant}</strong>! Que sea un día lleno de magia, risas y girasoles. 🌻✨`;
      } else if (diffDays === 1) {
        alertType = 'day';
        alertLabel = '⚡ ¡FALTA 1 DÍA! (Mañana)';
        alertMessage = `¡Aviso urgente! Mañana es el cumpleaños de <strong>${dateItem.celebrant}</strong> (${dateText}). ¡Prepara el abrazo y la sorpresa! 🎁💖`;
      } else if (diffDays >= 6 && diffDays <= 8) {
        alertType = 'week';
        alertLabel = `🚨 ¡Falta 1 semana! (${diffDays} días)`;
        alertMessage = `Recordatorio especial: Queda 1 semana para el cumpleaños de <strong>${dateItem.celebrant}</strong> (${dateText}). ¿Ya tienes listo el detalle? ✨`;
      } else if (diffDays >= 28 && diffDays <= 32) {
        alertType = 'month';
        alertLabel = `🔔 ¡Falta 1 mes! (~${diffDays} días)`;
        alertMessage = `Aviso con 1 mes de anticipación: Se acerca el cumpleaños de <strong>${dateItem.celebrant}</strong> (${dateText}). Ve planeando con calma. 🌻`;
      }

      return {
        ...dateItem,
        diffDays,
        nextDate: targetDate,
        alertType,
        alertLabel,
        alertMessage
      };
    }

    renderDailyDashboard() {
      const summary = document.getElementById('daily-summary');
      if (!summary) return;
      const currentUser = window.storage.getCurrentUser();
      const profiles = window.storage.getProfiles();
      const userProfile = profiles[currentUser] || {};
      const userDisplayName = userProfile.nickname || (currentUser.toLowerCase() === 'wendy' ? 'Wendy (Patico ♥️) 👧🏻' : 'Kevin 👦🏻');
      document.getElementById('dashboard-user').textContent = userDisplayName;
      const values = [
        ['🌻', window.storage.getMemories().length, 'recuerdos'],
        ['🎵', window.storage.getSongs().length, 'canciones'],
        ['🎬', window.storage.getMovies().length, 'películas'],
        ['📺', window.storage.getSeries().length, 'series'],
        ['💌', window.storage.getNotes().length, 'notas'],
        ['🌟', window.storage.getDreams().filter(dream => dream.status === 'Pendiente').length, 'sueños pendientes']
      ];
      summary.innerHTML = values.map(([icon, value, label]) => `<div class="glass-card daily-stat"><span>${icon}</span><strong>${value}</strong><small>${label}</small></div>`).join('');
      
      // Render de Recordatorios de Fechas Especiales (1 mes, 1 semana, 1 día)
      const reminderContainer = document.getElementById('special-dates-reminders-container');
      if (reminderContainer) {
        const specialDates = this.getSpecialDates().map(d => this.calculateSpecialDateRemaining(d));
        // Ordenar por cercanía
        specialDates.sort((a, b) => a.diffDays - b.diffDays);

        reminderContainer.innerHTML = `
          <div class="special-dates-reminder-hub">
            <div class="reminder-hub-header">
              <div class="reminder-hub-title">
                <span>🔔</span>
                <span>Recordatorios de Fechas Especiales</span>
              </div>
              <span style="font-size: 0.8rem; color: var(--color-text-secondary);">Avisos automáticos a 1 mes, 1 semana y 1 día</span>
            </div>

            <div class="reminder-grid">
              ${specialDates.map(item => `
                <div class="reminder-card ${item.themeClass}">
                  <div class="reminder-card-top">
                    <span class="reminder-name">
                      <span>${item.emoji}</span>
                      <span>${window.Utils.sanitizeHTML(item.title)}</span>
                    </span>
                    <span class="reminder-countdown-badge alert-${item.alertType}">
                      ${window.Utils.sanitizeHTML(item.alertLabel)}
                    </span>
                  </div>
                  <div class="reminder-message">
                    ${item.alertMessage}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      const prompts = ['Dejen una nota para que el otro la encuentre.', '¿Qué canción describe este día?', 'Elijan una película para su próxima noche.', 'Guarden un momento pequeño antes de olvidarlo.'];
      document.getElementById('daily-tip-text').textContent = prompts[new Date().getDate() % prompts.length];
    }

    renderSongs() {
      const container = document.getElementById("songs-grid-list");
      if (!container) return;
      const currentUser = window.storage.getCurrentUser();
      const ratingFilter = document.getElementById("filter-songs-rating")?.value || "all";
      let songs = window.storage.getSongs();

      if (ratingFilter !== "all") {
        if (ratingFilter === "unrated") {
          songs = songs.filter(s => (!s.kevinRating && !s.wendyRating) || (parseInt(s.kevinRating, 10) === 0 && parseInt(s.wendyRating, 10) === 0));
        } else {
          const minStars = parseInt(ratingFilter, 10);
          songs = songs.filter(s => {
            const kR = parseInt(s.kevinRating, 10) || 0;
            const wR = parseInt(s.wendyRating, 10) || 0;
            return kR >= minStars || wR >= minStars;
          });
        }
      }

      if (!songs.length) {
        container.innerHTML = `<div class="glass-card empty-media">No hay canciones que coincidan con este filtro. ¡Recomienda una arriba! 🎶</div>`;
        return;
      }

      container.innerHTML = songs.map(song => {
        const hasLyrics = Boolean(song.lyrics && song.lyrics.trim());
        const comments = Array.isArray(song.comments) ? song.comments : [];
        const author = song.proposedBy || 'Kevin';
        const authorInitial = author.charAt(0).toUpperCase();
        const authorClass = author.toLowerCase() === 'wendy' ? 'wendy' : 'kevin';

        const kevinRating = parseInt(song.kevinRating, 10) || 0;
        const wendyRating = parseInt(song.wendyRating, 10) || 0;
        const activeUserRating = currentUser.toLowerCase() === 'wendy' ? wendyRating : kevinRating;

        // 5 Estrellas Interactivas
        const starsHtml = [1, 2, 3, 4, 5].map(starNum => {
          const isFilled = starNum <= activeUserRating;
          return `<button type="button" class="star-btn ${isFilled ? 'active' : ''}" data-song-id="${song.id}" data-rating="${starNum}" title="Calificar con ${starNum} estrella${starNum > 1 ? 's' : ''}">★</button>`;
        }).join("");

        // Promedio o resumen para la etiqueta
        let ratingSummaryBadge = "";
        if (kevinRating > 0 && wendyRating > 0) {
          const avg = ((kevinRating + wendyRating) / 2).toFixed(1);
          ratingSummaryBadge = `<span class="song-badge-rating" title="Promedio de Kevin y Wendy">⭐ ${avg}/5</span>`;
        } else if (activeUserRating > 0) {
          ratingSummaryBadge = `<span class="song-badge-rating" title="Tu calificación">⭐ ${activeUserRating}/5</span>`;
        }

        return `
          <article class="glass-card song-card" data-id="${song.id}">
            <div class="song-header-row">
              ${song.cover ? `<img src="${window.Utils.sanitizeHTML(song.cover)}" alt="Portada de ${window.Utils.sanitizeHTML(song.title)}" class="song-card-cover" onerror="this.style.display='none'">` : '<div class="song-card-cover-placeholder">🎵</div>'}
              <div class="song-main-info">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <div class="song-author-badge" title="Recomendada automáticamente por ${window.Utils.sanitizeHTML(author)}">
                    <span class="author-badge-circle ${authorClass}">${authorInitial}</span>
                    <span>Recomendada por <strong>${window.Utils.sanitizeHTML(author)}</strong></span>
                  </div>
                  ${ratingSummaryBadge}
                </div>
                <h3 class="song-title">${window.Utils.sanitizeHTML(song.title)}</h3>
                <p class="song-artist">${window.Utils.sanitizeHTML(song.artist)} ${song.year ? `<span class="song-year">(${song.year})</span>` : ''}</p>
                ${song.album ? `<p class="song-album">Álbum: <em>${window.Utils.sanitizeHTML(song.album)}</em></p>` : ''}
              </div>
            </div>

            ${song.previewUrl ? `
              <div class="song-preview-container">
                <span class="preview-tag">🎧 Escucha previa:</span>
                <audio controls preload="none" src="${window.Utils.sanitizeHTML(song.previewUrl)}" class="song-audio-element"></audio>
              </div>
            ` : ''}

            <!-- Botones de Acción y Reproducción -->
            <div class="media-links">
              ${song.spotifyUrl ? `<a href="${window.Utils.sanitizeHTML(song.spotifyUrl)}" target="_blank" rel="noopener" class="btn-song-spotify" title="Escuchar en Spotify">🟢 Spotify</a>` : ''}
              ${song.youtubeUrl ? `<a href="${window.Utils.sanitizeHTML(song.youtubeUrl)}" target="_blank" rel="noopener" class="btn-song-youtube" title="Ver en YouTube">🔴 YouTube</a>` : ''}
              <button type="button" class="btn-song-lyrics btn-view-lyrics" data-id="${song.id}" title="${hasLyrics ? 'Leer letra' : 'Ver / Añadir letra'}">📜 ${hasLyrics ? 'Letra' : 'Letra +'}</button>
              <button type="button" class="btn-secondary btn-toggle-song-comments" data-id="${song.id}">
                ⭐ Calificación y Comentarios (${comments.length})
              </button>
              <button type="button" class="btn-edit-song" data-id="${song.id}" title="Editar canción">✏️</button>
              <button type="button" class="btn-delete-song" data-id="${song.id}" style="color: var(--color-danger);" title="Eliminar canción">🗑️</button>
            </div>

            <!-- Hilo de Calificaciones y Comentarios de la canción -->
            <div class="song-comments-container" id="song-comments-box-${song.id}" style="display: none;">
              
              <!-- Calificación de Estrellas Integrada en Comentarios -->
              <div class="song-rating-section">
                <div class="song-rating-stars-bar">
                  <span class="rating-label">Tu nota (${currentUser}):</span>
                  <div class="interactive-stars-group">
                    ${starsHtml}
                  </div>
                  <span class="rating-number">${activeUserRating > 0 ? `${activeUserRating}/5 ⭐` : 'Toca para calificar'}</span>
                </div>
                <div class="song-rating-scores-breakdown">
                  <span class="score-pill ${kevinRating > 0 ? 'rated' : ''}">👦🏻 Kevin: <strong>${kevinRating > 0 ? `${kevinRating}/5 ★` : 'Pendiente'}</strong></span>
                  <span class="score-pill ${wendyRating > 0 ? 'rated' : ''}">👧🏻 Wendy: <strong>${wendyRating > 0 ? `${wendyRating}/5 ★` : 'Pendiente'}</strong></span>
                </div>
              </div>

              <!-- Lista de comentarios -->
              <div class="song-comments-list" id="song-comments-list-${song.id}">
                ${comments.length === 0 ? `<p class="empty-comments-hint">Aún no hay comentarios en esta canción. ¡Escribe qué te hace sentir o qué te recuerda!</p>` : ''}
                ${comments.map(c => {
                  const cAuthor = c.author || 'Kevin';
                  const cClass = cAuthor.toLowerCase() === 'wendy' ? 'wendy-comment' : 'kevin-comment';
                  return `
                    <div class="comment-bubble ${cClass}">
                      <div class="comment-bubble-header">
                        <strong>${window.Utils.sanitizeHTML(cAuthor)}</strong>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                          <span>${window.Utils.formatDateTimeES(c.createdAt)}</span>
                          <button type="button" class="btn-del-song-comment" data-song-id="${song.id}" data-comment-id="${c.id}" title="Eliminar comentario">&times;</button>
                        </div>
                      </div>
                      <div class="comment-bubble-text">${window.Utils.sanitizeHTML(c.message)}</div>
                    </div>
                  `;
                }).join("")}
              </div>

              <!-- Formulario para agregar comentario -->
              <form class="song-add-comment-form" data-id="${song.id}">
                <input type="text" class="form-control song-comment-input" placeholder="Comenta algo sobre esta canción como ${window.Utils.sanitizeHTML(currentUser)}..." required />
                <button type="submit" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; white-space: nowrap;">Comentar 💌</button>
              </form>
            </div>
          </article>
        `;
      }).join("");

      // Listener de Calificación con Estrellas (1 Clic)
      container.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const songId = btn.dataset.songId;
          const ratingVal = parseInt(btn.dataset.rating, 10);
          window.storage.rateSong(songId, ratingVal, currentUser);
          this.renderSongs();
          this.renderDailyDashboard();
          window.Utils.showToast(`¡Calificaste con ${ratingVal} estrella${ratingVal > 1 ? 's' : ''}! ⭐`, 'success');
        });
      });

      // Listener de Despliegue de Comentarios
      container.querySelectorAll('.btn-toggle-song-comments').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const songId = btn.dataset.id;
          const box = document.getElementById(`song-comments-box-${songId}`);
          if (box) {
            const isHidden = box.style.display === 'none';
            box.style.display = isHidden ? 'block' : 'none';
          }
        });
      });

      // Listener de Envío de Comentarios
      container.querySelectorAll('.song-add-comment-form').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const songId = form.dataset.id;
          const input = form.querySelector('.song-comment-input');
          const msg = input ? input.value.trim() : '';
          if (!msg) return;

          window.storage.addSongComment(songId, {
            author: currentUser,
            message: msg
          });

          input.value = '';
          this.renderSongs();
          window.Utils.showToast('Comentario añadido a la canción 💬✨', 'success');
        });
      });

      // Listener de Eliminación de Comentarios
      container.querySelectorAll('.btn-del-song-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const songId = btn.dataset.songId;
          const commentId = btn.dataset.commentId;
          if (confirm('¿Eliminar este comentario?')) {
            window.storage.deleteSongComment(songId, commentId);
            this.renderSongs();
            window.Utils.showToast('Comentario eliminado', 'info');
          }
        });
      });

      container.querySelectorAll('.btn-view-lyrics').forEach(button => {
        button.addEventListener('click', () => {
          const song = window.storage.getSongs().find(s => s.id === button.dataset.id);
          if (song) this.openLyricsModal(song);
        });
      });

      container.querySelectorAll('.btn-edit-song').forEach(button => {
        button.addEventListener('click', () => {
          const song = window.storage.getSongs().find(s => s.id === button.dataset.id);
          if (song) this.openSongModal(song);
        });
      });

      container.querySelectorAll('.btn-delete-song').forEach(button => {
        button.addEventListener('click', () => {
          if (confirm("¿Eliminar esta canción de las recomendaciones?")) {
            window.storage.deleteSong(button.dataset.id);
            this.renderSongs();
            this.renderDailyDashboard();
            window.Utils.showToast("Canción eliminada", "info");
          }
        });
      });

      document.getElementById("filter-songs-rating")?.addEventListener("change", () => this.renderSongs());
    }

    openLyricsModal(song) {
      const modal = document.getElementById("modal-lyrics");
      const coverEl = document.getElementById("lyrics-modal-cover");
      const titleEl = document.getElementById("modal-lyrics-title");
      const artistEl = document.getElementById("modal-lyrics-artist");
      const bodyEl = document.getElementById("modal-lyrics-body");
      const actionsEl = document.getElementById("modal-lyrics-actions");

      if (song.cover) {
        coverEl.src = song.cover;
        coverEl.style.display = "block";
      } else {
        coverEl.style.display = "none";
      }

      titleEl.textContent = song.title;
      artistEl.textContent = `${song.artist} · Recomendada por ${song.proposedBy || 'Kevin'}`;

      if (song.lyrics && song.lyrics.trim()) {
        bodyEl.textContent = song.lyrics.trim();
      } else {
        bodyEl.innerHTML = `
          <div style="color: var(--color-text-secondary); padding: 2rem 1rem; text-align: center;">
            <p style="font-size: 1.1rem; margin-bottom: 1rem;">Aún no tenemos guardada la letra de esta canción.</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn-primary" id="btn-fetch-lyrics-now" style="font-size: 0.88rem;">🔍 Buscar letra en línea</button>
              <button type="button" class="btn-secondary" id="btn-write-lyrics-now" style="font-size: 0.88rem;">✏️ Escribir letra</button>
            </div>
          </div>
        `;

        document.getElementById('btn-fetch-lyrics-now')?.addEventListener('click', async () => {
          bodyEl.innerHTML = '<p style="color: var(--color-sunflower-gold); text-align: center;">Buscando letra de la canción… ✨</p>';
          const fetchedLyrics = await window.MediaService.fetchLyrics(song.artist, song.title);
          if (fetchedLyrics) {
            song.lyrics = fetchedLyrics;
            window.storage.saveSong(song);
            this.renderSongs();
            this.openLyricsModal(song);
            window.Utils.showToast("¡Letra encontrada y guardada! 📜", "success");
          } else {
            bodyEl.innerHTML = `
              <div style="color: var(--color-text-secondary); padding: 1.5rem 1rem; text-align: center;">
                <p>No se encontró la letra automática. Puedes pegarla o buscarla en Genius:</p>
                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                  <a href="${window.Utils.sanitizeHTML(song.lyricsUrl || window.MediaService.geniusUrl(song.artist, song.title))}" target="_blank" rel="noopener" class="btn-primary">Ver en Genius 🌐</a>
                  <button type="button" class="btn-secondary" id="btn-write-lyrics-now-2">✏️ Escribir letra</button>
                </div>
              </div>
            `;
            document.getElementById('btn-write-lyrics-now-2')?.addEventListener('click', () => {
              modal.classList.remove("active");
              this.openSongModal(song);
            });
          }
        });

        document.getElementById('btn-write-lyrics-now')?.addEventListener('click', () => {
          modal.classList.remove("active");
          this.openSongModal(song);
        });
      }

      actionsEl.innerHTML = `
        ${song.spotifyUrl ? `<a href="${window.Utils.sanitizeHTML(song.spotifyUrl)}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🟢 Spotify</a>` : ''}
        ${song.youtubeUrl ? `<a href="${window.Utils.sanitizeHTML(song.youtubeUrl)}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🔴 YouTube</a>` : ''}
        <button type="button" class="btn-secondary" id="btn-edit-modal-song-lyrics" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">✏️ Editar</button>
      `;

      document.getElementById('btn-edit-modal-song-lyrics')?.addEventListener('click', () => {
        modal.classList.remove("active");
        this.openSongModal(song);
      });

      modal.classList.add("active");
    }

    openSongModal(song = null) {
      const modal = document.getElementById("modal-song");
      const currentUser = window.storage.getCurrentUser();
      const author = song && song.proposedBy ? song.proposedBy : currentUser;

      document.getElementById("song-id").value = song ? (song.id || '') : '';
      document.getElementById("song-title").value = song ? (song.title || '') : '';
      document.getElementById("song-artist").value = song ? (song.artist || '') : '';
      document.getElementById("song-cover").value = song ? (song.cover || '') : '';
      document.getElementById("song-lyrics").value = song ? (song.lyrics || '') : '';
      document.getElementById("song-spotify").value = song ? (song.spotifyUrl || '') : '';
      document.getElementById("song-youtube").value = song ? (song.youtubeUrl || '') : '';
      document.getElementById("song-proposed").value = author;
      
      const authorNameEl = document.getElementById("song-author-name");
      if (authorNameEl) authorNameEl.textContent = author;
      const authorBadgeEl = document.getElementById("song-author-badge");
      if (authorBadgeEl) {
        authorBadgeEl.textContent = author.charAt(0).toUpperCase();
        authorBadgeEl.className = "author-badge-circle " + (author.toLowerCase() === "wendy" ? "wendy" : "kevin");
      }

      const kevinScore = document.getElementById("song-kevin-score");
      if (kevinScore) {
        kevinScore.value = song && song.kevinRating !== undefined ? song.kevinRating : 5;
      }
      const wendyScore = document.getElementById("song-wendy-score");
      if (wendyScore) {
        wendyScore.value = song && song.wendyRating !== undefined ? song.wendyRating : 0;
      }

      modal.classList.add("active");
    }

    async searchMusic(query) {
      const results = document.getElementById('music-search-results');
      results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-sunflower-gold); padding: 1.5rem;">Buscando canciones en tiempo real… 🎵✨</div>';

      try {
        const songs = await window.MediaService.searchMusic(query);
        if (!songs.length) {
          results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-text-secondary); padding: 1.5rem;">No encontramos canciones con esa búsqueda. ¡Prueba buscando por título, cantante o banda!</div>';
          return;
        }

        results.innerHTML = `
          <div class="search-results-header">
            <span class="search-results-title">🎵 Resultados encontrados (${songs.length}):</span>
            <button type="button" class="btn-secondary" id="btn-close-music-results" style="padding: 0.25rem 0.7rem; font-size: 0.8rem;">✕ Cerrar resultados</button>
          </div>
          <div class="music-search-grid">
            ${songs.map((song, index) => `
              <div class="glass-card search-song-card">
                <div class="search-song-top">
                  ${song.cover ? `<img src="${window.Utils.sanitizeHTML(song.cover)}" alt="Portada" class="search-song-cover" onerror="this.style.display='none'">` : '<div class="search-song-cover-placeholder">🎵</div>'}
                  <div class="search-song-info">
                    <h4 class="search-song-title">${window.Utils.sanitizeHTML(song.title)}</h4>
                    <p class="search-song-artist">${window.Utils.sanitizeHTML(song.artist)}</p>
                    ${song.album ? `<p class="search-song-album">💿 ${window.Utils.sanitizeHTML(song.album)} ${song.year ? `(${song.year})` : ''}</p>` : ''}
                  </div>
                </div>

                ${song.previewUrl ? `
                  <div class="search-song-preview">
                    <span class="preview-mini-label">🎧 Escucha previa:</span>
                    <audio controls preload="none" src="${window.Utils.sanitizeHTML(song.previewUrl)}" class="search-audio-player"></audio>
                  </div>
                ` : ''}

                <div class="search-song-actions">
                  <button type="button" class="btn-primary btn-add-song" data-index="${index}">
                    <span>🌻 + Recomendar</span>
                  </button>
                  <button type="button" class="btn-secondary btn-custom-song" data-index="${index}" title="Personalizar antes de guardar">
                    <span>✏️ Personalizar</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        document.getElementById('btn-close-music-results')?.addEventListener('click', () => {
          results.innerHTML = '';
        });

        results.querySelectorAll('.btn-add-song').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            const baseSong = songs[index];
            button.disabled = true;
            button.textContent = 'Importando letra… ⏳';

            const lyrics = await window.MediaService.fetchLyrics(baseSong.artist, baseSong.title);
            const currentUser = window.storage.getCurrentUser();
            const savedSong = {
              ...baseSong,
              lyrics: lyrics || '',
              proposedBy: currentUser,
              kevinRating: currentUser === 'Kevin' ? 5 : 0,
              wendyRating: currentUser === 'Wendy' ? 5 : 0,
              rating: 5,
              comments: []
            };

            window.storage.saveSong(savedSong);
            this.renderSongs();
            this.renderDailyDashboard();
            results.innerHTML = '';
            window.Utils.showToast(`¡${savedSong.title} añadida a Nuestra Música! 🎵✨`, 'success');
          });
        });

        results.querySelectorAll('.btn-custom-song').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            const baseSong = songs[index];
            button.textContent = 'Cargando…';
            const lyrics = await window.MediaService.fetchLyrics(baseSong.artist, baseSong.title);
            const currentUser = window.storage.getCurrentUser();
            this.openSongModal({
              ...baseSong,
              lyrics: lyrics || '',
              proposedBy: currentUser,
              kevinRating: currentUser === 'Kevin' ? 5 : 0,
              wendyRating: currentUser === 'Wendy' ? 5 : 0
            });
            button.textContent = '✏️ Personalizar';
          });
        });
      } catch (error) {
        results.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">${window.Utils.sanitizeHTML(error.message || 'No fue posible buscar música ahora.')}</div>`;
      }
    }

    // --- 6. Recuerdos (Campo de Girasoles) ---
    // --- 6. Recuerdos y Calendario Anual 🌻 ---
    initAnnualCalendar() {
      this.currentCalendarYear = 2026;
      this.annualHolidays = {
        2024: {
          '2024-01-01': 'Año Nuevo', '2024-01-08': 'Reyes Magos', '2024-03-25': 'Día de San José',
          '2024-03-28': 'Jueves Santo', '2024-03-29': 'Viernes Santo', '2024-05-01': 'Día del Trabajo',
          '2024-05-13': 'Ascensión del Señor', '2024-06-03': 'Corpus Christi', '2024-06-10': 'Sagrado Corazón',
          '2024-07-01': 'San Pedro y San Pablo', '2024-07-20': 'Independencia de Colombia', '2024-08-07': 'Batalla de Boyacá',
          '2024-08-19': 'Asunción de la Virgen', '2024-10-14': 'Día de la Raza', '2024-11-04': 'Todos los Santos',
          '2024-11-11': 'Independencia de Cartagena', '2024-12-08': 'Inmaculada Concepción', '2024-12-25': 'Navidad'
        },
        2025: {
          '2025-01-01': 'Año Nuevo', '2025-01-06': 'Reyes Magos', '2025-03-24': 'Día de San José',
          '2025-04-17': 'Jueves Santo', '2025-04-18': 'Viernes Santo', '2025-05-01': 'Día del Trabajo',
          '2025-06-02': 'Ascensión del Señor', '2025-06-23': 'Corpus Christi', '2025-06-30': 'Sagrado Corazón',
          '2025-07-20': 'Independencia de Colombia', '2025-08-07': 'Batalla de Boyacá', '2025-08-18': 'Asunción de la Virgen',
          '2025-10-13': 'Día de la Raza', '2025-11-03': 'Todos los Santos', '2025-11-17': 'Independencia de Cartagena',
          '2025-12-08': 'Inmaculada Concepción', '2025-12-25': 'Navidad'
        },
        2026: {
          '2026-01-01': 'Año Nuevo', '2026-01-12': 'Reyes Magos', '2026-03-23': 'Día de San José',
          '2026-04-02': 'Jueves Santo', '2026-04-03': 'Viernes Santo', '2026-05-01': 'Día del Trabajo',
          '2026-05-18': 'Ascensión del Señor', '2026-06-08': 'Corpus Christi', '2026-06-15': 'Sagrado Corazón',
          '2026-06-29': 'San Pedro y San Pablo', '2026-07-20': 'Independencia de Colombia', '2026-08-07': 'Batalla de Boyacá',
          '2026-08-17': 'Asunción de la Virgen', '2026-10-12': 'Día de la Raza', '2026-11-02': 'Todos los Santos',
          '2026-11-16': 'Independencia de Cartagena', '2026-12-08': 'Inmaculada Concepción', '2026-12-25': 'Navidad'
        }
      };

      const yearButtons = document.querySelectorAll("#calendar-year-pills .year-pill-btn");
      yearButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          yearButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.currentCalendarYear = parseInt(btn.dataset.year, 10) || 2026;
          this.renderAnnualCalendar();
        });
      });

      this.renderAnnualCalendar();
    }

    renderAnnualCalendar() {
      const container = document.getElementById("annual-months-container");
      if (!container) return;

      const year = this.currentCalendarYear || 2026;
      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

      const memories = window.storage.getMemories();
      const memoriesByDate = {};
      memories.forEach(m => {
        if (!memoriesByDate[m.date]) memoriesByDate[m.date] = [];
        memoriesByDate[m.date].push(m);
      });

      const holidays = this.annualHolidays[year] || {};
      const todayStr = new Date().toISOString().split("T")[0];

      let monthsHtml = "";

      for (let month = 0; month < 12; month++) {
        const firstDay = new Date(year, month, 1);
        let startingDay = firstDay.getDay() - 1; // Lunes=0 ... Domingo=6
        if (startingDay === -1) startingDay = 6;
        const totalDays = new Date(year, month + 1, 0).getDate();

        let daysGridHtml = "";

        // Días vacíos previos
        for (let e = 0; e < startingDay; e++) {
          daysGridHtml += `<div class="mini-day-cell empty"></div>`;
        }

        // Días del mes
        for (let day = 1; day <= totalDays; day++) {
          const monthPad = String(month + 1).padStart(2, "0");
          const dayPad = String(day).padStart(2, "0");
          const dateStr = `${year}-${monthPad}-${dayPad}`;

          const isHoliday = holidays[dateStr];
          const isToday = dateStr === todayStr;
          const isKevinBday = (month === 7 && day === 2); // 2 de Agosto (mes 7 = Agosto, 0-indexed)
          const isWendyBday = (month === 5 && day === 26); // 26 de Junio (mes 5 = Junio, 0-indexed)
          const dayMemories = memoriesByDate[dateStr] || [];
          const hasMemories = dayMemories.length > 0;

          let classes = ["mini-day-cell"];
          if (isToday) classes.push("today");
          if (isKevinBday) classes.push("bday-kevin");
          if (isWendyBday) classes.push("bday-wendy");
          if (isHoliday && !isKevinBday && !isWendyBday) classes.push("holiday");
          if (hasMemories) classes.push("has-memory");

          let dotsHtml = "";
          if (hasMemories) {
            dotsHtml = `<div class="mini-day-memory-dots">${dayMemories.slice(0, 3).map(m => `
              <span class="mini-memory-dot" style="background-color: ${m.color || '#F4C542'}; color: ${m.color || '#F4C542'};"></span>
            `).join("")}</div>`;
          }

          let tooltip = `${day} de ${monthNames[month]}`;
          if (isKevinBday) {
            tooltip = `🎂 ¡Cumpleaños de Kevin! 👦🏻💙 (2 de Agosto)`;
          } else if (isWendyBday) {
            tooltip = `🎂 ¡Cumpleaños de Wendy! 👧🏻💜 (26 de Junio - Patico ♥️)`;
          } else if (isHoliday) {
            tooltip = `${day} de ${monthNames[month]}: ${isHoliday}`;
          } else if (hasMemories) {
            tooltip = `${dayMemories.length} recuerdo(s) en esta fecha`;
          }

          daysGridHtml += `
            <div class="${classes.join(" ")}" data-date="${dateStr}" title="${window.Utils.sanitizeHTML(tooltip)}">
              <span>${day}</span>
              ${dotsHtml}
            </div>
          `;
        }

        monthsHtml += `
          <div class="mini-month-card">
            <div class="mini-month-header">${monthNames[month]}</div>
            <div class="mini-weekdays-row">${weekdays.map(w => `<span>${w}</span>`).join("")}</div>
            <div class="mini-days-grid">${daysGridHtml}</div>
          </div>
        `;
      }

      container.innerHTML = monthsHtml;

      // Event listeners para clics en días del calendario
      container.querySelectorAll(".mini-day-cell:not(.empty)").forEach(cell => {
        cell.addEventListener("click", () => {
          const date = cell.dataset.date;
          const dayMemories = memoriesByDate[date];
          if (dayMemories && dayMemories.length > 0) {
            const targetEl = document.getElementById(`mem-node-${dayMemories[0].id}`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              targetEl.style.transition = "transform 0.4s ease, box-shadow 0.4s ease";
              targetEl.style.transform = "scale(1.03)";
              targetEl.style.boxShadow = `0 0 30px ${dayMemories[0].color || '#F4C542'}`;
              setTimeout(() => {
                targetEl.style.transform = "";
                targetEl.style.boxShadow = "";
              }, 1800);
            }
          } else {
            this.openMemoryModal({ date });
          }
        });
      });
    }

    renderMemories() {
      const container = document.getElementById("memories-trail-list");
      const sortOrder = document.getElementById("select-sort-memories")?.value || "desc";
      if (!container) return;

      let list = window.storage.getMemories();
      list.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      });

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">Aún no hay recuerdos guardados. ¡Crea el primero o toca una fecha en el calendario! 🌻</div>`;
        return;
      }

      const currentUser = window.storage.getCurrentUser();

      container.innerHTML = `<div class="trail-line"></div>` + list.map(m => {
        const memColor = m.color || "#F4C542";
        const author = m.author || "Kevin";
        const authorInitial = author.charAt(0).toUpperCase();
        const authorClass = author.toLowerCase() === "wendy" ? "wendy" : "kevin";
        const comments = Array.isArray(m.comments) ? m.comments : [];
        const gallery = Array.isArray(m.gallery) ? m.gallery : [];

        let coverHtml = "";
        if (m.coverMedia) {
          const isVideo = m.coverType === "video" || m.coverMedia.match(/\.(mp4|webm|ogg|mov)$/i) || m.coverMedia.startsWith("data:video/");
          if (isVideo) {
            coverHtml = `
              <div class="memory-cover-wrapper">
                <video src="${window.Utils.sanitizeHTML(m.coverMedia)}" controls class="memory-cover-video"></video>
              </div>
            `;
          } else {
            coverHtml = `
              <div class="memory-cover-wrapper">
                <img src="${window.Utils.sanitizeHTML(m.coverMedia)}" alt="${window.Utils.sanitizeHTML(m.title)}" class="memory-cover-img" onerror="this.parentElement.style.display='none'">
              </div>
            `;
          }
        }

        let galleryHtml = "";
        if (gallery.length > 0) {
          galleryHtml = `
            <div class="memory-gallery-strip">
              ${gallery.map(itemUrl => {
                const isItemVideo = itemUrl.match(/\.(mp4|webm|ogg|mov)$/i) || itemUrl.startsWith("data:video/");
                if (isItemVideo) {
                  return `<video src="${window.Utils.sanitizeHTML(itemUrl)}" class="gallery-preview-item" title="Video adjunto"></video>`;
                }
                return `<img src="${window.Utils.sanitizeHTML(itemUrl)}" alt="Foto adjunta" class="gallery-preview-item" onerror="this.style.display='none'">`;
              }).join("")}
            </div>
          `;
        }

        return `
          <div class="memory-node" id="mem-node-${m.id}" data-id="${m.id}">
            <div class="sunflower-pin" style="border-color: ${memColor}; box-shadow: 0 0 15px ${memColor};" title="Fecha: ${window.Utils.formatDateES(m.date)}">🌻</div>
            
            <div class="glass-card memory-card-body" style="border-left: 4px solid ${memColor};">
              <div class="memory-date">
                <span style="color: ${memColor};">📅 ${window.Utils.formatDateES(m.date)}</span>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  ${m.isDemo ? `<span class="demo-badge">Ejemplo</span>` : ""}
                  ${m.status === "Destacado" ? `<span style="color: var(--color-sunflower-gold); font-size: 0.82rem;">⭐ Destacado</span>` : ""}
                </div>
              </div>

              ${coverHtml}

              <h3 class="memory-title">${window.Utils.sanitizeHTML(m.title)}</h3>
              <p class="memory-desc">${window.Utils.sanitizeHTML(m.description)}</p>

              ${galleryHtml}

              <!-- Canción enlazada si existe 🎵 -->
              ${m.songTitle ? `
                <div class="memory-linked-song-pill" title="Canción del recuerdo">
                  <span class="music-note-icon">🎵</span>
                  <div class="memory-song-info-text">
                    <span class="memory-song-name"><strong>${window.Utils.sanitizeHTML(m.songTitle)}</strong></span>
                    <span class="memory-song-artist">${window.Utils.sanitizeHTML(m.songArtist || '')}</span>
                  </div>
                  ${m.songAudioUrl ? `
                    <button type="button" class="btn-play-memory-song" data-audio="${window.Utils.sanitizeHTML(m.songAudioUrl)}" title="Escuchar preview de 30s">
                      ▶️
                    </button>
                  ` : ''}
                </div>
              ` : ''}

              <!-- Nota de voz grabada si existe 🎙️ -->
              ${m.voiceNoteUrl ? `
                <div class="memory-voice-note-pill" style="margin-top: 0.6rem; background: rgba(224, 64, 251, 0.12); border: 1px solid rgba(224, 64, 251, 0.35); border-radius: 12px; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.6rem;">
                  <span style="font-size: 1.15rem;">🎙️</span>
                  <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 0.78rem; color: #F8BBD0; font-weight: 600; margin-bottom: 0.2rem;">Nota de voz del recuerdo</div>
                    <audio controls src="${window.Utils.sanitizeHTML(m.voiceNoteUrl)}" style="width: 100%; height: 32px;"></audio>
                  </div>
                </div>
              ` : ''}

              <!-- Pie con Autor e Hilo de Comentarios -->
              <div class="memory-footer-bar">
                <div class="memory-author-badge" title="Añadido por ${window.Utils.sanitizeHTML(author)}">
                  <span class="author-badge-circle ${authorClass}">${authorInitial}</span>
                  <span>Por <strong>${window.Utils.sanitizeHTML(author)}</strong></span>
                </div>

                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                  <a href="${window.Utils.sanitizeHTML(m.driveFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(window.GoogleDriveService.formatFolderName(m.title, m.date))}`)}" target="_blank" rel="noopener" class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.8rem; color: var(--color-sunflower-gold);" title="Abrir carpeta en Google Drive">
                    📁 Drive
                  </a>
                  <button type="button" class="btn-secondary btn-toggle-comments" data-id="${m.id}" style="padding: 0.3rem 0.75rem; font-size: 0.82rem;">
                    💬 (${comments.length})
                  </button>
                  <button type="button" class="btn-secondary btn-edit-memory" data-id="${m.id}" style="padding: 0.3rem 0.65rem; font-size: 0.82rem;">✏️</button>
                  <button type="button" class="btn-secondary btn-delete-memory" data-id="${m.id}" style="padding: 0.3rem 0.65rem; font-size: 0.82rem; color: var(--color-danger);">🗑️</button>
                </div>
              </div>

              <!-- Hilo de comentarios desplegable -->
              <div class="memory-comments-container" id="comments-box-${m.id}" style="display: none;">
                <div class="comments-list-box" id="comments-list-${m.id}">
                  ${comments.length === 0 ? `<p style="font-size: 0.82rem; color: var(--color-text-secondary); margin: 0.3rem 0;">Aún no hay comentarios. ¡Sé el primero en escribir algo!</p>` : ''}
                  ${comments.map(c => {
                    const cAuthor = c.author || 'Kevin';
                    const cClass = cAuthor.toLowerCase() === 'wendy' ? 'wendy-comment' : '';
                    return `
                      <div class="comment-bubble ${cClass}">
                        <div class="comment-bubble-header">
                          <strong>${window.Utils.sanitizeHTML(cAuthor)}</strong>
                          <span>${window.Utils.formatDateTimeES(c.createdAt)}</span>
                        </div>
                        <div class="comment-bubble-text">${window.Utils.sanitizeHTML(c.message)}</div>
                      </div>
                    `;
                  }).join("")}
                </div>

                <form class="memory-add-comment-box" data-id="${m.id}">
                  <input type="text" class="comment-input-field" placeholder="Escribe un comentario como ${window.Utils.sanitizeHTML(currentUser)}..." required />
                  <button type="submit" class="btn-send-comment">Comentar 💌</button>
                </form>
              </div>

            </div>
          </div>
        `;
      }).join("");

      // Listener de Reproducción de Canción del Recuerdo
      container.querySelectorAll(".btn-play-memory-song").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const audioUrl = btn.dataset.audio;
          if (audioUrl) {
            this.playAudioPreview(audioUrl, btn);
          }
        });
      });

      // Listeners de comentarios
      container.querySelectorAll(".btn-toggle-comments").forEach(btn => {
        btn.addEventListener("click", () => {
          const memId = btn.dataset.id;
          const box = document.getElementById(`comments-box-${memId}`);
          if (box) {
            const isHidden = box.style.display === "none";
            box.style.display = isHidden ? "block" : "none";
          }
        });
      });

      container.querySelectorAll(".memory-add-comment-box").forEach(form => {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const memId = form.dataset.id;
          const input = form.querySelector(".comment-input-field");
          const msg = input.value.trim();
          if (!msg) return;

          window.storage.addMemoryComment(memId, {
            author: window.storage.getCurrentUser(),
            message: msg
          });

          input.value = "";
          this.renderMemories();
          window.Utils.showToast("Comentario añadido 💬", "success");
        });
      });

      // Listeners de edición y borrado
      container.querySelectorAll(".btn-edit-memory").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          const mem = window.storage.getMemories().find(m => m.id === id);
          if (mem) this.openMemoryModal(mem);
        });
      });

      container.querySelectorAll(".btn-delete-memory").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Seguro que deseas eliminar este recuerdo?")) {
            window.storage.deleteMemory(id);
            this.renderMemories();
            this.renderAnnualCalendar();
            window.Utils.showToast("Recuerdo eliminado", "info");
          }
        });
      });

      // Visor de fotos y videos en alta resolución (Lightbox)
      container.querySelectorAll(".memory-node").forEach(node => {
        const id = node.dataset.id;
        const mem = window.storage.getMemories().find(m => m.id === id);
        if (!mem) return;
        const allMedia = [mem.coverMedia, ...(mem.gallery || [])].filter(Boolean);
        if (allMedia.length === 0) return;

        node.querySelector(".memory-cover-wrapper")?.addEventListener("click", () => {
          this.openLightbox(allMedia, 0, mem.title);
        });

        node.querySelectorAll(".gallery-preview-item").forEach((thumb, tIdx) => {
          thumb.addEventListener("click", (e) => {
            e.stopPropagation();
            const startIdx = mem.coverMedia ? tIdx + 1 : tIdx;
            this.openLightbox(allMedia, startIdx, mem.title);
          });
        });
      });

      document.getElementById("select-sort-memories")?.addEventListener("change", () => this.renderMemories());
    }

    openMemoryModal(mem = null) {
      const modal = document.getElementById("modal-memory");
      if (!modal) return;
      const titleEl = document.getElementById("modal-memory-title");
      const currentUser = window.storage.getCurrentUser();

      if (titleEl) titleEl.textContent = mem && mem.id ? "Editar Recuerdo 🌻" : "Nuevo Recuerdo 🌻";
      const idInput = document.getElementById("mem-id");
      if (idInput) idInput.value = mem && mem.id ? mem.id : "";
      const dateInput = document.getElementById("mem-date");
      if (dateInput) dateInput.value = mem && mem.date ? mem.date : new Date().toISOString().split("T")[0];
      const titleInput = document.getElementById("mem-title");
      if (titleInput) titleInput.value = mem && mem.title ? mem.title : "";
      const descInput = document.getElementById("mem-desc");
      if (descInput) descInput.value = mem && mem.description ? mem.description : "";
      const statusInput = document.getElementById("mem-status");
      if (statusInput) statusInput.value = mem && mem.status ? mem.status : "Guardado";

      // Autor automático
      const author = mem && mem.author ? mem.author : currentUser;
      const authorNameEl = document.getElementById("mem-author-name");
      if (authorNameEl) authorNameEl.textContent = author;
      const authorBadge = document.getElementById("mem-author-badge");
      if (authorBadge) {
        authorBadge.textContent = author.charAt(0).toUpperCase();
        authorBadge.className = "author-badge-circle " + (author.toLowerCase() === "wendy" ? "wendy" : "kevin");
      }

      // Color Swatch
      const colorVal = mem && mem.color ? mem.color : "#F4C542";
      const radio = document.querySelector(`input[name="mem-color"][value="${colorVal}"]`);
      if (radio) radio.checked = true;

      // Portada
      const coverUrl = mem && mem.coverMedia ? mem.coverMedia : "";
      const coverInput = document.getElementById("mem-cover-url");
      if (coverInput) coverInput.value = coverUrl;
      this.updateCoverPreview(coverUrl);

      // Galería
      this.modalGalleryItems = mem && Array.isArray(mem.gallery) ? [...mem.gallery] : [];
      this.driveCoverPayload = null;
      this.driveGalleryPayloads = [];
      this.renderModalGallery();

      // Canción enlazada
      const songSelect = document.getElementById("mem-song-select");
      const previewBtn = document.getElementById("btn-preview-mem-song");
      if (songSelect) {
        const savedSongs = window.storage.getSongs();
        let optionsHtml = `<option value="">-- Sin canción enlazada --</option>`;
        savedSongs.forEach(s => {
          const selected = mem && mem.songId === s.id ? 'selected' : '';
          optionsHtml += `<option value="${s.id}" ${selected} data-title="${window.Utils.sanitizeHTML(s.title)}" data-artist="${window.Utils.sanitizeHTML(s.artist)}" data-cover="${window.Utils.sanitizeHTML(s.cover || '')}" data-audio="${window.Utils.sanitizeHTML(s.previewUrl || '')}">${window.Utils.sanitizeHTML(s.title)} - ${window.Utils.sanitizeHTML(s.artist)}</option>`;
        });
        songSelect.innerHTML = optionsHtml;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("mem-song-id", mem && mem.songId ? mem.songId : "");
        setVal("mem-song-title", mem && mem.songTitle ? mem.songTitle : "");
        setVal("mem-song-artist", mem && mem.songArtist ? mem.songArtist : "");
        setVal("mem-song-cover", mem && mem.songCover ? mem.songCover : "");
        setVal("mem-song-audio", mem && mem.songAudioUrl ? mem.songAudioUrl : "");

        if (previewBtn) {
          previewBtn.style.display = (mem && mem.songAudioUrl) ? "inline-block" : "none";
          previewBtn.dataset.audio = mem && mem.songAudioUrl ? mem.songAudioUrl : "";
          previewBtn.innerHTML = "▶️";
        }

        songSelect.onchange = () => {
          const selectedOption = songSelect.options[songSelect.selectedIndex];
          if (selectedOption && selectedOption.value) {
            setVal("mem-song-id", selectedOption.value);
            setVal("mem-song-title", selectedOption.dataset.title || "");
            setVal("mem-song-artist", selectedOption.dataset.artist || "");
            setVal("mem-song-cover", selectedOption.dataset.cover || "");
            const audioUrl = selectedOption.dataset.audio || "";
            setVal("mem-song-audio", audioUrl);

            if (previewBtn) {
              previewBtn.style.display = audioUrl ? "inline-block" : "none";
              previewBtn.dataset.audio = audioUrl;
              previewBtn.innerHTML = "▶️";
            }
          } else {
            setVal("mem-song-id", "");
            setVal("mem-song-title", "");
            setVal("mem-song-artist", "");
            setVal("mem-song-cover", "");
            setVal("mem-song-audio", "");
            if (previewBtn) previewBtn.style.display = "none";
          }
        };

        if (previewBtn) {
          previewBtn.onclick = () => {
            const audio = previewBtn.dataset.audio;
            if (audio) this.playAudioPreview(audio, previewBtn);
          };
        }
      }

      // Nota de voz
      const voiceUrl = mem && mem.voiceNoteUrl ? mem.voiceNoteUrl : '';
      const voiceDuration = mem && mem.voiceNoteDuration ? mem.voiceNoteDuration : 0;
      const memVoiceUrlInput = document.getElementById('mem-voice-url');
      const memVoiceDurInput = document.getElementById('mem-voice-duration');
      if (memVoiceUrlInput) memVoiceUrlInput.value = voiceUrl;
      if (memVoiceDurInput) memVoiceDurInput.value = voiceDuration;
      const voicePreview = document.getElementById('mem-voice-preview');
      const voiceAudioPlayer = document.getElementById('mem-voice-audio-player');
      const deleteVoiceBtn = document.getElementById('btn-mem-delete-audio');
      if (voiceUrl) {
        if (voiceAudioPlayer) voiceAudioPlayer.src = voiceUrl;
        if (voicePreview) voicePreview.style.display = 'block';
        if (deleteVoiceBtn) deleteVoiceBtn.style.display = 'inline-block';
      } else {
        if (voiceAudioPlayer) voiceAudioPlayer.src = '';
        if (voicePreview) voicePreview.style.display = 'none';
        if (deleteVoiceBtn) deleteVoiceBtn.style.display = 'none';
      }

      modal.classList.add("active");
    }

    updateCoverPreview(url) {
      const previewBox = document.getElementById("mem-cover-preview");
      if (!previewBox) return;
      if (!url) {
        previewBox.style.display = "none";
        previewBox.innerHTML = "";
        return;
      }
      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.startsWith("data:video/");
      previewBox.style.display = "block";
      if (isVideo) {
        previewBox.innerHTML = `<video src="${window.Utils.sanitizeHTML(url)}" controls style="max-height: 180px; width: 100%; border-radius: 8px;"></video>`;
      } else {
        previewBox.innerHTML = `<img src="${window.Utils.sanitizeHTML(url)}" alt="Vista previa" style="max-height: 180px; border-radius: 8px; object-fit: cover;" onerror="this.parentElement.style.display='none'">`;
      }
    }

    renderModalGallery() {
      const listEl = document.getElementById("mem-gallery-list");
      if (!listEl) return;
      if (!this.modalGalleryItems || this.modalGalleryItems.length === 0) {
        listEl.innerHTML = `<span style="font-size: 0.82rem; color: var(--color-text-muted);">No hay fotos ni videos adicionales adjuntos.</span>`;
        return;
      }

      listEl.innerHTML = this.modalGalleryItems.map((url, idx) => {
        const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.startsWith("data:video/");
        return `
          <div class="gallery-thumb-item">
            ${isVideo ? `<video src="${window.Utils.sanitizeHTML(url)}"></video>` : `<img src="${window.Utils.sanitizeHTML(url)}" alt="Foto">`}
            <button type="button" class="gallery-thumb-del" data-index="${idx}" title="Eliminar">&times;</button>
          </div>
        `;
      }).join("");

      listEl.querySelectorAll(".gallery-thumb-del").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10);
          this.modalGalleryItems.splice(idx, 1);
          this.renderModalGallery();
        });
      });
    }

    // --- 7. Películas (Nuestro Cine) ---
    // --- 7. Películas (Nuestro Cine) ---
    renderMovies() {
      const container = document.getElementById("movies-grid-list");
      const statusFilter = document.getElementById("filter-movies-status")?.value || "all";
      const genreFilter = document.getElementById("filter-movies-genre")?.value || "all";
      const ratingFilter = document.getElementById("filter-movies-rating")?.value || "all";
      if (!container) return;

      const allMovies = window.storage.getMovies();
      const currentUser = window.storage.getCurrentUser();

      // Poblar dinámicamente las opciones del selector de género si existe
      const genreSelect = document.getElementById("filter-movies-genre");
      if (genreSelect) {
        const uniqueGenres = new Set();
        allMovies.forEach(m => {
          if (m.genre) {
            m.genre.split(',').forEach(g => {
              const clean = g.trim();
              if (clean) uniqueGenres.add(clean);
            });
          }
        });
        const currentSelected = genreSelect.value;
        let optionsHtml = `<option value="all">🎭 Todos los géneros (${uniqueGenres.size})</option>`;
        Array.from(uniqueGenres).sort().forEach(g => {
          const isSel = currentSelected === g ? 'selected' : '';
          optionsHtml += `<option value="${window.Utils.sanitizeHTML(g)}" ${isSel}>${window.Utils.sanitizeHTML(g)}</option>`;
        });
        genreSelect.innerHTML = optionsHtml;
      }

      let list = [...allMovies];

      // Filtro por Género
      if (genreFilter !== "all") {
        list = list.filter(m => (m.genre || '').toLowerCase().includes(genreFilter.toLowerCase()));
      }

      // Filtro por Estado (Por ver / Vista)
      if (statusFilter !== "all") {
        list = list.filter(m => {
          const s = (m.status === 'Me encantó' || m.status === 'Favorita') ? 'Vista' : (m.status || 'Por ver');
          return s.toLowerCase() === statusFilter.toLowerCase();
        });
      }

      // Filtro por Calificación (1 a 10 / ⭐)
      if (ratingFilter !== "all") {
        if (ratingFilter === "unrated") {
          list = list.filter(m => (!m.kevinRating && !m.wendyRating && !m.priority) || (parseInt(m.kevinRating, 10) === 0 && parseInt(m.wendyRating, 10) === 0));
        } else {
          const minRating = parseInt(ratingFilter, 10);
          list = list.filter(m => {
            const kR = (parseInt(m.kevinRating, 10) || 0) * 2;
            const wR = (parseInt(m.wendyRating, 10) || 0) * 2;
            const prio = (parseInt(m.priority, 10) || 0) * 2;
            const imdb = Math.round(parseFloat(m.imdbRating) || 0);
            const maxRate = Math.max(kR, wR, prio, imdb);
            return maxRate >= minRating;
          });
        }
      }

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 2rem;">No hay películas que coincidan con estos filtros. ¡Añade una arriba! 🍿</div>`;
        return;
      }

      container.innerHTML = list.map(m => {
        const comments = Array.isArray(m.comments) ? m.comments : [];
        const author = m.proposedBy || 'Kevin';
        const authorInitial = author.charAt(0).toUpperCase();
        const authorClass = author.toLowerCase() === 'wendy' ? 'wendy' : 'kevin';

        const kevinRating = parseInt(m.kevinRating, 10) || 0;
        const wendyRating = parseInt(m.wendyRating, 10) || 0;
        const activeUserRating = currentUser.toLowerCase() === 'wendy' ? wendyRating : kevinRating;

        // 5 Estrellas Interactivas
        const starsHtml = [1, 2, 3, 4, 5].map(starNum => {
          const isFilled = starNum <= activeUserRating;
          return `<button type="button" class="star-btn ${isFilled ? 'active' : ''}" data-movie-id="${m.id}" data-rating="${starNum}" title="Calificar con ${starNum} estrella${starNum > 1 ? 's' : ''}">★</button>`;
        }).join("");

        // Resumen de calificación para la cabecera
        let ratingSummaryBadge = "";
        if (kevinRating > 0 && wendyRating > 0) {
          const avg = ((kevinRating + wendyRating) / 2).toFixed(1);
          ratingSummaryBadge = `<span class="song-badge-rating" title="Promedio de Kevin y Wendy">⭐ ${avg}/5</span>`;
        } else if (activeUserRating > 0) {
          ratingSummaryBadge = `<span class="song-badge-rating" title="Tu calificación">⭐ ${activeUserRating}/5</span>`;
        }

        const isWatched = (m.status === 'Vista' || m.status === 'Me encantó' || m.status === 'Favorita');
        const statusClass = isWatched ? 'Vista' : 'por-ver';
        const statusLabel = isWatched ? '🍿 Vista' : '🌱 Por ver';
        const platformsList = Array.isArray(m.platforms) ? m.platforms : (typeof m.platforms === 'string' && m.platforms ? m.platforms.split(',').map(s => s.trim()).filter(Boolean) : []);

        return `
          <div class="glass-card movie-card" data-id="${m.id}">
            <div>
              ${m.poster ? `<img class="movie-poster" src="${window.Utils.sanitizeHTML(m.poster)}" alt="Póster de ${window.Utils.sanitizeHTML(m.title)}" onerror="this.style.display='none'">` : '<div class="search-movie-poster-placeholder" style="height: 220px; width: 100%; border-radius: 12px; margin-bottom: 0.85rem;">🎬</div>'}
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="movie-badge-status btn-toggle-movie-status ${statusClass}" data-id="${m.id}" title="Toca para cambiar estado entre 'Por ver' y 'Vista' (1 solo toque)">
                  ${statusLabel} <span style="font-size:0.75rem; opacity:0.8; margin-left:2px;">⇄</span>
                </button>
                ${ratingSummaryBadge}
              </div>

              <div class="song-author-badge" style="margin-bottom: 0.35rem;" title="Propuesta automáticamente por ${window.Utils.sanitizeHTML(author)}">
                <span class="author-badge-circle ${authorClass}">${authorInitial}</span>
                <span>Propuesta por <strong>${window.Utils.sanitizeHTML(author)}</strong></span>
              </div>

              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--color-text-main); margin-bottom: 0.2rem; line-height: 1.25;">
                ${window.Utils.sanitizeHTML(m.title)} <span style="font-size: 0.95rem; color: var(--color-sunflower-gold); font-family: var(--font-numbers);">(${m.year})</span>
              </h3>

              <div class="movie-meta-tags" style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                ${m.genre ? `<span class="movie-meta-pill movie-genre-pill" title="Género de la película">🎭 ${window.Utils.sanitizeHTML(m.genre)}</span>` : ''}
                ${m.imdbRating ? `<span class="movie-meta-pill">⭐ TMDb: <strong>${window.Utils.sanitizeHTML(m.imdbRating)}</strong></span>` : ''}
                ${platformsList.map(plat => `<span class="movie-meta-pill">📺 ${window.Utils.sanitizeHTML(plat)}</span>`).join('')}
              </div>

              ${m.synopsis ? `<p class="movie-synopsis">${window.Utils.sanitizeHTML(m.synopsis)}</p>` : ''}
              
              ${m.imdbUrl ? `<p class="movie-meta" style="margin-top: 0.4rem;"><a href="${window.Utils.sanitizeHTML(m.imdbUrl)}" target="_blank" rel="noopener">⭐ Ver ficha oficial en IMDb</a></p>` : ''}
            </div>

            <div style="margin-top: 0.85rem;">
              <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn-secondary btn-toggle-movie-comments" data-id="${m.id}">
                  ⭐ Calificación y Comentarios (${comments.length})
                </button>
                <div style="display: flex; gap: 0.4rem;">
                  <button type="button" class="btn-secondary btn-edit-movie" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;" title="Editar película">✏️</button>
                  <button type="button" class="btn-secondary btn-delete-movie" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; color: var(--color-danger);" title="Eliminar película">🗑️</button>
                </div>
              </div>

              <!-- Hilo de Calificaciones y Comentarios de la película -->
              <div class="movie-comments-container" id="movie-comments-box-${m.id}" style="display: none;">
                
                <!-- Calificación de Estrellas Integrada en Películas -->
                <div class="song-rating-section">
                  <div class="song-rating-stars-bar">
                    <span class="rating-label">Tu nota (${currentUser}):</span>
                    <div class="interactive-stars-group">
                      ${starsHtml}
                    </div>
                    <span class="rating-number">${activeUserRating > 0 ? `${activeUserRating}/5 ⭐` : 'Toca para calificar'}</span>
                  </div>
                  <div class="song-rating-scores-breakdown">
                    <span class="score-pill ${kevinRating > 0 ? 'rated' : ''}">👦🏻 Kevin: <strong>${kevinRating > 0 ? `${kevinRating}/5 ★` : 'Pendiente'}</strong></span>
                    <span class="score-pill ${wendyRating > 0 ? 'rated' : ''}">👧🏻 Wendy: <strong>${wendyRating > 0 ? `${wendyRating}/5 ★` : 'Pendiente'}</strong></span>
                  </div>
                </div>

                <!-- Lista de comentarios -->
                <div class="song-comments-list" id="movie-comments-list-${m.id}">
                  ${comments.length === 0 ? `<p class="empty-comments-hint">Aún no hay comentarios sobre esta película. ¡Escribe qué te pareció o cuándo la veremos!</p>` : ''}
                  ${comments.map(c => {
                    const cAuthor = c.author || 'Kevin';
                    const cClass = cAuthor.toLowerCase() === 'wendy' ? 'wendy-comment' : 'kevin-comment';
                    return `
                      <div class="comment-bubble ${cClass}">
                        <div class="comment-bubble-header">
                          <strong>${window.Utils.sanitizeHTML(cAuthor)}</strong>
                          <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span>${window.Utils.formatDateTimeES(c.createdAt)}</span>
                            <button type="button" class="btn-del-movie-comment" data-movie-id="${m.id}" data-comment-id="${c.id}" title="Eliminar comentario">&times;</button>
                          </div>
                        </div>
                        <div class="comment-bubble-text">${window.Utils.sanitizeHTML(c.message)}</div>
                      </div>
                    `;
                  }).join("")}
                </div>

                <!-- Formulario para agregar comentario -->
                <form class="movie-add-comment-form" data-id="${m.id}">
                  <input type="text" class="form-control movie-comment-input" placeholder="Comenta algo sobre esta película como ${window.Utils.sanitizeHTML(currentUser)}..." required />
                  <button type="submit" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; white-space: nowrap;">Comentar 💌</button>
                </form>
              </div>
            </div>
          </div>
        `;
      }).join("");

      // Listener de Cambio Directo de Estado (1 Solo Toque)
      container.querySelectorAll('.btn-toggle-movie-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const movieId = btn.dataset.id;
          const movies = window.storage.getMovies();
          const movie = movies.find(m => m.id === movieId);
          if (!movie) return;
          const currentIsWatched = (movie.status === 'Vista' || movie.status === 'Me encantó' || movie.status === 'Favorita');
          movie.status = currentIsWatched ? 'Por ver' : 'Vista';
          window.storage.saveMovie(movie);
          this.renderMovies();
          this.renderDailyDashboard();
          window.Utils.showToast(`Estado cambiado a "${movie.status}" 🍿✨`, 'info');
        });
      });

      // Listeners de Estrellas para Películas
      container.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const movieId = btn.dataset.movieId;
          const ratingVal = parseInt(btn.dataset.rating, 10);
          window.storage.rateMovie(movieId, ratingVal, currentUser);
          this.renderMovies();
          this.renderDailyDashboard();
          window.Utils.showToast(`¡Calificaste la película con ${ratingVal} estrella${ratingVal > 1 ? 's' : ''}! 🎬⭐`, 'success');
        });
      });

      // Listener de Despliegue de Comentarios
      container.querySelectorAll('.btn-toggle-movie-comments').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const movieId = btn.dataset.id;
          const box = document.getElementById(`movie-comments-box-${movieId}`);
          if (box) {
            const isHidden = box.style.display === 'none';
            box.style.display = isHidden ? 'block' : 'none';
          }
        });
      });

      // Listener de Envío de Comentarios
      container.querySelectorAll('.movie-add-comment-form').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const movieId = form.dataset.id;
          const input = form.querySelector('.movie-comment-input');
          const msg = input ? input.value.trim() : '';
          if (!msg) return;

          window.storage.addMovieComment(movieId, {
            author: currentUser,
            message: msg
          });

          input.value = '';
          this.renderMovies();
          window.Utils.showToast('Comentario añadido a la película 💬🎬', 'success');
        });
      });

      // Listener de Eliminación de Comentarios
      container.querySelectorAll('.btn-del-movie-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const movieId = btn.dataset.movieId;
          const commentId = btn.dataset.commentId;
          if (confirm('¿Eliminar este comentario?')) {
            window.storage.deleteMovieComment(movieId, commentId);
            this.renderMovies();
            window.Utils.showToast('Comentario eliminado', 'info');
          }
        });
      });

      container.querySelectorAll(".btn-edit-movie").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const movie = window.storage.getMovies().find(m => m.id === id);
          if (movie) this.openMovieModal(movie);
        });
      });

      container.querySelectorAll(".btn-delete-movie").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar esta película de la biblioteca?")) {
            window.storage.deleteMovie(id);
            this.renderMovies();
            this.renderDailyDashboard();
            window.Utils.showToast("Película eliminada", "info");
          }
        });
      });

      document.getElementById("filter-movies-status")?.addEventListener("change", () => this.renderMovies());
      document.getElementById("filter-movies-genre")?.addEventListener("change", () => this.renderMovies());
      document.getElementById("filter-movies-rating")?.addEventListener("change", () => this.renderMovies());
    }

    openMovieModal(m = null) {
      const modal = document.getElementById("modal-movie");
      const currentUser = window.storage.getCurrentUser();
      const author = m && m.proposedBy ? m.proposedBy : currentUser;

      document.getElementById("movie-id").value = m ? (m.id || "") : "";
      document.getElementById("movie-title").value = m ? (m.title || "") : "";
      document.getElementById("movie-genre").value = m ? (m.genre || "") : "";
      document.getElementById("movie-poster").value = m ? (m.poster || "") : "";
      document.getElementById("movie-year").value = m ? (m.year || new Date().getFullYear()) : new Date().getFullYear();
      document.getElementById("movie-priority").value = m ? (m.priority || "5") : "5";
      document.getElementById("movie-status").value = m ? (m.status === 'Favorita' ? 'Me encantó' : (m.status || "Por ver")) : "Por ver";
      document.getElementById("movie-proposed").value = author;

      const authorNameEl = document.getElementById("movie-author-name");
      if (authorNameEl) authorNameEl.textContent = author;
      const authorBadgeEl = document.getElementById("movie-author-badge");
      if (authorBadgeEl) {
        authorBadgeEl.textContent = author.charAt(0).toUpperCase();
        authorBadgeEl.className = "author-badge-circle " + (author.toLowerCase() === "wendy" ? "wendy" : "kevin");
      }
      
      const platformsVal = m && m.platforms ? (Array.isArray(m.platforms) ? m.platforms.join(", ") : m.platforms) : "";
      document.getElementById("movie-platforms").value = platformsVal;
      document.getElementById("movie-imdb-score").value = m && m.imdbRating ? m.imdbRating : "";
      document.getElementById("movie-imdb-url").value = m && m.imdbUrl ? m.imdbUrl : "";
      document.getElementById("movie-synopsis").value = m && m.synopsis ? m.synopsis : "";

      const kevinScoreSelect = document.getElementById("movie-kevin-score");
      if (kevinScoreSelect) {
        kevinScoreSelect.value = m && m.kevinRating !== undefined && m.kevinRating !== null && m.kevinRating !== '' ? m.kevinRating : 5;
      }
      const wendyScoreSelect = document.getElementById("movie-wendy-score");
      if (wendyScoreSelect) {
        wendyScoreSelect.value = m && m.wendyRating !== undefined && m.wendyRating !== null && m.wendyRating !== '' ? m.wendyRating : 0;
      }

      modal.classList.add("active");
    }

    async searchMovies(query) {
      const results = document.getElementById('movie-search-results');
      if (!results) return;
      results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-sunflower-gold); padding: 1.5rem;">Buscando películas… 🔍🍿</div>';

      try {
        const movieList = await window.MediaService.searchMovies(query);
        if (!movieList.length) {
          results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-text-secondary); padding: 1.5rem;">No se encontraron películas con ese nombre. ¡Prueba con otro título!</div>';
          return;
        }

        results.innerHTML = `
          <div class="search-results-header">
            <span class="search-results-title">Películas encontradas:</span>
            <button type="button" class="btn-secondary" id="btn-close-movie-results" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">&times; Cerrar</button>
          </div>
          <div class="movies-search-grid">
            ${movieList.map((m, index) => `
              <div class="glass-card search-movie-card">
                ${m.poster ? `<img src="${window.Utils.sanitizeHTML(m.poster)}" alt="Póster" class="search-movie-poster" onerror="this.style.display='none'">` : '<div class="search-movie-poster-placeholder">🎬</div>'}
                <div class="search-movie-info">
                  <h4 class="search-movie-title">${window.Utils.sanitizeHTML(m.title)} <span style="font-size: 0.85rem; color: var(--color-sunflower-gold);">(${m.year || 'N/A'})</span></h4>
                  <p class="search-movie-synopsis">${window.Utils.sanitizeHTML(m.synopsis || 'Película disponible.')}</p>
                  <div class="search-movie-meta" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                    ${m.genre ? `<span class="movie-meta-pill movie-genre-pill">🎭 ${window.Utils.sanitizeHTML(m.genre)}</span>` : ''}
                    ${m.imdbRating ? `<span class="movie-meta-pill">⭐ TMDb: <strong>${window.Utils.sanitizeHTML(m.imdbRating)}</strong></span>` : ''}
                    <span class="movie-meta-pill">🎬 Película</span>
                  </div>
                </div>
                <div class="search-movie-actions">
                  <button type="button" class="btn-primary btn-add-search-movie" data-index="${index}">
                    <span>🍿 + Añadir a Cine</span>
                  </button>
                  <button type="button" class="btn-secondary btn-custom-movie" data-index="${index}" title="Personalizar antes de guardar">
                    <span>✏️ Personalizar</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        document.getElementById('btn-close-movie-results')?.addEventListener('click', () => {
          results.innerHTML = '';
        });

        results.querySelectorAll('.btn-add-search-movie').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.disabled = true;
            button.textContent = 'Guardando… ⏳';
            const baseMovie = movieList[index];
            const details = await window.MediaService.movieDetails(baseMovie);
            const currentUser = window.storage.getCurrentUser();

            window.storage.saveMovie({
              ...details,
              genre: details.genre || baseMovie.genre || '',
              proposedBy: currentUser,
              status: 'Por ver',
              comments: []
            });

            this.renderMovies();
            this.renderDailyDashboard();
            results.innerHTML = '';
            window.Utils.showToast(`¡${details.title} añadida a Nuestro Cine! 🎬🍿`, 'success');
          });
        });

        results.querySelectorAll('.btn-custom-movie').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.textContent = 'Cargando…';
            const details = await window.MediaService.movieDetails(movieList[index]);
            const currentUser = window.storage.getCurrentUser();
            this.openMovieModal({
              ...details,
              genre: details.genre || movieList[index].genre || '',
              proposedBy: currentUser,
              status: 'Por ver'
            });
            button.textContent = '✏️ Personalizar';
          });
        });
      } catch (error) {
        results.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">${window.Utils.sanitizeHTML(error.message || 'No fue posible buscar películas ahora.')}</div>`;
      }
    }

    // =========================================
    // MÓDULO DE SERIES & ANIME 📺
    // =========================================

    async searchSeries(query) {
      const results = document.getElementById('series-search-results');
      if (!results) return;
      results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-sunflower-gold); padding: 1.5rem;">Buscando series y anime… 🔍📺</div>';

      try {
        const seriesList = await window.MediaService.searchSeries(query);
        if (!seriesList.length) {
          results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-text-secondary); padding: 1.5rem;">No se encontraron series con ese nombre. ¡Prueba con otro título!</div>';
          return;
        }

        results.innerHTML = `
          <div class="search-results-header">
            <span class="search-results-title">Resultados de series encontrados:</span>
            <button type="button" class="btn-secondary" id="btn-close-series-results" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">&times; Cerrar</button>
          </div>
          <div class="movies-search-grid">
            ${seriesList.map((s, index) => `
              <div class="glass-card search-movie-card">
                ${s.poster ? `<img src="${window.Utils.sanitizeHTML(s.poster)}" alt="Póster" class="search-movie-poster" onerror="this.style.display='none'">` : '<div class="search-movie-poster-placeholder">📺</div>'}
                <div class="search-movie-info">
                  <h4 class="search-movie-title">${window.Utils.sanitizeHTML(s.title)} <span style="font-size: 0.85rem; color: var(--color-sunflower-gold);">(${s.year || 'N/A'})</span></h4>
                  <p class="search-movie-synopsis">${window.Utils.sanitizeHTML(s.synopsis || 'Serie/Anime disponible.')}</p>
                  <div class="search-movie-meta">
                    ${s.imdbRating ? `<span class="movie-meta-pill">⭐ TMDb: <strong>${window.Utils.sanitizeHTML(s.imdbRating)}</strong></span>` : ''}
                    <span class="movie-meta-pill">📺 Series & Anime</span>
                  </div>
                </div>
                <div class="search-movie-actions">
                  <button type="button" class="btn-primary btn-add-search-series" data-index="${index}">
                    <span>📺 + Añadir a Series</span>
                  </button>
                  <button type="button" class="btn-secondary btn-custom-series" data-index="${index}" title="Personalizar antes de guardar">
                    <span>✏️ Personalizar</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        document.getElementById('btn-close-series-results')?.addEventListener('click', () => {
          results.innerHTML = '';
        });

        results.querySelectorAll('.btn-add-search-series').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.disabled = true;
            button.textContent = 'Cargando temporadas… ⏳';
            const baseSerie = seriesList[index];
            const details = await window.MediaService.seriesDetails(baseSerie);
            const currentUser = window.storage.getCurrentUser();

            window.storage.saveSeries({
              ...details,
              proposedBy: currentUser,
              status: 'Por ver',
              comments: []
            });

            this.renderSeries();
            this.renderDailyDashboard();
            results.innerHTML = '';
            window.Utils.showToast(`¡${details.title} añadida a Nuestras Series! 📺🍿`, 'success');
          });
        });

        results.querySelectorAll('.btn-custom-series').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.textContent = 'Cargando…';
            const details = await window.MediaService.seriesDetails(seriesList[index]);
            const currentUser = window.storage.getCurrentUser();
            this.openSeriesModal({
              ...details,
              proposedBy: currentUser,
              status: 'Viendo'
            });
            button.textContent = '✏️ Personalizar';
          });
        });
      } catch (error) {
        results.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">${window.Utils.sanitizeHTML(error.message || 'No fue posible buscar series ahora.')}</div>`;
      }
    }

    renderSeries() {
      const container = document.getElementById("series-grid-list");
      const statusFilter = document.getElementById("filter-series-status")?.value || "all";
      const genreFilter = document.getElementById("filter-series-genre")?.value || "all";
      const ratingFilter = document.getElementById("filter-series-rating")?.value || "all";
      if (!container) return;

      const allSeries = window.storage.getSeries();
      const currentUser = window.storage.getCurrentUser();

      // Poblar dinámicamente las opciones del selector de género si existe
      const genreSelect = document.getElementById("filter-series-genre");
      if (genreSelect) {
        const uniqueGenres = new Set();
        allSeries.forEach(s => {
          if (s.genre) {
            s.genre.split(',').forEach(g => {
              const clean = g.trim();
              if (clean) uniqueGenres.add(clean);
            });
          }
        });
        const currentSelected = genreSelect.value;
        let optionsHtml = `<option value="all">🎭 Todos los géneros (${uniqueGenres.size})</option>`;
        Array.from(uniqueGenres).sort().forEach(g => {
          const isSel = currentSelected === g ? 'selected' : '';
          optionsHtml += `<option value="${window.Utils.sanitizeHTML(g)}" ${isSel}>${window.Utils.sanitizeHTML(g)}</option>`;
        });
        genreSelect.innerHTML = optionsHtml;
      }

      let list = [...allSeries];

      // Filtro por Género
      if (genreFilter !== "all") {
        list = list.filter(s => (s.genre || '').toLowerCase().includes(genreFilter.toLowerCase()));
      }

      if (statusFilter !== "all") {
        list = list.filter(s => (s.status || 'Viendo').toLowerCase() === statusFilter.toLowerCase());
      }

      if (ratingFilter !== "all") {
        if (ratingFilter === "unrated") {
          list = list.filter(s => (!s.kevinRating && !s.wendyRating) || (parseInt(s.kevinRating, 10) === 0 && parseInt(s.wendyRating, 10) === 0));
        } else {
          const minRating = parseInt(ratingFilter, 10);
          list = list.filter(s => {
            const kR = (parseInt(s.kevinRating, 10) || 0) * 2;
            const wR = (parseInt(s.wendyRating, 10) || 0) * 2;
            const imdb = Math.round(parseFloat(s.imdbRating) || 0);
            const maxRate = Math.max(kR, wR, imdb);
            return maxRate >= minRating;
          });
        }
      }

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 2rem;">No hay series que coincidan con estos filtros. ¡Busca una arriba o añade la tuya! 📺✨</div>`;
        return;
      }

      container.innerHTML = list.map(s => {
        const comments = Array.isArray(s.comments) ? s.comments : [];
        const author = s.proposedBy || 'Kevin';
        const authorInitial = author.charAt(0).toUpperCase();
        const authorClass = author.toLowerCase() === 'wendy' ? 'wendy' : 'kevin';

        const totalEps = s.totalEpisodes || 0;
        const progressBoth = s.progressBoth || 0;
        const progressKevin = s.progressKevin || 0;
        const progressWendy = s.progressWendy || 0;

        const isFullySeen = s.isFullyCompletedByBoth || (s.isFullyCompletedByKevin && s.isFullyCompletedByWendy);

        const statusLabel = s.status === 'Completada' ? '✨ Completada' : (s.status === 'Por ver' ? '🌱 Por ver' : '🍿 Viendo');
        const statusClass = s.status === 'Completada' ? 'encanto' : (s.status === 'Por ver' ? 'por-ver' : 'Vista');

        const platformsList = Array.isArray(s.platforms) ? s.platforms : (typeof s.platforms === 'string' && s.platforms ? s.platforms.split(',').map(p => p.trim()).filter(Boolean) : []);

        // Calificación global si está terminada
        let ratingBadge = "";
        if (s.kevinRating > 0 && s.wendyRating > 0) {
          const avg = ((s.kevinRating + s.wendyRating) / 2).toFixed(1);
          ratingBadge = `<span class="song-badge-rating" title="Promedio de Kevin y Wendy">⭐ ${avg}/5</span>`;
        } else if (s.kevinRating > 0 || s.wendyRating > 0) {
          const userScore = currentUser.toLowerCase() === 'wendy' ? s.wendyRating : s.kevinRating;
          if (userScore > 0) {
            ratingBadge = `<span class="song-badge-rating" title="Tu nota">⭐ ${userScore}/5</span>`;
          }
        }

        return `
          <div class="serie-card" data-id="${s.id}">
            <div>
              ${s.poster ? `<img class="serie-card-poster" src="${window.Utils.sanitizeHTML(s.poster)}" alt="Póster de ${window.Utils.sanitizeHTML(s.title)}" onerror="this.style.display='none'">` : '<div class="serie-card-poster-placeholder">📺</div>'}
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;">
                <span class="movie-badge-status ${statusClass}">${statusLabel}</span>
                ${ratingBadge}
              </div>

              <div class="song-author-badge" style="margin-bottom: 0.35rem;" title="Añadida por ${window.Utils.sanitizeHTML(author)}">
                <span class="author-badge-circle ${authorClass}">${authorInitial}</span>
                <span>Añadida por <strong>${window.Utils.sanitizeHTML(author)}</strong></span>
              </div>

              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--color-text-main); margin-bottom: 0.2rem; line-height: 1.25;">
                ${window.Utils.sanitizeHTML(s.title)} <span style="font-size: 0.95rem; color: var(--color-sunflower-gold); font-family: var(--font-numbers);">(${s.year || ''})</span>
              </h3>

              <div class="movie-meta-tags" style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                ${s.genre ? `<span class="movie-meta-pill movie-genre-pill" title="Género de la serie">🎭 ${window.Utils.sanitizeHTML(s.genre)}</span>` : ''}
                ${s.imdbRating ? `<span class="movie-meta-pill">⭐ TMDb: <strong>${s.imdbRating}</strong></span>` : ''}
                ${platformsList.map(plat => `<span class="movie-meta-pill">📺 ${window.Utils.sanitizeHTML(plat)}</span>`).join('')}
              </div>

              ${s.synopsis ? `<p class="movie-synopsis">${window.Utils.sanitizeHTML(s.synopsis)}</p>` : ''}

              <!-- Barra de Progreso Conjunto -->
              <div class="serie-progress-bar-wrap">
                <div class="serie-progress-track">
                  <div class="serie-progress-fill both" style="width: ${progressBoth}%;"></div>
                </div>
                <div class="serie-progress-labels">
                  <span class="serie-progress-tag" style="color: #00E5FF;">👦🏻 Kevin: ${progressKevin}%</span>
                  <span class="serie-progress-tag" style="color: #7092FD; font-weight: 700;">💑 Juntos: ${progressBoth}%</span>
                  <span class="serie-progress-tag" style="color: #E040FB;">👧🏻 Wendy: ${progressWendy}%</span>
                </div>
              </div>

              ${s.imdbUrl ? `
                <p class="movie-meta" style="margin-top: 0.4rem;">
                  <a href="${window.Utils.sanitizeHTML(s.imdbUrl)}" target="_blank" rel="noopener">⭐ Ver ficha oficial</a>
                </p>
              ` : ''}
            </div>

            <div style="margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
              <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn-primary btn-open-series-viewer" data-id="${s.id}" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
                  <span>▶ Ver Capítulos (${totalEps})</span>
                </button>
                <div style="display: flex; gap: 0.4rem;">
                  <button type="button" class="btn-secondary btn-edit-series" data-id="${s.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;" title="Editar serie">✏️</button>
                  <button type="button" class="btn-secondary btn-delete-series" data-id="${s.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; color: var(--color-danger);" title="Eliminar serie">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      // Listeners
      container.querySelectorAll(".btn-open-series-viewer").forEach(btn => {
        btn.addEventListener("click", () => this.openSeriesViewer(btn.dataset.id));
      });

      container.querySelectorAll(".btn-edit-series").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const s = window.storage.getSeries().find(item => item.id === id);
          if (s) this.openSeriesModal(s);
        });
      });

      container.querySelectorAll(".btn-delete-series").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (confirm("¿Seguro que deseas eliminar esta serie de la lista?")) {
            window.storage.deleteSeries(id);
            this.renderSeries();
            this.renderDailyDashboard();
            window.Utils.showToast("Serie eliminada", "info");
          }
        });
      });

      document.getElementById("filter-series-status")?.addEventListener("change", () => this.renderSeries());
      document.getElementById("filter-series-genre")?.addEventListener("change", () => this.renderSeries());
      document.getElementById("filter-series-rating")?.addEventListener("change", () => this.renderSeries());
    }

    openSeriesModal(s = null) {
      const modal = document.getElementById("modal-series");
      const titleEl = document.getElementById("modal-series-title");
      const currentUser = window.storage.getCurrentUser();
      const author = s && s.proposedBy ? s.proposedBy : currentUser;

      titleEl.textContent = s && s.id ? "Editar Serie 📺" : "Añadir Serie o Anime 📺";
      document.getElementById("series-id").value = s && s.id ? s.id : "";
      document.getElementById("series-tmdb-id").value = s && s.tmdbId ? s.tmdbId : "";
      document.getElementById("series-title").value = s && s.title ? s.title : "";
      document.getElementById("series-genre").value = s && s.genre ? s.genre : "";
      document.getElementById("series-poster").value = s && s.poster ? s.poster : "";
      document.getElementById("series-year").value = s && s.year ? s.year : new Date().getFullYear();
      document.getElementById("series-seasons-count").value = s && s.seasonsCount ? s.seasonsCount : (s && s.seasons ? s.seasons.length : 1);
      document.getElementById("series-status").value = s && s.status ? s.status : "Viendo";
      document.getElementById("series-proposed").value = author;

      const authorNameEl = document.getElementById("series-author-name");
      if (authorNameEl) authorNameEl.textContent = author;
      const authorBadgeEl = document.getElementById("series-author-badge");
      if (authorBadgeEl) {
        authorBadgeEl.textContent = author.charAt(0).toUpperCase();
        authorBadgeEl.className = "author-badge-circle " + (author.toLowerCase() === "wendy" ? "wendy" : "kevin");
      }

      const platformsVal = s && s.platforms ? (Array.isArray(s.platforms) ? s.platforms.join(", ") : s.platforms) : "";
      document.getElementById("series-platforms").value = platformsVal;
      document.getElementById("series-imdb-score").value = s && s.imdbRating ? s.imdbRating : "";
      document.getElementById("series-synopsis").value = s && s.synopsis ? s.synopsis : "";

      modal.classList.add("active");
    }

    async openSeriesViewer(seriesId, activeSeasonNum = 1) {
      const serie = window.storage.getSeries().find(s => s.id === seriesId);
      if (!serie) return;

      const modal = document.getElementById("modal-series-viewer");
      document.getElementById("series-viewer-title").textContent = serie.title;
      document.getElementById("series-viewer-subtitle").textContent = `${serie.seasonsCount || (serie.seasons ? serie.seasons.length : 1)} Temporadas · ${serie.totalEpisodes || 0} Capítulos`;

      // Si la temporada activa no tiene metadatos completos y tiene tmdbId, enriquecerla preservando vistos
      const seasonObj = (serie.seasons || []).find(s => s.seasonNumber === activeSeasonNum);
      if (seasonObj && serie.tmdbId && (!seasonObj.episodes || !seasonObj.episodes.length || !seasonObj.episodes[0]?.stillPath)) {
        try {
          const episodes = await window.MediaService.getSeasonEpisodes(serie.tmdbId, activeSeasonNum);
          if (episodes && episodes.length) {
            const existingEpisodes = seasonObj.episodes || [];
            seasonObj.episodes = episodes.map(newEp => {
              const prev = existingEpisodes.find(p => p.episodeNumber === newEp.episodeNumber);
              return {
                ...newEp,
                watchedByKevin: prev ? prev.watchedByKevin : false,
                watchedByWendy: prev ? prev.watchedByWendy : false,
                watchedAtKevin: prev ? prev.watchedAtKevin : null,
                watchedAtWendy: prev ? prev.watchedAtWendy : null
              };
            });
            window.storage.saveSeries(serie);
          }
        } catch (_) {}
      }

      this.renderSeriesViewerContent(seriesId, activeSeasonNum);
      modal.classList.add("active");
    }

    renderSeriesViewerContent(seriesId, activeSeasonNum = 1) {
      const container = document.getElementById("series-viewer-content");
      const serie = window.storage.getSeries().find(s => s.id === seriesId);
      if (!container || !serie) return;

      const currentUser = window.storage.getCurrentUser();
      const isWendy = currentUser.toLowerCase() === 'wendy';
      const userCompleted = isWendy ? serie.isFullyCompletedByWendy : serie.isFullyCompletedByKevin;

      const seasons = serie.seasons && serie.seasons.length ? serie.seasons : [
        { seasonNumber: 1, name: 'Temporada 1', episodes: [] }
      ];

      const activeSeason = seasons.find(s => s.seasonNumber === activeSeasonNum) || seasons[0];
      const episodes = activeSeason.episodes || [];

      // Calificación de estrellas (desbloqueable)
      const activeUserRating = isWendy ? (serie.wendyRating || 0) : (serie.kevinRating || 0);
      const starsHtml = [1, 2, 3, 4, 5].map(starNum => {
        const isFilled = starNum <= activeUserRating;
        return `<button type="button" class="star-btn ${isFilled ? 'active' : ''} ${!userCompleted ? 'disabled' : ''}" data-series-id="${serie.id}" data-rating="${starNum}" ${!userCompleted ? 'disabled title="Completa todos los capítulos para calificar"' : `title="Calificar con ${starNum} estrellas"`}>★</button>`;
      }).join("");

      const comments = Array.isArray(serie.comments) ? serie.comments : [];

      container.innerHTML = `
        <!-- Cabecera de la Serie -->
        <div class="series-header-hero">
          ${serie.poster ? `<img src="${window.Utils.sanitizeHTML(serie.poster)}" alt="Póster" class="series-hero-poster" onerror="this.style.display='none'">` : '<div class="serie-card-poster-placeholder" style="height: 200px;">📺</div>'}
          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap;">
              <span class="movie-badge-status ${serie.status === 'Completada' ? 'encanto' : 'Vista'}">${serie.status || 'Viendo'}</span>
              ${serie.imdbRating ? `<span class="movie-meta-pill">⭐ TMDb: <strong>${serie.imdbRating}</strong></span>` : ''}
              <span class="movie-meta-pill">📅 ${serie.year || ''}</span>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: var(--color-sunflower-gold); margin-bottom: 0.4rem;">${window.Utils.sanitizeHTML(serie.title)}</h2>
            <p style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.45; margin-bottom: 0.85rem;">${window.Utils.sanitizeHTML(serie.synopsis || 'Sinopsis no disponible.')}</p>
            
            <!-- Barra de Progreso Global -->
            <div class="serie-progress-bar-wrap">
              <div class="serie-progress-track" style="height: 12px;">
                <div class="serie-progress-fill both" style="width: ${serie.progressBoth || 0}%;"></div>
              </div>
              <div class="serie-progress-labels">
                <span style="color: #00E5FF; font-weight: 600;">👦🏻 Kevin: ${serie.progressKevin || 0}%</span>
                <span style="color: #7092FD; font-weight: 700;">💑 Juntos: ${serie.progressBoth || 0}%</span>
                <span style="color: #E040FB; font-weight: 600;">👧🏻 Wendy: ${serie.progressWendy || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selector de Temporadas -->
        <div>
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-sunflower-gold); margin-bottom: 0.5rem;">Selecciona una Temporada:</div>
          <div class="season-tabs-bar">
            ${seasons.map(s => `
              <button type="button" class="season-tab-btn ${s.seasonNumber === activeSeason.seasonNumber ? 'active' : ''}" data-season-num="${s.seasonNumber}">
                ${window.Utils.sanitizeHTML(s.name || `Temporada ${s.seasonNumber}`)}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Lista de Capítulos de la Temporada -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main);">
              Capítulos de ${window.Utils.sanitizeHTML(activeSeason.name || `Temporada ${activeSeason.seasonNumber}`)} (${episodes.length}):
            </div>
            <span style="font-size: 0.78rem; color: var(--color-text-muted);">Toca para marcar como visto</span>
          </div>

          <div class="episodes-grid">
            ${episodes.length === 0 ? `
              <div class="glass-card" style="text-align: center; padding: 1.5rem; color: var(--color-text-secondary);">
                No hay capítulos cargados para esta temporada.
                <button type="button" class="btn-secondary btn-fetch-episodes" style="margin-top: 0.5rem;" data-season="${activeSeason.seasonNumber}">
                  🔄 Cargar capítulos oficiales
                </button>
              </div>
            ` : episodes.map(ep => {
              const kSeen = ep.watchedByKevin === true;
              const wSeen = ep.watchedByWendy === true;
              const bothSeen = kSeen && wSeen;
              const activeUserSeen = isWendy ? wSeen : kSeen;
              const otherUserSeen = isWendy ? kSeen : wSeen;
              const otherUserName = isWendy ? 'Kevin 👦🏻' : 'Wendy 👧🏻';
              const activeUserClass = isWendy ? 'seen-wendy' : 'seen-kevin';

              let cardClass = "";
              if (bothSeen) cardClass = "watched-both";
              else if (kSeen) cardClass = "watched-kevin";
              else if (wSeen) cardClass = "watched-wendy";

              return `
                <div class="episode-card ${cardClass}" data-ep="${ep.episodeNumber}">
                  <div class="episode-main-row">
                    ${ep.stillPath ? `<img src="${window.Utils.sanitizeHTML(ep.stillPath)}" class="episode-still" alt="Capítulo ${ep.episodeNumber}" onerror="this.style.display='none'">` : '<div class="episode-still" style="display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📺</div>'}
                    
                    <div class="episode-info">
                      <div class="episode-title-row">
                        <span class="episode-num-badge">E${ep.episodeNumber}</span>
                        <span class="episode-name">${window.Utils.sanitizeHTML(ep.name || `Episodio ${ep.episodeNumber}`)}</span>
                      </div>
                      <p class="episode-synopsis">${window.Utils.sanitizeHTML(ep.overview || 'Sinopsis no disponible.')}</p>
                      
                      ${!bothSeen && otherUserSeen ? `
                        <div style="margin-top: 0.35rem; font-size: 0.75rem; color: ${isWendy ? '#00E5FF' : '#E040FB'}; font-weight: 600;">
                          ✓ ${otherUserName} ya vio este capítulo
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Botones de Visto exclusivos del perfil activo -->
                  <div class="episode-actions-group">
                    <button type="button" class="btn-seen-badge ${bothSeen ? 'seen-both' : (activeUserSeen ? activeUserClass : '')} btn-toggle-ep-self" data-season="${activeSeason.seasonNumber}" data-ep="${ep.episodeNumber}" title="Marcar/desmarcar solo este capítulo para tu perfil (${currentUser})">
                      ${bothSeen ? '💑 Visto por ambos ✨' : (activeUserSeen ? `✓ Visto por ti (${currentUser})` : `+ Marcar como visto`)}
                    </button>

                    <button type="button" class="btn-seen-badge btn-mark-ep-upto" data-season="${activeSeason.seasonNumber}" data-ep="${ep.episodeNumber}" title="Marcar este capítulo y todos los capítulos anteriores como vistos para tu perfil (${currentUser})">
                      ⏩ Visto hasta aquí
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Sección de Calificación (Bloqueada hasta terminar la serie) -->
        <div class="rating-lock-box ${userCompleted ? 'unlocked' : 'locked'}">
          ${userCompleted ? `
            <div style="text-align: center;">
              <h4 style="color: var(--color-sunflower-gold); margin-bottom: 0.3rem; font-size: 1.15rem;">🏆 ¡Has completado toda la serie! 🌻✨</h4>
              <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.85rem;">Ya puedes dar tu calificación final de estrellas:</p>
              
              <div class="song-rating-stars-bar" style="justify-content: center; margin-bottom: 0.85rem;">
                <div class="interactive-stars-group">
                  ${starsHtml}
                </div>
                <span class="rating-number">${activeUserRating > 0 ? `${activeUserRating}/5 ⭐` : 'Toca para calificar'}</span>
              </div>

              <div class="song-rating-scores-breakdown" style="justify-content: center;">
                <span class="score-pill ${serie.kevinRating > 0 ? 'rated' : ''}">👦🏻 Kevin: <strong>${serie.kevinRating > 0 ? `${serie.kevinRating}/5 ★` : (serie.isFullyCompletedByKevin ? 'Listo para calificar' : 'Viendo')}</strong></span>
                <span class="score-pill ${serie.wendyRating > 0 ? 'rated' : ''}">👧🏻 Wendy: <strong>${serie.wendyRating > 0 ? `${serie.wendyRating}/5 ★` : (serie.isFullyCompletedByWendy ? 'Listo para calificar' : 'Viendo')}</strong></span>
              </div>
            </div>
          ` : `
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: var(--color-text-muted); font-size: 0.88rem;">
              <span>🔒</span>
              <span><strong>Calificación bloqueada:</strong> Podrás calificar esta serie cuando hayas marcado todos sus capítulos como vistos.</span>
            </div>
          `}
        </div>

        <!-- Hilo de Comentarios con Indicador de Capítulo Actual -->
        <div class="glass-card" style="padding: 1.25rem; margin-top: 0.5rem;">
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--color-sunflower-gold); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>💬</span>
            <span>Comentarios y Reacciones de la Serie (${comments.length})</span>
          </div>

          <div class="comments-list-box" style="max-height: 250px; overflow-y: auto;">
            ${comments.length === 0 ? '<p style="font-size: 0.85rem; color: var(--color-text-secondary);">Aún no hay comentarios en esta serie. ¡Deja el primero y comparte por dónde vas!</p>' : comments.map(c => {
              const isWendyAuthor = (c.author || '').toLowerCase() === 'wendy';
              return `
                <div class="comment-bubble ${isWendyAuthor ? 'wendy-comment' : ''}">
                  <div class="comment-bubble-header">
                    <div>
                      <strong>${window.Utils.sanitizeHTML(c.author || 'Kevin')}</strong>
                      <span class="comment-progress-tag" title="Iba por este capítulo al comentar">📍 ${window.Utils.sanitizeHTML(c.currentProgress || 'En progreso')}</span>
                      ${c.isCompleted ? '<span style="color: var(--color-sunflower-gold); font-size: 0.72rem; margin-left: 0.25rem;">(👑 Serie terminada)</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <span>${window.Utils.formatDateTimeES(c.createdAt)}</span>
                      <button type="button" class="btn-del-series-comment" data-series-id="${serie.id}" data-comment-id="${c.id}" style="background:none; border:none; color:var(--color-danger); cursor:pointer; font-size:1rem;">&times;</button>
                    </div>
                  </div>
                  <div class="comment-bubble-text">${window.Utils.sanitizeHTML(c.message)}</div>
                </div>
              `;
            }).join('')}
          </div>

          <form id="form-series-add-comment" style="display: flex; gap: 0.5rem; margin-top: 0.85rem;">
            <input type="text" id="input-series-comment" class="comment-input-field" placeholder="Escribe un comentario como ${window.Utils.sanitizeHTML(currentUser)}..." required />
            <button type="submit" class="btn-send-comment">Comentar 💬</button>
          </form>
        </div>
      `;

      this.initSeriesViewerHandlers(seriesId, activeSeasonNum);
    }

    initSeriesViewerHandlers(seriesId, activeSeasonNum) {
      const container = document.getElementById("series-viewer-content");
      if (!container) return;

      // Pestañas de temporada
      container.querySelectorAll(".season-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const sNum = parseInt(btn.dataset.seasonNum, 10);
          this.openSeriesViewer(seriesId, sNum);
        });
      });

      // Cargar capítulos si faltan
      container.querySelectorAll(".btn-fetch-episodes").forEach(btn => {
        btn.addEventListener("click", async () => {
          const sNum = parseInt(btn.dataset.season, 10);
          btn.textContent = 'Cargando capítulos… ⏳';
          const serie = window.storage.getSeries().find(s => s.id === seriesId);
          if (serie && serie.tmdbId) {
            const episodes = await window.MediaService.getSeasonEpisodes(serie.tmdbId, sNum);
            const seasonObj = (serie.seasons || []).find(s => s.seasonNumber === sNum);
            if (seasonObj) {
              seasonObj.episodes = episodes;
              window.storage.saveSeries(serie);
              this.renderSeriesViewerContent(seriesId, sNum);
            }
          }
        });
      });

      // Toggle visto solo de este capítulo por el usuario activo
      container.querySelectorAll(".btn-toggle-ep-self").forEach(btn => {
        btn.addEventListener("click", () => {
          const currentUser = window.storage.getCurrentUser();
          const sNum = parseInt(btn.dataset.season, 10);
          const epNum = parseInt(btn.dataset.ep, 10);
          window.storage.toggleEpisodeWatched(seriesId, sNum, epNum, currentUser);
          this.renderSeriesViewerContent(seriesId, sNum);
          this.renderSeries();
          this.renderDailyDashboard();
        });
      });

      // Marcar visto hasta este capítulo y anteriores
      container.querySelectorAll(".btn-mark-ep-upto").forEach(btn => {
        btn.addEventListener("click", () => {
          const currentUser = window.storage.getCurrentUser();
          const sNum = parseInt(btn.dataset.season, 10);
          const epNum = parseInt(btn.dataset.ep, 10);
          if (confirm(`¿Marcar este capítulo (T${sNum}:E${epNum}) y todos los anteriores como vistos para ${currentUser}?`)) {
            window.storage.markEpisodesUpTo(seriesId, sNum, epNum, currentUser);
            this.renderSeriesViewerContent(seriesId, sNum);
            this.renderSeries();
            this.renderDailyDashboard();
            window.Utils.showToast(`Capítulos anteriores marcados como vistos para ${currentUser} 📺✨`, "success");
          }
        });
      });

      // Calificación por estrellas
      container.querySelectorAll(".star-btn:not(.disabled)").forEach(btn => {
        btn.addEventListener("click", () => {
          const rating = parseInt(btn.dataset.rating, 10);
          const currentUser = window.storage.getCurrentUser();
          try {
            window.storage.rateSeries(seriesId, currentUser, rating);
            this.renderSeriesViewerContent(seriesId, activeSeasonNum);
            this.renderSeries();
            window.Utils.showToast(`¡Calificación de ${rating} ⭐ guardada!`, 'success');
          } catch (err) {
            window.Utils.showToast(err.message, 'warning');
          }
        });
      });

      // Añadir comentario
      const commentForm = document.getElementById("form-series-add-comment");
      commentForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("input-series-comment");
        const msg = input ? input.value.trim() : "";
        if (!msg) return;

        const currentUser = window.storage.getCurrentUser();
        window.storage.addSeriesComment(seriesId, {
          author: currentUser,
          message: msg
        });

        if (input) input.value = "";
        this.renderSeriesViewerContent(seriesId, activeSeasonNum);
        this.renderSeries();
        window.Utils.showToast("Comentario publicado 💬", "success");
      });

      // Eliminar comentario
      container.querySelectorAll(".btn-del-series-comment").forEach(btn => {
        btn.addEventListener("click", () => {
          const cId = btn.dataset.commentId;
          window.storage.deleteSeriesComment(seriesId, cId);
          this.renderSeriesViewerContent(seriesId, activeSeasonNum);
          this.renderSeries();
        });
      });
    }

    // --- 8. Muro Compartido ---
    renderNotes() {
      const container = document.getElementById("notes-grid-list");
      if (!container) return;

      let list = window.storage.getNotes();
      const currentUser = window.storage.getCurrentUser();

      // Ordenar: Fijadas con chincheta primero, luego cronológico descendente
      list.sort((a, b) => {
        const pinA = a.isPinned ? 1 : 0;
        const pinB = b.isPinned ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 2rem;">El muro está esperando vuestras primeras notas de amor. 💌✨</div>`;
        return;
      }

      container.innerHTML = list.map(n => {
        const author = n.author || 'Kevin';
        const isAuthor = author.toLowerCase() === currentUser.toLowerCase() || n.isDemo;
        const styleClass = `style-${n.style || 'sunflower'}`;
        const isPinned = n.isPinned === true;
        const sticker = n.sticker || '';
        const photoUrl = n.photoUrl || '';
        const isSurprise = n.style === 'surprise' && !n.isRevealed;

        const reactions = n.reactions || {};
        const availableReactions = ['❤️', '🥰', '🌻', '😂', '🥺'];

        return `
          <div class="paper-note ${styleClass} ${isPinned ? 'is-pinned' : ''}" data-id="${n.id}">
            ${isPinned ? `<span class="paper-note-pin-badge btn-toggle-pin" data-id="${n.id}" title="Nota fijada arriba. Toca para desfijar">📌</span>` : ''}
            ${sticker ? `<span class="note-floating-sticker" title="Sticker">${window.Utils.sanitizeHTML(sticker)}</span>` : ''}

            <div class="paper-note-header">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="author-badge-circle ${author.toLowerCase() === 'wendy' ? 'wendy' : 'kevin'}" style="width: 24px; height: 24px; font-size: 0.75rem;">
                  ${author.charAt(0).toUpperCase()}
                </span>
                <span class="paper-author" style="color: ${author.toLowerCase() === 'wendy' ? 'var(--color-pink)' : 'var(--color-lilac)'}; font-weight: 700;">
                  ${window.Utils.sanitizeHTML(author)}
                </span>
              </div>
              <span class="paper-date">${window.Utils.formatDateTimeES(n.createdAt)}</span>
            </div>

            <!-- Contenido de la Nota (o Raspa & Gana si es Sorpresa) -->
            ${isSurprise ? `
              <div class="surprise-scratch-box">
                <div class="surprise-scratch-cover btn-reveal-surprise" data-id="${n.id}">
                  <span style="font-size: 1.6rem;">🤫✨</span>
                  <strong style="color: var(--color-sunflower-gold); font-size: 0.9rem;">Nota Sorpresa Oculta</strong>
                  <button type="button" class="surprise-scratch-btn">🎁 Toca para raspar y leer</button>
                </div>
                <div class="paper-content" style="filter: blur(8px); user-select: none;">${window.Utils.sanitizeHTML(n.message)}</div>
              </div>
            ` : `
              <div class="paper-content">${window.Utils.sanitizeHTML(n.message)}</div>
            `}

            <!-- Foto Polaroid Adjunta si existe -->
            ${photoUrl ? `
              <div class="note-polaroid-attachment">
                <img src="${window.Utils.sanitizeHTML(photoUrl)}" class="note-polaroid-img" alt="Foto adjunta" onerror="this.parentElement.style.display='none'" />
              </div>
            ` : ''}

            <!-- Nota de Voz Adjunta si existe 🎙️ -->
            ${n.voiceNoteUrl ? `
              <div class="note-voice-attachment" style="margin: 0.6rem 0; background: rgba(0,0,0,0.18); border-radius: 8px; padding: 0.35rem 0.6rem; display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size: 1rem;">🎙️</span>
                <audio controls src="${window.Utils.sanitizeHTML(n.voiceNoteUrl)}" style="width: 100%; height: 30px;"></audio>
              </div>
            ` : ''}

            <!-- Barra de Reacciones Interactivas -->
            <div class="note-reactions-bar">
              ${availableReactions.map(emoji => {
                const users = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
                const count = users.length;
                const hasReacted = users.includes(currentUser);
                const titleText = count > 0 ? `${users.join(' y ')} reaccionó con ${emoji}` : `Reaccionar con ${emoji}`;
                return `
                  <button type="button" class="reaction-btn ${hasReacted ? 'active' : ''} btn-react-note" data-id="${n.id}" data-emoji="${emoji}" title="${titleText}">
                    <span>${emoji}</span>
                    ${count > 0 ? `<strong>${count}</strong>` : ''}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Acciones de la Nota -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; padding-top: 0.4rem;">
              <button type="button" class="btn-secondary btn-toggle-pin" data-id="${n.id}" style="padding: 0.18rem 0.55rem; font-size: 0.72rem;" title="${isPinned ? 'Desfijar de la parte superior' : 'Fijar con chincheta'}">
                ${isPinned ? '📌 Desfijar' : '📌 Fijar'}
              </button>

              <div style="display: flex; gap: 0.35rem;">
                ${isAuthor ? `
                  <button type="button" class="btn-secondary btn-edit-note" data-id="${n.id}" style="padding: 0.18rem 0.55rem; font-size: 0.72rem;">Editar</button>
                  <button type="button" class="btn-secondary btn-delete-note" data-id="${n.id}" style="padding: 0.18rem 0.55rem; font-size: 0.72rem; color: var(--color-danger);">Eliminar</button>
                ` : `
                  <span style="font-size: 0.7rem; color: var(--color-text-muted);">🔒 Nota de ${window.Utils.sanitizeHTML(author)}</span>
                `}
              </div>
            </div>
          </div>
        `;
      }).join("");

      // Listeners
      container.querySelectorAll(".btn-react-note").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const emoji = btn.dataset.emoji;
          window.storage.reactToNote(id, emoji, currentUser);
          this.renderNotes();
        });
      });

      container.querySelectorAll(".btn-toggle-pin").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          window.storage.toggleNotePin(id);
          this.renderNotes();
          window.Utils.showToast("Estado de chincheta actualizado 📌", "info");
        });
      });

      container.querySelectorAll(".btn-reveal-surprise").forEach(cover => {
        cover.addEventListener("click", () => {
          const id = cover.dataset.id;
          window.storage.revealSurpriseNote(id);
          this.renderNotes();
          window.Utils.showToast("¡Sorpresa revelada! ✨💖", "success");
        });
      });

      container.querySelectorAll(".btn-edit-note").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const note = window.storage.getNotes().find(n => n.id === id);
          if (note) this.openNoteModal(note);
        });
      });

      container.querySelectorAll(".btn-delete-note").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar esta nota del muro?")) {
            try {
              window.storage.deleteNote(id);
              this.renderNotes();
              this.renderDailyDashboard();
              window.Utils.showToast("Nota eliminada", "info");
            } catch (err) {
              window.Utils.showToast(err.message, "warning");
            }
          }
        });
      });
    }

    openNoteModal(n = null) {
      const modal = document.getElementById("modal-note");
      const currentUser = window.storage.getCurrentUser();
      const author = n ? n.author : currentUser;

      document.getElementById("note-id").value = n ? n.id : "";
      document.getElementById("note-author").value = author;
      document.getElementById("note-message").value = n ? n.message : "";

      // Insignia visual del autor
      const authorBadgeEl = document.getElementById("note-modal-author-badge");
      if (authorBadgeEl) {
        authorBadgeEl.textContent = author.charAt(0).toUpperCase();
        authorBadgeEl.className = "author-badge-circle " + (author.toLowerCase() === "wendy" ? "wendy" : "kevin");
      }
      const authorNameEl = document.getElementById("note-modal-author-name");
      if (authorNameEl) {
        authorNameEl.textContent = `${author} ${author.toLowerCase() === 'wendy' ? '👧🏻 (Patico ♥️)' : '👦🏻'}`;
      }

      // Estilo de papelito
      const styleVal = n && n.style ? n.style : "sunflower";
      const styleRadio = modal.querySelector(`input[name="note-style"][value="${styleVal}"]`);
      if (styleRadio) styleRadio.checked = true;

      // Sticker
      const stickerVal = n && n.sticker ? n.sticker : "";
      const stickerRadio = modal.querySelector(`input[name="note-sticker"][value="${stickerVal}"]`);
      if (stickerRadio) stickerRadio.checked = true;

      // Polaroid
      const photoInput = document.getElementById("note-photo-url");
      const photoPreviewWrap = document.getElementById("note-photo-preview-wrap");
      const photoPreviewImg = document.getElementById("note-photo-preview-img");
      if (photoInput) photoInput.value = n && n.photoUrl ? n.photoUrl : "";
      if (photoPreviewWrap && photoPreviewImg) {
        if (n && n.photoUrl) {
          photoPreviewImg.src = n.photoUrl;
          photoPreviewWrap.style.display = "block";
        } else {
          photoPreviewWrap.style.display = "none";
        }
      }

      // Pin
      const pinCheckbox = document.getElementById("note-is-pinned");
      if (pinCheckbox) pinCheckbox.checked = n && n.isPinned === true;

      // Nota de voz
      const voiceUrl = n && n.voiceNoteUrl ? n.voiceNoteUrl : "";
      const voiceDuration = n && n.voiceNoteDuration ? n.voiceNoteDuration : 0;
      const noteVoiceUrlInput = document.getElementById("note-voice-url");
      const noteVoiceDurInput = document.getElementById("note-voice-duration");
      if (noteVoiceUrlInput) noteVoiceUrlInput.value = voiceUrl;
      if (noteVoiceDurInput) noteVoiceDurInput.value = voiceDuration;
      const voicePreview = document.getElementById("note-voice-preview");
      const voiceAudioPlayer = document.getElementById("note-voice-audio-player");
      const deleteVoiceBtn = document.getElementById("btn-note-delete-audio");
      if (voiceUrl) {
        if (voiceAudioPlayer) voiceAudioPlayer.src = voiceUrl;
        if (voicePreview) voicePreview.style.display = "block";
        if (deleteVoiceBtn) deleteVoiceBtn.style.display = "inline-block";
      } else {
        if (voiceAudioPlayer) voiceAudioPlayer.src = "";
        if (voicePreview) voicePreview.style.display = "none";
        if (deleteVoiceBtn) deleteVoiceBtn.style.display = "none";
      }

      modal.classList.add("active");
    }

    // --- 9. Frasco de Sueños ---
    renderDreams() {
      const container = document.getElementById("dreams-list-container");
      const categoryFilter = document.getElementById("filter-dreams-category")?.value || "all";
      const statusFilter = document.getElementById("filter-dreams-status")?.value || "all";
      if (!container) return;

      let list = window.storage.getDreams();
      const total = list.length;
      const completed = list.filter(d => d.status === "Cumplido").length;
      const pending = total - completed;
      const pct = total > 0 ? (completed / total) * 100 : 0;

      document.getElementById("stat-dreams-total").textContent = window.Utils.formatNumberES(total);
      document.getElementById("stat-dreams-completed").textContent = window.Utils.formatNumberES(completed);
      document.getElementById("stat-dreams-pending").textContent = window.Utils.formatNumberES(pending);
      document.getElementById("stat-dreams-pct").textContent = window.Utils.formatDecimalES(pct, 2) + " %";

      // Render Luces y Estrellas en la cámara del frasco
      const jarStarsChamber = document.getElementById("jar-stars-chamber");
      if (jarStarsChamber) {
        const starCount = Math.min(Math.max(total, 6), 24);
        let starsHtml = '';
        for (let i = 0; i < starCount; i++) {
          const isGold = i < completed;
          const left = 12 + Math.random() * 76;
          const top = 15 + Math.random() * 70;
          const delay = (Math.random() * 3).toFixed(1);
          const size = 8 + Math.floor(Math.random() * 10);
          starsHtml += `<span class="jar-firefly ${isGold ? 'gold' : 'blue'}" style="left:${left}%; top:${top}%; width:${size}px; height:${size}px; animation-delay:${delay}s;"></span>`;
        }
        jarStarsChamber.innerHTML = starsHtml;
      }

      // Filtros
      if (categoryFilter !== "all") {
        list = list.filter(d => (d.category || '✨ General') === categoryFilter);
      }
      if (statusFilter !== "all") {
        list = list.filter(d => d.status === statusFilter);
      }

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 2rem;">No hay sueños que coincidan con estos filtros. ¡Añade un nuevo deseo arriba! ✨</div>`;
        return;
      }

      // Ordenar: pendientes con más deseo primero, luego cumplidos
      list.sort((a, b) => {
        if (a.status === 'Pendiente' && b.status === 'Cumplido') return -1;
        if (a.status === 'Cumplido' && b.status === 'Pendiente') return 1;
        return (b.desireLevel || 3) - (a.desireLevel || 3);
      });

      container.innerHTML = list.map(d => {
        const isComp = d.status === "Cumplido";
        const desireFires = '🔥'.repeat(Math.max(1, Math.min(3, d.desireLevel || 3)));
        const cat = d.category || '✨ General';

        return `
          <div class="glass-card dream-item-card ${isComp ? "completed" : ""}" data-id="${d.id}">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <span class="dream-category-badge">${window.Utils.sanitizeHTML(cat)}</span>
                <span class="dream-desire-badge" title="Nivel de Ilusión">${desireFires}</span>
              </div>

              <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <button type="button" class="btn-toggle-dream" data-id="${d.id}" title="${isComp ? 'Marcar como pendiente' : '¡Marcar como cumplido!'}" style="background: none; border: none; font-size: 1.6rem; cursor: pointer; padding: 0; line-height: 1;">
                  ${isComp ? "🌟" : "🌱"}
                </button>
                <div style="flex: 1; min-width: 0;">
                  <h3 class="dream-title-text ${isComp ? 'completed-text' : ''}">${window.Utils.sanitizeHTML(d.title)}</h3>
                  <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                    ${d.completedAt ? `🏆 Cumplido el ${window.Utils.formatDateES(d.completedAt)}` : `🌱 Guardado en el frasco`}
                    ${d.proposedBy ? ` · Propuesto por <strong>${window.Utils.sanitizeHTML(d.proposedBy)}</strong>` : ''}
                  </div>
                </div>
              </div>

              ${d.photo ? `
                <div class="dream-card-photo-box" data-photo="${window.Utils.sanitizeHTML(d.photo)}" data-title="${window.Utils.sanitizeHTML(d.title)}">
                  <img src="${window.Utils.sanitizeHTML(d.photo)}" alt="Foto de ${window.Utils.sanitizeHTML(d.title)}" class="dream-card-photo-img" onerror="this.parentElement.style.display='none'">
                  <span class="dream-photo-pill">📸 Ver foto del recuerdo ↗</span>
                </div>
              ` : ''}

              ${d.notes ? `
                <p class="dream-card-notes">💌 <em>"${window.Utils.sanitizeHTML(d.notes)}"</em></p>
              ` : ''}
            </div>

            <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; margin-top: 0.85rem; border-top: 1px solid rgba(185, 142, 230, 0.15); padding-top: 0.65rem;">
              ${!isComp ? `<button type="button" class="btn-primary btn-fulfill-quick" data-id="${d.id}" style="padding: 0.25rem 0.75rem; font-size: 0.78rem;">¡Cumplido! 🏆</button>` : ''}
              <button type="button" class="btn-secondary btn-edit-dream" data-id="${d.id}" style="padding: 0.25rem 0.65rem; font-size: 0.78rem;">✏️</button>
              <button type="button" class="btn-secondary btn-delete-dream" data-id="${d.id}" style="padding: 0.25rem 0.65rem; font-size: 0.78rem; color: var(--color-danger);">🗑️</button>
            </div>
          </div>
        `;
      }).join("");

      // Listeners
      container.querySelectorAll(".btn-toggle-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const dream = window.storage.getDreams().find(d => d.id === id);
          if (!dream) return;

          if (dream.status === 'Pendiente') {
            this.openFulfillDreamModal(dream);
          } else {
            dream.status = 'Pendiente';
            dream.completedAt = null;
            window.storage.saveDream(dream);
            this.renderDreams();
            this.renderDailyDashboard();
            window.Utils.showToast("Sueño devuelto a pendientes 🌱", "info");
          }
        });
      });

      container.querySelectorAll(".btn-fulfill-quick").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const dream = window.storage.getDreams().find(d => d.id === id);
          if (dream) this.openFulfillDreamModal(dream);
        });
      });

      container.querySelectorAll(".dream-card-photo-box").forEach(box => {
        box.addEventListener("click", (e) => {
          e.stopPropagation();
          const photoUrl = box.dataset.photo;
          const title = box.dataset.title || 'Sueño Cumplido';
          if (photoUrl) {
            this.openLightbox([photoUrl], 0, `🏆 ${title}`);
          }
        });
      });

      container.querySelectorAll(".btn-edit-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const dream = window.storage.getDreams().find(d => d.id === id);
          if (dream) this.openDreamModal(dream);
        });
      });

      container.querySelectorAll(".btn-delete-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar este sueño del frasco?")) {
            window.storage.deleteDream(id);
            this.renderDreams();
            this.renderDailyDashboard();
            window.Utils.showToast("Sueño eliminado", "info");
          }
        });
      });

      document.getElementById("filter-dreams-category")?.addEventListener("change", () => this.renderDreams());
      document.getElementById("filter-dreams-status")?.addEventListener("change", () => this.renderDreams());
    }

    openDreamModal(d = null) {
      const modal = document.getElementById("modal-dream");
      const titleEl = document.getElementById("modal-dream-title");
      titleEl.textContent = d && d.id ? "Editar Sueño 🌟" : "Nuevo Sueño ✨";

      document.getElementById("dream-id").value = d ? d.id : "";
      document.getElementById("dream-title").value = d ? d.title : "";
      document.getElementById("dream-category").value = d ? (d.category || "✈️ Viajes & Aventuras") : "✈️ Viajes & Aventuras";
      document.getElementById("dream-desire").value = d ? (d.desireLevel || "3") : "3";
      document.getElementById("dream-status").value = d ? d.status : "Pendiente";
      document.getElementById("dream-photo-data").value = d && d.photo ? d.photo : "";
      document.getElementById("dream-completed-date").value = d && d.completedAt ? d.completedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      document.getElementById("dream-notes").value = d && d.notes ? d.notes : "";

      const compFields = document.getElementById("dream-completion-fields");
      const previewWrap = document.getElementById("dream-photo-preview-wrap");
      const previewImg = document.getElementById("dream-photo-preview-img");

      if (d && d.status === "Cumplido") {
        compFields.style.display = "block";
        if (d.photo) {
          previewImg.src = d.photo;
          previewWrap.style.display = "block";
        } else {
          previewWrap.style.display = "none";
        }
      } else {
        compFields.style.display = "none";
        previewWrap.style.display = "none";
      }

      document.getElementById("dream-status").onchange = (e) => {
        compFields.style.display = e.target.value === "Cumplido" ? "block" : "none";
      };

      document.getElementById("dream-photo-input").onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const compressed = await window.Utils.compressImage(file, 1200, 0.85);
          document.getElementById("dream-photo-data").value = compressed;
          previewImg.src = compressed;
          previewWrap.style.display = "block";
        } catch (err) {
          console.error("Error cargando foto:", err);
        }
      };

      document.getElementById("btn-remove-dream-photo").onclick = () => {
        document.getElementById("dream-photo-data").value = "";
        document.getElementById("dream-photo-input").value = "";
        previewWrap.style.display = "none";
      };

      modal.classList.add("active");
    }

    openFulfillDreamModal(dream) {
      const modal = document.getElementById("modal-dream-fulfill");
      if (!modal || !dream) return;

      document.getElementById("fulfill-dream-id").value = dream.id;
      document.getElementById("fulfill-dream-photo-data").value = dream.photo || "";
      document.getElementById("fulfill-dream-title-display").textContent = `«${dream.title}»`;
      document.getElementById("fulfill-dream-date").value = new Date().toISOString().split('T')[0];
      document.getElementById("fulfill-dream-notes").value = dream.notes || "";

      const previewWrap = document.getElementById("fulfill-photo-preview-wrap");
      const previewImg = document.getElementById("fulfill-photo-preview-img");

      if (dream.photo) {
        previewImg.src = dream.photo;
        previewWrap.style.display = "block";
      } else {
        previewWrap.style.display = "none";
      }

      document.getElementById("fulfill-dream-photo-file").onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const compressed = await window.Utils.compressImage(file, 1200, 0.85);
          document.getElementById("fulfill-dream-photo-data").value = compressed;
          previewImg.src = compressed;
          previewWrap.style.display = "block";
        } catch (err) {
          console.error("Error comprimiendo foto de sueño cumplido:", err);
        }
      };

      modal.classList.add("active");
    }

    spinRoulette() {
      const modal = document.getElementById("modal-dream-roulette");
      const resultBox = document.getElementById("roulette-result-box");
      const titleEl = document.getElementById("roulette-dream-title");
      const catEl = document.getElementById("roulette-category-badge");
      const desireEl = document.getElementById("roulette-desire-badge");

      if (!modal) return;
      modal.classList.add("active");

      const dreams = window.storage.getDreams();
      let candidates = dreams.filter(d => d.status === "Pendiente");
      if (!candidates.length) candidates = dreams;

      if (!candidates.length) {
        resultBox.style.display = "block";
        titleEl.textContent = "¡Añade tu primer sueño al frasco! 🌟";
        catEl.textContent = "✨ Frasco vacío";
        desireEl.textContent = "";
        return;
      }

      resultBox.style.display = "none";
      setTimeout(() => {
        const randomDream = candidates[Math.floor(Math.random() * candidates.length)];
        titleEl.textContent = randomDream.title;
        catEl.textContent = randomDream.category || "✨ General";
        desireEl.textContent = '🔥'.repeat(randomDream.desireLevel || 3) + " Nivel de ilusión";
        resultBox.style.display = "block";
        window.Animations.triggerPetalRain();
      }, 500);
    }

    // --- 10. Gestión de Formularios y Modales ---
    initModals() {
      document.getElementById("btn-new-memory")?.addEventListener("click", () => this.openMemoryModal());
      document.getElementById("btn-new-song")?.addEventListener("click", () => document.getElementById("modal-song").classList.add("active"));
      document.getElementById("btn-new-movie")?.addEventListener("click", () => this.openMovieModal());
      document.getElementById("btn-new-series")?.addEventListener("click", () => this.openSeriesModal());
      document.getElementById("btn-new-note")?.addEventListener("click", () => this.openNoteModal());
      document.getElementById("btn-new-dream")?.addEventListener("click", () => this.openDreamModal());
      document.getElementById("btn-spin-dreams")?.addEventListener("click", () => this.spinRoulette());
      document.getElementById("btn-spin-again")?.addEventListener("click", () => this.spinRoulette());
      document.getElementById("btn-open-gdrive")?.addEventListener("click", () => {
        const defaultUrl = localStorage.getItem('patico_gdrive_main_url') || window.CONFIG.googleDrive?.folderUrl || "https://drive.google.com/drive/folders/1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm?usp=sharing";
        const inputUrl = document.getElementById("input-gdrive-folder-url");
        const openLink = document.getElementById("btn-open-gdrive-link");
        if (inputUrl) inputUrl.value = defaultUrl;
        if (openLink) openLink.href = defaultUrl;
        document.getElementById("modal-gdrive").classList.add("active");
      });

      document.getElementById("input-gdrive-folder-url")?.addEventListener("input", (e) => {
        const openLink = document.getElementById("btn-open-gdrive-link");
        if (openLink) openLink.href = e.target.value.trim() || "#";
      });

      document.getElementById("btn-save-gdrive-url")?.addEventListener("click", () => {
        const inputUrl = document.getElementById("input-gdrive-folder-url");
        const val = inputUrl ? inputUrl.value.trim() : "";
        if (val) {
          localStorage.setItem("patico_gdrive_main_url", val);
          window.Utils.showToast("Enlace de Google Drive guardado 📁✨", "success");
        }
        document.getElementById("modal-gdrive").classList.remove("active");
      });

      document.getElementById("btn-change-password")?.addEventListener("click", () => document.getElementById("modal-password").classList.add("active"));
      document.getElementById("music-search-form")?.addEventListener("submit", e => { e.preventDefault(); this.searchMusic(document.getElementById('music-search-input').value); });
      document.getElementById("movie-search-form")?.addEventListener("submit", e => { e.preventDefault(); this.searchMovies(document.getElementById('movie-search-input').value); });
      document.getElementById("series-search-form")?.addEventListener("submit", e => { e.preventDefault(); this.searchSeries(document.getElementById('series-search-input').value); });

      document.querySelectorAll("[data-close-modal]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const modalId = e.currentTarget.dataset.closeModal;
          document.getElementById(modalId)?.classList.remove("active");
        });
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
        }
      });

      // Controles del formulario de Recuerdos
      document.querySelectorAll(".btn-quick-date").forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.val;
          const dateInput = document.getElementById("mem-date");
          if (!dateInput) return;
          const now = new Date();
          if (type === "today") {
            dateInput.value = now.toISOString().split("T")[0];
          } else if (type === "yesterday") {
            now.setDate(now.getDate() - 1);
            dateInput.value = now.toISOString().split("T")[0];
          }
        });
      });

      document.getElementById("mem-cover-url")?.addEventListener("input", (e) => {
        this.updateCoverPreview(e.target.value.trim());
      });

      document.getElementById("mem-cover-file")?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewBox = document.getElementById("mem-cover-preview");
        if (previewBox) {
          previewBox.style.display = "block";
          previewBox.innerHTML = "<div style='color: var(--color-sunflower-gold); font-size: 0.85rem; padding: 0.5rem;'>Optimizando imagen... ⏳</div>";
        }
        try {
          const dataUrl = await window.Utils.compressImage(file, 1280, 0.8);
          this.driveCoverPayload = dataUrl;
          document.getElementById("mem-cover-url").value = dataUrl;
          this.updateCoverPreview(dataUrl);
        } catch (err) {
          console.error("Error procesando foto de portada:", err);
          window.Utils.showToast("Error al cargar la foto.", "error");
        }
      });

      document.getElementById("btn-add-gallery-item")?.addEventListener("click", () => {
        const input = document.getElementById("mem-gallery-item-input");
        const url = input ? input.value.trim() : "";
        if (!url) return;
        if (!this.modalGalleryItems) this.modalGalleryItems = [];
        this.modalGalleryItems.push(url);
        input.value = "";
        this.renderModalGallery();
      });

      document.getElementById("mem-gallery-file")?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (!this.modalGalleryItems) this.modalGalleryItems = [];
        if (!this.driveGalleryPayloads) this.driveGalleryPayloads = [];

        window.Utils.showToast(`Cargando ${files.length} foto(s)... ⏳`, "info", 1500);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            // Comprimir de forma ultra-rápida y ligera con ObjectURL
            const dataUrl = await window.Utils.compressImage(file, 1280, 0.8);
            if (dataUrl) {
              this.driveGalleryPayloads.push(dataUrl);
              this.modalGalleryItems.push(dataUrl);
              this.renderModalGallery();
            }
          } catch (err) {
            console.error("Error procesando foto de galería:", err);
          }
          // Pausa no bloqueante para mantener la UI fluida a 60fps
          await new Promise(r => setTimeout(r, 20));
        }
      });

      document.getElementById("form-memory")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : "Guardar recuerdo 🌻";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Guardando recuerdo… ⏳";
        }

        const coverVal = document.getElementById("mem-cover-url").value.trim();
        const isVideo = coverVal.match(/\.(mp4|webm|ogg|mov)$/i) || coverVal.startsWith("data:video/");
        const selectedColor = document.querySelector('input[name="mem-color"]:checked')?.value || "#F4C542";

        const songId = document.getElementById("mem-song-id").value;
        const songTitle = document.getElementById("mem-song-title").value;
        const songArtist = document.getElementById("mem-song-artist").value;
        const songCover = document.getElementById("mem-song-cover").value;
        const songAudioUrl = document.getElementById("mem-song-audio").value;

        const memData = {
          id: document.getElementById("mem-id").value || undefined,
          date: document.getElementById("mem-date").value,
          title: document.getElementById("mem-title").value.trim(),
          description: document.getElementById("mem-desc").value.trim(),
          color: selectedColor,
          coverMedia: coverVal,
          coverType: isVideo ? "video" : "image",
          gallery: this.modalGalleryItems || [],
          status: document.getElementById("mem-status").value,
          author: window.storage.getCurrentUser(),
          songId: songId || null,
          songTitle: songTitle || '',
          songArtist: songArtist || '',
          songCover: songCover || '',
          songAudioUrl: songAudioUrl || '',
          voiceNoteUrl: document.getElementById("mem-voice-url")?.value || '',
          voiceNoteDuration: parseInt(document.getElementById("mem-voice-duration")?.value, 10) || 0
        };

        const driveCover = this.driveCoverPayload || coverVal;
        const driveGallery = (this.driveGalleryPayloads && this.driveGalleryPayloads.length) ? [...this.driveGalleryPayloads] : [...(this.modalGalleryItems || [])];

        // 1. Guardar de inmediato en el teléfono para que aparezca en 0 segundos
        window.storage.saveMemory(memData);
        document.getElementById("modal-memory").classList.remove("active");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnHtml;
        }
        this.renderMemories();
        this.renderAnnualCalendar();
        this.renderDailyDashboard();
        window.Utils.showToast("¡Recuerdo guardado! 🌻 Respaldando en Google Drive en segundo plano... ✨", "success");

        // 2. Encolar subida a Google Drive en segundo plano
        if (window.GoogleDriveService && (driveCover || driveGallery.length)) {
          window.GoogleDriveService.uploadMemory(memData, driveCover, driveGallery);
        }
      });

      document.getElementById("form-series")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const currentUser = window.storage.getCurrentUser();
        const platformsInput = document.getElementById("series-platforms").value.trim();
        const platforms = platformsInput ? platformsInput.split(",").map(p => p.trim()).filter(Boolean) : ["Streaming"];

        const serieData = {
          id: document.getElementById("series-id").value || undefined,
          tmdbId: document.getElementById("series-tmdb-id").value || undefined,
          title: document.getElementById("series-title").value.trim(),
          genre: document.getElementById("series-genre")?.value.trim() || '',
          poster: document.getElementById("series-poster").value.trim(),
          year: parseInt(document.getElementById("series-year").value, 10) || new Date().getFullYear(),
          seasonsCount: parseInt(document.getElementById("series-seasons-count").value, 10) || 1,
          status: document.getElementById("series-status").value,
          proposedBy: document.getElementById("series-proposed").value || currentUser,
          platforms: platforms,
          imdbRating: document.getElementById("series-imdb-score").value.trim(),
          synopsis: document.getElementById("series-synopsis").value.trim()
        };

        window.storage.saveSeries(serieData);
        document.getElementById("modal-series").classList.remove("active");
        this.renderSeries();
        this.renderDailyDashboard();
        window.Utils.showToast("¡Serie guardada! 📺🍿", "success");
      });

      document.getElementById("form-password")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const ok = await window.storage.changePassword(
          window.storage.getCurrentUser(),
          document.getElementById('current-password').value,
          document.getElementById('new-password').value
        );
        if (!ok) {
          window.Utils.showToast('La contraseña actual no coincide.', 'error');
          return;
        }
        document.getElementById('modal-password').classList.remove('active');
        e.currentTarget.reset();
        window.Utils.showToast('Contraseña actualizada.', 'success');
      });

      document.getElementById("form-song")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById('song-id').value;
        const title = document.getElementById('song-title').value.trim();
        const artist = document.getElementById('song-artist').value.trim();
        const cover = document.getElementById('song-cover').value.trim();
        const lyrics = document.getElementById('song-lyrics').value.trim();
        const spotifyUrl = document.getElementById('song-spotify').value.trim() || window.MediaService.spotifyUrl(title, artist);
        const youtubeUrl = document.getElementById('song-youtube').value.trim() || window.MediaService.youtubeUrl(title, artist);
        const proposedBy = document.getElementById('song-proposed').value || window.storage.getCurrentUser();
        const kevinRating = parseInt(document.getElementById('song-kevin-score')?.value, 10) || 5;
        const wendyRating = parseInt(document.getElementById('song-wendy-score')?.value, 10) || 0;

        window.storage.saveSong({
          id: id || undefined,
          title,
          artist,
          cover,
          lyrics,
          spotifyUrl,
          youtubeUrl,
          lyricsUrl: window.MediaService.geniusUrl(artist, title),
          proposedBy,
          kevinRating,
          wendyRating
        });

        document.getElementById('modal-song').classList.remove('active');
        e.currentTarget.reset();
        this.renderSongs();
        this.renderDailyDashboard();
        window.Utils.showToast('Canción guardada 🎵', 'success');
      });

      document.getElementById("form-movie")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const currentUser = window.storage.getCurrentUser();
        const movieData = {
          id: document.getElementById("movie-id").value,
          title: document.getElementById("movie-title").value.trim(),
          genre: document.getElementById("movie-genre")?.value.trim() || '',
          poster: document.getElementById("movie-poster").value.trim(),
          year: document.getElementById("movie-year").value,
          proposedBy: document.getElementById("movie-proposed").value || currentUser,
          priority: document.getElementById("movie-priority").value,
          status: document.getElementById("movie-status").value,
          platforms: document.getElementById("movie-platforms").value.trim(),
          imdbRating: document.getElementById("movie-imdb-score").value.trim(),
          imdbUrl: document.getElementById("movie-imdb-url").value.trim(),
          synopsis: document.getElementById("movie-synopsis").value.trim(),
          kevinRating: parseInt(document.getElementById("movie-kevin-score")?.value, 10) || 5,
          wendyRating: parseInt(document.getElementById("movie-wendy-score")?.value, 10) || 0
        };
        window.storage.saveMovie(movieData);
        document.getElementById("modal-movie").classList.remove("active");
        this.renderMovies();
        this.renderDailyDashboard();
        window.Utils.showToast("Película guardada en la biblioteca 🎬", "success");
      });

      // Controles de foto polaroid para notas
      const notePhotoUrlInput = document.getElementById("note-photo-url");
      const notePhotoFileInput = document.getElementById("note-photo-file");
      const notePhotoPreviewWrap = document.getElementById("note-photo-preview-wrap");
      const notePhotoPreviewImg = document.getElementById("note-photo-preview-img");

      notePhotoUrlInput?.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (notePhotoPreviewWrap && notePhotoPreviewImg) {
          if (val) {
            notePhotoPreviewImg.src = val;
            notePhotoPreviewWrap.style.display = "block";
          } else {
            notePhotoPreviewWrap.style.display = "none";
          }
        }
      });

      notePhotoFileInput?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const dataUrl = await window.Utils.compressImage(file, 1000, 0.8);
          if (notePhotoUrlInput) notePhotoUrlInput.value = dataUrl;
          if (notePhotoPreviewWrap && notePhotoPreviewImg) {
            notePhotoPreviewImg.src = dataUrl;
            notePhotoPreviewWrap.style.display = "block";
          }
        } catch (err) {
          console.error("Error cargando foto en nota:", err);
        }
      });

      document.getElementById("form-note")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const selectedStyle = document.querySelector('input[name="note-style"]:checked')?.value || "sunflower";
        const selectedSticker = document.querySelector('input[name="note-sticker"]:checked')?.value || "";
        const photoUrl = document.getElementById("note-photo-url")?.value.trim() || "";
        const isPinned = document.getElementById("note-is-pinned")?.checked || false;

        const noteData = {
          id: document.getElementById("note-id").value || undefined,
          author: document.getElementById("note-author").value,
          message: document.getElementById("note-message").value.trim(),
          style: selectedStyle,
          sticker: selectedSticker,
          photoUrl: photoUrl,
          isPinned: isPinned,
          voiceNoteUrl: document.getElementById("note-voice-url")?.value || "",
          voiceNoteDuration: parseInt(document.getElementById("note-voice-duration")?.value, 10) || 0
        };

        try {
          window.storage.saveNote(noteData);
          document.getElementById("modal-note").classList.remove("active");
          this.renderNotes();
          this.renderDailyDashboard();
          window.Utils.showToast("¡Nota publicada en el muro! 💌✨", "success");
        } catch (err) {
          window.Utils.showToast(err.message, "warning");
        }
      });

      document.getElementById("form-dream")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const dreamId = document.getElementById("dream-id").value;
        const title = document.getElementById("dream-title").value.trim();
        const category = document.getElementById("dream-category").value;
        const desireLevel = parseInt(document.getElementById("dream-desire").value, 10) || 3;
        const status = document.getElementById("dream-status").value;
        const photoData = document.getElementById("dream-photo-data").value;
        const completedDate = document.getElementById("dream-completed-date").value;
        const notes = document.getElementById("dream-notes").value.trim();

        const dreamData = {
          id: dreamId || undefined,
          title: title,
          category: category,
          desireLevel: desireLevel,
          status: status,
          photo: photoData,
          completedAt: status === "Cumplido" ? (completedDate || new Date().toISOString()) : null,
          notes: notes
        };

        window.storage.saveDream(dreamData);
        document.getElementById("modal-dream").classList.remove("active");
        this.renderDreams();
        this.renderDailyDashboard();
        window.Utils.showToast("Sueño guardado en el frasco ✨", "success");

        // Subir foto a Google Drive /Frasco de Sueños en segundo plano
        if (status === "Cumplido" && photoData && window.GoogleDriveService) {
          window.GoogleDriveService.uploadDreamPhoto(title, completedDate, photoData);
        }
      });

      document.getElementById("form-dream-fulfill")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const dreamId = document.getElementById("fulfill-dream-id").value;
        const photoData = document.getElementById("fulfill-dream-photo-data").value;
        const completedDate = document.getElementById("fulfill-dream-date").value || new Date().toISOString().split('T')[0];
        const notes = document.getElementById("fulfill-dream-notes").value.trim();

        const dreams = window.storage.getDreams();
        const dream = dreams.find(d => d.id === dreamId);
        if (!dream) return;

        dream.status = "Cumplido";
        dream.completedAt = completedDate;
        if (photoData) dream.photo = photoData;
        if (notes) dream.notes = notes;

        window.storage.saveDream(dream);
        document.getElementById("modal-dream-fulfill").classList.remove("active");
        this.renderDreams();
        this.renderDailyDashboard();
        window.Animations.triggerPetalRain();
        window.Utils.showToast("¡Felicidades! Logro cumplido y respaldado en Google Drive 🏆🌟", "success");

        // Subir foto a Google Drive /Frasco de Sueños en segundo plano
        if (photoData && window.GoogleDriveService) {
          window.GoogleDriveService.uploadDreamPhoto(dream.title, completedDate, photoData);
        }
      });
    }

    initProfilesModal() {
      const modal = document.getElementById('modal-profiles');
      const form = document.getElementById('form-profiles');
      if (!modal || !form) return;

      const kevinNicknameInput = document.getElementById('profile-kevin-nickname');
      const kevinUrlInput = document.getElementById('profile-kevin-avatar-url');
      const kevinFileInput = document.getElementById('profile-kevin-avatar-file');
      const kevinPreviewImg = document.getElementById('kevin-avatar-preview-img');
      const kevinPreviewFallback = document.getElementById('kevin-avatar-preview-fallback');

      const wendyNicknameInput = document.getElementById('profile-wendy-nickname');
      const wendyUrlInput = document.getElementById('profile-wendy-avatar-url');
      const wendyFileInput = document.getElementById('profile-wendy-avatar-file');
      const wendyPreviewImg = document.getElementById('wendy-avatar-preview-img');
      const wendyPreviewFallback = document.getElementById('wendy-avatar-preview-fallback');

      let kevinAvatarData = '';
      let wendyAvatarData = '';

      const populateModal = () => {
        const profiles = window.storage.getProfiles();
        if (kevinNicknameInput) kevinNicknameInput.value = profiles.Kevin?.nickname || 'Kevin';
        if (kevinUrlInput) kevinUrlInput.value = profiles.Kevin?.avatar?.startsWith('data:') ? '' : (profiles.Kevin?.avatar || '');
        kevinAvatarData = profiles.Kevin?.avatar || '';
        if (kevinAvatarData) {
          if (kevinPreviewImg) {
            kevinPreviewImg.src = kevinAvatarData;
            kevinPreviewImg.style.display = 'block';
          }
          if (kevinPreviewFallback) kevinPreviewFallback.style.display = 'none';
        } else {
          if (kevinPreviewImg) kevinPreviewImg.style.display = 'none';
          if (kevinPreviewFallback) {
            kevinPreviewFallback.style.display = 'flex';
            kevinPreviewFallback.textContent = profiles.Kevin?.nickname ? profiles.Kevin.nickname.charAt(0).toUpperCase() : 'K';
          }
        }

        if (wendyNicknameInput) wendyNicknameInput.value = profiles.Wendy?.nickname || 'Patico ♥️';
        if (wendyUrlInput) wendyUrlInput.value = profiles.Wendy?.avatar?.startsWith('data:') ? '' : (profiles.Wendy?.avatar || '');
        wendyAvatarData = profiles.Wendy?.avatar || '';
        if (wendyAvatarData) {
          if (wendyPreviewImg) {
            wendyPreviewImg.src = wendyAvatarData;
            wendyPreviewImg.style.display = 'block';
          }
          if (wendyPreviewFallback) wendyPreviewFallback.style.display = 'none';
        } else {
          if (wendyPreviewImg) wendyPreviewImg.style.display = 'none';
          if (wendyPreviewFallback) {
            wendyPreviewFallback.style.display = 'flex';
            wendyPreviewFallback.textContent = profiles.Wendy?.nickname ? profiles.Wendy.nickname.charAt(0).toUpperCase() : 'W';
          }
        }
      };

      document.getElementById('btn-open-profiles')?.addEventListener('click', () => {
        populateModal();
        modal.classList.add('active');
      });

      document.getElementById('whatsapp-presence-bar')?.addEventListener('click', () => {
        populateModal();
        modal.classList.add('active');
      });

      kevinUrlInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          kevinAvatarData = val;
          if (kevinPreviewImg) {
            kevinPreviewImg.src = val;
            kevinPreviewImg.style.display = 'block';
          }
          if (kevinPreviewFallback) kevinPreviewFallback.style.display = 'none';
        }
      });

      kevinFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            kevinAvatarData = evt.target.result;
            if (kevinPreviewImg) {
              kevinPreviewImg.src = kevinAvatarData;
              kevinPreviewImg.style.display = 'block';
            }
            if (kevinPreviewFallback) kevinPreviewFallback.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      });

      wendyUrlInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          wendyAvatarData = val;
          if (wendyPreviewImg) {
            wendyPreviewImg.src = val;
            wendyPreviewImg.style.display = 'block';
          }
          if (wendyPreviewFallback) wendyPreviewFallback.style.display = 'none';
        }
      });

      wendyFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            wendyAvatarData = evt.target.result;
            if (wendyPreviewImg) {
              wendyPreviewImg.src = wendyAvatarData;
              wendyPreviewImg.style.display = 'block';
            }
            if (wendyPreviewFallback) wendyPreviewFallback.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          Kevin: {
            nickname: (kevinNicknameInput?.value || '').trim() || 'Kevin',
            avatar: kevinAvatarData
          },
          Wendy: {
            nickname: (wendyNicknameInput?.value || '').trim() || 'Patico ♥️',
            avatar: wendyAvatarData
          }
        };

        window.storage.saveProfiles(updated);
        modal.classList.remove('active');
        this.initWhatsAppPresenceUI();
        this.renderDailyDashboard();
        window.Utils.showToast('¡Perfiles y apodos actualizados! 💖🌻', 'success');
      });
    }

    initNudgeFeature() {
      document.getElementById('btn-send-nudge')?.addEventListener('click', () => {
        const currentUser = window.storage.getCurrentUser();
        const profiles = window.storage.getProfiles();
        const otherUser = currentUser.toLowerCase() === 'wendy' ? 'Kevin' : 'Wendy';
        const otherNickname = profiles[otherUser]?.nickname || otherUser;

        window.storage.sendNudge();
        window.Utils.showToast(`¡Le enviaste un toquecito de amor a ${otherNickname}! 🌻💖`, 'success');

        if (window.confetti) {
          window.confetti({
            particleCount: 45,
            spread: 70,
            origin: { y: 0.15 },
            colors: ['#F4C542', '#E040FB', '#00E5FF', '#FF4081']
          });
        }
      });
    }

    // --- 7. Sistema Interactivo Patico Wrapped 🌻 ---
    initWrappedSystem() {
      this.initChaptersTabs();
      this.initWrappedStories();
      this.initCounterAnimations();
    }

    initChaptersTabs() {
      const tabs = document.querySelectorAll("#chapters-nav-tabs .chapter-tab-btn");
      const display = document.getElementById("chapter-active-display");
      if (!tabs.length || !display) return;

      const chaptersData = {
        1: {
          title: "Capítulo 1 — El reencuentro",
          dates: "20 noviembre – diciembre 2024",
          count: "~3.361 mensajes",
          desc: "Todo comienza cuando Kevin recupera contacto con Wendy después del robo de su celular. Los primeros días están llenos de saludos, preguntas simples y la sensación de volver a conocerse. En esta etapa aparecen los primeros audios largos y los chismes que terminarían siendo una tradición.",
          quote: "«Todo comenzó con un simple “Holi”.»"
        },
        2: {
          title: "Capítulo 2 — La confianza",
          dates: "enero – abril 2025",
          count: "~3.000 mensajes",
          desc: "La conversación deja de depender de una excusa. Empiezan a llamarse “lindo”, comparten fotografías de su día, hablan de vacaciones, familia, universidad, trabajo y comienzan a mostrar espacios personales de su vida cotidiana.",
          quote: "«Ya no hablaban para responder; hablaban para compartir.»"
        },
        3: {
          title: "Capítulo 3 — Conversaciones reales",
          dates: "julio – diciembre 2025",
          count: "~11.680 mensajes",
          desc: "Es la etapa con mayor crecimiento del chat. Ambos empiezan a compartir preocupaciones, estrés, problemas laborales y emociones personales. La confianza alcanza su punto más alto y las conversaciones dejan de ser superficiales para convertirse en un espacio de apoyo mutuo.",
          quote: "«La confianza ya no estaba en los saludos. Estaba en contar lo difícil.»"
        },
        4: {
          title: "Capítulo 4 — La rutina bonita",
          dates: "enero – agosto 2026",
          count: "~7.337 mensajes",
          desc: "Hablar se convierte en parte del día. Ya no existen silencios incómodos ni motivos específicos para escribir. Los mensajes aparecen simplemente porque el otro forma parte de la rutina.",
          quote: "«Algunas personas llegan. Otras terminan haciendo parte de los días normales.»"
        }
      };

      tabs.forEach(btn => {
        btn.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          btn.classList.add("active");
          const chId = btn.dataset.chapter;
          const data = chaptersData[chId];
          if (!data) return;

          display.style.opacity = "0";
          display.style.transform = "translateY(8px)";
          setTimeout(() => {
            display.innerHTML = `
              <div class="chapter-badge-dates">${data.dates}</div>
              <span class="chapter-msg-count">${data.count}</span>
              <h3 class="chapter-title">${data.title}</h3>
              <p class="chapter-desc">${data.desc}</p>
              <div class="chapter-quote">${data.quote}</div>
            `;
            display.style.transition = "all 0.3s ease";
            display.style.opacity = "1";
            display.style.transform = "translateY(0)";
          }, 200);
        });
      });
    }

    initWrappedStories() {
      const modal = document.getElementById("modal-wrapped-story");
      const btnOpen = document.getElementById("btn-open-story-mode");
      const btnClose = document.getElementById("btn-close-story");
      const progressContainer = document.getElementById("story-progress-bars");
      const viewport = document.getElementById("story-viewport");
      const indexLabel = document.getElementById("story-slide-index-label");
      const btnPrev = document.getElementById("btn-story-prev");
      const btnNext = document.getElementById("btn-story-next");
      const btnPause = document.getElementById("btn-story-pause");
      const touchPrev = document.getElementById("story-touch-prev");
      const touchNext = document.getElementById("story-touch-next");

      if (!modal || !btnOpen) return;

      const slides = [
        {
          tag: "🏛️ ATRIA · 2024 - 2026",
          icon: "🏛️",
          title: "Nuestra Historia en Números",
          bigNumber: "25.378",
          unit: "mensajes intercambiados",
          narrative: "«Durante 648 días, dos personas construyeron una historia de 25.378 mensajes. No es una conversación cualquiera; es un diario escrito entre risas, chismes, audios y pequeños momentos cotidianos.»",
          footerInfo: "20 nov 2024 – 29 ago 2026 · 648 días"
        },
        {
          tag: "⚖️ Participación de Cada Uno",
          icon: "💬",
          title: "El Ritmo de la Conversación",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin: 1rem 0;">
              <div class="participant-box kevin">
                <div class="participant-name kevin-name">Kevin Gómez</div>
                <div class="participant-pct">56,9%</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">14.428 msgs<br><strong>43.198 palabras</strong></div>
              </div>
              <div class="participant-box wendy">
                <div class="participant-name wendy-name">Wendy (Patico ♥️)</div>
                <div class="participant-pct">43,1%</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">10.950 msgs<br><strong>41.403 palabras</strong></div>
              </div>
            </div>
            <div class="insight-highlight-box" style="margin-top: 0.5rem; text-align: left;">
              💡 Aunque Kevin envió 3.478 mensajes más, la diferencia final fue de tan solo <strong>1.795 palabras</strong>.
            </div>
          `,
          narrative: "«Kevin habla más veces. Wendy habla casi igual de profundo.»",
          footerInfo: "84.601 palabras totales escritas"
        },
        {
          tag: "⚡ Velocidad de Respuesta",
          icon: "⏱️",
          title: "Siempre Presentes",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin: 1rem 0;">
              <div class="speed-card">
                <div class="speed-val">1 min</div>
                <div class="speed-label">Mediana Kevin 👦🏻</div>
              </div>
              <div class="speed-card">
                <div class="speed-val">3 min</div>
                <div class="speed-label">Mediana Wendy 👧🏻</div>
              </div>
            </div>
          `,
          narrative: "«Cuando alguno escribía, el otro casi siempre estaba ahí. En conversación activa, el chat funcionaba prácticamente en tiempo real.»",
          footerInfo: "Promedio general: 75 min (incluye noches y jornadas)"
        },
        {
          tag: "📖 Capítulo 1 · El reencuentro",
          icon: "🌱",
          title: "El Reencuentro",
          dates: "20 nov – dic 2024 · ~3.361 mensajes",
          bodyText: "Todo comenzó cuando Kevin recuperó contacto con Wendy después del robo de su celular. Los primeros días estuvieron llenos de saludos, preguntas simples y volver a conocerse con los primeros audios y chismes.",
          narrative: "«Todo comenzó con un simple “Holi”.»",
          footerInfo: "El inicio de una nueva etapa"
        },
        {
          tag: "🤝 Capítulo 2 · La confianza",
          icon: "🌷",
          title: "La Confianza",
          dates: "ene – abr 2025 · ~3.000 mensajes",
          bodyText: "La conversación dejó de necesitar excusas. Comenzaron a llamarse “lindo”, compartir fotos cotidianas, hablar de vacaciones, familia, universidad y trabajo.",
          narrative: "«Ya no hablaban para responder; hablaban para compartir.»",
          footerInfo: "Primeros espacios personales compartidos"
        },
        {
          tag: "💖 Capítulo 3 · Conversaciones reales",
          icon: "🌊",
          title: "Conversaciones Reales",
          dates: "jul – dic 2025 · ~11.680 mensajes",
          bodyText: "La etapa de mayor crecimiento del chat. Compartieron preocupaciones, estrés, problemas del trabajo y emociones personales. Un espacio incondicional de apoyo mutuo.",
          narrative: "«La confianza ya no estaba en los saludos. Estaba en contar lo difícil.»",
          footerInfo: "Pico de actividad y cercanía emocional"
        },
        {
          tag: "🏡 Capítulo 4 · La rutina bonita",
          icon: "✨",
          title: "La Rutina Bonita",
          dates: "ene – ago 2026 · ~7.337 mensajes",
          bodyText: "Hablar se convirtió en parte del día. Ya no existían silencios incómodos ni motivos forzados para escribir. Los mensajes aparecieron simplemente porque el otro hacía parte de la vida.",
          narrative: "«Algunas personas llegan. Otras terminan haciendo parte de los días normales.»",
          footerInfo: "Compañía cotidiana"
        },
        {
          tag: "👑 Récords del Chat",
          icon: "🔥",
          title: "El Día Más Activo de la Historia",
          bigNumber: "872",
          unit: "mensajes en un solo día",
          dates: "28 de agosto de 2026",
          narrative: "«Hubo días donde dejaron de usar WhatsApp como una aplicación… y prácticamente vivieron dentro del chat.»",
          footerInfo: "Top días: 2 dic 2025 (414 msgs) · 27 ago 2026 (405 msgs)"
        },
        {
          tag: "💬 Identidad & Lo de Siempre",
          icon: "🗣️",
          title: "El Sello de la Conversación",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin: 0.75rem 0;">
              <div class="identity-col" style="padding: 0.8rem; text-align: left;">
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-lilac); margin-bottom: 0.35rem;">👦🏻 Kevin</div>
                <div style="font-size: 0.85rem; color: var(--color-text-main);">Holi · JSJSJS · Chisme · Parce · :3</div>
              </div>
              <div class="identity-col" style="padding: 0.8rem; text-align: left;">
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-sunflower-gold); margin-bottom: 0.35rem;">👧🏻 Wendy</div>
                <div style="font-size: 0.85rem; color: var(--color-text-main);">Holap · Jummm · Lindo · Pjs · 💁🏻‍♀️</div>
              </div>
            </div>
            <div class="top-phrase-spotlight" style="padding: 0.9rem; margin-top: 0.5rem;">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-secondary);">Pregunta más repetida:</div>
              <div style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 700; color: var(--color-sunflower-gold);">“¿Cómo estás?”</div>
            </div>
          `,
          narrative: "«Algunas conversaciones se escribieron con palabras. Otras duraron más de un minuto en un audio.»",
          footerInfo: "3.729 archivos multimedia compartidos"
        },
        {
          tag: "💛 El Dato Más Bonito",
          icon: "🌻",
          title: "Dos Voces, Una Misma Historia",
          customHtml: `
            <div style="margin: 1.2rem 0;">
              <div style="font-family: var(--font-numbers); font-size: 1.5rem; font-weight: 700; color: var(--color-sunflower-gold);">
                43.198 palabras <span style="color: var(--color-lilac); font-weight: 300;">vs</span> 41.403 palabras
              </div>
            </div>
          `,
          narrative: "«Kevin envió miles de mensajes más. Wendy escribió casi la misma cantidad de palabras. Dos maneras distintas de conversar que terminaron construyendo exactamente la misma historia.»",
          footerInfo: "648 días · 25.378 mensajes · Una historia infinita 🌻"
        }
      ];

      let currentIndex = 0;
      let isPaused = false;
      let timerId = null;
      const slideDuration = 6500; // ms

      const renderProgressBar = () => {
        progressContainer.innerHTML = slides.map((_, i) => `
          <div class="story-progress-segment ${i < currentIndex ? 'completed' : ''}" id="story-seg-${i}">
            <div class="story-progress-segment-fill" id="story-seg-fill-${i}" style="width: ${i < currentIndex ? '100%' : '0%'};"></div>
          </div>
        `).join("");
      };

      const renderSlide = (index) => {
        currentIndex = index;
        const slide = slides[index];
        indexLabel.textContent = `${index + 1}/${slides.length}`;

        renderProgressBar();

        viewport.classList.remove("slide-animating");
        void viewport.offsetWidth;
        viewport.classList.add("slide-animating");

        viewport.innerHTML = `
          <div class="wrapped-card-tag" style="margin-bottom: 0.75rem;">${slide.tag}</div>
          <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">${slide.icon}</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-sunflower-gold); margin-bottom: 0.5rem; line-height: 1.2;">
            ${slide.title}
          </h2>
          
          ${slide.dates ? `<div style="font-family: var(--font-numbers); font-size: 0.85rem; color: var(--color-lilac); margin-bottom: 0.5rem;">${slide.dates}</div>` : ''}
          ${slide.bigNumber ? `
            <div style="margin: 0.85rem 0;">
              <span class="giant-number" style="font-size: 3.5rem;">${slide.bigNumber}</span>
              <div style="font-size: 0.95rem; color: var(--color-light-yellow);">${slide.unit || ''}</div>
            </div>
          ` : ''}
          ${slide.customHtml ? slide.customHtml : ''}
          ${slide.bodyText ? `<p style="font-size: 0.92rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0.75rem 0;">${slide.bodyText}</p>` : ''}
          ${slide.narrative ? `
            <div style="font-family: var(--font-heading); font-style: italic; font-size: 1.18rem; color: var(--color-text-main); margin-top: 0.9rem; line-height: 1.4; border-left: 2px solid var(--color-sunflower-gold); padding-left: 0.75rem; text-align: left;">
              ${slide.narrative}
            </div>
          ` : ''}
          ${slide.footerInfo ? `
            <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 1.2rem;">
              ${slide.footerInfo}
            </div>
          ` : ''}
        `;

        startProgressTimer();
      };

      const startProgressTimer = () => {
        if (timerId) clearInterval(timerId);
        if (isPaused) return;

        const currentFill = document.getElementById(`story-seg-fill-${currentIndex}`);
        let startTime = Date.now();

        timerId = setInterval(() => {
          if (isPaused) {
            startTime += 50;
            return;
          }
          const elapsed = Date.now() - startTime;
          const pct = Math.min((elapsed / slideDuration) * 100, 100);
          if (currentFill) currentFill.style.width = `${pct}%`;

          if (elapsed >= slideDuration) {
            clearInterval(timerId);
            if (currentIndex < slides.length - 1) {
              renderSlide(currentIndex + 1);
            } else {
              closeStory();
            }
          }
        }, 30);
      };

      const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
          renderSlide(currentIndex + 1);
        } else {
          closeStory();
        }
      };

      const prevSlide = () => {
        if (currentIndex > 0) {
          renderSlide(currentIndex - 1);
        } else {
          renderSlide(0);
        }
      };

      const togglePause = () => {
        isPaused = !isPaused;
        btnPause.textContent = isPaused ? "▶ Reanudar" : "⏸ Pausar";
      };

      const openStory = () => {
        modal.classList.add("active");
        currentIndex = 0;
        isPaused = false;
        btnPause.textContent = "⏸ Pausar";
        renderSlide(0);
      };

      const closeStory = () => {
        modal.classList.remove("active");
        if (timerId) clearInterval(timerId);
      };

      btnOpen.addEventListener("click", openStory);
      btnClose.addEventListener("click", closeStory);
      btnNext.addEventListener("click", nextSlide);
      btnPrev.addEventListener("click", prevSlide);
      btnPause.addEventListener("click", togglePause);
      touchNext.addEventListener("click", nextSlide);
      touchPrev.addEventListener("click", prevSlide);

      window.addEventListener("keydown", (e) => {
        if (!modal.classList.contains("active")) return;
        if (e.key === "Escape") closeStory();
        if (e.key === "ArrowRight" || e.key === " ") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
      });
    }

    initLightbox() {
      this.lightboxItems = [];
      this.lightboxIndex = 0;
      this.lightboxTitle = "";

      const modal = document.getElementById("modal-lightbox-viewer");
      const btnClose = document.getElementById("btn-close-lightbox");
      const btnPrev = document.getElementById("btn-lightbox-prev");
      const btnNext = document.getElementById("btn-lightbox-next");

      if (!modal) return;

      btnClose?.addEventListener("click", () => {
        modal.classList.remove("active");
        const vp = document.getElementById("lightbox-viewport");
        if (vp) vp.innerHTML = "";
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
          const vp = document.getElementById("lightbox-viewport");
          if (vp) vp.innerHTML = "";
        }
      });

      btnPrev?.addEventListener("click", () => {
        if (!this.lightboxItems || this.lightboxItems.length === 0) return;
        this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxItems.length) % this.lightboxItems.length;
        this.renderLightboxCurrent();
      });

      btnNext?.addEventListener("click", () => {
        if (!this.lightboxItems || this.lightboxItems.length === 0) return;
        this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxItems.length;
        this.renderLightboxCurrent();
      });

      window.addEventListener("keydown", (e) => {
        if (!modal.classList.contains("active")) return;
        if (e.key === "ArrowLeft") btnPrev?.click();
        if (e.key === "ArrowRight") btnNext?.click();
        if (e.key === "Escape") btnClose?.click();
      });
    }

    openLightbox(items = [], startIndex = 0, title = "Recuerdo") {
      const modal = document.getElementById("modal-lightbox-viewer");
      if (!modal || !items.length) return;

      this.lightboxItems = items;
      this.lightboxIndex = Math.max(0, Math.min(startIndex, items.length - 1));
      this.lightboxTitle = title;

      modal.classList.add("active");
      this.renderLightboxCurrent();
    }

    renderLightboxCurrent() {
      const vp = document.getElementById("lightbox-viewport");
      const counterEl = document.getElementById("lightbox-counter");
      const titleEl = document.getElementById("lightbox-caption-title");
      const btnPrev = document.getElementById("btn-lightbox-prev");
      const btnNext = document.getElementById("btn-lightbox-next");

      if (!vp) return;

      const itemUrl = this.lightboxItems[this.lightboxIndex];
      if (!itemUrl) return;
      const isVideo = itemUrl.match(/\.(mp4|webm|ogg|mov)$/i) || itemUrl.startsWith("data:video/");

      if (isVideo) {
        vp.innerHTML = `<video src="${window.Utils.sanitizeHTML(itemUrl)}" controls autoplay style="max-height: 80vh; max-width: 90vw; border-radius: 12px;"></video>`;
      } else {
        vp.innerHTML = `<img src="${window.Utils.sanitizeHTML(itemUrl)}" alt="Foto en alta resolución" style="max-height: 80vh; max-width: 90vw; border-radius: 12px; object-fit: contain;">`;
      }

      if (titleEl) titleEl.textContent = this.lightboxTitle;
      if (counterEl) counterEl.textContent = `${this.lightboxIndex + 1} / ${this.lightboxItems.length}`;

      if (btnPrev && btnNext) {
        btnPrev.style.display = this.lightboxItems.length > 1 ? "flex" : "none";
        btnNext.style.display = this.lightboxItems.length > 1 ? "flex" : "none";
      }
    }

    // ========================================================
    // --- 10. PREGUNTA DIARIA DE PAREJA CON CANDADO 💌✨ ---
    // ========================================================

    initDailyPrompt() {
      this.renderDailyPromptWidget();
    }

    renderDailyPromptWidget() {
      const container = document.getElementById('daily-prompt-card');
      if (!container) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = window.storage.getDailyPrompt(todayStr);
      const currentUser = window.storage.getCurrentUser();
      const isWendy = currentUser.toLowerCase() === 'wendy';
      const myAnswer = isWendy ? prompt.wendyAnswer : prompt.kevinAnswer;
      const partnerAnswer = isWendy ? prompt.kevinAnswer : prompt.wendyAnswer;
      const partnerName = isWendy ? 'Kevin' : 'Wendy';
      const partnerInitial = partnerName.charAt(0);
      const partnerClass = partnerName.toLowerCase();
      const myInitial = currentUser.charAt(0).toUpperCase();
      const myClass = currentUser.toLowerCase();

      const isBothAnswered = Boolean(prompt.kevinAnswer && prompt.wendyAnswer);

      let contentHtml = '';

      if (isBothAnswered) {
        // AMBOS RESPONDIERON -> REVELADO TOTAL CON CONFETI
        contentHtml = `
          <div class="daily-prompt-revealed-wrap">
            <div class="daily-prompt-header">
              <div class="daily-prompt-badge">
                <span class="prompt-star">✨</span>
                <span>Pregunta del Día · ¡Ambos Respondieron! 💖</span>
              </div>
              <button type="button" class="btn-secondary btn-open-prompts-history" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">
                📖 Álbum de Preguntas
              </button>
            </div>

            <h3 class="daily-prompt-question-title">«${window.Utils.sanitizeHTML(prompt.question)}»</h3>

            <div class="daily-prompt-answers-grid">
              <!-- Respuesta Kevin -->
              <div class="prompt-answer-card kevin-card">
                <div class="prompt-answer-header">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="author-badge-circle kevin">K</span>
                    <strong>Kevin 👦🏻</strong>
                  </div>
                  <small style="color: var(--color-text-muted); font-size: 0.75rem;">${prompt.kevinAnsweredAt ? window.Utils.formatDateTimeES(prompt.kevinAnsweredAt) : 'Hoy'}</small>
                </div>
                <div class="prompt-answer-text">
                  ${window.Utils.sanitizeHTML(prompt.kevinAnswer)}
                </div>
              </div>

              <!-- Respuesta Wendy -->
              <div class="prompt-answer-card wendy-card">
                <div class="prompt-answer-header">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="author-badge-circle wendy">W</span>
                    <strong>Wendy 👧🏻 (Patico ♥️)</strong>
                  </div>
                  <small style="color: var(--color-text-muted); font-size: 0.75rem;">${prompt.wendyAnsweredAt ? window.Utils.formatDateTimeES(prompt.wendyAnsweredAt) : 'Hoy'}</small>
                </div>
                <div class="prompt-answer-text">
                  ${window.Utils.sanitizeHTML(prompt.wendyAnswer)}
                </div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 0.85rem;">
              <span style="font-size: 0.82rem; color: var(--color-sunflower-gold);">🎉 ¡Conexión del día completada! Mañana a las 00:00 se desbloqueará una nueva pregunta.</span>
            </div>
          </div>
        `;
      } else if (myAnswer) {
        // YO YA RESPONDÍ, ESPERANDO A MI PAREJA
        contentHtml = `
          <div class="daily-prompt-waiting-wrap">
            <div class="daily-prompt-header">
              <div class="daily-prompt-badge">
                <span class="prompt-star">🔒</span>
                <span>Pregunta del Día · Respuesta Bajo Llave</span>
              </div>
              <button type="button" class="btn-secondary btn-open-prompts-history" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">
                📖 Álbum
              </button>
            </div>

            <h3 class="daily-prompt-question-title">«${window.Utils.sanitizeHTML(prompt.question)}»</h3>

            <div class="daily-prompt-secret-box">
              <div class="secret-box-icon">🔒</div>
              <div style="flex: 1;">
                <h4 style="margin: 0; color: var(--color-sunflower-gold); font-size: 0.95rem;">Tu respuesta ha sido sellada con éxito 💌</h4>
                <p style="margin: 0.3rem 0 0; font-size: 0.84rem; color: var(--color-text-secondary); line-height: 1.4;">
                  Escribiste: <em>«${window.Utils.sanitizeHTML(myAnswer)}»</em>
                </p>
                <div class="secret-partner-status" style="margin-top: 0.6rem; font-size: 0.82rem; color: #E040FB;">
                  ${partnerAnswer ? `✨ ${partnerName} también respondió. ¡Actualizando...!` : `⏳ Esperando a que <strong>${partnerName}</strong> responda para desbloquear ambas respuestas simultáneamente.`}
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // YO NO HE RESPONDIDO AÚN
        contentHtml = `
          <div class="daily-prompt-pending-wrap">
            <div class="daily-prompt-header">
              <div class="daily-prompt-badge">
                <span class="prompt-star">💌</span>
                <span>Pregunta Diaria de Pareja</span>
              </div>
              <button type="button" class="btn-secondary btn-open-prompts-history" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">
                📖 Álbum
              </button>
            </div>

            <div class="daily-prompt-hero-box">
              <h3 class="daily-prompt-question-title" style="margin-bottom: 0.75rem;">«${window.Utils.sanitizeHTML(prompt.question)}»</h3>
              
              ${partnerAnswer ? `
                <div class="partner-answered-hint-pill" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-full); background: rgba(224, 64, 251, 0.18); border: 1px solid rgba(224, 64, 251, 0.4); color: #F8BBD0; font-size: 0.82rem; margin-bottom: 0.75rem;">
                  <span>🔒</span>
                  <span><strong>${partnerName}</strong> ya respondió. ¡Escribe tu respuesta para descubrir lo que dijo!</span>
                </div>
              ` : `
                <p style="font-size: 0.84rem; color: var(--color-text-secondary); margin-bottom: 0.75rem;">
                  Tu respuesta permanecerá secreta y se revelará al mismo tiempo que la de ${partnerName}.
                </p>
              `}

              <form id="form-daily-prompt" style="display: flex; flex-direction: column; gap: 0.6rem;">
                <textarea id="daily-prompt-input" class="form-control" rows="3" placeholder="Escribe tu respuesta sincera como ${currentUser}..." required style="resize: vertical;"></textarea>
                <div style="display: flex; justify-content: flex-end;">
                  <button type="submit" class="btn-primary" style="padding: 0.5rem 1.4rem; font-size: 0.9rem;">
                    <span>Enviar mi respuesta 💌</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
      }

      container.innerHTML = contentHtml;

      // Listeners
      container.querySelector('#form-daily-prompt')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('daily-prompt-input');
        const text = input ? input.value.trim() : '';
        if (!text) return;

        const updated = window.storage.saveDailyAnswer(todayStr, currentUser, text);
        this.renderDailyPromptWidget();

        if (updated.revealed) {
          if (window.confetti) {
            window.confetti({ particleCount: 80, spread: 90, origin: { y: 0.3 } });
          }
          window.Utils.showToast('🎉 ¡Ambos han respondido! Respuestas reveladas 💖✨', 'success');
        } else {
          window.Utils.showToast('¡Tu respuesta quedó sellada bajo llave! 🔒 Esperando a tu amor...', 'success');
        }
      });

      container.querySelectorAll('.btn-open-prompts-history').forEach(btn => {
        btn.addEventListener('click', () => {
          this.renderDailyPromptsHistory();
          document.getElementById('modal-daily-prompts-history')?.classList.add('active');
        });
      });
    }

    renderDailyPromptsHistory() {
      const container = document.getElementById('daily-prompts-history-list');
      if (!container) return;

      const history = window.storage.getDailyPromptsHistory();
      if (!history.length) {
        container.innerHTML = '<div style="text-align: center; color: var(--color-text-muted); padding: 2rem;">Aún no hay preguntas respondidas. ¡Empiecen respondiendo la de hoy! 💌</div>';
        return;
      }

      container.innerHTML = history.map(item => {
        const isBoth = item.kevinAnswer && item.wendyAnswer;
        return `
          <div class="glass-card prompt-history-card" style="padding: 1.1rem; border-color: ${isBoth ? 'rgba(244, 197, 66, 0.4)' : 'rgba(255, 255, 255, 0.1)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
              <span style="font-size: 0.78rem; color: var(--color-sunflower-gold); font-weight: 700; background: rgba(244, 197, 66, 0.15); padding: 0.2rem 0.6rem; border-radius: var(--radius-full);">📅 ${window.Utils.formatDateES(item.date)}</span>
              <span style="font-size: 0.78rem; color: ${isBoth ? '#00E5FF' : '#FFB74D'}; font-weight: 600;">${isBoth ? '✨ Completada por ambos' : '⏳ Pendiente'}</span>
            </div>
            <h4 style="font-size: 1.05rem; color: var(--color-text-main); margin-bottom: 0.75rem; font-family: var(--font-heading);">«${window.Utils.sanitizeHTML(item.question)}»</h4>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="background: rgba(109, 74, 153, 0.2); padding: 0.6rem 0.85rem; border-radius: 8px; border-left: 3px solid #7092FD;">
                <strong style="font-size: 0.82rem; color: #7092FD;">👦🏻 Kevin:</strong>
                <p style="margin: 0.2rem 0 0; font-size: 0.88rem; color: var(--color-text-secondary);">${item.kevinAnswer ? window.Utils.sanitizeHTML(item.kevinAnswer) : '<em>(Aún no respondió)</em>'}</p>
              </div>
              <div style="background: rgba(224, 64, 251, 0.15); padding: 0.6rem 0.85rem; border-radius: 8px; border-left: 3px solid #E040FB;">
                <strong style="font-size: 0.82rem; color: #E040FB;">👧🏻 Wendy:</strong>
                <p style="margin: 0.2rem 0 0; font-size: 0.88rem; color: var(--color-text-secondary);">${item.wendyAnswer ? window.Utils.sanitizeHTML(item.wendyAnswer) : '<em>(Aún no respondió)</em>'}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // ========================================================
    // --- 11. CÁPSULAS DEL TIEMPO ⏳💎 ---
    // ========================================================

    initTimeCapsules() {
      this.renderTimeCapsules();

      if (!this.timeCapsuleInterval) {
        this.timeCapsuleInterval = setInterval(() => {
          this.updateTimeCapsuleCountdowns();
        }, 1000);
      }

      document.getElementById('btn-new-capsule')?.addEventListener('click', () => {
        this.openNewCapsuleModal();
      });

      document.getElementById('form-time-capsule')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('capsule-title').value.trim();
        const unlockDate = document.getElementById('capsule-unlock-date').value;
        const theme = document.getElementById('capsule-theme').value;
        const message = document.getElementById('capsule-message').value.trim();
        const photoUrl = document.getElementById('capsule-photo-url').value.trim();
        const voiceNoteUrl = document.getElementById('capsule-voice-url').value;
        const voiceNoteDuration = parseInt(document.getElementById('capsule-voice-duration').value, 10) || 0;
        const currentUser = window.storage.getCurrentUser();

        window.storage.saveTimeCapsule({
          title,
          unlockDate,
          theme,
          message,
          photoUrl,
          voiceNoteUrl,
          voiceNoteDuration,
          creator: currentUser
        });

        document.getElementById('modal-time-capsule').classList.remove('active');
        e.currentTarget.reset();
        this.renderTimeCapsules();
        window.Utils.showToast('¡Cápsula sellada con éxito! ⏳🔒✨', 'success');
      });
    }

    openNewCapsuleModal() {
      const modal = document.getElementById('modal-time-capsule');
      const form = document.getElementById('form-time-capsule');
      if (form) form.reset();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDateStr = tomorrow.toISOString().split('T')[0];
      const unlockDateInput = document.getElementById('capsule-unlock-date');
      if (unlockDateInput) {
        unlockDateInput.min = minDateStr;
        unlockDateInput.value = minDateStr;
      }

      const voicePreview = document.getElementById('capsule-voice-preview');
      const voiceAudioPlayer = document.getElementById('capsule-voice-audio-player');
      const deleteVoiceBtn = document.getElementById('btn-capsule-delete-audio');
      if (voiceAudioPlayer) voiceAudioPlayer.src = '';
      if (voicePreview) voicePreview.style.display = 'none';
      if (deleteVoiceBtn) deleteVoiceBtn.style.display = 'none';

      modal?.classList.add('active');
    }

    renderTimeCapsules() {
      const container = document.getElementById('time-capsules-grid');
      if (!container) return;

      const capsules = window.storage.getTimeCapsules();
      if (!capsules.length) {
        container.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 1.5rem; font-size: 0.88rem;">
            Aún no tienen cápsulas del tiempo selladas. ¡Crea una para abrir en su próximo aniversario, cumpleaños o fecha especial! ⏳✨
          </div>
        `;
        return;
      }

      const now = Date.now();

      container.innerHTML = capsules.map(c => {
        const unlockMs = new Date(c.unlockDate).getTime();
        const isReady = unlockMs <= now || c.isOpened;
        const creator = c.creator || 'Kevin';
        const creatorInitial = creator.charAt(0).toUpperCase();
        const creatorClass = creator.toLowerCase() === 'wendy' ? 'wendy' : 'kevin';

        return `
          <div class="glass-card time-capsule-card ${c.theme || 'gold'} ${isReady ? 'capsule-unlocked' : 'capsule-locked'}" data-id="${c.id}">
            <div class="capsule-card-top">
              <span class="capsule-status-badge ${isReady ? 'unlocked' : 'locked'}">
                ${isReady ? '🔓 Lista para abrir' : '🔒 Sellada bajo llave'}
              </span>
              <div class="song-author-badge" style="margin: 0;" title="Sellada por ${window.Utils.sanitizeHTML(creator)}">
                <span class="author-badge-circle ${creatorClass}" style="width: 24px; height: 24px; font-size: 0.75rem;">${creatorInitial}</span>
                <span style="font-size: 0.75rem;">Por <strong>${window.Utils.sanitizeHTML(creator)}</strong></span>
              </div>
            </div>

            <div class="capsule-visual-chest">
              <span class="chest-emoji">${isReady ? '💎' : '⏳'}</span>
            </div>

            <h4 class="capsule-card-title">${window.Utils.sanitizeHTML(c.title)}</h4>
            <p class="capsule-card-date">Fecha de apertura: <strong>${window.Utils.formatDateES(c.unlockDate)}</strong></p>

            <div class="capsule-countdown-box" id="capsule-timer-${c.id}">
              ${this.getCapsuleRemainingText(c.unlockDate, c.isOpened)}
            </div>

            <div class="capsule-actions" style="margin-top: 0.85rem; display: flex; gap: 0.5rem; justify-content: space-between;">
              ${isReady ? `
                <button type="button" class="btn-primary btn-open-capsule" data-id="${c.id}" style="flex: 1; padding: 0.45rem 0.8rem; font-size: 0.85rem;">
                  <span>💎 Abrir Cofre</span>
                </button>
              ` : `
                <button type="button" class="btn-secondary btn-inspect-locked-capsule" data-id="${c.id}" style="flex: 1; padding: 0.45rem 0.8rem; font-size: 0.82rem;">
                  <span>🔒 Ver Candado</span>
                </button>
              `}
              <button type="button" class="btn-secondary btn-del-capsule" data-id="${c.id}" style="padding: 0.25rem 0.6rem; font-size: 0.8rem; color: var(--color-danger);" title="Eliminar cápsula">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.btn-open-capsule').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.viewOpenedCapsule(id);
        });
      });

      container.querySelectorAll('.btn-inspect-locked-capsule').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const c = window.storage.getTimeCapsules().find(item => item.id === id);
          if (c) {
            window.Utils.showToast(`🔒 Esta cápsula está sellada. Se desbloqueará el ${window.Utils.formatDateES(c.unlockDate)} ✨`, 'info');
          }
        });
      });

      container.querySelectorAll('.btn-del-capsule').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('¿Eliminar esta cápsula del tiempo?')) {
            window.storage.deleteTimeCapsule(id);
            this.renderTimeCapsules();
            window.Utils.showToast('Cápsula eliminada', 'info');
          }
        });
      });
    }

    getCapsuleRemainingText(unlockDateStr, isOpened) {
      if (isOpened) return '<span style="color: #00E5FF; font-weight: 600;">✨ Abierta & Revelada</span>';
      const unlockMs = new Date(unlockDateStr).getTime();
      const now = Date.now();
      const diffMs = unlockMs - now;
      if (diffMs <= 0) return '<span style="color: #69F0AE; font-weight: 700;">🎉 ¡EL TIEMPO LLEGÓ! Abre el cofre</span>';

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      return `<span>⏳ ${days}d ${hours}h ${mins}m ${secs}s</span>`;
    }

    updateTimeCapsuleCountdowns() {
      const capsules = window.storage.getTimeCapsules();
      capsules.forEach(c => {
        const el = document.getElementById(`capsule-timer-${c.id}`);
        if (el) {
          el.innerHTML = this.getCapsuleRemainingText(c.unlockDate, c.isOpened);
        }
      });
    }

    viewOpenedCapsule(id) {
      const c = window.storage.openTimeCapsule(id);
      if (!c) return;

      const modal = document.getElementById('modal-capsule-viewer');
      const titleEl = document.getElementById('modal-capsule-viewer-title');
      const dateEl = document.getElementById('modal-capsule-viewer-date');
      const bodyEl = document.getElementById('modal-capsule-viewer-body');

      titleEl.textContent = c.title;
      dateEl.textContent = `Sellada el ${window.Utils.formatDateES(c.createdAt || c.unlockDate)} por ${c.creator}`;

      let photoHtml = '';
      if (c.photoUrl) {
        photoHtml = `<div style="text-align: center; margin-bottom: 1.25rem;"><img src="${window.Utils.sanitizeHTML(c.photoUrl)}" alt="Foto de cápsula" style="max-height: 250px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);" /></div>`;
      }

      let voiceHtml = '';
      if (c.voiceNoteUrl) {
        voiceHtml = `
          <div class="capsule-voice-player-wrap" style="background: rgba(224, 64, 251, 0.15); border: 1px solid rgba(224, 64, 251, 0.4); border-radius: 12px; padding: 0.85rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
              <span>🎙️</span>
              <strong style="color: #F8BBD0; font-size: 0.9rem;">Nota de voz del pasado grabada por ${window.Utils.sanitizeHTML(c.creator)}:</strong>
            </div>
            <audio controls src="${c.voiceNoteUrl}" style="width: 100%; height: 38px;"></audio>
          </div>
        `;
      }

      bodyEl.innerHTML = `
        ${photoHtml}
        <div class="capsule-letter-box" style="background: rgba(26, 18, 42, 0.8); border: 1px solid rgba(244, 197, 66, 0.4); border-radius: 12px; padding: 1.25rem; font-family: var(--font-heading); font-size: 1.15rem; line-height: 1.6; color: var(--color-light-yellow); white-space: pre-wrap;">
${window.Utils.sanitizeHTML(c.message)}
        </div>
        ${voiceHtml}
      `;

      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 100, origin: { y: 0.3 } });
      }

      modal.classList.add('active');
      this.renderTimeCapsules();
    }

    // ========================================================
    // --- 12. NOTAS DE VOZ & GRABADORA (MEDIARECORDER) 🎙️ ---
    // ========================================================

    initVoiceRecorders() {
      // 1. Grabadora en Recuerdos
      this.setupVoiceRecorderInstance({
        recordBtnId: 'btn-mem-record',
        stopBtnId: 'btn-mem-stop',
        deleteBtnId: 'btn-mem-delete-audio',
        timerId: 'mem-record-timer',
        previewId: 'mem-voice-preview',
        audioPlayerId: 'mem-voice-audio-player',
        urlInputId: 'mem-voice-url',
        durationInputId: 'mem-voice-duration'
      });

      // 2. Grabadora en Notas del Muro
      this.setupVoiceRecorderInstance({
        recordBtnId: 'btn-note-record',
        stopBtnId: 'btn-note-stop',
        deleteBtnId: 'btn-note-delete-audio',
        timerId: 'note-record-timer',
        previewId: 'note-voice-preview',
        audioPlayerId: 'note-voice-audio-player',
        urlInputId: 'note-voice-url',
        durationInputId: 'note-voice-duration'
      });

      // 3. Grabadora en Cápsulas del Tiempo
      this.setupVoiceRecorderInstance({
        recordBtnId: 'btn-capsule-record',
        stopBtnId: 'btn-capsule-stop',
        deleteBtnId: 'btn-capsule-delete-audio',
        timerId: 'capsule-record-timer',
        previewId: 'capsule-voice-preview',
        audioPlayerId: 'capsule-voice-audio-player',
        urlInputId: 'capsule-voice-url',
        durationInputId: 'capsule-voice-duration'
      });
    }

    setupVoiceRecorderInstance(cfg) {
      const recordBtn = document.getElementById(cfg.recordBtnId);
      const stopBtn = document.getElementById(cfg.stopBtnId);
      const deleteBtn = document.getElementById(cfg.deleteBtnId);
      const timerEl = document.getElementById(cfg.timerId);
      const previewEl = document.getElementById(cfg.previewId);
      const audioPlayer = document.getElementById(cfg.audioPlayerId);
      const urlInput = document.getElementById(cfg.urlInputId);
      const durationInput = document.getElementById(cfg.durationInputId);

      if (!recordBtn || !stopBtn) return;

      recordBtn.addEventListener('click', async () => {
        try {
          const recorder = window.VoiceRecorder || window.MediaService?.VoiceRecorder;
          if (!recorder) {
            throw new Error('El servicio de grabación no está disponible en este momento.');
          }

          recordBtn.style.display = 'none';
          stopBtn.style.display = 'inline-flex';
          if (deleteBtn) deleteBtn.style.display = 'none';

          await recorder.startRecording((timeFormatted, sec) => {
            if (timerEl) timerEl.textContent = timeFormatted;
          });
        } catch (err) {
          recordBtn.style.display = 'inline-flex';
          stopBtn.style.display = 'none';
          window.Utils.showToast('No se pudo acceder al micrófono: ' + (err.message || err), 'error');
        }
      });

      stopBtn.addEventListener('click', async () => {
        try {
          const recorder = window.VoiceRecorder || window.MediaService?.VoiceRecorder;
          const result = recorder ? await recorder.stopRecording() : null;
          stopBtn.style.display = 'none';
          recordBtn.style.display = 'inline-flex';

          if (result && result.dataUrl) {
            if (urlInput) urlInput.value = result.dataUrl;
            if (durationInput) durationInput.value = result.durationSec;
            if (audioPlayer) {
              audioPlayer.src = result.dataUrl;
            }
            if (previewEl) previewEl.style.display = 'block';
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
            window.Utils.showToast(`¡Audio grabado (${result.durationSec}s)! 🎙️✨`, 'success');
          }
        } catch (err) {
          stopBtn.style.display = 'none';
          recordBtn.style.display = 'inline-flex';
          console.error(err);
        }
      });

      deleteBtn?.addEventListener('click', () => {
        if (urlInput) urlInput.value = '';
        if (durationInput) durationInput.value = '0';
        if (audioPlayer) {
          audioPlayer.src = '';
        }
        if (previewEl) previewEl.style.display = 'none';
        deleteBtn.style.display = 'none';
        window.Utils.showToast('Nota de voz eliminada', 'info');
      });
    }

    initCounterAnimations() {
      const counters = document.querySelectorAll(".animate-counter");
      if (!counters.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target, 10);
            if (!isNaN(target)) {
              window.animateCounter(entry.target, target, 2000, false);
            }
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      counters.forEach(c => observer.observe(c));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Pausar automáticamente cualquier otro audio o video cuando uno empieza a sonar
    document.addEventListener("play", (e) => {
      const mediaElements = document.querySelectorAll("audio, video");
      mediaElements.forEach(media => {
        if (media !== e.target && !media.paused) {
          media.pause();
        }
      });
    }, true);

    window.paticoApp = new PaticoApp();
  });
})();

