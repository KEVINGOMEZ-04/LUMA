/**
 * LUMA 🌟 - Controlador Principal de Aplicación
 * Plataforma social de grupos privados (Clean Luxury Edition).
 * 100% Feature Parity con ATRIA (Recuerdos Trail, Películas con Rating Bar, Paper Notes, Frasco de Metas con Stats).
 */

class LumaApp {
  constructor() {
    this.currentTab = 'inicio';
    this.audioManager = window.audioManager;
    this.storage = window.storage;
    this.media = window.MediaService;
    this.presence = window.presence;

    this.init();
  }

  init() {
    // 1. Inicializar Tema Visual (Modo Oscuro / Claro)
    this.initTheme();

    // 2. Iniciar Canvas de Fondo
    if (window.StarfieldBackground) {
      new window.StarfieldBackground('stars-canvas');
    }

    // 3. Registrar Service Worker PWA
    this.registerServiceWorker();

    // 4. Suscribirse a cambios de datos y presencia
    this.bindSubscriptions();

    // 5. Configurar Navegación por Hash y Tabs Móviles
    this.setupNavigation();

    // 6. Vincular Eventos de Modales y Formularios
    this.bindModalEvents();
    this.bindFormEvents();
    this.bindSearchEvents();
    this.bindProfileCustomizerInteractions();

    // 6.1 Inicializar Módulo de Música Colaborativa y Reproductor Global
    this.initMusicLiveSearch();
    this.initMusicFilters();
    this.initSongModalInteractions();
    this.initSongCommentsInteractions();
    this.initGlobalPlayerControls();

    // 7. Verificar Estado Inicial y Mostrar Dashboard
    this.checkInitialState();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('luma_theme') || 'dark';
    this.setTheme(savedTheme, false);
  }

  setTheme(theme, showToast = true) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('luma_theme', theme);

    const darkBtn = document.getElementById('btn-theme-dark');
    const lightBtn = document.getElementById('btn-theme-light');
    if (darkBtn && lightBtn) {
      if (theme === 'light') {
        darkBtn.classList.remove('active');
        lightBtn.classList.add('active');
      } else {
        lightBtn.classList.remove('active');
        darkBtn.classList.add('active');
      }
    }

    if (showToast) {
      window.Utils.showToast(theme === 'light' ? '☀️ Modo Claro activado' : '🌙 Modo Oscuro activado', 'info');
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Registro de Service Worker:', err);
        });
      });
    }
  }

  bindSubscriptions() {
    this.storage.subscribe((key) => {
      this.updateHeader();
      if (!key || key === 'groupData' || key === 'activeGroup' || key === 'groups') {
        this.renderCurrentTab();
      }
    });

    this.presence.subscribe((presenceMap) => {
      this.updateHeaderPresence();
      if (document.getElementById('modal-members-presence')?.classList.contains('active')) {
        this.populateMembersPresenceModal(presenceMap);
      }
    });

    this.audioManager.subscribe((state) => {
      this.renderAudioPlayerBar(state);
    });
  }

  checkInitialState() {
    const profile = this.storage.getUserProfile();
    const groups = this.storage.getGroups();
    const activeGroup = this.storage.getActiveGroup();

    const onboardingScreen = document.getElementById('onboarding-screen');
    const appContainer = document.getElementById('app-container');

    if (!groups || groups.length === 0 || !activeGroup) {
      if (onboardingScreen) onboardingScreen.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
      this.bindOnboardingActions();
    } else {
      if (onboardingScreen) onboardingScreen.style.display = 'none';
      if (appContainer) appContainer.style.display = 'flex';
      
      this.presence.bindGroup(activeGroup.id, profile);
      this.updateHeader();
      this.handleHashChange();
    }
  }

  enterActiveGroupDirectly() {
    const activeGroup = this.storage.getActiveGroup();
    const profile = this.storage.getUserProfile();
    if (!activeGroup) return;

    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    this.presence.bindGroup(activeGroup.id, profile);
    this.updateHeader();
    window.location.hash = '#inicio';
    this.handleHashChange();
  }

  bindOnboardingActions() {
    const btnHost = document.getElementById('btn-onboarding-host');
    const btnCode = document.getElementById('btn-onboarding-code');
    const btnGroups = document.getElementById('btn-onboarding-groups');
    const btnProfile = document.getElementById('btn-onboarding-profile');
    const quickEnterBox = document.getElementById('onboarding-quick-enter-banner');
    const btnQuickEnter = document.getElementById('btn-onboarding-enter-active');

    const activeGroup = this.storage.getActiveGroup();
    if (activeGroup && quickEnterBox) {
      quickEnterBox.style.display = 'flex';
      const nameEl = document.getElementById('quick-enter-group-name');
      const iconEl = document.getElementById('quick-enter-group-icon');
      if (nameEl) nameEl.textContent = activeGroup.name;
      if (iconEl) iconEl.textContent = activeGroup.icon || '🌟';
    }

    if (btnQuickEnter) {
      btnQuickEnter.onclick = () => this.enterActiveGroupDirectly();
    }

    if (btnHost) {
      btnHost.onclick = () => this.openModal('modal-create-group');
    }
    if (btnCode) {
      btnCode.onclick = () => this.openModal('modal-join-group');
    }
    if (btnGroups) {
      btnGroups.onclick = () => this.openGroupsListModal();
    }
    if (btnProfile) {
      btnProfile.onclick = () => {
        this.populateProfileModal();
        this.openModal('modal-profile');
      };
    }
  }  // --- NAVEGACIÓN Y TABS ---
  setupNavigation() {
    const pillsContainer = document.getElementById('nav-pills-container');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    window.CONFIG.sections.forEach(sec => {
      const pill = document.createElement('a');
      pill.href = `#${sec.id}`;
      pill.className = `nav-pill ${sec.id === this.currentTab ? 'active' : ''}`;
      pill.id = `nav-pill-${sec.id}`;
      pill.innerHTML = `<span>${sec.icon}</span><span>${sec.label}</span>`;
      pillsContainer.appendChild(pill);
    });

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  handleHashChange() {
    const rawHash = window.location.hash.replace('#', '').trim();
    const validSections = window.CONFIG.sections.map(s => s.id);
    const target = validSections.includes(rawHash) ? rawHash : 'inicio';

    this.currentTab = target;

    document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
    if (target === 'inicio') {
      document.getElementById('bottom-tab-inicio')?.classList.add('active');
    } else if (target === 'recuerdos') {
      document.getElementById('bottom-tab-recuerdos')?.classList.add('active');
    } else if (target === 'notas') {
      document.getElementById('bottom-tab-mensajes')?.classList.add('active');
    }

    document.querySelectorAll('.luma-section').forEach(s => s.classList.remove('active'));
    const activeSection = document.getElementById(`section-${target}`);
    if (activeSection) activeSection.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    switch (this.currentTab) {
      case 'inicio': this.renderInicio(); break;
      case 'recuerdos': this.renderMemories(); break;
      case 'musica': this.renderSongs(); break;
      case 'cine': this.renderMovies(); break;
      case 'series': this.renderSeries(); break;
      case 'notas': this.renderNotes(); break;
      case 'objetivos': this.renderGoals(); break;
    }
  }

  // --- CABECERA Y GRUPO ACTIVO ---
  updateHeader() {
    const group = this.storage.getActiveGroup();
    const profile = this.storage.getUserProfile();
    if (!group) return;

    const nameEl = document.getElementById('header-group-name');
    const dotEl = document.getElementById('header-group-dot');
    const codeEl = document.getElementById('header-group-code');

    if (nameEl) nameEl.textContent = group.name;
    if (dotEl) {
      dotEl.textContent = group.icon || '🌟';
    }
    if (codeEl) {
      codeEl.textContent = group.code || '------';
      codeEl.onclick = (e) => {
        e.stopPropagation();
        window.Utils.copyToClipboard(group.code, `Código ${group.code} copiado 📋`);
      };
    }

    const groupChip = document.getElementById('header-group-chip');
    if (groupChip) {
      groupChip.onclick = () => this.openGroupMenuModal();
    }

    const groupIconEl = document.getElementById('header-group-icon-display');
    if (groupIconEl) {
      if (group.iconImage) {
        groupIconEl.innerHTML = `<img src="${group.iconImage}" style="width: 24px; height: 24px; border-radius: 6px; object-fit: cover;" alt="grupo" />`;
      } else {
        groupIconEl.textContent = group.icon || '👥';
      }
    }

    const groupMembersBtn = document.getElementById('header-group-members-btn');
    if (groupMembersBtn) {
      groupMembersBtn.onclick = () => this.openMembersPresenceModal();
    }

    const searchBtn = document.getElementById('btn-header-search');
    if (searchBtn) {
      searchBtn.onclick = () => {
        window.location.hash = '#musica';
        document.getElementById('music-search-input')?.focus();
      };
    }

    const notifsBtn = document.getElementById('btn-header-notifs');
    if (notifsBtn) {
      notifsBtn.onclick = () => {
        window.Utils.showToast('Tienes 3 actividades recientes en tu grupo', 'info');
      };
    }

    this.updateHeaderPresence();
  }

  updateHeaderPresence() {
    const dot = document.getElementById('header-user-presence-dot');
    if (!dot) return;
    const isOnline = Boolean(this.presence && this.presence.isOnline);
    dot.className = `header-user-presence-dot ${isOnline ? 'online' : 'offline'}`;
  }

  // --- MODAL: MENÚ DE OPCIONES DE GRUPO ---
  openGroupMenuModal() {
    const group = this.storage.getActiveGroup();
    if (!group) return;

    const iconEl = document.getElementById('menu-group-icon-display');
    const nameEl = document.getElementById('menu-group-name-display');

    if (iconEl) {
      if (group.iconImage) {
        iconEl.innerHTML = `<img src="${group.iconImage}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;" alt="logo" />`;
      } else {
        iconEl.textContent = group.icon || '🌟';
      }
    }
    if (nameEl) nameEl.textContent = group.name;

    const btnEdit = document.getElementById('btn-menu-action-edit');
    if (btnEdit) {
      btnEdit.onclick = () => {
        this.closeModal('modal-group-menu');
        this.openEditGroupModal();
      };
    }

    const btnSwitch = document.getElementById('btn-menu-action-switch');
    if (btnSwitch) {
      btnSwitch.onclick = () => {
        this.closeModal('modal-group-menu');
        this.openGroupsListModal();
      };
    }

    const btnHome = document.getElementById('btn-menu-action-home');
    if (btnHome) {
      btnHome.onclick = () => {
        this.closeModal('modal-group-menu');
        document.getElementById('app-container').style.display = 'none';
        const onb = document.getElementById('onboarding-screen');
        if (onb) onb.style.display = 'flex';
        this.bindOnboardingActions();
      };
    }

    const btnLeave = document.getElementById('btn-menu-action-leave');
    if (btnLeave) {
      btnLeave.onclick = () => {
        if (confirm(`¿Estás seguro de que deseas salir del grupo "${group.name}"?`)) {
          this.closeModal('modal-group-menu');
          this.storage.leaveGroup(group.id);
          window.Utils.showToast(`Has salido del grupo "${group.name}"`, 'info');
          this.checkInitialState();
        }
      };
    }

    this.openModal('modal-group-menu');
  }

  // --- MODAL: MIEMBROS Y ESTADO DE CONEXIÓN DEL GRUPO ---
  openMembersPresenceModal() {
    this.populateMembersPresenceModal(this.presence ? (this.presence.presenceMap || {}) : {});
    this.openModal('modal-members-presence');
  }

  populateMembersPresenceModal(presenceMap = {}) {
    const profile = this.storage.getUserProfile() || {};
    const group = this.storage.getActiveGroup();
    if (!group) return;

    const titleEl = document.getElementById('presence-modal-group-title');
    const emojiEl = document.getElementById('presence-modal-group-emoji');
    const codeEl = document.getElementById('presence-modal-group-code');
    const codeBtn = document.getElementById('presence-modal-group-code-btn');
    const inviteBtn = document.getElementById('btn-presence-modal-invite');

    if (titleEl) titleEl.textContent = `"${group.name}"`;
    if (emojiEl) {
      if (group.iconImage) {
        emojiEl.innerHTML = `<img src="${group.iconImage}" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;" alt="icono" />`;
      } else {
        emojiEl.textContent = group.icon || '🌟';
      }
    }
    if (codeEl) codeEl.textContent = group.code || '------';
    if (codeBtn) {
      codeBtn.onclick = () => {
        window.Utils.copyToClipboard(group.code, `Código ${group.code} copiado al portapapeles 📋`);
      };
    }
    if (inviteBtn) {
      inviteBtn.onclick = () => {
        this.closeModal('modal-members-presence');
        this.openInviteModal();
      };
    }

    const myAvatar = document.getElementById('presence-modal-my-avatar');
    const myName = document.getElementById('presence-modal-my-name');
    const myBio = document.getElementById('presence-modal-my-bio');
    const myStatus = document.getElementById('presence-modal-my-status');

    if (myAvatar) {
      myAvatar.style.backgroundColor = profile.favoriteColor || '#6366F1';
      if (profile.avatar) {
        myAvatar.innerHTML = `<img src="${window.Utils.sanitizeHTML(profile.avatar)}" alt="${window.Utils.sanitizeHTML(profile.name)}" />`;
      } else if (profile.presetAvatar) {
        myAvatar.innerHTML = `<span>${profile.presetAvatar}</span>`;
      } else {
        myAvatar.innerHTML = `<span>${(profile.name || 'U').charAt(0).toUpperCase()}</span>`;
      }
    }
    if (myName) myName.textContent = profile.name || 'Mi Perfil';
    if (myBio) myBio.textContent = profile.bio || 'Sin biografía añadida';
    if (myStatus) myStatus.textContent = profile.statusMsg || '✨ En línea';

    const btnEditProfile = document.getElementById('btn-presence-modal-edit-profile');
    if (btnEditProfile) {
      btnEditProfile.onclick = () => {
        this.closeModal('modal-members-presence');
        this.populateProfileModal();
        this.openModal('modal-profile');
      };
    }

    const listContainer = document.getElementById('presence-modal-members-list');
    const countEl = document.getElementById('presence-modal-members-count');
    const members = group.members || [];

    if (countEl) countEl.textContent = members.length;
    if (!listContainer) return;

    listContainer.innerHTML = '';
    members.forEach(m => {
      const isMe = m.id === profile.id;
      const isHost = group.host && group.host.id === m.id;
      const pData = presenceMap[m.id] || {};
      const isOnline = Boolean(pData.online || pData.state === 'online' || isMe);
      const isAway = pData.state === 'away';

      let statusLabel = 'Desconectado';
      let statusClass = 'offline';
      if (isOnline) {
        statusLabel = '🟢 En línea';
        statusClass = 'online';
      } else if (isAway) {
        statusLabel = '🌙 Ausente';
        statusClass = 'away';
      }

      let detailText = '';
      if (m.bio) {
        detailText = `<div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 0.1rem;">${window.Utils.sanitizeHTML(m.bio)}</div>`;
      }

      let timeText = '';
      if (isOnline) {
        timeText = 'Activo ahora';
      } else if (pData.lastSeen) {
        timeText = `Última vez: ${this.formatRelativeTime(new Date(pData.lastSeen).toISOString())}`;
      } else if (m.lastSeen) {
        timeText = `Última vez: ${this.formatRelativeTime(m.lastSeen)}`;
      } else {
        timeText = `Miembro desde ${window.Utils.formatDateES(m.joinedAt || group.createdAt)}`;
      }

      const card = document.createElement('div');
      card.className = 'member-presence-card';
      card.innerHTML = `
        <div class="member-card-left">
          <div class="member-card-avatar" style="background-color: ${m.color || '#6366F1'};">
            ${m.avatar ? `<img src="${window.Utils.sanitizeHTML(m.avatar)}" alt="${window.Utils.sanitizeHTML(m.name)}" />` : (m.presetAvatar || (m.name || 'U').charAt(0).toUpperCase())}
          </div>
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
              <strong style="font-size: 0.9rem; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${window.Utils.sanitizeHTML(m.name)}
              </strong>
              ${isHost ? '<span class="user-role-badge">👑 Host</span>' : '<span class="user-role-badge">⭐ Miembro</span>'}
              ${isMe ? '<span class="user-role-badge self">Tú</span>' : ''}
            </div>
            ${detailText}
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.1rem;">${timeText}</div>
          </div>
        </div>
        <div class="member-card-status-pill ${statusClass}">${statusLabel}</div>
      `;
      listContainer.appendChild(card);
    });
  }

  // --- PERSONALIZADOR DE PERFIL INTERACTIVO ---
  bindProfileCustomizerInteractions() {
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.profile-tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    document.querySelectorAll('.avatar-preset-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.avatar-preset-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.activePresetAvatar = item.getAttribute('data-preset');
        this.activeUploadedAvatar = '';
        this.updateProfileLivePreview();
      });
    });

    document.querySelectorAll('.color-swatch-circle').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch-circle').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.getAttribute('data-color');
        document.getElementById('profile-color-input').value = color;
        this.activeProfileColor = color;
        this.updateProfileLivePreview();
      });
    });

    document.querySelectorAll('.status-quick-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.status-quick-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const status = pill.getAttribute('data-status');
        document.getElementById('profile-status-input').value = status;
        this.updateProfileLivePreview();
      });
    });

    ['profile-name-input', 'profile-handle-input', 'profile-bio-input', 'profile-status-input'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        this.updateProfileLivePreview();
      });
    });

    document.getElementById('profile-avatar-file')?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        this.activeUploadedAvatar = await window.Utils.fileToBase64(e.target.files[0]);
        document.querySelectorAll('.avatar-preset-item').forEach(i => i.classList.remove('active'));
        this.updateProfileLivePreview();
      }
    });
  }

  populateProfileModal() {
    const p = this.storage.getUserProfile();
    this.activePresetAvatar = p.presetAvatar || '👨‍🚀';
    this.activeUploadedAvatar = p.avatar || '';
    this.activeProfileColor = p.favoriteColor || '#6366F1';

    const nameInput = document.getElementById('profile-name-input');
    const handleInput = document.getElementById('profile-handle-input');
    const bioInput = document.getElementById('profile-bio-input');
    const statusInput = document.getElementById('profile-status-input');
    const genderSelect = document.getElementById('profile-gender-select');
    const colorInput = document.getElementById('profile-color-input');

    if (nameInput) nameInput.value = p.name || 'Usuario LUMA';
    if (handleInput) handleInput.value = p.handle || '@usuario';
    if (bioInput) bioInput.value = p.bio || '';
    if (statusInput) statusInput.value = p.statusMsg || '✨ En línea';
    if (genderSelect) genderSelect.value = p.gender || 'No especificado';
    if (colorInput) colorInput.value = this.activeProfileColor;

    document.querySelectorAll('.avatar-preset-item').forEach(item => {
      if (item.getAttribute('data-preset') === this.activePresetAvatar && !this.activeUploadedAvatar) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.querySelectorAll('.color-swatch-circle').forEach(swatch => {
      if (swatch.getAttribute('data-color').toLowerCase() === this.activeProfileColor.toLowerCase()) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });

    this.updateProfileLivePreview();
  }

  updateProfileLivePreview() {
    const name = document.getElementById('profile-name-input')?.value || 'Usuario LUMA';
    let handle = document.getElementById('profile-handle-input')?.value || '@usuario';
    if (handle && !handle.startsWith('@')) handle = '@' + handle;
    const bio = document.getElementById('profile-bio-input')?.value || '¡Hola! Compartiendo momentos increíbles en LUMA 🌟';
    const status = document.getElementById('profile-status-input')?.value || '✨ En línea';
    const color = this.activeProfileColor || document.getElementById('profile-color-input')?.value || '#6366F1';

    const prevName = document.getElementById('profile-preview-name');
    const prevHandle = document.getElementById('profile-preview-handle');
    const prevBio = document.getElementById('profile-preview-bio');
    const prevStatus = document.getElementById('profile-preview-status-msg');
    const prevAvatarCircle = document.getElementById('profile-preview-avatar-circle');
    const bioCounter = document.getElementById('profile-bio-counter');

    if (prevName) prevName.textContent = name;
    if (prevHandle) prevHandle.textContent = handle;
    if (prevBio) prevBio.textContent = bio;
    if (prevStatus) prevStatus.textContent = status;
    if (bioCounter) bioCounter.textContent = `${bio.length} / 120`;

    if (prevAvatarCircle) {
      prevAvatarCircle.style.backgroundColor = color;
      prevAvatarCircle.style.boxShadow = `0 0 20px ${color}88`;
      if (this.activeUploadedAvatar) {
        prevAvatarCircle.innerHTML = `<img src="${this.activeUploadedAvatar}" alt="${name}" />`;
      } else if (this.activePresetAvatar) {
        prevAvatarCircle.innerHTML = `<span>${this.activePresetAvatar}</span>`;
      } else {
        prevAvatarCircle.innerHTML = `<span>${(name || 'U').charAt(0).toUpperCase()}</span>`;
      }
    }
  }  // --- 1. RENDER INICIO ---
  renderInicio() {
    const group = this.storage.getActiveGroup();
    if (!group) return;

    // 1. Portada
    const coverImg = document.getElementById('group-cover-img');
    const coverWrap = document.getElementById('group-cover-wrapper');
    if (coverImg && coverWrap) {
      if (group.coverImage) {
        coverImg.src = group.coverImage;
        coverImg.style.display = 'block';
      } else {
        coverImg.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
        coverImg.style.display = 'block';
      }
    }

    const btnChangeCover = document.getElementById('btn-edit-cover-quick');
    if (btnChangeCover) {
      btnChangeCover.onclick = () => this.openEditGroupModal();
    }

    // 2. Logo Squircle del Grupo
    const iconDisplay = document.getElementById('group-hero-icon-display');
    const iconBox = document.getElementById('group-hero-icon-box');
    if (iconDisplay) {
      if (group.iconImage) {
        iconDisplay.innerHTML = `<img src="${group.iconImage}" alt="Logo" style="width:100%; height:100%; object-fit:cover;" />`;
      } else {
        iconDisplay.textContent = group.icon || '⭐';
      }
    }
    if (iconBox) {
      iconBox.onclick = () => this.openEditGroupModal();
    }

    // 3. Título del Grupo
    const titleEl = document.getElementById('group-hero-title');
    if (titleEl) titleEl.textContent = group.name;

    const btnEditTitle = document.getElementById('btn-edit-group-title');
    if (btnEditTitle) btnEditTitle.onclick = () => this.openEditGroupModal();

    const btnEditHero = document.getElementById('btn-edit-group-hero');
    if (btnEditHero) btnEditHero.onclick = () => this.openEditGroupModal();

    // 4. Contador y Avatares de Miembros Inline en Hero
    const countEl = document.getElementById('group-hero-members-count');
    const members = group.members || [];
    if (countEl) countEl.textContent = `👥 ${members.length} miembros`;

    const inlineAvatarsContainer = document.getElementById('hero-inline-member-avatars');
    if (inlineAvatarsContainer) {
      inlineAvatarsContainer.innerHTML = '';
      members.slice(0, 5).forEach(m => {
        const pill = document.createElement('div');
        pill.className = 'hero-member-avatar-pill';
        pill.title = m.name;
        pill.style.backgroundColor = m.color || '#6366F1';
        if (m.avatar) {
          pill.innerHTML = `<img src="${window.Utils.sanitizeHTML(m.avatar)}" alt="${window.Utils.sanitizeHTML(m.name)}" />`;
        } else if (m.presetAvatar) {
          pill.innerHTML = `<span>${m.presetAvatar}</span>`;
        } else {
          pill.textContent = (m.name || 'U').charAt(0).toUpperCase();
        }
        inlineAvatarsContainer.appendChild(pill);
      });
    }

    const membersRowInteractive = document.getElementById('hero-members-interactive');
    if (membersRowInteractive) {
      membersRowInteractive.onclick = () => this.openMembersPresenceModal();
    }

    // 5. Código del Grupo
    const codeTextEl = document.getElementById('group-hero-code-text');
    if (codeTextEl) codeTextEl.textContent = group.code;

    const btnCopy = document.getElementById('btn-copy-group-code');
    if (btnCopy) {
      btnCopy.onclick = () => window.Utils.copyToClipboard(group.code, `¡Código de grupo ${group.code} copiado!`);
    }

    const btnInvite = document.getElementById('btn-invite-members');
    if (btnInvite) {
      btnInvite.onclick = () => {
        window.Utils.copyToClipboard(group.code, `Comparte el código "${group.code}" para unirse a ${group.name} 🚀`);
      };
    }

    // 6. Insights en Inicio (6 Cards con descripciones exactas)
    const stats = this.storage.calculateInsights();
    const hMem = document.getElementById('home-insight-stat-memories');
    const hMon = document.getElementById('home-insight-stat-month');
    const hMov = document.getElementById('home-insight-stat-movie');
    const hArt = document.getElementById('home-insight-stat-artist');
    const hSer = document.getElementById('home-insight-stat-series');
    const hGoa = document.getElementById('home-insight-stat-goals');

    if (hMem) hMem.textContent = stats.totalMemories;
    if (hMon) hMon.textContent = stats.mostActiveMonth !== 'N/A' ? stats.mostActiveMonth : 'Febrero';
    if (hMov) hMov.textContent = stats.topMovie;
    if (hArt) hArt.textContent = stats.topArtist !== 'N/A' ? stats.topArtist : 'Coldplay';
    if (hSer) hSer.textContent = stats.topSeries !== 'N/A' ? stats.topSeries : 'Arcane (T2:C1)';
    if (hGoa) hGoa.textContent = `${stats.goalsPct}% (${stats.completedGoals}/${stats.totalGoals || 1})`;

    const dMem = document.getElementById('home-insight-desc-memories');
    const dMon = document.getElementById('home-insight-desc-month');
    const dMov = document.getElementById('home-insight-desc-movie');
    const dArt = document.getElementById('home-insight-desc-artist');
    const dSer = document.getElementById('home-insight-desc-series');
    const dGoa = document.getElementById('home-insight-desc-goals');

    if (dMem) dMem.textContent = 'Momentos guardados';
    if (dMon) dMon.textContent = `${stats.totalMemories || 18} recuerdos creados`;
    if (dMov) dMov.textContent = 'Mejor calificada';
    if (dArt) dArt.textContent = `${(this.storage.getSongs() || []).length || 12} canciones guardadas`;
    if (dSer) dSer.textContent = 'Más avanzada';
    if (dGoa) dGoa.textContent = 'Completados';

    // 7. Actividad Reciente del Grupo
    const feedContainer = document.getElementById('activity-feed-container');
    if (!feedContainer) return;

    const data = this.storage.getGroupData();
    const allItems = [
      ...(group.members || []).map(m => ({
        _type: 'miembro',
        icon: '👤',
        badgeColor: 'emerald',
        tagColor: 'emerald',
        tag: 'NUEVO MIEMBRO',
        title: `${m.name} se unió al grupo`,
        meta: this.formatRelativeTime(m.joinedAt || group.createdAt),
        date: m.joinedAt || group.createdAt
      })),
      ...(data.memories || []).map(m => ({
        ...m,
        _type: 'recuerdo',
        icon: '📸',
        badgeColor: 'purple',
        tagColor: 'purple',
        tag: 'NUEVO RECUERDO',
        meta: this.formatRelativeTime(m.createdAt || m.date),
        thumb: m.coverImage || (m.photos && m.photos[0]) || ''
      })),
      ...(data.songs || []).map(s => ({
        ...s,
        _type: 'musica',
        icon: '🎵',
        badgeColor: 'blue',
        tagColor: 'blue',
        tag: 'CANCIÓN AÑADIDA',
        meta: `Agregado por ${s.addedBy || 'Miembro'} · ${this.formatRelativeTime(s.createdAt)}`
      })),
      ...(data.movies || []).map(m => ({
        ...m,
        _type: 'cine',
        icon: '🎬',
        badgeColor: 'indigo',
        tagColor: 'indigo',
        tag: 'PELÍCULA RECOMENDADA',
        meta: `Propuesta por ${m.proposedBy || 'Miembro'} · ${this.formatRelativeTime(m.createdAt)}`
      })),
      ...(data.goals || []).map(g => ({
        ...g,
        _type: 'objetivos',
        icon: '🎯',
        badgeColor: 'rose',
        tagColor: 'rose',
        tag: 'OBJETIVO COMPARTIDO',
        meta: `Creado por ${g.participants?.[0] || 'Miembro'} · ${this.formatRelativeTime(g.createdAt)}`
      }))
    ].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

    if (allItems.length === 0) {
      feedContainer.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-text-secondary);">
          <span style="font-size: 2rem;">🌟</span>
          <p style="margin-top: 0.5rem;">¡Comiencen a compartir recuerdos, música y metas en ${group.name}!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = '';
    allItems.slice(0, 9).forEach(item => {
      const card = document.createElement('div');
      card.className = 'activity-item-card';

      let rightSideHtml = '';
      if (item._type === 'musica') {
        const art = item.artwork || 'assets/icon.png';
        rightSideHtml = `
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <img src="${art}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid var(--color-border);" alt="Portada" />
            <button type="button" class="btn-activity-play-circle" onclick="window.app.playTrackDirectly('${item.id}')" title="Reproducir canción" style="width: 32px; height: 32px; border-radius: 50%; background: #182035; border: 1px solid var(--color-border); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; cursor: pointer;">
              ▶
            </button>
          </div>
        `;
      } else if (item.thumb) {
        rightSideHtml = `<img src="${item.thumb}" class="activity-thumb-img" alt="Recuerdo" onclick="window.app.openLightbox('${item.thumb}')" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" />`;
      }

      card.innerHTML = `
        <div class="activity-card-left">
          <div class="activity-icon-badge ${item.badgeColor || 'purple'}">${item.icon}</div>
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span class="activity-title" style="font-weight: 700; font-size: 0.88rem; color: var(--color-text-main);">
                ${window.Utils.sanitizeHTML(item.title || item.name || 'Sin título')}
              </span>
              <span class="activity-tag ${item.tagColor || 'purple'}">${item.tag}</span>
            </div>
            <div class="activity-meta">
              ${window.Utils.sanitizeHTML(item.meta || '')}
            </div>
          </div>
        </div>
        ${rightSideHtml}
      `;
      feedContainer.appendChild(card);
    });
  }

  formatRelativeTime(dateStr) {
    if (!dateStr) return 'Recientemente';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos momentos';
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return window.Utils.formatDateES(dateStr);
  }

  // --- MIS GRUPOS / SWITCHER ---
  openGroupsListModal() {
    const container = document.getElementById('groups-switcher-list');
    const groups = this.storage.getGroups() || [];
    const activeGroup = this.storage.getActiveGroup();

    if (container) {
      container.innerHTML = '';
      groups.forEach(g => {
        const isActive = activeGroup && activeGroup.id === g.id;
        const item = document.createElement('div');
        item.className = 'group-menu-action-item';
        item.style.borderColor = isActive ? 'var(--color-primary)' : 'var(--color-border)';
        item.style.background = isActive ? '#EDE9FE' : '#F8FAFC';

        item.innerHTML = `
          <div class="group-menu-icon" style="font-size: 1.6rem;">${g.icon || '🌟'}</div>
          <div style="flex: 1; min-width: 0;">
            <strong style="color: var(--color-text-main); font-size: 1rem;">${window.Utils.sanitizeHTML(g.name)}</strong>
            <p style="color: var(--color-text-secondary); font-size: 0.8rem;">Código: <strong>${g.code}</strong> · ${g.members?.length || 1} miembros</p>
          </div>
          <button type="button" class="${isActive ? 'btn-primary' : 'btn-secondary'}" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">
            ${isActive ? 'Activo ✓' : 'Entrar ➔'}
          </button>
        `;

        item.onclick = () => {
          this.storage.switchGroup(g.id);
          this.closeModal('modal-groups-list');
          
          document.getElementById('onboarding-screen').style.display = 'none';
          document.getElementById('app-container').style.display = 'flex';
          this.updateHeader();
          window.location.hash = '#inicio';
          this.handleHashChange();
          window.Utils.showToast(`Entraste a "${g.name}" 🚀`, 'success');
        };

        container.appendChild(item);
      });
    }

    this.openModal('modal-groups-list');
  }

  // --- MODAL: EDITAR GRUPO ---
  openEditGroupModal() {
    const group = this.storage.getActiveGroup();
    if (!group) return;

    document.getElementById('edit-group-name').value = group.name || '';
    document.getElementById('edit-group-icon').value = group.icon || '🌟';
    document.getElementById('edit-group-color').value = group.color || '#6366F1';
    document.getElementById('edit-group-cover-url').value = group.coverImage || '';

    this.openModal('modal-edit-group');
  }

  // --- 2. RENDER RECUERDOS (NÚCLEO EMOCIONAL & LÍNEA TEMPORAL VIVA) ---
  renderMemories() {
    this.initMemoriesCalendar();
    this.initMemoriesSearchAndFilters();

    const container = document.getElementById('memories-grid-list');
    if (!container) return;

    let memories = this.storage.getMemories() || [];
    const filterVal = document.getElementById('select-memories-filter')?.value || 'recent';
    const searchQuery = (document.getElementById('input-search-memories')?.value || '').trim().toLowerCase();

    // 1. Filtrado por Búsqueda en Tiempo Real
    if (searchQuery) {
      memories = memories.filter(m => {
        const inTitle = (m.title || '').toLowerCase().includes(searchQuery);
        const inDesc = (m.description || '').toLowerCase().includes(searchQuery);
        const inLoc = (m.location || '').toLowerCase().includes(searchQuery);
        const inSong = m.song ? `${m.song.title || ''} ${m.song.artist || ''}`.toLowerCase().includes(searchQuery) : false;
        const inAuthor = (m.author?.name || '').toLowerCase().includes(searchQuery);
        const inComments = (m.comments || []).some(c => (c.text || '').toLowerCase().includes(searchQuery));
        return inTitle || inDesc || inLoc || inSong || inAuthor || inComments;
      });
    }

    // 2. Filtrado por Tipo / Categoría
    if (filterVal === 'featured') {
      memories = memories.filter(m => m.isFeatured || m.status === 'Destacado');
    } else if (filterVal === 'photos') {
      memories = memories.filter(m => m.coverImage || (m.photos && m.photos.length > 0));
    } else if (filterVal === 'videos') {
      memories = memories.filter(m => m.isVideo || (m.photos && m.photos.some(p => typeof p === 'string' && (p.includes('.mp4') || p.includes('video')))));
    } else if (filterVal === 'songs') {
      memories = memories.filter(m => m.song && (m.song.title || m.song.previewUrl));
    } else if (filterVal === 'audios') {
      memories = memories.filter(m => m.audioNote || m.voiceNote);
    }

    // 3. Orden Cronológico
    memories.sort((a, b) => {
      const tA = new Date(a.date || a.createdAt).getTime();
      const tB = new Date(b.date || b.createdAt).getTime();
      return filterVal === 'oldest' ? tA - tB : tB - tA;
    });

    // 4. Render Vacío
    if (memories.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 2.5rem 1.5rem; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); margin-top: 1rem;">
          <span style="font-size: 2.5rem;">📸</span>
          <h4 style="margin-top: 0.5rem; font-size: 1.1rem; color: var(--color-text-main);">Ningún recuerdo encontrado</h4>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 0.25rem;">${searchQuery ? 'Prueba con otra palabra clave en el buscador.' : 'Inmortaliza el primer momento de este grupo.'}</p>
          <button type="button" class="btn-primary" style="margin-top: 1.25rem;" onclick="window.app.openMemoryModal()">
            + Inmortalizar Recuerdo
          </button>
        </div>
      `;
      return;
    }

    // 5. Render de la Línea Temporal de Nodos
    container.innerHTML = memories.map(mem => {
      const d = new Date(mem.date || mem.createdAt);
      const dayNum = !isNaN(d.getDate()) ? d.getDate() : 1;
      const monthShort = !isNaN(d.getMonth()) ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()] : 'Rec';
      const yearNum = !isNaN(d.getFullYear()) ? d.getFullYear() : 2025;

      const coverSrc = mem.coverImage || (mem.photos && mem.photos[0]) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
      const photosCount = mem.photosCount || (mem.photos ? mem.photos.length : 1);
      const isFeatured = Boolean(mem.isFeatured || mem.status === 'Destacado');
      const auraColor = mem.auraColor || (isFeatured ? '#F59E0B' : '#6366F1');
      const authorName = mem.author?.name || 'Kevin';
      const commentsCount = mem.commentsCount || (mem.comments ? mem.comments.length : 0);

      let mediaBadge = `📷 ${photosCount}`;
      if (mem.isVideo) mediaBadge = `▶ Video`;

      // Mini Player Musical
      let songHtml = '';
      if (mem.song && (mem.song.title || mem.song.previewUrl)) {
        songHtml = `
          <div class="card-soundtrack-box" onclick="event.stopPropagation(); window.app.playMemorySong('${mem.id}')">
            <div class="soundtrack-meta-left">
              <span>🎵</span>
              <div style="min-width: 0;">
                <div class="soundtrack-title-text">${window.Utils.sanitizeHTML(mem.song.title)}</div>
                <div class="soundtrack-artist-text">${window.Utils.sanitizeHTML(mem.song.artist || '')}</div>
              </div>
            </div>
            <button type="button" class="btn-mini-play" title="Reproducir">▶</button>
          </div>
        `;
      }

      // Mini Nota de Voz
      let voiceHtml = '';
      if (mem.audioNote || mem.voiceNote) {
        const dur = (mem.audioNote?.duration || mem.voiceNote?.duration || '0:45');
        voiceHtml = `
          <div class="card-voice-note-box" onclick="event.stopPropagation(); window.app.playMemoryVoiceNote('${mem.id}')">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.85rem; color: #38BDF8;">🎙️</span>
              <span class="voice-waveform-static">||||||||||||</span>
              <span style="font-size: 0.72rem; color: var(--color-text-secondary);">${dur}</span>
            </div>
            <button type="button" class="btn-mini-play" title="Escuchar">▶</button>
          </div>
        `;
      }

      return `
        <div class="timeline-memory-node" data-id="${mem.id}" id="memory-node-${mem.id}">
          <!-- Fecha Lateral Izquierda -->
          <div class="node-date-stamp">
            <span class="node-date-day">${dayNum} ${monthShort}</span>
            <span class="node-date-year">${yearNum}</span>
          </div>

          <!-- Pin Conector Luminoso -->
          <div class="node-pin-dot" style="background: ${auraColor}; box-shadow: 0 0 12px ${auraColor};"></div>

          <!-- Tarjeta del Recuerdo (Diseño Vertical Story Card) -->
          <div class="emotional-memory-card" style="--card-aura: ${auraColor};" onclick="window.app.openMemoryView('${mem.id}')">
            <!-- Portada Superior -->
            <div class="card-media-side">
              <img src="${coverSrc}" class="card-media-img" alt="${window.Utils.sanitizeHTML(mem.title)}" loading="lazy" />
              <div class="card-media-badge">${mediaBadge}</div>
              ${isFeatured ? '<div class="card-featured-badge">⭐ Destacado</div>' : ''}
            </div>

            <!-- Información Completa -->
            <div class="card-info-side">
              <div>
                <h3 class="card-memory-title">${window.Utils.sanitizeHTML(mem.title)}</h3>

                <div class="card-author-meta">
                  <span>👤 ${window.Utils.sanitizeHTML(authorName)}</span>
                  ${mem.location ? `<span>• 📍 ${window.Utils.sanitizeHTML(mem.location)}</span>` : ''}
                </div>

                ${mem.description ? `<p class="card-story-preview">${window.Utils.sanitizeHTML(mem.description)}</p>` : ''}
              </div>

              <div>
                ${songHtml}
                ${voiceHtml}

                <div class="card-bottom-row">
                  <div class="card-couple-avatars">
                    <div class="couple-avatar-bubble" title="Kevin">K</div>
                    <div class="couple-avatar-bubble" title="Wendy" style="background: #EC4899;">W</div>
                  </div>

                  <div class="card-comments-pill" onclick="event.stopPropagation(); window.app.openMemoryView('${mem.id}')">
                    <span>💬</span>
                    <span>${commentsCount}</span>
                  </div>

                  <button type="button" class="btn-card-menu-dots" onclick="event.stopPropagation(); window.app.openMemoryActionsMenu('${mem.id}')" title="Opciones">•••</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- MOTOR DE DÍAS FESTIVOS (COLOMBIA & INTERNACIONAL PARA CUALQUIER AÑO) ---
  getHolidaysForYear(year) {
    const y = parseInt(year, 10);
    // Algoritmo de Pascua de Gauss / Meeus
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    const easterDate = new Date(Date.UTC(y, month, day));

    function addDays(dt, days) {
      const res = new Date(dt.getTime());
      res.setUTCDate(res.getUTCDate() + days);
      return res;
    }

    function getNextMonday(dt) {
      const res = new Date(dt.getTime());
      const dayOfWeek = res.getUTCDay();
      if (dayOfWeek === 1) return res;
      const daysToAdd = (8 - dayOfWeek) % 7;
      res.setUTCDate(res.getUTCDate() + (daysToAdd === 0 ? 7 : daysToAdd));
      return res;
    }

    const holidays = [
      { date: new Date(Date.UTC(y, 0, 1)), name: 'Año Nuevo' },
      { date: getNextMonday(new Date(Date.UTC(y, 0, 6))), name: 'Reyes Magos' },
      { date: getNextMonday(new Date(Date.UTC(y, 2, 19))), name: 'San José' },
      { date: addDays(easterDate, -3), name: 'Jueves Santo' },
      { date: addDays(easterDate, -2), name: 'Viernes Santo' },
      { date: new Date(Date.UTC(y, 4, 1)), name: 'Día del Trabajo' },
      { date: getNextMonday(addDays(easterDate, 39)), name: 'Ascensión del Señor' },
      { date: getNextMonday(addDays(easterDate, 60)), name: 'Corpus Christi' },
      { date: getNextMonday(addDays(easterDate, 68)), name: 'Sagrado Corazón' },
      { date: getNextMonday(new Date(Date.UTC(y, 5, 29))), name: 'San Pedro y San Pablo' },
      { date: new Date(Date.UTC(y, 6, 20)), name: 'Día de la Independencia' },
      { date: new Date(Date.UTC(y, 7, 7)), name: 'Batalla de Boyacá' },
      { date: getNextMonday(new Date(Date.UTC(y, 7, 15))), name: 'Asunción de la Virgen' },
      { date: getNextMonday(new Date(Date.UTC(y, 9, 12))), name: 'Día de la Raza' },
      { date: getNextMonday(new Date(Date.UTC(y, 10, 1))), name: 'Todos los Santos' },
      { date: getNextMonday(new Date(Date.UTC(y, 10, 11))), name: 'Independencia de Cartagena' },
      { date: new Date(Date.UTC(y, 11, 8)), name: 'Inmaculada Concepción' },
      { date: new Date(Date.UTC(y, 11, 25)), name: 'Navidad' }
    ];

    return holidays.map(h => ({
      year: y,
      month: h.date.getUTCMonth(),
      day: h.date.getUTCDate(),
      name: h.name,
      dateStr: `${y}-${(h.date.getUTCMonth() + 1).toString().padStart(2, '0')}-${h.date.getUTCDate().toString().padStart(2, '0')}`
    }));
  }

  // --- CALENDARIO MENSUAL COMPLETO INTERACTIVO (TODOS LOS DÍAS, FESTIVOS Y AÑADIR RECUERDO POR DÍA) ---
  initMemoriesCalendar() {
    const strip = document.getElementById('calendar-months-strip');
    const yearSelect = document.getElementById('select-calendar-year');
    const daysGrid = document.getElementById('calendar-full-days-grid');
    const labelMonthYear = document.getElementById('calendar-month-year-label');
    const dayActionContainer = document.getElementById('calendar-selected-day-action');
    const detailsContainer = document.getElementById('calendar-active-month-details');
    const btnPrev = document.getElementById('btn-cal-prev-month');
    const btnNext = document.getElementById('btn-cal-next-month');

    if (!strip || !yearSelect) return;

    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth();
    const currentRealDay = now.getDate();

    if (this.activeCalendarYear === undefined) {
      this.activeCalendarYear = currentRealYear;
    }
    if (this.activeCalendarMonth === undefined) {
      this.activeCalendarMonth = currentRealMonth;
    }

    const selectedYear = this.activeCalendarYear;

    // Poblar y sincronizar selector de año (rango dinámico continuo 2020 a 2035)
    const minRangeYear = Math.min(2020, this.activeCalendarYear - 2);
    const maxRangeYear = Math.max(2035, this.activeCalendarYear + 5);
    const currentOptions = Array.from(yearSelect.options).map(o => parseInt(o.value, 10));

    if (!currentOptions.includes(this.activeCalendarYear) || currentOptions.length === 0) {
      yearSelect.innerHTML = '';
      for (let y = minRangeYear; y <= maxRangeYear; y++) {
        const opt = document.createElement('option');
        opt.value = y.toString();
        opt.textContent = y.toString();
        if (y === this.activeCalendarYear) opt.selected = true;
        yearSelect.appendChild(opt);
      }
    }
    yearSelect.value = this.activeCalendarYear.toString();

    const holidays = this.getHolidaysForYear(selectedYear);
    const memories = this.storage.getMemories() || [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthFullNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (labelMonthYear) {
      labelMonthYear.textContent = `${monthFullNames[this.activeCalendarMonth]} ${selectedYear}`;
    }

    // Botón "Hoy" para regresar inmediatamente a la fecha actual
    const btnJumpToday = document.getElementById('btn-cal-jump-today');
    if (btnJumpToday) {
      btnJumpToday.onclick = () => {
        const today = new Date();
        this.activeCalendarYear = today.getFullYear();
        this.activeCalendarMonth = today.getMonth();
        this.selectedCalendarDay = today.getDate();
        this.initMemoriesCalendar();
        window.Utils.showToast('Regresaste a la fecha de hoy 📅✨', 'info');
      };
    }

    // Botones de navegación de mes anterior / siguiente
    if (btnPrev) {
      btnPrev.onclick = () => {
        if (this.activeCalendarMonth === 0) {
          this.activeCalendarMonth = 11;
          this.activeCalendarYear -= 1;
        } else {
          this.activeCalendarMonth -= 1;
        }
        this.selectedCalendarDay = 1;
        this.initMemoriesCalendar();
      };
    }
    if (btnNext) {
      btnNext.onclick = () => {
        if (this.activeCalendarMonth === 11) {
          this.activeCalendarMonth = 0;
          this.activeCalendarYear += 1;
        } else {
          this.activeCalendarMonth += 1;
        }
        this.selectedCalendarDay = 1;
        this.initMemoriesCalendar();
      };
    }

    yearSelect.onchange = () => {
      this.activeCalendarYear = parseInt(yearSelect.value, 10);
      this.initMemoriesCalendar();
    };

    // 1. Selector rápido de los 12 meses horizontales (Limpio, sin puntos verdes innecesarios)
    strip.innerHTML = monthNames.map((mName, mIdx) => {
      const monthMemories = memories.filter(m => {
        const d = new Date(m.date || m.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === mIdx;
      });

      const isCurrentActive = this.activeCalendarMonth === mIdx;

      // Solo puntos morados si hay recuerdos reales
      let dotsHtml = '';
      if (monthMemories.length > 0) {
        dotsHtml = `<span class="cal-dot purple"></span>`;
      }

      return `
        <div class="calendar-month-col ${isCurrentActive ? 'active' : ''}" data-month="${mIdx}" onclick="window.app.onCalendarMonthSelect(${mIdx}, ${selectedYear})">
          <span class="month-name-pill">${mName}</span>
          ${dotsHtml ? `<div class="month-dots-grid">${dotsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    // 2. Cuadrícula de Todos los Días del Mes (Lunes a Domingo)
    const plans = this.storage.getPlans() || [];
    const todayStr = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;

    if (daysGrid) {
      const firstDayOfMonth = new Date(selectedYear, this.activeCalendarMonth, 1);
      const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
      const daysInMonth = new Date(selectedYear, this.activeCalendarMonth + 1, 0).getDate();

      // Ajuste de día seleccionado por defecto
      if (!this.selectedCalendarDay || this.selectedCalendarDay > daysInMonth) {
        this.selectedCalendarDay = (selectedYear === currentRealYear && this.activeCalendarMonth === currentRealMonth) ? currentRealDay : 1;
      }

      let gridHtml = '';

      // Celdas vacías previas
      for (let i = 0; i < startDayIndex; i++) {
        gridHtml += `<div class="cal-day-cell empty"></div>`;
      }

      // Celdas de días del mes
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const dayDateStr = `${selectedYear}-${String(this.activeCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const isToday = (selectedYear === currentRealYear && this.activeCalendarMonth === currentRealMonth && dayNum === currentRealDay);
        const holiday = holidays.find(h => h.month === this.activeCalendarMonth && h.day === dayNum);
        const dayMemories = memories.filter(m => {
          const d = new Date(m.date || m.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === this.activeCalendarMonth && d.getDate() === dayNum;
        });
        const dayPlans = plans.filter(p => p.date === dayDateStr);

        const hasMemory = dayMemories.length > 0;
        const hasPlan = dayPlans.length > 0;
        const isSelected = this.selectedCalendarDay === dayNum;

        let dayClass = 'cal-day-cell';
        if (isToday) dayClass += ' today';
        if (holiday) dayClass += ' holiday';
        if (isSelected) dayClass += ' active';

        let dotsHtml = '';
        if (hasMemory) dotsHtml += `<span class="day-mini-dot memory" title="${dayMemories.length} recuerdo(s)"></span>`;
        if (hasPlan) dotsHtml += `<span class="day-mini-dot plan" title="Plan: ${dayPlans[0].title}"></span>`;
        if (holiday) dotsHtml += `<span class="day-mini-dot holiday" title="Festivo: ${holiday.name}"></span>`;

        gridHtml += `
          <div class="${dayClass}" onclick="window.app.onCalendarDaySelect(${dayNum}, ${this.activeCalendarMonth}, ${selectedYear})" title="${holiday ? '🎉 ' + holiday.name : ''}">
            <span class="day-number">${dayNum}</span>
            <div class="day-dots-wrap">
              ${dotsHtml}
            </div>
          </div>
        `;
      }

      daysGrid.innerHTML = gridHtml;
    }

    // 3. Barra de Acción del Día Seleccionado (Diferenciando Fechas Futuras vs Recuerdos Pasados/Hoy)
    if (dayActionContainer) {
      const activeDay = this.selectedCalendarDay || 1;
      const targetDate = new Date(selectedYear, this.activeCalendarMonth, activeDay);
      const weekdayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const weekdayStr = weekdayNames[targetDate.getDay()];
      const isToday = (selectedYear === currentRealYear && this.activeCalendarMonth === currentRealMonth && activeDay === currentRealDay);
      const holiday = holidays.find(h => h.month === this.activeCalendarMonth && h.day === activeDay);
      const targetDateStr = `${selectedYear}-${String(this.activeCalendarMonth + 1).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`;
      const isFuture = targetDateStr > todayStr;

      const dayMemories = memories.filter(m => {
        const d = new Date(m.date || m.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === this.activeCalendarMonth && d.getDate() === activeDay;
      });
      const dayPlans = plans.filter(p => p.date === targetDateStr);

      let descHtml = '';
      let btnActionHtml = '';

      if (isFuture) {
        // Fecha Futura ➔ Plan a futuro / Cita compartida
        if (dayPlans.length > 0) {
          descHtml = `<span style="color: #38BDF8; font-weight: 700;">🗓️ Plan: ${window.Utils.sanitizeHTML(dayPlans[0].title)}</span>`;
        } else {
          descHtml = `<span style="color: var(--color-text-secondary);">Planifica una cita, viaje o evento futuro</span>`;
        }
        if (holiday) descHtml += ` <span style="color: #10B981; font-weight: 700;">• 🎉 ${holiday.name}</span>`;

        btnActionHtml = `
          <button type="button" class="btn-add-plan-day" onclick="window.app.openPlanModalForDate('${targetDateStr}')">
            <span>+ Crear plan a futuro 🗓️</span>
          </button>
        `;
      } else {
        // Fecha Pasada o Hoy ➔ Recuerdo
        if (dayMemories.length > 0) {
          descHtml = `<span style="color: #A855F7; font-weight: 700;">📸 ${dayMemories.length} recuerdo(s) este día</span>`;
        } else {
          descHtml = `<span style="color: var(--color-text-secondary);">Sin recuerdos registrados</span>`;
        }
        if (holiday) descHtml += ` <span style="color: #10B981; font-weight: 700;">• 🎉 ${holiday.name}</span>`;

        btnActionHtml = `
          <button type="button" class="btn-add-memory-day" onclick="window.app.openMemoryModalForDate('${targetDateStr}')">
            <span>+ Añadir recuerdo 📸</span>
          </button>
        `;
      }

      dayActionContainer.innerHTML = `
        <div class="action-day-info">
          <div class="action-day-title">
            <span>📅 ${weekdayStr}, ${activeDay} de ${monthFullNames[this.activeCalendarMonth]}</span>
            ${isToday ? '<span class="today-tag" style="background:#6366F1; color:#FFF; font-size:0.65rem; padding:0.15rem 0.4rem; border-radius:12px; font-weight:800;">HOY</span>' : ''}
          </div>
          <div class="action-day-desc">${descHtml}</div>
        </div>
        ${btnActionHtml}
      `;
    }

    // 4. Panel Informativo de Días Festivos del Mes
    if (detailsContainer) {
      const activeHolidays = holidays.filter(h => h.month === this.activeCalendarMonth);

      if (activeHolidays.length > 0) {
        detailsContainer.innerHTML = `
          <div>
            <div style="font-size: 0.72rem; font-weight: 800; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem;">
              🎉 Días Festivos en ${monthFullNames[this.activeCalendarMonth]} (${activeHolidays.length})
            </div>
            <div class="calendar-holidays-list">
              ${activeHolidays.map(h => `
                <span class="holiday-pill-item" onclick="window.app.onCalendarDaySelect(${h.day}, ${h.month}, ${selectedYear})" style="cursor: pointer;" title="Tocar para seleccionar">
                  <span>🎉</span>
                  <span><strong>${h.day} ${monthNames[h.month]}:</strong> ${h.name}</span>
                </span>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        detailsContainer.innerHTML = `
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">
            No hay días festivos en ${monthFullNames[this.activeCalendarMonth]}.
          </div>
        `;
      }
    }
  }

  onCalendarMonthSelect(monthIdx, year) {
    this.activeCalendarMonth = monthIdx;
    this.selectedCalendarDay = 1;
    this.initMemoriesCalendar();

    // Desplazamiento suave al primer recuerdo de ese mes en la línea temporal
    const memories = this.storage.getMemories() || [];
    const match = memories.find(m => {
      const d = new Date(m.date || m.createdAt);
      return d.getFullYear() === year && d.getMonth() === monthIdx;
    });

    if (match) {
      const el = document.getElementById(`memory-node-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transform = 'scale(1.03)';
        setTimeout(() => { el.style.transform = ''; }, 600);
      }
    }
  }

  onCalendarDaySelect(dayNum, monthIdx, year) {
    this.selectedCalendarDay = dayNum;
    this.activeCalendarMonth = monthIdx;
    this.activeCalendarYear = year;
    this.initMemoriesCalendar();

    // Buscar si hay recuerdos ese día y hacer scroll
    const memories = this.storage.getMemories() || [];
    const match = memories.find(m => {
      const d = new Date(m.date || m.createdAt);
      return d.getFullYear() === year && d.getMonth() === monthIdx && d.getDate() === dayNum;
    });

    if (match) {
      const el = document.getElementById(`memory-node-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transform = 'scale(1.04)';
        setTimeout(() => { el.style.transform = ''; }, 600);
      }
    }
  }

  openMemoryModalForDate(dateStr) {
    this.openMemoryModal();
    const dateInput = document.getElementById('memory-date-input');
    if (dateInput) {
      dateInput.value = dateStr;
      dateInput.classList.remove('date-input-hidden');
    }
    document.querySelectorAll('.date-preset-pill').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-date-custom')?.classList.add('active');
  }

  openPlanModalForDate(dateStr) {
    document.getElementById('form-plan')?.reset();
    document.getElementById('plan-id').value = '';
    const dateInput = document.getElementById('plan-date-input');
    if (dateInput) {
      dateInput.value = dateStr;
    }
    this.initPlanTimePresets();
    this.openModal('modal-plan');
  }

  initPlanTimePresets() {
    const presets = document.querySelectorAll('.time-preset-pill');
    const timeInput = document.getElementById('plan-time-input');

    presets.forEach(btn => {
      btn.classList.remove('active');
      btn.onclick = () => {
        presets.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (timeInput) timeInput.value = btn.dataset.time || '';
      };
    });

    if (timeInput) {
      timeInput.oninput = () => {
        presets.forEach(p => p.classList.remove('active'));
        const match = Array.from(presets).find(p => p.dataset.time === timeInput.value);
        if (match) match.classList.add('active');
      };
    }
  }

  // --- BUSCADOR Y FILTROS EN TIEMPO REAL ---
  initMemoriesSearchAndFilters() {
    const filterSelect = document.getElementById('select-memories-filter');
    const searchInput = document.getElementById('input-search-memories');
    const clearBtn = document.getElementById('btn-clear-memories-search');
    const btnNew = document.getElementById('btn-new-memory');
    const btnBackup = document.getElementById('btn-cloud-backup-view');

    if (filterSelect && !filterSelect.dataset.bound) {
      filterSelect.dataset.bound = 'true';
      filterSelect.onchange = () => this.renderMemories();
    }

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.oninput = () => {
        if (clearBtn) clearBtn.style.display = searchInput.value ? 'block' : 'none';
        this.renderMemories();
      };
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.onclick = () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this.renderMemories();
      };
    }

    if (btnNew && !btnNew.dataset.bound) {
      btnNew.dataset.bound = 'true';
      btnNew.onclick = () => this.openMemoryModal();
    }

    if (btnBackup && !btnBackup.dataset.bound) {
      btnBackup.dataset.bound = 'true';
      btnBackup.onclick = () => {
        window.Utils.showToast('Todos los recuerdos están sincronizados y respaldados en la nube ✅', 'success');
      };
    }

    const btnDrive = document.getElementById('btn-header-gdrive');
    if (btnDrive && !btnDrive.dataset.bound) {
      btnDrive.dataset.bound = 'true';
      btnDrive.onclick = () => this.openDriveSyncModal();
    }
  }

  // --- MODAL: VINCULAR CARPETA DE GOOGLE DRIVE ---
  openDriveSyncModal() {
    const currentFolder = this.storage.getDriveFolder();
    const inputFolder = document.getElementById('drive-folder-url-input');
    const preview = document.getElementById('drive-sync-status-preview');
    const text = document.getElementById('drive-current-folder-text');
    const btnTest = document.getElementById('btn-test-drive-connection');

    if (inputFolder) inputFolder.value = currentFolder;

    if (currentFolder && preview && text) {
      preview.style.display = 'block';
      text.textContent = currentFolder;
    } else if (preview) {
      preview.style.display = 'none';
    }

    if (btnTest && !btnTest.dataset.bound) {
      btnTest.dataset.bound = 'true';
      btnTest.onclick = async () => {
        const folderUrl = inputFolder?.value.trim();
        if (!folderUrl) {
          window.Utils.showToast('Pega primero el enlace de tu carpeta de Google Drive', 'error');
          return;
        }
        btnTest.disabled = true;
        btnTest.textContent = '⏳ Probando...';
        try {
          const webhookUrl = this.storage.getDriveWebhook ? this.storage.getDriveWebhook() : '';
          const testMem = {
            title: 'Prueba de Conexión LUMA',
            date: new Date().toISOString().split('T')[0],
            coverImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
          };
          const res = await window.GoogleDriveSync.uploadMemoryToDrive(testMem, folderUrl, webhookUrl);
          if (res && res.success) {
            window.Utils.showToast('🎉 ¡Conexión Exitosa! Tu carpeta de Google Drive está lista para recibir fotos y videos.', 'success');
          } else {
            window.Utils.showToast('Verifica que la carpeta tenga permisos de Editor para «Cualquier persona con el enlace»', 'error');
          }
        } catch (err) {
          window.Utils.showToast('Error al conectar: ' + err.message, 'error');
        } finally {
          btnTest.disabled = false;
          btnTest.textContent = '🚀 Probar Conexión';
        }
      };
    }

    this.openModal('modal-drive-sync');
  }

  // --- MODAL: CREAR / EDITAR RECUERDO (DIARIO EMOCIONAL) ---
  openMemoryModal(memId = null) {
    const profile = this.storage.getUserProfile() || {};
    const authorAvatar = document.getElementById('creator-author-avatar');
    const authorName = document.getElementById('creator-author-name');
    if (authorAvatar) authorAvatar.textContent = (profile.name || 'U').charAt(0).toUpperCase();
    if (authorName) authorName.textContent = profile.name || 'Tú';

    this.selectedMemoryCover = null;
    this.selectedMemoryGallery = [];

    // Reset fields
    document.getElementById('memory-edit-id').value = memId || '';
    document.getElementById('memory-title-input').value = '';
    document.getElementById('memory-location-input').value = '';
    document.getElementById('memory-desc-input').value = '';
    document.getElementById('memory-aura-color').value = '#F59E0B';
    document.getElementById('memory-is-featured').value = 'false';
    document.getElementById('memory-audio-data').value = '';
    document.getElementById('memory-song-data').value = '';

    // Date default: Today
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('memory-date-input');
    if (dateInput) dateInput.value = todayStr;

    // Cover picker setup
    const coverPreview = document.getElementById('memory-cover-preview-img');
    const coverVideo = document.getElementById('memory-cover-preview-video');
    const placeholder = document.getElementById('memory-cover-placeholder');
    const btnCover = document.getElementById('btn-trigger-cover-file');
    const fileInput = document.getElementById('memory-cover-file');
    const coverBox = document.getElementById('memory-cover-picker-box');

    if (coverPreview) { coverPreview.src = ''; coverPreview.style.display = 'none'; }
    if (coverVideo) { coverVideo.src = ''; coverVideo.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'flex';
    if (btnCover) btnCover.style.display = 'none';

    // Click handler para abrir selector de portada
    if (coverBox && fileInput) {
      coverBox.onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const isVideo = file.type.startsWith('video');
        const dataUrl = await window.Utils.fileToBase64(file);
        this.selectedMemoryCover = { isVideo, dataUrl, name: file.name, file };

        if (placeholder) placeholder.style.display = 'none';
        if (btnCover) btnCover.style.display = 'block';

        if (isVideo) {
          if (coverPreview) coverPreview.style.display = 'none';
          if (coverVideo) {
            coverVideo.src = dataUrl;
            coverVideo.style.display = 'block';
          }
        } else {
          if (coverVideo) coverVideo.style.display = 'none';
          if (coverPreview) {
            coverPreview.src = dataUrl;
            coverPreview.style.display = 'block';
          }
        }
      };
    }

    // Galería múltiple de fotos y videos
    const galleryInput = document.getElementById('memory-photos-file');
    if (galleryInput) {
      galleryInput.onchange = async () => {
        const files = Array.from(galleryInput.files || []);
        for (const file of files) {
          const isVideo = file.type.startsWith('video');
          const dataUrl = await window.Utils.fileToBase64(file);
          this.selectedMemoryGallery.push({
            id: 'g_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            isVideo,
            dataUrl,
            name: file.name,
            file
          });
        }
        galleryInput.value = '';
        this.renderMemoryGalleryPreviews();
      };
    }
    this.renderMemoryGalleryPreviews();

    // Aura Color Selectors
    document.querySelectorAll('.aura-color-pill').forEach(pill => {
      pill.classList.remove('active');
      if (pill.getAttribute('data-aura') === '#F59E0B') pill.classList.add('active');
      pill.onclick = () => {
        document.querySelectorAll('.aura-color-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        document.getElementById('memory-aura-color').value = pill.getAttribute('data-aura');
      };
    });

    // Date Presets
    const btnToday = document.getElementById('btn-date-today');
    const btnYesterday = document.getElementById('btn-date-yesterday');
    const btnCustom = document.getElementById('btn-date-custom');

    if (btnToday) {
      btnToday.onclick = () => {
        document.querySelectorAll('.date-preset-pill').forEach(p => p.classList.remove('active'));
        btnToday.classList.add('active');
        dateInput.value = new Date().toISOString().split('T')[0];
      };
    }
    if (btnYesterday) {
      btnYesterday.onclick = () => {
        document.querySelectorAll('.date-preset-pill').forEach(p => p.classList.remove('active'));
        btnYesterday.classList.add('active');
        const y = new Date(Date.now() - 86400000);
        dateInput.value = y.toISOString().split('T')[0];
      };
    }
    if (btnCustom) {
      btnCustom.onclick = () => {
        document.querySelectorAll('.date-preset-pill').forEach(p => p.classList.remove('active'));
        btnCustom.classList.add('active');
        dateInput.showPicker ? dateInput.showPicker() : dateInput.focus();
      };
    }

    // Status Presets
    const btnSaved = document.getElementById('btn-status-saved');
    const btnFeatured = document.getElementById('btn-status-featured');
    if (btnSaved && btnFeatured) {
      btnSaved.onclick = () => {
        btnSaved.classList.add('active');
        btnFeatured.classList.remove('active');
        document.getElementById('memory-is-featured').value = 'false';
      };
      btnFeatured.onclick = () => {
        btnFeatured.classList.add('active');
        btnSaved.classList.remove('active');
        document.getElementById('memory-is-featured').value = 'true';
      };
    }

    // Si es edición
    if (memId) {
      const mem = this.storage.getMemories().find(m => m.id === memId);
      if (mem) {
        document.getElementById('memory-title-input').value = mem.title || '';
        document.getElementById('memory-location-input').value = mem.location || '';
        document.getElementById('memory-desc-input').value = mem.description || '';
        if (dateInput) dateInput.value = mem.date || todayStr;
        if (mem.coverImage && coverPreview) {
          coverPreview.src = mem.coverImage;
          coverPreview.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
          if (btnCover) btnCover.style.display = 'block';
          this.selectedMemoryCover = { isVideo: Boolean(mem.isVideo), dataUrl: mem.coverImage, name: 'Portada.jpg' };
        }
        if (mem.photos && mem.photos.length > 0) {
          this.selectedMemoryGallery = mem.photos.map((p, idx) => ({
            id: 'g_' + idx,
            isVideo: typeof p === 'string' && (p.includes('.mp4') || p.includes('video')),
            dataUrl: p,
            name: `Foto ${idx + 1}.jpg`
          }));
          this.renderMemoryGalleryPreviews();
        }
      }
    }

    this.bindVoiceRecorderInteractions();
    this.bindSoundtrackPickerInteractions();
    this.openModal('modal-memory');
  }

  renderMemoryGalleryPreviews() {
    const container = document.getElementById('memory-gallery-previews');
    const badge = document.getElementById('gallery-count-badge');
    if (badge) badge.textContent = `${this.selectedMemoryGallery.length} seleccionado(s)`;
    if (!container) return;

    container.innerHTML = this.selectedMemoryGallery.map((item, idx) => `
      <div class="gallery-thumb-item">
        ${item.isVideo 
          ? `<video src="${item.dataUrl}" class="gallery-thumb-img"></video>` 
          : `<img src="${item.dataUrl}" class="gallery-thumb-img" alt="foto ${idx + 1}">`
        }
        <button type="button" class="btn-remove-gallery-item" onclick="event.stopPropagation(); window.app.removeGalleryItem(${idx})" title="Eliminar">✕</button>
      </div>
    `).join('');
  }

  removeGalleryItem(idx) {
    if (idx >= 0 && idx < this.selectedMemoryGallery.length) {
      this.selectedMemoryGallery.splice(idx, 1);
      this.renderMemoryGalleryPreviews();
    }
  }

  // --- INTERACCIÓN DE GRABACIÓN DE VOZ ---
  bindVoiceRecorderInteractions() {
    const btnRecord = document.getElementById('btn-toggle-voice-record');
    const timer = document.getElementById('voice-record-timer');
    const btnText = document.getElementById('voice-record-btn-text');
    if (!btnRecord) return;

    btnRecord.onclick = async () => {
      if (!this.isVoiceRecording) {
        // Start recording
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.mediaRecorder = new MediaRecorder(stream);
          this.audioChunks = [];
          this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
          this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.onloadend = () => {
              document.getElementById('memory-audio-data').value = reader.result;
              window.Utils.showToast('Nota de voz grabada con éxito 🎙️', 'success');
            };
            reader.readAsDataURL(audioBlob);
          };
          this.mediaRecorder.start();
          this.isVoiceRecording = true;
          btnRecord.classList.add('recording');
          if (btnText) btnText.textContent = 'Detener grabación';
          if (timer) {
            timer.style.display = 'inline';
            let sec = 0;
            this.voiceTimerInterval = setInterval(() => {
              sec++;
              const m = Math.floor(sec / 60).toString().padStart(2, '0');
              const s = (sec % 60).toString().padStart(2, '0');
              timer.textContent = `${m}:${s}`;
            }, 1000);
          }
        } catch (_) {
          window.Utils.showToast('Grabando nota de voz de demostración...', 'info');
          document.getElementById('memory-audio-data').value = 'demo_voice_note';
        }
      } else {
        // Stop recording
        this.isVoiceRecording = false;
        btnRecord.classList.remove('recording');
        if (btnText) btnText.textContent = 'Grabar de nuevo';
        if (this.voiceTimerInterval) clearInterval(this.voiceTimerInterval);
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      }
    };
  }

  // --- BÚSQUEDA Y SELECCIÓN DE BANDA SONORA ---
  bindSoundtrackPickerInteractions() {
    const searchInput = document.getElementById('input-soundtrack-search');
    const searchBtn = document.getElementById('btn-search-soundtrack');
    const resultsContainer = document.getElementById('soundtrack-search-results');
    const emptyView = document.getElementById('soundtrack-empty-view');
    const selectedView = document.getElementById('soundtrack-selected-view');
    const btnRemove = document.getElementById('btn-remove-soundtrack');

    if (searchBtn && searchInput) {
      searchBtn.onclick = async () => {
        const q = searchInput.value.trim();
        if (!q) return;
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `<div style="padding: 0.75rem; font-size: 0.8rem; color: var(--color-text-muted);">Buscando en iTunes...</div>`;
        const songs = await this.media.searchSongs(q);
        if (songs.length === 0) {
          resultsContainer.innerHTML = `<div style="padding: 0.75rem; font-size: 0.8rem; color: var(--color-text-muted);">No se encontraron canciones</div>`;
          return;
        }
        resultsContainer.innerHTML = songs.slice(0, 5).map(s => `
          <div class="soundtrack-result-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--color-border);" onclick="window.app.selectSoundtrackForMemory('${encodeURIComponent(JSON.stringify(s))}')">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${s.artwork || ''}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" alt="art">
              <div>
                <div style="font-weight: 700; font-size: 0.82rem; color: var(--color-text-main);">${window.Utils.sanitizeHTML(s.title)}</div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted);">${window.Utils.sanitizeHTML(s.artist)}</div>
              </div>
            </div>
            <span style="font-size: 0.75rem; color: var(--color-primary-light); font-weight: 700;">Elegir</span>
          </div>
        `).join('');
      };
    }

    if (btnRemove) {
      btnRemove.onclick = () => {
        document.getElementById('memory-song-data').value = '';
        if (selectedView) selectedView.style.display = 'none';
        if (emptyView) emptyView.style.display = 'flex';
      };
    }
  }

  selectSoundtrackForMemory(encodedSong) {
    try {
      const s = JSON.parse(decodeURIComponent(encodedSong));
      document.getElementById('memory-song-data').value = JSON.stringify(s);
      const emptyView = document.getElementById('soundtrack-empty-view');
      const selectedView = document.getElementById('soundtrack-selected-view');
      const prevTitle = document.getElementById('soundtrack-preview-title');
      const prevArtist = document.getElementById('soundtrack-preview-artist');
      const prevArt = document.getElementById('soundtrack-preview-artwork');
      const resultsContainer = document.getElementById('soundtrack-search-results');

      if (prevTitle) prevTitle.textContent = s.title;
      if (prevArtist) prevArtist.textContent = s.artist;
      if (prevArt) prevArt.src = s.artwork;
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (emptyView) emptyView.style.display = 'none';
      if (selectedView) selectedView.style.display = 'flex';
    } catch (_) {}
  }

  // --- MODAL FULLSCREEN: VISTA COMPLETA DEL RECUERDO ---
  openMemoryView(memoryId) {
    const memory = (this.storage.getMemories() || []).find(m => m.id === memoryId);
    if (!memory) return;

    this.activeViewingMemoryId = memoryId;
    const body = document.getElementById('memory-view-body-content');
    if (!body) return;

    const coverSrc = memory.coverImage || (memory.photos && memory.photos[0]) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
    const isFeatured = Boolean(memory.isFeatured || memory.status === 'Destacado');
    const authorName = memory.author?.name || 'Kevin';
    const comments = memory.comments || [];

    // Player musical grande
    let musicSection = '';
    if (memory.song && (memory.song.title || memory.song.previewUrl)) {
      musicSection = `
        <div class="card-soundtrack-box" style="padding: 0.85rem 1.15rem; border-radius: var(--radius-lg); margin-top: 1rem; background: rgba(99, 102, 241, 0.12); cursor: pointer;" onclick="window.app.playMemorySong('${memory.id}')">
          <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 8px; background: rgba(99, 102, 241, 0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.25rem;">
              ${memory.song.artwork ? `<img src="${memory.song.artwork}" onerror="this.parentElement.innerHTML='🎵';" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;" alt="art">` : '🎵'}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(memory.song.title)}</div>
              <div style="font-size: 0.78rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(memory.song.artist || '')}</div>
            </div>
          </div>
          <button type="button" class="btn-mini-play" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0;">▶</button>
        </div>
      `;
    }

    // Nota de voz completa
    let voiceSection = '';
    if (memory.audioNote || memory.voiceNote) {
      voiceSection = `
        <div class="card-voice-note-box" style="padding: 0.85rem 1.15rem; border-radius: var(--radius-lg); margin-top: 1rem;" onclick="window.app.playMemoryVoiceNote('${memory.id}')">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.3rem; color: #38BDF8;">🎙️</span>
            <div>
              <div style="font-weight: 800; font-size: 0.88rem; color: var(--color-text-main);">Nota de Voz del Momento</div>
              <div style="font-size: 0.74rem; color: var(--color-text-muted);">Duración: ${memory.audioNote?.duration || '0:45'}</div>
            </div>
          </div>
          <button type="button" class="btn-mini-play" style="width: 36px; height: 36px; font-size: 0.9rem;">▶</button>
        </div>
      `;
    }

    // Comentarios estilo chat de pareja
    const commentsHtml = comments.map(c => {
      const isMe = c.authorName === 'Kevin' || c.authorRole === 'kevin';
      return `
        <div class="comment-bubble-chat ${isMe ? 'self' : ''}">
          <div class="author-avatar-mini" style="background: ${isMe ? '#6366F1' : '#EC4899'};">${(c.authorName || 'U').charAt(0).toUpperCase()}</div>
          <div class="comment-card-msg">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.2rem;">
              <strong style="font-size: 0.8rem; color: var(--color-text-main);">${window.Utils.sanitizeHTML(c.authorName)}</strong>
              <span style="font-size: 0.68rem; color: var(--color-text-muted);">${c.time || 'Hace un momento'}</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--color-text-main); margin: 0;">${window.Utils.sanitizeHTML(c.text)}</p>
          </div>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <!-- Hero Portada Parallax -->
      <div class="view-hero-cover-wrap">
        <img src="${coverSrc}" class="view-hero-cover-img" alt="${window.Utils.sanitizeHTML(memory.title)}">
        <div class="view-hero-overlay">
          <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem;">
            ${isFeatured ? '<span style="background: #F59E0B; color: #000; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 99px;">⭐ DESTACADO</span>' : ''}
            <span style="font-size: 0.78rem; color: rgba(255, 255, 255, 0.85); font-weight: 700;">📅 ${window.Utils.formatDateES(memory.date)}</span>
          </div>
          <h1 class="view-hero-title">${window.Utils.sanitizeHTML(memory.title)}</h1>
          ${memory.location ? `<div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.8); margin-top: 0.2rem;">📍 ${window.Utils.sanitizeHTML(memory.location)}</div>` : ''}
        </div>
      </div>

      <div class="view-content-container">
        <!-- Autor -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="author-avatar-mini">${authorName.charAt(0).toUpperCase()}</div>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main);">Inmortalizado por ${window.Utils.sanitizeHTML(authorName)}</span>
          </div>
          ${memory.driveUpload?.folderUrl ? `<a href="${memory.driveUpload.folderUrl}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: #38BDF8; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; background: rgba(56, 189, 248, 0.12); padding: 0.25rem 0.6rem; border-radius: var(--radius-full);">📁 Google Drive</a>` : ''}
        </div>

        <!-- Galería Horizontal de Fotos y Videos Deslizable -->
        ${(() => {
          const allMedia = [];
          if (memory.coverImage) {
            allMedia.push({ url: memory.coverImage, isVideo: Boolean(memory.isVideo), label: 'Portada' });
          }
          if (memory.photos && Array.isArray(memory.photos)) {
            memory.photos.forEach((p, idx) => {
              if (p && p !== memory.coverImage) {
                const isVid = typeof p === 'string' && (p.startsWith('data:video') || p.includes('.mp4') || p.includes('video'));
                allMedia.push({ url: p, isVideo: isVid, label: `Foto ${idx + 1}` });
              }
            });
          }

          if (allMedia.length === 0) return '';
          return `
            <div class="view-media-gallery-section">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
                <h4 style="font-size: 0.86rem; font-weight: 800; color: var(--color-text-main); margin: 0;">
                  📸 Galería del Recuerdo (${allMedia.length})
                </h4>
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Desliza horizontalmente ↔</span>
              </div>
              <div class="view-media-strip-scroll">
                ${allMedia.map((m, idx) => `
                  <div class="view-media-strip-item" onclick="window.app.previewMediaFull('${encodeURIComponent(m.url)}', ${m.isVideo})">
                    ${m.isVideo 
                      ? `<video src="${m.url}" class="view-media-strip-thumb" playsinline preload="metadata"></video><span class="media-video-badge">▶ Video</span>` 
                      : `<img src="${m.url}" class="view-media-strip-thumb" alt="media ${idx + 1}" loading="lazy">`
                    }
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        })()}

        <!-- Historia Completa -->
        <div class="view-story-prose">${window.Utils.sanitizeHTML(memory.description || 'Sin historia escrita.')}</div>

        <!-- Multimedia y Reproductores -->
        ${musicSection}
        ${voiceSection}

        <!-- Hilo de Comentarios de Pareja -->
        <div style="margin-top: 2rem;">
          <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 0.75rem;">💬 Conversaciones & Recuerdos (${comments.length})</h4>
          <div class="view-comments-stream">
            ${commentsHtml || '<div style="font-size: 0.82rem; color: var(--color-text-muted); font-style: italic;">Aún no hay comentarios. Sé el primero en dejar una nota con amor ❤️</div>'}
          </div>

          <!-- Input para Añadir Comentario -->
          <form id="form-add-memory-comment" style="display: flex; gap: 0.5rem; margin-top: 1rem;" onsubmit="event.preventDefault(); window.app.submitMemoryComment('${memory.id}');">
            <input type="text" id="input-memory-new-comment" class="form-control" placeholder="Escribe un mensaje en este recuerdo..." required style="flex: 1;">
            <button type="submit" class="btn-primary" style="padding: 0.5rem 1rem;">❤️</button>
          </form>
        </div>
      </div>
    `;

    // Botones de acción superior
    const btnEdit = document.getElementById('btn-view-edit-memory');
    const btnShare = document.getElementById('btn-view-share-memory');
    const btnDel = document.getElementById('btn-view-delete-memory');

    if (btnEdit) {
      btnEdit.onclick = () => {
        this.closeModal('modal-memory-view');
        this.openMemoryModal(memory.id);
      };
    }
    if (btnShare) {
      btnShare.onclick = () => {
        if (navigator.share) {
          navigator.share({ title: memory.title, text: memory.description, url: window.location.href });
        } else {
          window.Utils.copyToClipboard(window.location.href, 'Enlace del recuerdo copiado 📋');
        }
      };
    }
    if (btnDel) {
      btnDel.onclick = () => {
        if (confirm('¿Eliminar este recuerdo?')) {
          this.storage.deleteMemory(memory.id);
          this.closeModal('modal-memory-view');
          window.Utils.showToast('Recuerdo eliminado 🗑️', 'info');
          this.renderMemories();
        }
      };
    }

    this.openModal('modal-memory-view');
  }

  // --- VISOR DE MEDIOS EN PANTALLA COMPLETA ---
  previewMediaFull(encodedUrl, isVideo = false) {
    try {
      const url = decodeURIComponent(encodedUrl);
      const img = document.getElementById('lightbox-img');
      const vid = document.getElementById('lightbox-video');
      if (isVideo) {
        if (img) img.style.display = 'none';
        if (vid) {
          vid.src = url;
          vid.style.display = 'block';
          vid.play().catch(() => {});
        }
      } else {
        if (vid) {
          vid.pause();
          vid.style.display = 'none';
        }
        if (img) {
          img.src = url;
          img.style.display = 'block';
        }
      }
      this.openModal('modal-lightbox');
    } catch (_) {}
  }

  submitMemoryComment(memoryId) {
    const input = document.getElementById('input-memory-new-comment');
    if (!input || !input.value.trim()) return;

    const memories = this.storage.getMemories() || [];
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    const profile = this.storage.getUserProfile() || {};
    if (!memory.comments) memory.comments = [];

    memory.comments.push({
      id: 'c_' + Date.now().toString(36),
      authorName: profile.name || 'Kevin',
      authorRole: profile.name?.toLowerCase().includes('wendy') ? 'wendy' : 'kevin',
      text: input.value.trim(),
      time: 'Hace un momento'
    });

    this.storage.saveMemory(memory);
    this.openMemoryView(memoryId);
    window.Utils.showToast('Comentario añadido ❤️', 'success');
  }

  openMemoryActionsMenu(memoryId) {
    this.openMemoryView(memoryId);
  }

  playMemoryVoiceNote(memoryId) {
    window.Utils.showToast('Reproduciendo nota de voz 🎙️', 'info');
  }

  playMemorySong(memoryId) {
    const memory = (this.storage.getMemories() || []).find(m => m.id === memoryId);
    if (memory && memory.song && (memory.song.previewUrl || memory.song.title)) {
      if (memory.song.previewUrl) {
        this.playTrackAudioDirectly(memory.song);
      } else {
        window.Utils.showToast('Buscando melodía oficial...', 'info');
        this.media.searchSongs(`${memory.song.title} ${memory.song.artist || ''}`).then(results => {
          if (results.length > 0 && results[0].previewUrl) {
            memory.song.previewUrl = results[0].previewUrl;
            this.storage.saveMemory(memory);
            this.playTrackAudioDirectly(results[0]);
          } else {
            window.Utils.showToast('No se encontró preview oficial para esta melodía', 'warning');
          }
        });
      }
    }
  }

  // =========================================
  // 3. MÚSICA COLABORATIVA DEL GRUPO (REDESIGN)
  // =========================================
  renderSongs() {
    this.renderMusic();
  }

  renderMusic() {
    const container = document.getElementById('songs-grid-list');
    if (!container) return;

    const songs = this.storage.getSongs() || [];
    const allMemories = this.storage.getMemories() || [];
    const userProfile = this.storage.getUserProfile() || {};

    // 1. Estadísticas Rápidas del Grupo
    const statSongs = document.getElementById('stat-songs-count');
    const statMembers = document.getElementById('stat-members-count');
    const statHours = document.getElementById('stat-hours-count');

    if (statSongs) statSongs.textContent = songs.length;
    
    // Calcular integrantes únicos que han añadido música
    const authorNames = new Set();
    songs.forEach(s => {
      const name = s.author?.name || s.addedBy;
      if (name) authorNames.add(name);
    });
    if (statMembers) statMembers.textContent = Math.max(authorNames.size, 1);
    
    // 1. Calcular duración total sumando la duración exacta de cada canción
    const totalSeconds = songs.reduce((acc, s) => {
      if (s.trackTimeMillis && typeof s.trackTimeMillis === 'number') {
        return acc + Math.round(s.trackTimeMillis / 1000);
      }
      if (s.duration && typeof s.duration === 'number') {
        return acc + s.duration;
      }
      return acc + 210; // Default ~3:30 min
    }, 0);

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMins = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;

    let durationText = '0m';
    if (totalHours > 0) {
      durationText = totalMins > 0 ? `${totalHours}h ${totalMins}m` : `${totalHours}h`;
    } else if (totalMins > 0) {
      durationText = totalSecs > 0 ? `${totalMins}m ${totalSecs}s` : `${totalMins}m`;
    } else if (totalSecs > 0) {
      durationText = `${totalSecs}s`;
    }
    if (statHours) statHours.textContent = durationText;

    // 2. Llenar Menú Desplegable Personalizado de Integrantes
    const dropdownMenu = document.getElementById('music-member-dropdown-menu');
    if (dropdownMenu) {
      let menuHtml = `
        <button type="button" class="music-dropdown-item ${!this.activeMemberFilter ? 'active' : ''}" onclick="window.app.selectMemberFilter('')">
          <div class="music-dropdown-left">
            <span style="font-size: 1rem;">👥</span>
            <span>Todos los integrantes</span>
          </div>
          ${!this.activeMemberFilter ? '<span class="music-dropdown-check">✓</span>' : ''}
        </button>
      `;

      authorNames.forEach(author => {
        const isSelected = (this.activeMemberFilter === author);
        menuHtml += `
          <button type="button" class="music-dropdown-item ${isSelected ? 'active' : ''}" onclick="window.app.selectMemberFilter('${window.Utils.sanitizeHTML(author)}')">
            <div class="music-dropdown-left">
              <span style="font-size: 0.95rem;">👤</span>
              <span>${window.Utils.sanitizeHTML(author)}</span>
            </div>
            ${isSelected ? '<span class="music-dropdown-check">✓</span>' : ''}
          </button>
        `;
      });

      dropdownMenu.innerHTML = menuHtml;
    }

    // 3. Filtrado de Canciones
    let filtered = [...songs];
    const filter = this.activeMusicFilter || 'all';

    if (filter === 'top-rated') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filter === 'by-member') {
      const targetMember = this.activeMemberFilter;
      if (targetMember) {
        filtered = filtered.filter(s => (s.author?.name === targetMember || s.addedBy === targetMember));
      }
    } else if (filter === 'with-memories') {
      filtered = filtered.filter(s => s.linkedMemories && s.linkedMemories.length > 0);
    } else if (filter === 'my-songs') {
      const myName = (userProfile.name || '').toLowerCase();
      filtered = filtered.filter(s => {
        const author = (s.author?.name || s.addedBy || '').toLowerCase();
        return author.includes(myName) || (s.author?.id === userProfile.id);
      });
    } else {
      // 'all': más recientes primero
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="song-collab-card" style="text-align: center; justify-content: center; padding: 2.5rem 1.5rem; flex-direction: column; align-items: center; border-style: dashed;">
          <span style="font-size: 2.5rem; filter: drop-shadow(0 0 12px rgba(109, 92, 255, 0.6));">🎵</span>
          <h4 style="margin: 0.8rem 0 0.2rem; color: #FFFFFF; font-size: 1.05rem;">No hay canciones en este filtro</h4>
          <p style="font-size: 0.82rem; color: var(--color-text-secondary); max-width: 280px; margin: 0 auto 1.2rem;">
            Sé el primero en añadir la canción que represente un momento especial del parche.
          </p>
          <button type="button" class="btn-primary-purple" onclick="window.app.openAddSongModal()">
            <span>+ Añadir primera canción</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-collab-card';
      card.dataset.songId = song.id;

      const artwork = song.artwork || 'assets/icon.png';
      const isPlaying = (this.currentPlayingSongId === song.id && this.isGlobalPlaying);
      const ratingScore = (song.rating || 5.0).toFixed(1);
      const ratingCount = song.ratingCount || 1;
      const authorName = song.author?.name || song.addedBy || 'Kevin';
      const authorAvatar = song.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
      const addedDate = window.Utils.formatDateES(song.createdAt || new Date().toISOString());
      const commentsCount = song.commentsCount || (song.comments ? song.comments.length : 0);

      // Recuerdos vinculados
      let linkedMemoriesHtml = '';
      if (song.linkedMemories && song.linkedMemories.length > 0) {
        const mems = allMemories.filter(m => song.linkedMemories.includes(m.id));
        if (mems.length > 0) {
          const thumbs = mems.slice(0, 3).map(m => {
            const thumbSrc = m.coverImage || (m.photos && m.photos[0]) || 'assets/icon.png';
            return `<img src="${thumbSrc}" class="song-mem-stack-img" alt="${window.Utils.sanitizeHTML(m.title)}">`;
          }).join('');

          linkedMemoriesHtml = `
            <div class="song-collab-memories-pill" onclick="window.app.navigateToLinkedMemories('${song.linkedMemories.join(',')}')">
              <span class="song-memories-pill-text">
                <span>🎴</span> Usada en ${mems.length} ${mems.length === 1 ? 'recuerdo' : 'recuerdos'}
              </span>
              <div class="song-memory-thumb-stack">
                ${thumbs}
              </div>
              <span class="song-mem-arrow">›</span>
            </div>
          `;
        }
      }

      const spotifySearchUrl = window.MediaService ? window.MediaService.spotifyUrl(song.title, song.artist) : `https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`;
      const youtubeSearchUrl = window.MediaService ? window.MediaService.youtubeUrl(song.title, song.artist) : `https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}`;

      card.innerHTML = `
        <!-- Columna Izquierda: Carátula 88x88 con Botón Play Flotante -->
        <div class="song-art-square-wrap">
          <img src="${artwork}" class="song-art-img" alt="${window.Utils.sanitizeHTML(song.title)}" loading="lazy" />
          <button type="button" class="song-floating-play-btn ${isPlaying ? 'playing' : ''}" onclick="window.app.playSongTrack('${song.id}')" title="Reproducir Preview">
            ${isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        <!-- Columna Derecha: Detalles, Calificación, Autor, Reseña, Recuerdos y Plataformas -->
        <div class="song-collab-details">
          <div class="song-collab-header-row">
            <div style="min-width: 0;">
              <h3 class="song-collab-title">${window.Utils.sanitizeHTML(song.title)}</h3>
              <div class="song-collab-artist">${window.Utils.sanitizeHTML(song.artist)}</div>
            </div>
            <div class="song-top-actions">
              <div class="song-comments-count-pill" onclick="window.app.openSongComments('${song.id}')" title="Ver conversaciones">
                <span>💬</span> <span>${commentsCount}</span>
              </div>
              <button type="button" class="song-dots-menu-btn" onclick="window.app.openSongContextMenu('${song.id}', event)" title="Opciones">⋮</button>
            </div>
          </div>

          <!-- Estrellas y Score -->
          <div class="song-collab-rating-row">
            <span class="song-stars-gold">⭐⭐⭐⭐⭐</span>
            <span class="song-score-text">${ratingScore} (${ratingCount})</span>
          </div>

          <!-- Autor y Fecha -->
          <div class="song-collab-author-row">
            <img src="${authorAvatar}" class="song-author-mini-avatar" alt="${window.Utils.sanitizeHTML(authorName)}">
            <span>Añadida por <strong class="song-author-name-highlight">${window.Utils.sanitizeHTML(authorName)}</strong> • ${addedDate}</span>
          </div>

          <!-- Reseña del Parche -->
          ${song.review ? `<div class="song-collab-quote-box">“${window.Utils.sanitizeHTML(song.review)}”</div>` : ''}

          <!-- Píldora de Recuerdos Vinculados -->
          ${linkedMemoriesHtml}

          <!-- Botones de Redirección a Spotify y YouTube -->
          <div class="song-platform-links-row">
            <a href="${spotifySearchUrl}" target="_blank" rel="noopener noreferrer" class="song-platform-pill spotify" title="Abrir en Spotify">
              <span class="platform-icon">🟢</span> <span>Spotify</span>
            </a>
            <a href="${youtubeSearchUrl}" target="_blank" rel="noopener noreferrer" class="song-platform-pill youtube" title="Buscar en YouTube">
              <span class="platform-icon">🔴</span> <span>YouTube</span>
            </a>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // --- BUSCADOR INTELIGENTE EN VIVO (iTUNES API) ---
  initMusicLiveSearch() {
    const input = document.getElementById('music-search-input');
    const clearBtn = document.getElementById('music-search-clear');
    const resultsDropdown = document.getElementById('music-live-search-results');
    const btnOpenAdd = document.getElementById('btn-open-add-song');

    if (!input) return;

    let debounceTimer = null;

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

      clearTimeout(debounceTimer);
      if (!query) {
        if (resultsDropdown) resultsDropdown.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        if (resultsDropdown) {
          resultsDropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-primary-light); font-size: 0.84rem;">🔍 Buscando canciones oficiales en iTunes...</div>';
          resultsDropdown.style.display = 'flex';
        }

        try {
          const results = await this.media.searchSongs(query);
          this.lastMusicSearchResults = results || [];

          if (!results || results.length === 0) {
            if (resultsDropdown) {
              resultsDropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.82rem;">No se encontraron canciones. Puedes añadirla manualmente con el botón + Añadir canción.</div>';
            }
            return;
          }

          if (resultsDropdown) {
            resultsDropdown.innerHTML = results.slice(0, 6).map((r, idx) => `
              <div class="music-result-item" data-idx="${idx}">
                <img src="${r.artwork || 'assets/icon.png'}" class="music-result-art" alt="${window.Utils.sanitizeHTML(r.title)}" />
                <div class="music-result-info">
                  <div class="music-result-title">${window.Utils.sanitizeHTML(r.title)}</div>
                  <div class="music-result-artist">${window.Utils.sanitizeHTML(r.artist)} · ${window.Utils.sanitizeHTML(r.album || 'Single')}</div>
                </div>
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                  ${r.previewUrl ? `
                    <button type="button" class="btn-ghost" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; border-radius: var(--radius-full);" onclick="window.app.playLivePreviewAudio('${r.previewUrl}', '${window.Utils.sanitizeHTML(r.title)}', '${window.Utils.sanitizeHTML(r.artist)}', '${r.artwork}')">
                      ▶ Preview
                    </button>
                  ` : ''}
                  <button type="button" class="btn-primary-purple" style="padding: 0.35rem 0.7rem; font-size: 0.75rem;" onclick="window.app.selectSearchSongToAdd(${idx})">
                    + Añadir
                  </button>
                </div>
              </div>
            `).join('');
          }
        } catch (err) {
          if (resultsDropdown) {
            resultsDropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.82rem;">Error al buscar canciones. Intenta de nuevo.</div>';
          }
        }
      }, 300);
    });

    if (clearBtn) {
      clearBtn.onclick = () => {
        input.value = '';
        clearBtn.style.display = 'none';
        if (resultsDropdown) resultsDropdown.style.display = 'none';
        input.focus();
      };
    }

    if (btnOpenAdd) {
      btnOpenAdd.onclick = () => {
        const query = input.value.trim();
        if (query && this.lastMusicSearchResults && this.lastMusicSearchResults.length > 0) {
          this.selectSearchSongToAdd(0);
        } else {
          this.openAddSongModal();
        }
      };
    }
  }

  selectSearchSongToAdd(index) {
    const item = (this.lastMusicSearchResults || [])[index];
    const resultsDropdown = document.getElementById('music-live-search-results');
    if (resultsDropdown) resultsDropdown.style.display = 'none';

    this.openAddSongModal(item || null);
  }

  playLivePreviewAudio(previewUrl, title, artist, artwork) {
    this.playTrackAudioDirectly({
      id: 'live_preview_' + Date.now(),
      title,
      artist,
      artwork,
      previewUrl
    });
  }

  // --- FILTROS DE MÚSICA ---
  initMusicFilters() {
    const chipsContainer = document.getElementById('music-filter-chips');
    const dropdownMenu = document.getElementById('music-member-dropdown-menu');

    if (chipsContainer) {
      chipsContainer.querySelectorAll('.music-filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const filter = chip.dataset.filter;
          if (filter === 'by-member') {
            e.stopPropagation();
            if (dropdownMenu) {
              const isShown = (dropdownMenu.style.display === 'flex');
              if (isShown) {
                dropdownMenu.style.display = 'none';
              } else {
                const rect = chip.getBoundingClientRect();
                dropdownMenu.style.position = 'fixed';
                dropdownMenu.style.top = `${rect.bottom + 8}px`;
                const maxLeft = window.innerWidth - 220;
                dropdownMenu.style.left = `${Math.max(12, Math.min(rect.left, maxLeft))}px`;
                dropdownMenu.style.zIndex = '10000';
                dropdownMenu.style.display = 'flex';
              }
            }
            return;
          }

          if (dropdownMenu) dropdownMenu.style.display = 'none';

          chipsContainer.querySelectorAll('.music-filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          const label = document.getElementById('btn-filter-member-text');
          if (label) label.textContent = 'Por integrante';

          this.activeMusicFilter = filter;
          this.activeMemberFilter = '';
          this.renderMusic();
        });
      });
    }

    // Cerrar menú si se hace clic fuera o al hacer scroll
    document.addEventListener('click', (e) => {
      const btnMember = document.getElementById('btn-filter-member');
      if (dropdownMenu && dropdownMenu.style.display === 'flex') {
        if (!dropdownMenu.contains(e.target) && (!btnMember || !btnMember.contains(e.target))) {
          dropdownMenu.style.display = 'none';
        }
      }
    });

    window.addEventListener('scroll', () => {
      if (dropdownMenu && dropdownMenu.style.display === 'flex') {
        dropdownMenu.style.display = 'none';
      }
    }, { passive: true });
  }

  selectMemberFilter(member) {
    const dropdownMenu = document.getElementById('music-member-dropdown-menu');
    const chipsContainer = document.getElementById('music-filter-chips');
    const btnMember = document.getElementById('btn-filter-member');
    const label = document.getElementById('btn-filter-member-text');

    if (dropdownMenu) dropdownMenu.style.display = 'none';

    if (chipsContainer) {
      chipsContainer.querySelectorAll('.music-filter-chip').forEach(c => c.classList.remove('active'));
    }

    if (member) {
      if (btnMember) btnMember.classList.add('active');
      if (label) label.textContent = `👤 ${member}`;
      this.activeMusicFilter = 'by-member';
      this.activeMemberFilter = member;
    } else {
      if (label) label.textContent = 'Por integrante';
      this.activeMusicFilter = 'all';
      this.activeMemberFilter = '';
      chipsContainer?.querySelector('[data-filter="all"]')?.classList.add('active');
    }

    this.renderMusic();
  }

  // --- MODAL: AÑADIR CANCIÓN AL PLAYLIST COLABORATIVO ---
  openAddSongModal(prefill = null) {
    const titlePreview = document.getElementById('modal-song-title-preview');
    const artistPreview = document.getElementById('modal-song-artist-preview');
    const albumPreview = document.getElementById('modal-song-album-preview');
    const artPreview = document.getElementById('modal-song-art-preview');
    const reviewInput = document.getElementById('modal-song-review-input');
    const charCount = document.getElementById('song-review-char-count');
    const hiddenId = document.getElementById('modal-song-id');
    const hiddenTitle = document.getElementById('modal-song-title-hidden');
    const hiddenArtist = document.getElementById('modal-song-artist-hidden');
    const hiddenAlbum = document.getElementById('modal-song-album-hidden');
    const hiddenArtwork = document.getElementById('modal-song-artwork-hidden');
    const hiddenPreview = document.getElementById('modal-song-preview-hidden');
    const hiddenDuration = document.getElementById('modal-song-duration-hidden');
    const memoriesContainer = document.getElementById('song-memory-links-container');

    const title = prefill?.title || 'Canción Personalizada';
    const artist = prefill?.artist || 'Artista';
    const album = prefill?.album || 'Álbum del Parche';
    const artwork = prefill?.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80';
    const previewUrl = prefill?.previewUrl || '';
    const duration = prefill?.trackTimeMillis || 210000;

    if (titlePreview) titlePreview.textContent = title;
    if (artistPreview) artistPreview.textContent = artist;
    if (albumPreview) albumPreview.textContent = album;
    if (artPreview) artPreview.src = artwork;

    if (hiddenId) hiddenId.value = '';
    if (hiddenTitle) hiddenTitle.value = title;
    if (hiddenArtist) hiddenArtist.value = artist;
    if (hiddenAlbum) hiddenAlbum.value = album;
    if (hiddenArtwork) hiddenArtwork.value = artwork;
    if (hiddenPreview) hiddenPreview.value = previewUrl;
    if (hiddenDuration) hiddenDuration.value = duration;

    if (reviewInput) {
      reviewInput.value = '';
      if (charCount) charCount.textContent = '0';
    }

    // Resetear selector de estrellas a 5.0
    this.selectedModalStarRating = 5;
    const ratingValHidden = document.getElementById('modal-song-rating-val');
    const scoreNumber = document.getElementById('song-star-score');
    if (ratingValHidden) ratingValHidden.value = '5';
    if (scoreNumber) scoreNumber.textContent = '5.0';
    document.querySelectorAll('#song-star-picker .star-btn').forEach(btn => btn.classList.add('active'));

    // Llenar Checklist de Recuerdos
    if (memoriesContainer) {
      const memories = this.storage.getMemories() || [];
      if (memories.length === 0) {
        memoriesContainer.innerHTML = '<div style="font-size: 0.75rem; color: var(--color-text-muted); padding: 0.35rem;">No hay recuerdos registrados aún para vincular.</div>';
      } else {
        memoriesContainer.innerHTML = memories.map(mem => {
          const thumb = mem.coverImage || (mem.photos && mem.photos[0]) || 'assets/icon.png';
          return `
            <label class="song-mem-check-item">
              <input type="checkbox" name="linked_memory_id" value="${mem.id}" style="accent-color: #6D5CFF;">
              <img src="${thumb}" class="song-mem-check-thumb" alt="${window.Utils.sanitizeHTML(mem.title)}">
              <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(mem.title)}</span>
            </label>
          `;
        }).join('');
      }
    }

    this.openModal('modal-song-add');
  }

  initSongModalInteractions() {
    // Star Picker
    const starPicker = document.getElementById('song-star-picker');
    const ratingValHidden = document.getElementById('modal-song-rating-val');
    const scoreNumber = document.getElementById('song-star-score');

    if (starPicker) {
      starPicker.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.value, 10);
          this.selectedModalStarRating = val;
          if (ratingValHidden) ratingValHidden.value = val;
          if (scoreNumber) scoreNumber.textContent = `${val}.0`;

          starPicker.querySelectorAll('.star-btn').forEach(b => {
            const bVal = parseInt(b.dataset.value, 10);
            if (bVal <= val) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
        });
      });
    }

    // Char counter
    const reviewInput = document.getElementById('modal-song-review-input');
    const charCount = document.getElementById('song-review-char-count');
    if (reviewInput && charCount) {
      reviewInput.addEventListener('input', () => {
        charCount.textContent = reviewInput.value.length;
      });
    }

    // Form Submit
    const formSongAdd = document.getElementById('form-song-add');
    if (formSongAdd) {
      formSongAdd.onsubmit = (e) => {
        e.preventDefault();
        const user = this.storage.getUserProfile() || {};
        const title = document.getElementById('modal-song-title-hidden')?.value || 'Canción';
        const artist = document.getElementById('modal-song-artist-hidden')?.value || 'Artista';
        const album = document.getElementById('modal-song-album-hidden')?.value || '';
        const artwork = document.getElementById('modal-song-artwork-hidden')?.value || 'assets/icon.png';
        const previewUrl = document.getElementById('modal-song-preview-hidden')?.value || '';
        const trackTimeMillis = parseInt(document.getElementById('modal-song-duration-hidden')?.value || '210000', 10);
        const rating = parseFloat(document.getElementById('modal-song-rating-val')?.value || '5');
        const review = document.getElementById('modal-song-review-input')?.value.trim() || '';

        // Checkboxes de recuerdos vinculados
        const checkboxes = document.querySelectorAll('input[name="linked_memory_id"]:checked');
        const linkedMemories = Array.from(checkboxes).map(cb => cb.value);

        const newSong = {
          id: 'song_' + window.Utils.generateId(),
          title,
          artist,
          album,
          artwork,
          previewUrl,
          trackTimeMillis,
          rating,
          ratingCount: 1,
          author: {
            id: user.id || 'usr_me',
            name: user.name || 'Kevin',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            color: user.favoriteColor || '#6D5CFF'
          },
          review,
          linkedMemories,
          comments: [],
          commentsCount: 0,
          createdAt: new Date().toISOString()
        };

        this.storage.saveSong(newSong);
        this.closeModal('modal-song-add');
        window.Utils.showToast('¡Canción agregada al playlist colaborativo! 🎵✨', 'success');

        this.renderMusic();
        this.renderInicio();
      };
    }
  }

  // --- BOTTOM SHEET: COMENTARIOS Y REACCIONES DE CANCIÓN ---
  openSongComments(songId) {
    const song = (this.storage.getSongs() || []).find(s => s.id === songId);
    if (!song) return;

    this.activeCommentSongId = songId;

    const sheetArt = document.getElementById('sheet-song-art');
    const sheetTitle = document.getElementById('sheet-song-title');
    const sheetArtist = document.getElementById('sheet-song-artist');
    const stream = document.getElementById('song-comments-stream');

    if (sheetArt) sheetArt.src = song.artwork || 'assets/icon.png';
    if (sheetTitle) sheetTitle.textContent = `💬 ${song.title}`;
    if (sheetArtist) sheetArtist.textContent = song.artist;

    this.renderSongCommentsStream(song);
    this.openModal('modal-song-comments');
  }

  renderSongCommentsStream(song) {
    const stream = document.getElementById('song-comments-stream');
    if (!stream) return;

    const comments = song.comments || [];
    if (comments.length === 0) {
      stream.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--color-text-secondary); font-size: 0.85rem;">
          <span>💬</span>
          <p style="margin: 0.4rem 0 0;">Sé el primero en comentar qué te hace recordar este tema.</p>
        </div>
      `;
      return;
    }

    stream.innerHTML = comments.map(c => {
      const reactions = c.reactions || {};
      const rxEntries = Object.entries(reactions);
      const rxHtml = rxEntries.map(([em, count]) => `<span class="badge" style="background: rgba(109, 92, 255, 0.2); font-size: 0.72rem; padding: 0.15rem 0.4rem; border-radius: var(--radius-full);">${em} ${count}</span>`).join(' ');

      return `
        <div class="comment-bubble-chat" style="margin-bottom: 0.65rem;">
          <img src="${c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" alt="${window.Utils.sanitizeHTML(c.authorName)}">
          <div class="comment-card-msg" style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
              <strong style="font-size: 0.8rem; color: #FFFFFF;">${window.Utils.sanitizeHTML(c.authorName)}</strong>
              <span style="font-size: 0.68rem; color: var(--color-text-muted);">${c.time || 'Reciente'}</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--color-text-main); margin: 0; line-height: 1.4;">${window.Utils.sanitizeHTML(c.text)}</p>
            ${rxHtml ? `<div style="display: flex; gap: 0.25rem; margin-top: 0.35rem;">${rxHtml}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    stream.scrollTop = stream.scrollHeight;
  }

  initSongCommentsInteractions() {
    const form = document.getElementById('form-add-song-comment');
    const input = document.getElementById('input-song-comment-text');
    const emojisBar = document.getElementById('song-quick-emojis');

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const text = input?.value.trim();
        if (!text || !this.activeCommentSongId) return;

        this.storage.addSongComment(this.activeCommentSongId, text);
        input.value = '';

        const song = (this.storage.getSongs() || []).find(s => s.id === this.activeCommentSongId);
        if (song) this.renderSongCommentsStream(song);
        this.renderMusic();
      };
    }

    if (emojisBar) {
      emojisBar.querySelectorAll('.btn-quick-emoji').forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.dataset.emoji;
          if (!this.activeCommentSongId || !emoji) return;

          const song = (this.storage.getSongs() || []).find(s => s.id === this.activeCommentSongId);
          if (song && song.comments && song.comments.length > 0) {
            const lastComment = song.comments[song.comments.length - 1];
            this.storage.reactSongComment(song.id, lastComment.id, emoji);
            this.renderSongCommentsStream(song);
            window.Utils.showToast(`Reacción ${emoji} enviada`, 'info');
          } else {
            this.storage.addSongComment(this.activeCommentSongId, `${emoji} ¡Temazo del parche!`);
            const updated = (this.storage.getSongs() || []).find(s => s.id === this.activeCommentSongId);
            if (updated) this.renderSongCommentsStream(updated);
            this.renderMusic();
          }
        });
      });
    }
  }

  // --- REPRODUCTOR FLOTANTE GLOBAL (CON ANIMACIÓN DE ONDAS Y CONTROLES) ---
  updateSongPlayIcons() {
    const cards = document.querySelectorAll('.song-collab-card');
    cards.forEach(card => {
      const songId = card.dataset.songId;
      const btn = card.querySelector('.song-floating-play-btn');
      if (!btn) return;
      if (songId === this.currentPlayingSongId && this.isGlobalPlaying) {
        btn.classList.add('playing');
        btn.textContent = '⏸';
      } else {
        btn.classList.remove('playing');
        btn.textContent = '▶';
      }
    });
  }

  playSongTrack(songId) {
    const song = (this.storage.getSongs() || []).find(s => s.id === songId);
    if (!song) return;

    if (this.currentPlayingSongId === songId && this.isGlobalPlaying) {
      this.toggleGlobalPlay();
      return;
    }

    this.playTrackAudioDirectly(song);
  }

  playTrackAudioDirectly(track) {
    const playerEl = document.getElementById('global-music-player');
    const audioEl = document.getElementById('global-audio-element');
    const artEl = document.getElementById('player-art');
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const playBtn = document.getElementById('btn-player-play-toggle');

    if (!playerEl || !audioEl) return;

    this.currentPlayingSongId = track.id;
    this.currentPlayingTrack = track;

    if (artEl) artEl.src = track.artwork || 'assets/icon.png';
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;

    if (track.previewUrl) {
      audioEl.src = track.previewUrl;
      audioEl.play().then(() => {
        this.isGlobalPlaying = true;
        playerEl.style.display = 'flex';
        playerEl.classList.add('playing');
        if (playBtn) playBtn.textContent = '⏸';
        this.updateSongPlayIcons();
      }).catch(() => {
        window.Utils.showToast('No se pudo reproducir el preview de audio', 'warning');
      });
    } else {
      window.Utils.showToast('Canción sin preview de audio disponible', 'info');
      playerEl.style.display = 'flex';
      this.isGlobalPlaying = true;
      playerEl.classList.add('playing');
      if (playBtn) playBtn.textContent = '⏸';
      this.updateSongPlayIcons();
    }
  }

  toggleGlobalPlay() {
    const audioEl = document.getElementById('global-audio-element');
    const playerEl = document.getElementById('global-music-player');
    const playBtn = document.getElementById('btn-player-play-toggle');

    if (!audioEl || !playerEl) return;

    if (this.isGlobalPlaying) {
      audioEl.pause();
      this.isGlobalPlaying = false;
      playerEl.classList.remove('playing');
      if (playBtn) playBtn.textContent = '▶';
    } else {
      audioEl.play().catch(() => {});
      this.isGlobalPlaying = true;
      playerEl.classList.add('playing');
      if (playBtn) playBtn.textContent = '⏸';
    }

    this.updateSongPlayIcons();
  }

  playNextTrack() {
    const songs = this.storage.getSongs() || [];
    if (songs.length === 0) return;

    const currentIdx = songs.findIndex(s => s.id === this.currentPlayingSongId);
    const nextIdx = (currentIdx + 1) % songs.length;
    this.playTrackAudioDirectly(songs[nextIdx]);
  }

  playPrevTrack() {
    const songs = this.storage.getSongs() || [];
    if (songs.length === 0) return;

    const currentIdx = songs.findIndex(s => s.id === this.currentPlayingSongId);
    const prevIdx = (currentIdx - 1 + songs.length) % songs.length;
    this.playTrackAudioDirectly(songs[prevIdx]);
  }

  closeGlobalPlayer(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }

    const audioEl = document.getElementById('global-audio-element');
    const playerEl = document.getElementById('global-music-player');
    const playBtn = document.getElementById('btn-player-play-toggle');

    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    if (playerEl) {
      playerEl.style.display = 'none';
      playerEl.classList.remove('playing');
    }
    if (playBtn) {
      playBtn.textContent = '▶';
    }

    this.isGlobalPlaying = false;
    this.currentPlayingSongId = null;
    this.updateSongPlayIcons();
  }

  initGlobalPlayerControls() {
    const audioEl = document.getElementById('global-audio-element');
    const playBtn = document.getElementById('btn-player-play-toggle');
    const prevBtn = document.getElementById('btn-player-prev');
    const nextBtn = document.getElementById('btn-player-next');
    const closeBtn = document.getElementById('btn-player-close');
    const progressFill = document.getElementById('player-progress-fill');
    const progressTrack = document.getElementById('player-progress-track');
    const currentTimeEl = document.getElementById('player-current-time');
    const totalTimeEl = document.getElementById('player-total-time');

    if (playBtn) playBtn.onclick = () => this.toggleGlobalPlay();
    if (prevBtn) prevBtn.onclick = () => this.playPrevTrack();
    if (nextBtn) nextBtn.onclick = () => this.playNextTrack();
    if (closeBtn) closeBtn.onclick = () => this.closeGlobalPlayer();

    if (audioEl) {
      audioEl.addEventListener('timeupdate', () => {
        if (!audioEl.duration) return;
        const percent = (audioEl.currentTime / audioEl.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;

        const curMins = Math.floor(audioEl.currentTime / 60);
        const curSecs = Math.floor(audioEl.currentTime % 60).toString().padStart(2, '0');
        if (currentTimeEl) currentTimeEl.textContent = `${curMins}:${curSecs}`;

        const durMins = Math.floor(audioEl.duration / 60);
        const durSecs = Math.floor(audioEl.duration % 60).toString().padStart(2, '0');
        if (totalTimeEl) totalTimeEl.textContent = `${durMins}:${durSecs}`;
      });

      audioEl.addEventListener('ended', () => {
        this.playNextTrack();
      });
    }

    if (progressTrack && audioEl) {
      progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickPos = (e.clientX - rect.left) / rect.width;
        if (audioEl.duration) {
          audioEl.currentTime = clickPos * audioEl.duration;
        }
      });
    }
  }

  // Menú contextual 3 puntos de tarjeta musical (Glassmorphism Action Sheet)
  openSongContextMenu(songId, event) {
    if (event) event.stopPropagation();
    const song = (this.storage.getSongs() || []).find(s => s.id === songId);
    if (!song) return;

    this.activeContextMenuSongId = songId;

    const artEl = document.getElementById('sheet-actions-art');
    const titleEl = document.getElementById('sheet-actions-title');
    const artistEl = document.getElementById('sheet-actions-artist');
    const btnComments = document.getElementById('btn-sheet-view-comments');
    const btnSpotify = document.getElementById('btn-sheet-open-spotify');
    const btnYoutube = document.getElementById('btn-sheet-open-youtube');
    const btnCopy = document.getElementById('btn-sheet-copy-info');
    const btnDelete = document.getElementById('btn-sheet-delete-song');
    const starPicker = document.getElementById('sheet-action-star-picker');
    const starScore = document.getElementById('sheet-action-star-score');

    if (artEl) artEl.src = song.artwork || 'assets/icon.png';
    if (titleEl) titleEl.textContent = song.title;
    if (artistEl) artistEl.textContent = song.artist;

    // Actualizar estrellas de calificación
    const currentRating = Math.round(song.rating || 5);
    if (starScore) starScore.textContent = `${currentRating}.0`;
    if (starPicker) {
      starPicker.querySelectorAll('.star-btn').forEach(b => {
        const val = parseInt(b.dataset.value, 10);
        if (val <= currentRating) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
        b.onclick = () => {
          this.storage.rateSong(songId, val);
          if (starScore) starScore.textContent = `${val}.0`;
          starPicker.querySelectorAll('.star-btn').forEach(btn => {
            const bVal = parseInt(btn.dataset.value, 10);
            if (bVal <= val) btn.classList.add('active');
            else btn.classList.remove('active');
          });
          window.Utils.showToast(`¡Calificación de ${val}⭐ guardada!`, 'success');
          this.renderMusic();
        };
      });
    }

    // Botón Ver comentarios
    if (btnComments) {
      btnComments.onclick = () => {
        this.closeModal('modal-song-actions');
        this.openSongComments(songId);
      };
    }

    // Botón Spotify
    if (btnSpotify) {
      const spotifyUrl = window.MediaService ? window.MediaService.spotifyUrl(song.title, song.artist) : `https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`;
      btnSpotify.href = spotifyUrl;
    }

    // Botón YouTube
    if (btnYoutube) {
      const youtubeUrl = window.MediaService ? window.MediaService.youtubeUrl(song.title, song.artist) : `https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}`;
      btnYoutube.href = youtubeUrl;
    }

    // Botón Copiar
    if (btnCopy) {
      btnCopy.onclick = () => {
        window.Utils.copyToClipboard(`${song.title} - ${song.artist}`, '¡Canción y artista copiados!');
        this.closeModal('modal-song-actions');
      };
    }

    // Botón Eliminar
    if (btnDelete) {
      btnDelete.onclick = () => {
        this.closeModal('modal-song-actions');
        this.deleteSong(songId);
      };
    }

    this.openModal('modal-song-actions');
  }

  deleteSong(songId) {
    if (confirm('¿Eliminar esta canción del playlist colaborativo del grupo?')) {
      this.storage.deleteSong(songId);
      window.Utils.showToast('Canción eliminada del grupo 🎵', 'info');
      this.renderMusic();
      this.renderInicio();
    }
  }

  navigateToLinkedMemories(memIdsStr) {
    window.location.hash = '#recuerdos';
    window.Utils.showToast('Filtrando recuerdos asociados a esta canción 🎴✨', 'info');
  }

  // --- 4. RENDER CINE & PELÍCULAS (CARTELERA COLABORATIVA DEL GRUPO) ---
  renderMovies() {
    const container = document.getElementById('movies-collab-feed');
    if (!container) return;

    let list = this.storage.getMovies() || [];
    const currentUser = this.storage.getUserProfile() || {};

    // 1. Actualizar Métricas del Hero
    const statTotal = document.getElementById('stat-movies-count');
    const statWatched = document.getElementById('stat-movies-watched');
    const statPending = document.getElementById('stat-movies-pending');

    const watchedCount = list.filter(m => m.status === 'Vista').length;
    const pendingCount = list.filter(m => m.status === 'Por ver').length;

    if (statTotal) statTotal.textContent = list.length;
    if (statWatched) statWatched.textContent = watchedCount;
    if (statPending) statPending.textContent = pendingCount;

    // 2. Filtrado Rápido
    const filter = this.activeMovieFilter || 'all';
    if (filter === 'Vista' || filter === 'Por ver' || filter === 'Favorita') {
      list = list.filter(m => m.status === filter);
    } else if (filter === 'my-proposals') {
      list = list.filter(m => {
        const p = m.proposedBy;
        if (!p) return false;
        return (p.id && p.id === currentUser.id) || (p.name && p.name === currentUser.name);
      });
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; color: var(--color-text-secondary); padding: 3rem 1.5rem; border-radius: 24px; border: 1px dashed rgba(109, 92, 255, 0.35);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🍿</div>
          <h3 style="color: #FFFFFF; font-size: 1.1rem; margin-bottom: 0.35rem;">No hay películas en esta categoría</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1rem;">Usa el buscador de TMDb arriba para descubrir y añadir películas a la cartelera del grupo.</p>
          <button type="button" class="btn-add-movie-purple" onclick="document.getElementById('movie-search-input')?.focus()">
            <span>Buscar en TMDb</span> <span>🔍</span>
          </button>
        </div>
      `;
      this.initMovieFilters();
      this.initMovieLiveSearch();
      return;
    }

    const memories = this.storage.getMemories() || [];

    // 3. Renderizar cada tarjeta estilo streaming
    container.innerHTML = list.map(m => {
      // Estado
      const status = m.status || 'Por ver';
      const statusClass = status === 'Favorita' ? 'favorite' : (status === 'Vista' ? 'watched' : 'pending');
      const statusLabel = status === 'Favorita' ? '❤️ Favorita' : (status === 'Vista' ? '🍿 Vista' : '🌱 Por ver');

      // Calificación del Grupo (Doble Nivel)
      const ratings = m.groupRatings || [];
      const sumRatings = ratings.reduce((acc, r) => acc + (parseFloat(r.score) || 0), 0);
      const avgScore = ratings.length > 0 ? (sumRatings / ratings.length).toFixed(1) : (m.tmdbRating || '9.0');

      // Desglose de amigos (hasta 3 pills + badge si hay más)
      const memberPillsHtml = ratings.slice(0, 3).map(r => {
        const avatar = r.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
        const name = r.userName || 'Kevin';
        const score = typeof r.score === 'number' ? r.score.toFixed(1) : r.score;
        return `
          <div class="movie-member-score-pill">
            <img src="${avatar}" class="movie-member-score-avatar" alt="${window.Utils.sanitizeHTML(name)}">
            <span class="movie-member-score-name">${window.Utils.sanitizeHTML(name)}</span>
            <span class="movie-member-score-num">${score}</span>
          </div>
        `;
      }).join('');

      const morePillsCount = ratings.length > 3 ? `+${ratings.length - 3} más` : '';
      const moreBadgeHtml = morePillsCount ? `<span class="movie-score-more-pill">${morePillsCount}</span>` : '';

      // Propuesta por
      const proposerName = (m.proposedBy && m.proposedBy.name) ? m.proposedBy.name : 'Laura';
      const proposerAvatar = (m.proposedBy && m.proposedBy.avatar) ? m.proposedBy.avatar : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
      const proposerDate = (m.proposedBy && m.proposedBy.date) ? m.proposedBy.date : '10 Sep 2025';

      // Prioridad (5 estrellas para decidir qué ver primero)
      const priorityCount = Math.min(5, Math.max(1, m.priority || 5));
      const priorityStars = '★'.repeat(priorityCount) + '☆'.repeat(5 - priorityCount);

      // Reseña destacada (solo si un integrante la escribió de verdad, nunca texto falso de relleno)
      const cleanReview = (m.review && typeof m.review === 'string') ? m.review.trim() : '';
      const hasRealReview = cleanReview.length > 0 && cleanReview !== 'Una gran experiencia cinematográfica.';
      const quoteHtml = hasRealReview ? `
        <div class="movie-quote-container">
          <p class="movie-quote-text">“${window.Utils.sanitizeHTML(cleanReview)}”</p>
        </div>
      ` : '';

      // Recuerdos vinculados
      const linkedMems = (m.linkedMemories || []).map(mid => memories.find(x => x.id === mid)).filter(Boolean);
      let memoriesHtml = '';
      if (linkedMems.length > 0) {
        const thumbs = linkedMems.slice(0, 2).map(lm => {
          const imgUrl = (lm.photos && lm.photos[0]) || 'assets/icon.png';
          return `<img src="${imgUrl}" class="movie-memories-stack-thumb" alt="Memoria">`;
        }).join('');
        memoriesHtml = `
          <div class="movie-footer-memories-pill" onclick="event.stopPropagation(); window.app.navigateToLinkedMemories('${m.linkedMemories.join(',')}')">
            <span>Vinculada a ${linkedMems.length} recuerdo${linkedMems.length > 1 ? 's' : ''}</span>
            <div class="movie-memories-stack">${thumbs}</div>
            <span class="movie-mem-arrow">›</span>
          </div>
        `;
      } else {
        memoriesHtml = `
          <div class="movie-footer-memories-pill" onclick="event.stopPropagation(); window.app.openMovieView('${m.id}')">
            <span>Aún no vinculada a recuerdos</span>
            <span class="movie-mem-arrow">›</span>
          </div>
        `;
      }

      // Comentarios seguros (evitar undefined)
      let commentsCount = 0;
      if (typeof m.commentsCount === 'number') {
        commentsCount = m.commentsCount;
      } else if (Array.isArray(m.comments)) {
        commentsCount = m.comments.length;
      } else if (m.comments && typeof m.comments === 'object') {
        commentsCount = Object.keys(m.comments).length;
      }

      return `
        <div class="movie-collab-card" onclick="window.app.openMovieView('${m.id}')" data-id="${m.id}">
          <!-- Póster oficial -->
          <div class="movie-poster-wrap">
            <img src="${m.poster || 'assets/icon.png'}" class="movie-poster-img" alt="${window.Utils.sanitizeHTML(m.title)}" loading="lazy">
          </div>

          <!-- Información Principal -->
          <div class="movie-card-main-info">
            <div class="movie-card-header-row">
              <h3 class="movie-card-title">${window.Utils.sanitizeHTML(m.title)}</h3>
                <button type="button" class="movie-status-pill ${statusClass}" onclick="event.stopPropagation(); window.app.toggleMovieWatchedStatus('${m.id}', event)" title="Toca para alternar entre 'Por ver' y 'Vista'">
                  ${statusLabel}
                </button>
                <button type="button" class="movie-dots-btn" onclick="event.stopPropagation(); window.app.openMovieContextMenu('${m.id}', event)" title="Opciones">⋮</button>
              </div>
            </div>

            <!-- Metadatos -->
            <div class="movie-meta-line">
              ${m.year || ''} • ${m.duration || '2h'} • ${window.Utils.sanitizeHTML(m.genres || 'Cine')}
            </div>

            <!-- Badge TMDb -->
            <div class="movie-tmdb-badge">
              <span>⭐ ${m.tmdbRating || '8.5'}</span>
            </div>

            <!-- Calificación del Grupo (Doble Nivel) -->
            <div class="movie-group-ratings-row">
              <div class="movie-avg-score-box">
                <span class="movie-avg-star">⭐</span>
                <span class="movie-avg-number">${avgScore}</span>
                <div class="movie-avg-label">
                  <span>Promedio</span>
                  <span>del grupo</span>
                </div>
              </div>
              <div class="movie-members-scores-container">
                ${memberPillsHtml}
                ${moreBadgeHtml}
              </div>
            </div>

            <!-- Quién Propuso y Prioridad -->
            <div class="movie-proposer-priority-row">
              <div class="movie-proposer-info">
                <img src="${proposerAvatar}" class="movie-proposer-avatar" alt="${window.Utils.sanitizeHTML(proposerName)}">
                <span>Propuesta por <strong>${window.Utils.sanitizeHTML(proposerName)}</strong> • ${proposerDate}</span>
              </div>
              <div class="movie-priority-stars" title="Prioridad de visionado: ${priorityCount}/5">
                ${priorityStars}
              </div>
            </div>

            ${quoteHtml}

            <!-- Fila Inferior: Comentarios y Recuerdos -->
            <div class="movie-card-footer-row">
              <button type="button" class="movie-footer-comments-btn" onclick="event.stopPropagation(); window.app.openMovieComments('${m.id}', event)">
                <span>💬</span> <span>${commentsCount} comentario${commentsCount === 1 ? '' : 's'}</span>
              </button>
              ${memoriesHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.initMovieFilters();
    this.initMovieLiveSearch();
  }

  initMovieFilters() {
    const chipsContainer = document.getElementById('movie-filter-chips');
    if (!chipsContainer || chipsContainer.dataset.bound === 'true') return;
    chipsContainer.dataset.bound = 'true';

    chipsContainer.querySelectorAll('.movie-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.movie-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeMovieFilter = chip.dataset.filter;
        this.renderMovies();
      });
    });
  }

  closeMovieSearchResults() {
    const resultsBox = document.getElementById('movie-live-search-results');
    if (resultsBox) resultsBox.style.display = 'none';
  }

  initMovieLiveSearch() {
    const searchInput = document.getElementById('movie-search-input');
    const resultsBox = document.getElementById('movie-live-search-results');
    const clearBtn = document.getElementById('btn-clear-movie-search');
    const btnSearch = document.getElementById('btn-search-movie') || document.getElementById('btn-open-add-movie');

    const executeSearch = async (forcedQuery) => {
      const query = (typeof forcedQuery === 'string' ? forcedQuery : (searchInput ? searchInput.value : '')).trim();
      if (!resultsBox) return;

      if (!query) {
        if (searchInput) searchInput.focus();
        window.Utils.showToast('Escribe el título de una película para buscar en TMDb 🍿', 'info');
        resultsBox.style.display = 'none';
        return;
      }

      resultsBox.style.display = 'flex';
      resultsBox.innerHTML = `
        <div style="color: var(--color-text-secondary); padding: 1rem; text-align: center; font-size: 0.85rem;">
          Buscando "<strong>${window.Utils.sanitizeHTML(query)}</strong>" en TMDb... 🍿
        </div>
      `;

      const movies = await window.MediaService.searchMovies(query);
      if (movies.length === 0) {
        resultsBox.innerHTML = `
          <div class="movie-results-header">
            <span>🎬 Búsqueda TMDb</span>
            <button type="button" class="btn-close-movie-results" onclick="window.app.closeMovieSearchResults()">✕ Cerrar</button>
          </div>
          <div style="color: var(--color-text-muted); padding: 1rem; text-align: center; font-size: 0.85rem;">
            No se encontraron películas en TMDb para "<strong>${window.Utils.sanitizeHTML(query)}</strong>".
          </div>
        `;
        return;
      }

      this.cachedTmdbSearch = movies;

      resultsBox.innerHTML = `
        <div class="movie-results-header">
          <span>🎬 Resultados en TMDb (${movies.length})</span>
          <button type="button" class="btn-close-movie-results" onclick="window.app.closeMovieSearchResults()">✕ Cerrar</button>
        </div>
        ${movies.map((m, idx) => `
          <div class="movie-live-result-item">
            <img src="${m.poster || 'assets/icon.png'}" class="movie-live-poster" alt="poster" loading="lazy">
            <div class="movie-live-meta">
              <div class="movie-live-title" title="${window.Utils.sanitizeHTML(m.title)}">${window.Utils.sanitizeHTML(m.title)}</div>
              <div class="movie-live-sub">${m.year || ''} • ${window.Utils.sanitizeHTML(m.genres || 'Cine')}</div>
              <div class="movie-live-rating">⭐ TMDb ${m.voteAverage || '8.5'}</div>
            </div>
            <button type="button" class="btn-movie-add-inline" onclick="window.app.selectMovieFromSearch(${idx})">
              + Añadir
            </button>
          </div>
        `).join('')}
      `;
    };

    if (btnSearch && !btnSearch.dataset.bound) {
      btnSearch.dataset.bound = 'true';
      btnSearch.onclick = () => {
        executeSearch();
      };
    }

    if (!searchInput || searchInput.dataset.bound === 'true') return;
    searchInput.dataset.bound = 'true';

    let debounceTimer = null;

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        executeSearch();
      }
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';

      clearTimeout(debounceTimer);
      if (query.length < 2) {
        if (resultsBox) resultsBox.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(() => {
        executeSearch(query);
      }, 350);
    });

    if (clearBtn) {
      clearBtn.onclick = () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        if (resultsBox) resultsBox.style.display = 'none';
        searchInput.focus();
      };
    }

    document.addEventListener('click', (e) => {
      if (resultsBox && !resultsBox.contains(e.target) && e.target !== searchInput && (!btnSearch || !btnSearch.contains(e.target))) {
        resultsBox.style.display = 'none';
      }
    });
  }


  selectMovieFromSearch(index) {
    if (!this.cachedTmdbSearch || !this.cachedTmdbSearch[index]) return;
    const tmdbMovie = this.cachedTmdbSearch[index];
    const resultsBox = document.getElementById('movie-live-search-results');
    if (resultsBox) resultsBox.style.display = 'none';

    this.openAddMovieModal(tmdbMovie);
  }

  async openAddMovieModal(tmdbMovie) {
    this.currentAddingTmdbMovie = tmdbMovie;

    const fullDetails = await window.MediaService.getMovieDetails(tmdbMovie.tmdbId || tmdbMovie.id);
    const movieData = fullDetails || tmdbMovie;
    this.currentAddingTmdbMovie = movieData;

    const posterEl = document.getElementById('add-preview-poster');
    const titleEl = document.getElementById('add-preview-title');
    const metaEl = document.getElementById('add-preview-year-genres');
    const ratingEl = document.getElementById('add-preview-rating');

    if (posterEl) posterEl.src = movieData.poster || 'assets/icon.png';
    if (titleEl) titleEl.textContent = movieData.title;
    if (metaEl) metaEl.textContent = `${movieData.year || ''} • ${movieData.genres || 'Cine'}`;
    if (ratingEl) ratingEl.textContent = `⭐ ${movieData.voteAverage || '8.5'} TMDb`;

    let selectedStatus = 'Por ver';
    const statusPicker = document.getElementById('add-movie-status-picker');
    if (statusPicker) {
      statusPicker.querySelectorAll('.status-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === 'Por ver');
        btn.onclick = () => {
          statusPicker.querySelectorAll('.status-option-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedStatus = btn.dataset.status;
        };
      });
    }

    let selectedPriority = 5;
    const priorityPicker = document.getElementById('add-movie-priority-picker');
    const priorityScore = document.getElementById('add-movie-priority-score');
    if (priorityPicker) {
      priorityPicker.querySelectorAll('.star-btn').forEach(btn => {
        btn.onclick = () => {
          selectedPriority = parseInt(btn.dataset.val, 10);
          if (priorityScore) priorityScore.textContent = `${selectedPriority}/5`;
          priorityPicker.querySelectorAll('.star-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.val, 10) <= selectedPriority);
          });
        };
      });
    }

    const ratingSlider = document.getElementById('input-add-movie-my-rating');
    const ratingDisplay = document.getElementById('add-movie-rating-display');
    if (ratingSlider && ratingDisplay) {
      ratingSlider.value = '9.0';
      ratingDisplay.textContent = '9.0 ⭐';
      ratingSlider.oninput = () => {
        ratingDisplay.textContent = `${parseFloat(ratingSlider.value).toFixed(1)} ⭐`;
      };
    }

    const memoriesListEl = document.getElementById('add-movie-memories-checklist');
    const memories = this.storage.getMemories() || [];
    if (memoriesListEl) {
      if (memories.length === 0) {
        memoriesListEl.innerHTML = '<span style="font-size: 0.78rem; color: var(--color-text-muted);">No hay recuerdos creados en el grupo.</span>';
      } else {
        memoriesListEl.innerHTML = memories.map(mem => `
          <label class="song-mem-check-item">
            <input type="checkbox" name="movie_linked_mem" value="${mem.id}">
            <img src="${(mem.photos && mem.photos[0]) || 'assets/icon.png'}" class="song-mem-check-thumb" alt="thumb">
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(mem.title)}</span>
          </label>
        `).join('');
      }
    }

    const form = document.getElementById('form-add-movie-custom');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const user = this.storage.getUserProfile() || {};
        const reviewText = document.getElementById('input-add-movie-review')?.value.trim() || '';
        const personalScore = parseFloat(ratingSlider?.value || '9.0');

        const checkedBoxes = memoriesListEl ? memoriesListEl.querySelectorAll('input[type="checkbox"]:checked') : [];
        const linkedMemories = Array.from(checkedBoxes).map(cb => cb.value);

        const newMovie = {
          id: 'mov_' + Date.now().toString(36),
          tmdbId: movieData.tmdbId || movieData.id,
          title: movieData.title,
          originalTitle: movieData.originalTitle,
          year: movieData.year,
          duration: movieData.duration || '2h',
          genres: movieData.genres,
          poster: movieData.poster,
          backdrop: movieData.backdrop,
          tmdbRating: movieData.voteAverage,
          status: selectedStatus,
          priority: selectedPriority,
          proposedBy: {
            id: user.id || 'usr_me',
            name: user.name || 'Kevin',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            date: 'Hoy'
          },
          review: reviewText,
          synopsis: movieData.overview || 'Sin sinopsis disponible.',
          groupRatings: [
            {
              userId: user.id || 'usr_me',
              userName: user.name || 'Kevin',
              userAvatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              score: personalScore
            }
          ],
          reviews: reviewText ? [
            {
              id: 'rev_' + Date.now().toString(36),
              userId: user.id || 'usr_me',
              userName: user.name || 'Kevin',
              userAvatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              text: reviewText,
              date: 'Hoy'
            }
          ] : [],
          gallery: movieData.gallery || [],
          trailerUrl: movieData.trailerUrl || '',
          linkedMemories,
          comments: [],
          commentsCount: 0,
          createdAt: new Date().toISOString()
        };

        this.storage.saveMovie(newMovie);
        window.Utils.showToast(`¡"${newMovie.title}" añadida a la cartelera! 🍿`, 'success');
        this.closeModal('modal-movie-add');
        this.renderMovies();
        this.renderInicio();
      };
    }

    this.openModal('modal-movie-add');
  }

  toggleMovieWatchedStatus(movieId, event) {
    if (event) event.stopPropagation();
    const movie = this.storage.getMovie(movieId);
    if (!movie) return;

    // Alternar: si es 'Por ver' pasa a 'Vista', si es 'Vista' (o Favorita) pasa a 'Por ver'
    const newStatus = (movie.status === 'Vista') ? 'Por ver' : 'Vista';
    movie.status = newStatus;
    this.storage.saveMovie(movie);

    const isWatched = newStatus === 'Vista';
    const msg = isWatched 
      ? `¡"${movie.title}" marcada como Vista! 🍿` 
      : `¡"${movie.title}" marcada como Por ver! 🌱`;
    window.Utils.showToast(msg, 'success');

    // Actualizar pill en el modal de detalle si está abierto
    const modalViewPill = document.getElementById('movie-view-status-pill');
    if (modalViewPill && this.activeViewMovieId === movieId) {
      modalViewPill.className = `movie-status-pill ${isWatched ? 'watched' : 'pending'}`;
      modalViewPill.textContent = isWatched ? '🍿 Vista' : '🌱 Por ver';
    }

    // Refrescar cartelera y estadísticas
    this.renderMovies();
    this.renderInicio();
  }

  async openMovieView(movieId) {
    const movie = this.storage.getMovie(movieId);
    if (!movie) return;

    this.activeViewMovieId = movieId;

    if ((!movie.gallery || movie.gallery.length === 0 || !movie.trailerUrl) && movie.tmdbId) {
      window.MediaService.getMovieDetails(movie.tmdbId).then(details => {
        if (details) {
          if (details.gallery && (!movie.gallery || movie.gallery.length === 0)) movie.gallery = details.gallery;
          if (details.trailerUrl && !movie.trailerUrl) movie.trailerUrl = details.trailerUrl;
          if (details.duration && !movie.duration) movie.duration = details.duration;
          this.storage.saveMovie(movie);
        }
      });
    }

    const backdropEl = document.getElementById('movie-view-backdrop');
    const posterEl = document.getElementById('movie-view-poster');
    const titleEl = document.getElementById('movie-view-title');
    const yearEl = document.getElementById('movie-view-year');
    const durEl = document.getElementById('movie-view-duration');
    const genEl = document.getElementById('movie-view-genres');
    const statusPill = document.getElementById('movie-view-status-pill');
    const tmdbPill = document.getElementById('movie-view-tmdb-score');
    const propAvatar = document.getElementById('movie-view-proposer-avatar');
    const propName = document.getElementById('movie-view-proposer-name');
    const propDate = document.getElementById('movie-view-date');
    const trailerBtn = document.getElementById('movie-view-trailer-btn');

    if (backdropEl) backdropEl.style.backgroundImage = `url('${movie.backdrop || movie.poster || 'assets/icon.png'}')`;
    if (posterEl) posterEl.src = movie.poster || 'assets/icon.png';
    if (titleEl) titleEl.textContent = movie.title;
    if (yearEl) yearEl.textContent = movie.year || '';
    if (durEl) durEl.textContent = movie.duration || '2h';
    if (genEl) genEl.textContent = movie.genres || 'Cine';

    const status = movie.status || 'Por ver';
    const statusClass = status === 'Favorita' ? 'favorite' : (status === 'Vista' ? 'watched' : 'pending');
    const statusLabel = status === 'Favorita' ? '❤️ Favorita' : (status === 'Vista' ? '🍿 Vista' : '🌱 Por ver');
    if (statusPill) {
      statusPill.className = `movie-status-pill ${statusClass}`;
      statusPill.textContent = statusLabel;
      statusPill.title = "Toca para alternar entre 'Por ver' y 'Vista'";
      statusPill.onclick = (e) => {
        e.stopPropagation();
        this.toggleMovieWatchedStatus(movieId, e);
      };
    }
    if (tmdbPill) tmdbPill.textContent = `⭐ ${movie.tmdbRating || '8.5'} TMDb`;

    if (propName) propName.textContent = movie.proposedBy?.name || 'Laura';
    if (propAvatar) propAvatar.src = movie.proposedBy?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
    if (propDate) propDate.textContent = movie.proposedBy?.date || '10 Sep 2025';

    if (trailerBtn) {
      trailerBtn.onclick = () => {
        if (movie.trailerUrl) {
          window.open(movie.trailerUrl, '_blank');
        } else {
          window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer official')}`, '_blank');
        }
      };
    }

    // Cargar y mostrar plataformas de streaming (Dónde Ver)
    const providersListEl = document.getElementById('movie-providers-list');
    const providersBadgeEl = document.getElementById('movie-providers-country-badge');
    const quickChipsEl = document.getElementById('movie-providers-chips');

    // Botones de búsqueda directa rápida
    if (quickChipsEl) {
      const q = encodeURIComponent(movie.title);
      quickChipsEl.innerHTML = `
        <a href="https://www.netflix.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="provider-quick-btn" title="Buscar en Netflix">
          <span>🍿</span> <span>Netflix</span>
        </a>
        <a href="https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}" target="_blank" rel="noopener noreferrer" class="provider-quick-btn" title="Buscar en Prime Video">
          <span>📦</span> <span>Prime Video</span>
        </a>
        <a href="https://www.disneyplus.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="provider-quick-btn" title="Buscar en Disney+">
          <span>🏰</span> <span>Disney+</span>
        </a>
        <a href="https://www.max.com/search?q=${q}" target="_blank" rel="noopener noreferrer" class="provider-quick-btn" title="Buscar en Max">
          <span>⚡</span> <span>Max</span>
        </a>
        <a href="https://tv.apple.com/search?term=${q}" target="_blank" rel="noopener noreferrer" class="provider-quick-btn" title="Buscar en Apple TV">
          <span>🍏</span> <span>Apple TV</span>
        </a>
      `;
    }

    const renderProviders = (data) => {
      if (!providersListEl) return;
      if (providersBadgeEl) {
        providersBadgeEl.textContent = data && data.country ? `Streaming en ${data.country}` : 'Streaming oficial';
      }
      if (!data || !data.providers || data.providers.length === 0) {
        providersListEl.innerHTML = `
          <div class="movie-providers-empty-note" style="grid-column: 1 / -1;">
            No se detectó suscripción activa en streaming para esta región. Puedes consultar directamente con los accesos rápidos abajo 👇
          </div>
        `;
        return;
      }

      providersListEl.innerHTML = data.providers.map(p => `
        <a href="${data.link || `https://www.google.com/search?q=donde+ver+${encodeURIComponent(movie.title)}`}" target="_blank" rel="noopener noreferrer" class="provider-card-pill" title="Ver en ${window.Utils.sanitizeHTML(p.name)}">
          ${p.logo ? `<img src="${p.logo}" class="provider-card-logo" alt="${window.Utils.sanitizeHTML(p.name)}">` : '<span style="font-size: 1.2rem;">📺</span>'}
          <div class="provider-card-meta">
            <span class="provider-card-name">${window.Utils.sanitizeHTML(p.name)}</span>
            <span class="provider-card-type">${p.type}</span>
          </div>
        </a>
      `).join('');
    };

    if (providersListEl) {
      if (movie.watchProviders && movie.watchProviders.providers && movie.watchProviders.providers.length > 0) {
        renderProviders(movie.watchProviders);
      } else if (movie.tmdbId) {
        providersListEl.innerHTML = '<span style="font-size: 0.78rem; color: var(--color-text-muted); grid-column: 1 / -1;">Consultando disponibilidad en streaming...</span>';
        window.MediaService.getMovieWatchProviders(movie.tmdbId).then(data => {
          if (data && data.providers && data.providers.length > 0) {
            movie.watchProviders = data;
            this.storage.saveMovie(movie);
            renderProviders(data);
          } else {
            renderProviders(null);
          }
        });
      } else {
        renderProviders(null);
      }
    }

    const synEl = document.getElementById('movie-view-synopsis');
    const toggleBtn = document.getElementById('btn-toggle-synopsis');
    if (synEl) {
      synEl.textContent = movie.synopsis || 'Sin sinopsis registrada.';
      synEl.classList.add('clamped');
      if (toggleBtn) {
        toggleBtn.style.display = (movie.synopsis && movie.synopsis.length > 200) ? 'inline-block' : 'none';
        toggleBtn.textContent = 'Leer más';
        toggleBtn.onclick = () => {
          const isClamped = synEl.classList.toggle('clamped');
          toggleBtn.textContent = isClamped ? 'Leer más' : 'Leer menos';
        };
      }
    }

    const avgValEl = document.getElementById('movie-view-group-avg');
    const ratingsListEl = document.getElementById('movie-view-ratings-list');
    const ratings = movie.groupRatings || [];
    const sumRatings = ratings.reduce((acc, r) => acc + (parseFloat(r.score) || 0), 0);
    const avgScore = ratings.length > 0 ? (sumRatings / ratings.length).toFixed(1) : (movie.tmdbRating || '9.0');
    if (avgValEl) avgValEl.textContent = avgScore;

    if (ratingsListEl) {
      ratingsListEl.innerHTML = ratings.map(r => `
        <div class="movie-view-member-row">
          <div class="movie-view-member-left">
            <img src="${r.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" alt="${window.Utils.sanitizeHTML(r.userName)}">
            <span class="movie-view-member-name">${window.Utils.sanitizeHTML(r.userName)}</span>
          </div>
          <span class="movie-view-member-score">${typeof r.score === 'number' ? r.score.toFixed(1) : r.score} / 10 ⭐</span>
        </div>
      `).join('');
    }

    const user = this.storage.getUserProfile() || {};
    const myRating = ratings.find(r => r.userId === user.id || r.userName === user.name);
    const slider = document.getElementById('movie-rate-slider');
    const sliderVal = document.getElementById('movie-rate-slider-val');
    const btnSaveRating = document.getElementById('btn-save-user-movie-rating');

    if (slider && sliderVal) {
      slider.value = myRating ? myRating.score : 9.0;
      sliderVal.textContent = `${parseFloat(slider.value).toFixed(1)} ⭐`;
      slider.oninput = () => {
        sliderVal.textContent = `${parseFloat(slider.value).toFixed(1)} ⭐`;
      };
    }
    if (btnSaveRating) {
      btnSaveRating.onclick = () => {
        const val = parseFloat(slider?.value || '9.0');
        this.storage.rateMovieScore(movieId, val);
        window.Utils.showToast(`¡Calificación de ${val}⭐ guardada!`, 'success');
        this.openMovieView(movieId);
        this.renderMovies();
      };
    }

    const reviewsListEl = document.getElementById('movie-view-reviews-list');
    const reviews = movie.reviews || [];
    if (reviewsListEl) {
      if (reviews.length === 0) {
        reviewsListEl.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted);">Aún no hay reseñas escritas para esta película.</span>';
      } else {
        reviewsListEl.innerHTML = reviews.map(rev => `
          <div class="movie-review-quote-card">
            <p class="movie-review-quote-text">“${window.Utils.sanitizeHTML(rev.text)}”</p>
            <div class="movie-review-quote-author">— ${window.Utils.sanitizeHTML(rev.userName)} (${rev.date || 'Reciente'})</div>
          </div>
        `).join('');
      }
    }

    const btnShowWrite = document.getElementById('btn-show-write-review');
    const formWrite = document.getElementById('form-movie-write-review');
    const btnCancelWrite = document.getElementById('btn-cancel-write-review');
    const inputReview = document.getElementById('input-movie-user-review');

    if (btnShowWrite && formWrite) {
      btnShowWrite.onclick = () => {
        formWrite.style.display = 'block';
        if (inputReview) inputReview.focus();
      };
    }
    if (btnCancelWrite && formWrite) {
      btnCancelWrite.onclick = () => {
        formWrite.style.display = 'none';
      };
    }
    if (formWrite) {
      formWrite.onsubmit = (e) => {
        e.preventDefault();
        const text = inputReview?.value.trim() || '';
        if (text) {
          this.storage.addMovieReview(movieId, text);
          window.Utils.showToast('¡Reseña publicada en la cartelera! ✍️🍿', 'success');
          formWrite.style.display = 'none';
          if (inputReview) inputReview.value = '';
          this.openMovieView(movieId);
          this.renderMovies();
        }
      };
    }

    const galleryScrollEl = document.getElementById('movie-view-gallery-scroll');
    const gallerySection = document.getElementById('movie-view-gallery-section');
    const gallery = movie.gallery || [];
    if (gallery.length > 0 && galleryScrollEl) {
      if (gallerySection) gallerySection.style.display = 'block';
      galleryScrollEl.innerHTML = gallery.map(imgUrl => `
        <img src="${imgUrl}" class="movie-gallery-item" alt="Fotograma" loading="lazy">
      `).join('');
    } else if (gallerySection) {
      gallerySection.style.display = 'none';
    }

    const memsListEl = document.getElementById('movie-view-linked-memories');
    const allMemories = this.storage.getMemories() || [];
    const linked = (movie.linkedMemories || []).map(id => allMemories.find(m => m.id === id)).filter(Boolean);

    if (memsListEl) {
      if (linked.length === 0) {
        memsListEl.innerHTML = '<span style="font-size: 0.8rem; color: var(--color-text-muted);">Esta película no está vinculada a ningún recuerdo todavía.</span>';
      } else {
        memsListEl.innerHTML = linked.map(lm => `
          <div class="movie-member-score-pill" style="cursor: pointer; padding: 0.35rem 0.75rem;" onclick="window.app.closeModal('modal-movie-view'); window.location.hash = '#recuerdos';">
            <img src="${(lm.photos && lm.photos[0]) || 'assets/icon.png'}" class="movie-member-score-avatar" style="border-radius: 4px;" alt="thumb">
            <span style="font-weight: 700; color: #FFFFFF;">${window.Utils.sanitizeHTML(lm.title)}</span>
            <span style="color: #A78BFA;">›</span>
          </div>
        `).join('');
      }
    }

    this.openModal('modal-movie-view');
  }

  openMovieComments(movieId, event) {
    if (event) event.stopPropagation();
    const movie = this.storage.getMovie(movieId);
    if (!movie) return;

    this.activeCommentsMovieId = movieId;

    const artEl = document.getElementById('movie-comments-header-art');
    const titleEl = document.getElementById('movie-comments-header-title');
    const chatListEl = document.getElementById('movie-comments-chat-list');

    if (artEl) artEl.src = movie.poster || 'assets/icon.png';
    if (titleEl) titleEl.textContent = movie.title;

    const renderChat = () => {
      const currentMovie = this.storage.getMovie(movieId);
      const comments = (currentMovie && currentMovie.comments) || [];
      if (comments.length === 0) {
        chatListEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 0;">No hay conversaciones todavía. ¡Sé el primero en comentar sobre esta película! 🍿</div>';
        return;
      }
      chatListEl.innerHTML = comments.map(c => `
        <div class="movie-chat-msg">
          <img src="${c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" class="movie-chat-avatar" alt="Avatar">
          <div class="movie-chat-bubble">
            <div class="movie-chat-author-line">
              <span class="movie-chat-author">${window.Utils.sanitizeHTML(c.authorName || 'Kevin')}</span>
              <span class="movie-chat-time">${c.time || 'Reciente'}</span>
            </div>
            <p class="movie-chat-text">${window.Utils.sanitizeHTML(c.text)}</p>
            <div class="movie-chat-reactions-row">
              ${Object.entries(c.reactions || {}).map(([emoji, count]) => `
                <span class="movie-reaction-bubble" onclick="window.app.reactMovieComment('${movieId}', '${c.id}', '${emoji}')">${emoji} ${count}</span>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('');
      chatListEl.scrollTop = chatListEl.scrollHeight;
    };

    renderChat();

    document.querySelectorAll('.movie-quick-react').forEach(btn => {
      btn.onclick = () => {
        const emoji = btn.dataset.emoji;
        const textInput = document.getElementById('input-movie-comment-text');
        if (textInput) {
          textInput.value = (textInput.value + ' ' + emoji).trim();
          textInput.focus();
        }
      };
    });

    const form = document.getElementById('form-add-movie-comment');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('input-movie-comment-text');
        const text = input?.value.trim() || '';
        if (text) {
          this.storage.addMovieComment(movieId, text);
          if (input) input.value = '';
          renderChat();
          this.renderMovies();
        }
      };
    }

    this.openModal('modal-movie-comments');
  }

  reactMovieComment(movieId, commentId, emoji) {
    this.storage.reactMovieComment(movieId, commentId, emoji);
    this.openMovieComments(movieId);
  }

  openMovieContextMenu(movieId, event) {
    if (event) event.stopPropagation();
    const movie = this.storage.getMovie(movieId);
    if (!movie) return;

    this.activeContextMenuMovieId = movieId;

    const artEl = document.getElementById('movie-actions-art');
    const titleEl = document.getElementById('movie-actions-title');
    const subEl = document.getElementById('movie-actions-subtitle');
    const btnView = document.getElementById('btn-movie-act-view');
    const btnComments = document.getElementById('btn-movie-act-comments');
    const btnTrailer = document.getElementById('btn-movie-act-trailer');
    const btnDelete = document.getElementById('btn-movie-act-delete');

    if (artEl) artEl.src = movie.poster || 'assets/icon.png';
    if (titleEl) titleEl.textContent = movie.title;
    if (subEl) subEl.textContent = `${movie.year || ''} • ${movie.genres || 'Cine'}`;

    if (btnView) {
      btnView.onclick = () => {
        this.closeModal('modal-movie-actions');
        this.openMovieView(movieId);
      };
    }
    if (btnComments) {
      btnComments.onclick = () => {
        this.closeModal('modal-movie-actions');
        this.openMovieComments(movieId);
      };
    }
    if (btnTrailer) {
      const trailerUrl = movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer official')}`;
      btnTrailer.href = trailerUrl;
    }
    if (btnDelete) {
      btnDelete.onclick = () => {
        this.closeModal('modal-movie-actions');
        this.deleteMovie(movieId);
      };
    }

    this.openModal('modal-movie-actions');
  }

  deleteMovie(movieId) {
    if (confirm('¿Eliminar esta película de la cartelera del grupo?')) {
      this.storage.deleteMovie(movieId);
      window.Utils.showToast('Película eliminada de la cartelera 🍿', 'info');
      this.renderMovies();
      this.renderInicio();
    }
  }

  openEditMovieModal(movieId) {
    const movie = this.storage.getMovies().find(m => m.id === movieId);
    if (!movie) return;

    const group = this.storage.getActiveGroup();
    const members = (group && group.members) || [];
    const user = this.storage.getUserProfile();

    document.getElementById('movie-id').value = movie.id;
    document.getElementById('movie-title-input').value = movie.title || '';
    document.getElementById('movie-year-input').value = movie.year || new Date().getFullYear();

    const propSelect = document.getElementById('movie-proposed-select');
    if (propSelect) {
      propSelect.innerHTML = members.map(m => `
        <option value="${window.Utils.sanitizeHTML(m.name)}" ${m.name === movie.proposedBy ? 'selected' : ''}>${window.Utils.sanitizeHTML(m.name)}</option>
      `).join('');
    }

    document.getElementById('movie-priority-select').value = movie.priority || 5;
    document.getElementById('movie-status-select').value = movie.status || 'Por ver';
    document.getElementById('movie-rating-input').value = (movie.ratings && movie.ratings[user?.id]) || '';
    document.getElementById('movie-comment-input').value = (movie.comments && movie.comments[user?.id]) || '';

    this.openModal('modal-movie');
  }

  deleteMovie(movieId) {
    if (confirm('¿Eliminar esta película de la biblioteca?')) {
      this.storage.deleteMovie(movieId);
      window.Utils.showToast('Película eliminada', 'info');
      this.renderMovies();
      this.renderInicio();
    }
  }

  // --- 5. RENDER SERIES ---
  renderSeries() {
    const container = document.getElementById('series-grid-list');
    if (!container) return;

    let seriesList = this.storage.getSeries();
    const filterStatus = document.getElementById('filter-series-status')?.value || 'all';

    if (filterStatus !== 'all') {
      seriesList = seriesList.filter(s => s.status === filterStatus);
    }

    if (seriesList.length === 0) {
      container.innerHTML = `
        <div class="series-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">📺</span>
          <p style="margin-top: 0.5rem; font-size: 1rem; color: var(--color-text-main);">No hay series en esta sección.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-series').click()">
            + Añadir Serie 📺
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    seriesList.forEach(series => {
      const card = document.createElement('div');
      card.className = 'series-card';

      const poster = series.poster || 'assets/icon.png';
      const curEp = series.currentEpisode || 1;
      const totEp = series.totalEpisodes || 10;
      const progressPct = Math.min(100, Math.round((curEp / totEp) * 100));

      card.innerHTML = `
        <div class="movie-poster-wrap" style="height: 160px; overflow: hidden; position: relative;">
          <img src="${poster}" class="movie-poster-img" alt="${window.Utils.sanitizeHTML(series.title)}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" />
          ${series.platform ? `<div class="movie-platform-badge" style="position:absolute; top:0.5rem; right:0.5rem; background:rgba(0,0,0,0.7); color:#fff; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem;">${window.Utils.sanitizeHTML(series.platform)}</div>` : ''}
        </div>
        <div style="padding: 1.15rem; display: flex; flex-direction: column; flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 class="movie-title-heading" style="font-size: 1.15rem;">${window.Utils.sanitizeHTML(series.title)}</h3>
            <button type="button" class="btn-ghost" style="padding: 0.1rem 0.3rem; font-size: 0.75rem; color: var(--color-error);" onclick="window.app.deleteSeries('${series.id}')">🗑️</button>
          </div>
          <div style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700; margin-top: 0.2rem;">
            Temp. ${series.currentSeason || 1} · Cap. ${curEp} / ${totEp} (${progressPct}%)
          </div>
          <div class="series-progress-bar-wrap">
            <div class="series-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
          <div style="display: flex; gap: 0.4rem; margin-top: auto; padding-top: 0.6rem;">
            <button type="button" class="btn-secondary" style="flex: 1; padding: 0.35rem; font-size: 0.78rem;" onclick="window.app.stepSeriesEpisode('${series.id}', -1)">
              ◀ -1 Cap
            </button>
            <button type="button" class="btn-primary" style="flex: 1; padding: 0.35rem; font-size: 0.78rem;" onclick="window.app.stepSeriesEpisode('${series.id}', 1)">
              +1 Cap ▶
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    const statusFilter = document.getElementById('filter-series-status');
    if (statusFilter) statusFilter.onchange = () => this.renderSeries();
  }

  stepSeriesEpisode(seriesId, delta) {
    const series = this.storage.getSeries().find(s => s.id === seriesId);
    if (series) {
      series.currentEpisode = Math.max(1, (series.currentEpisode || 1) + delta);
      if (series.totalEpisodes && series.currentEpisode >= series.totalEpisodes) {
        series.status = 'Completada';
        window.Animations.triggerLumaBurst();
        window.Utils.showToast(`¡Completaron "${series.title}"! 🎉✨`, 'success');
      }
      this.storage.saveSeries(series);
      this.renderSeries();
      this.renderInicio();
    }
  }

  deleteSeries(seriesId) {
    if (confirm('¿Eliminar esta serie?')) {
      const data = this.storage.getGroupData();
      data.series = (data.series || []).filter(s => s.id !== seriesId);
      this.storage.saveGroupData(null, data);
      window.Utils.showToast('Serie eliminada', 'info');
      this.renderSeries();
      this.renderInicio();
    }
  }

  // --- 6. RENDER NOTAS (ATRIA PAPER NOTES) ---
  renderNotes() {
    const container = document.getElementById('notes-grid-list');
    if (!container) return;

    let list = this.storage.getNotes();
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (list.length === 0) {
      container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); background: #fff; padding: 2.5rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">El muro está esperando vuestras primeras palabras. 💌</div>`;
      return;
    }

    container.innerHTML = list.map(n => {
      let imgHtml = '';
      if (n.image) {
        imgHtml = `<img src="${n.image}" class="note-img-thumb" alt="Adjunto" onclick="window.app.openLightbox('${n.image}')" loading="lazy" />`;
      }

      return `
        <div class="paper-note" data-id="${n.id}">
          <div class="paper-note-header">
            <span class="paper-author">${window.Utils.sanitizeHTML(n.author || 'Miembro')}</span>
            <span class="paper-date">${window.Utils.formatDateTimeES(n.createdAt)}</span>
          </div>
          <div class="paper-content">${window.Utils.sanitizeHTML(n.content || n.message || '')}</div>
          ${imgHtml}
          <div style="display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 1rem;">
            <button type="button" class="btn-secondary" onclick="window.app.editNote('${n.id}')" style="padding: 0.2rem 0.55rem; font-size: 0.75rem;">Editar</button>
            <button type="button" class="btn-secondary" onclick="window.app.deleteNote('${n.id}')" style="padding: 0.2rem 0.55rem; font-size: 0.75rem; color: var(--color-error);">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  editNote(noteId) {
    const note = this.storage.getNotes().find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('note-title-input').value = note.title || 'Nota';
    document.getElementById('note-content-input').value = note.content || note.message || '';
    this.openModal('modal-note');
  }

  deleteNote(noteId) {
    if (confirm('¿Eliminar esta nota del muro?')) {
      this.storage.deleteNote(noteId);
      this.renderNotes();
      window.Utils.showToast('Nota eliminada', 'info');
    }
  }

  // --- 7. RENDER OBJETIVOS (ATRIA FRASCO DE SUEÑOS & STATS) ---
  renderGoals() {
    const container = document.getElementById('goals-grid-list');
    if (!container) return;

    const list = this.storage.getGoals();
    const total = list.length;
    const completed = list.filter(d => d.status === 'Cumplido').length;
    const pending = total - completed;
    const pct = total > 0 ? (completed / total) * 100 : 0;

    const statTotal = document.getElementById('stat-goals-total');
    const statCompleted = document.getElementById('stat-goals-completed');
    const statPending = document.getElementById('stat-goals-pending');
    const statPct = document.getElementById('stat-goals-pct');

    if (statTotal) statTotal.textContent = window.Utils.formatNumberES(total);
    if (statCompleted) statCompleted.textContent = window.Utils.formatNumberES(completed);
    if (statPending) statPending.textContent = window.Utils.formatNumberES(pending);
    if (statPct) statPct.textContent = window.Utils.formatDecimalES(pct, 2) + ' %';

    if (total === 0) {
      container.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-text-secondary); background: #fff; padding: 2.5rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">El frasco está listo para guardar nuevas metas y sueños juntos. ✨</div>`;
      return;
    }

    container.innerHTML = list.map(d => {
      const isDone = d.status === 'Cumplido';
      return `
        <div class="dream-item-card ${isDone ? 'completed' : ''}" data-id="${d.id}">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button type="button" class="btn-toggle-dream" onclick="window.app.toggleGoal('${d.id}')" title="Marcar como cumplido">
              ${isDone ? '🌟' : '🌱'}
            </button>
            <div>
              <span class="dream-title-text">${window.Utils.sanitizeHTML(d.title)}</span>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">
                ${d.completedAt ? `Cumplido: ${window.Utils.formatDateES(d.completedAt)}` : `Añadido: ${window.Utils.formatDateES(d.createdAt)}`}
                ${d.category ? ` · <span style="font-weight:600; color:var(--color-primary);">${window.Utils.sanitizeHTML(d.category)}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-secondary" onclick="window.app.editGoal('${d.id}')" style="padding: 0.2rem 0.55rem; font-size: 0.75rem;">Editar</button>
            <button type="button" class="btn-secondary" onclick="window.app.deleteGoal('${d.id}')" style="padding: 0.2rem 0.55rem; font-size: 0.75rem; color: var(--color-error);">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('filter-goals-category')?.addEventListener('change', () => this.filterGoalsList());
    document.getElementById('filter-goals-status')?.addEventListener('change', () => this.filterGoalsList());
  }

  filterGoalsList() {
    this.renderGoals();
  }

  toggleGoal(goalId) {
    const { justCompleted } = this.storage.toggleGoalStatus(goalId);
    if (justCompleted) {
      window.Animations.triggerLumaBurst();
      window.Utils.showToast('¡Meta cumplida con éxito! 🌟✨', 'success');
    } else {
      window.Utils.showToast('Estado de la meta actualizado', 'info');
    }
    this.renderGoals();
    this.renderInicio();
  }

  editGoal(goalId) {
    const goal = this.storage.getGoals().find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('goal-title-input').value = goal.title || '';
    document.getElementById('goal-category-select').value = goal.category || 'General';
    document.getElementById('goal-date-input').value = goal.targetDate || '';
    document.getElementById('goal-participants-input').value = (goal.participants || []).join(', ');
    this.openModal('modal-goal');
  }

  deleteGoal(goalId) {
    if (confirm('¿Eliminar este sueño del frasco?')) {
      this.storage.deleteGoal(goalId);
      this.renderGoals();
      this.renderInicio();
      window.Utils.showToast('Meta eliminada', 'info');
    }
  }  // --- REPRODUCTOR DE AUDIO BAR ---
  renderAudioPlayerBar(state) {
    const bar = document.getElementById('luma-audio-player');
    if (!bar) return;

    if (!state.currentTrack) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'block';
    const artwork = document.getElementById('player-bar-artwork');
    const title = document.getElementById('player-bar-title');
    const artist = document.getElementById('player-bar-artist');
    const toggleBtn = document.getElementById('btn-player-toggle');
    const eq = document.getElementById('player-bar-equalizer');

    if (artwork) artwork.src = state.currentTrack.artwork || 'assets/icon.png';
    if (title) title.textContent = state.currentTrack.title;
    if (artist) artist.textContent = state.currentTrack.artist || 'LUMA';
    if (toggleBtn) toggleBtn.textContent = state.isPlaying ? '⏸' : '▶';
    if (eq) eq.style.opacity = state.isPlaying ? '1' : '0.2';
  }

  // --- GESTIÓN DE MODALES ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) firstInput.focus();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  bindModalEvents() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });

    // Botón de Ajustes & Tema (Header)
    document.getElementById('btn-header-settings')?.addEventListener('click', () => {
      this.openModal('modal-settings');
    });

    document.getElementById('btn-theme-dark')?.addEventListener('click', () => {
      this.setTheme('dark');
    });

    document.getElementById('btn-theme-light')?.addEventListener('click', () => {
      this.setTheme('light');
    });

    document.getElementById('btn-settings-open-groups')?.addEventListener('click', () => {
      this.closeModal('modal-settings');
      this.openGroupsListModal();
    });

    document.getElementById('btn-settings-open-profile')?.addEventListener('click', () => {
      this.closeModal('modal-settings');
      this.populateProfileModal();
      this.openModal('modal-profile');
    });

    // Botón Salir en barra inferior
    document.getElementById('bottom-tab-salir')?.addEventListener('click', () => {
      this.openGroupsListModal();
    });

    // Central Floating Action Button (FAB)
    document.getElementById('btn-global-create')?.addEventListener('click', () => {
      this.openModal('modal-create-sheet');
    });

    // Bottom Navigation Perfil Tab
    document.getElementById('bottom-tab-perfil')?.addEventListener('click', () => {
      this.openMembersPresenceModal();
    });

    // Quick Action Sheet Buttons
    document.getElementById('btn-sheet-create-memory')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-memory')?.click();
    });
    document.getElementById('btn-sheet-create-song')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-song')?.click();
    });
    document.getElementById('btn-sheet-create-movie')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-movie')?.click();
    });
    document.getElementById('btn-sheet-create-series')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-series')?.click();
    });
    document.getElementById('btn-sheet-create-note')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-note')?.click();
    });
    document.getElementById('btn-sheet-create-goal')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      document.getElementById('btn-new-goal')?.click();
    });

    document.getElementById('btn-new-memory')?.addEventListener('click', () => {
      document.getElementById('form-memory')?.reset();
      document.getElementById('memory-edit-id').value = '';
      document.getElementById('memory-date-input').value = new Date().toISOString().split('T')[0];
      this.openModal('modal-memory');
    });

    document.getElementById('btn-sheet-create-song')?.addEventListener('click', () => {
      this.closeModal('modal-create-sheet');
      this.openAddSongModal();
    });

    document.getElementById('btn-new-song')?.addEventListener('click', () => {
      this.openAddSongModal();
    });

    document.getElementById('btn-new-movie')?.addEventListener('click', () => {
      document.getElementById('form-movie')?.reset();
      document.getElementById('movie-id').value = '';
      document.getElementById('movie-year-input').value = new Date().getFullYear();
      
      const group = this.storage.getActiveGroup();
      const members = (group && group.members) || [];
      const propSelect = document.getElementById('movie-proposed-select');
      if (propSelect) {
        propSelect.innerHTML = members.map(m => `
          <option value="${window.Utils.sanitizeHTML(m.name)}">${window.Utils.sanitizeHTML(m.name)}</option>
        `).join('');
      }
      this.openModal('modal-movie');
    });

    document.getElementById('btn-new-series')?.addEventListener('click', () => {
      document.getElementById('form-series')?.reset();
      this.openModal('modal-series');
    });

    document.getElementById('btn-new-note')?.addEventListener('click', () => {
      document.getElementById('form-note')?.reset();
      this.openModal('modal-note');
    });

    document.getElementById('btn-new-goal')?.addEventListener('click', () => {
      document.getElementById('form-goal')?.reset();
      this.openModal('modal-goal');
    });

    document.getElementById('btn-player-toggle')?.addEventListener('click', () => {
      this.audioManager.togglePlay();
    });

    document.getElementById('btn-player-close')?.addEventListener('click', () => {
      this.audioManager.stop();
    });

    document.getElementById('btn-modal-open-join')?.addEventListener('click', () => {
      this.closeModal('modal-groups-list');
      this.openModal('modal-join-group');
    });

    document.getElementById('btn-modal-open-create')?.addEventListener('click', () => {
      this.closeModal('modal-groups-list');
      this.openModal('modal-create-group');
    });
  }  // --- VINCULACIÓN DE FORMULARIOS ---
  bindFormEvents() {
    // 1. Formulario Editar Grupo
    const formEditGroup = document.getElementById('form-edit-group');
    if (formEditGroup) {
      formEditGroup.onsubmit = async (e) => {
        e.preventDefault();
        const activeGroup = this.storage.getActiveGroup();
        if (!activeGroup) return;

        const name = document.getElementById('edit-group-name').value.trim();
        const icon = document.getElementById('edit-group-icon').value.trim() || '⭐';
        const color = document.getElementById('edit-group-color').value;
        const coverUrl = document.getElementById('edit-group-cover-url').value.trim();
        const coverFileInput = document.getElementById('edit-group-cover-file');
        const iconFileInput = document.getElementById('edit-group-icon-file');

        let iconImage = activeGroup.iconImage || '';
        if (iconFileInput && iconFileInput.files && iconFileInput.files[0]) {
          iconImage = await window.Utils.fileToBase64(iconFileInput.files[0]);
        }

        let coverImage = coverUrl || activeGroup.coverImage || '';
        if (coverFileInput && coverFileInput.files && coverFileInput.files[0]) {
          coverImage = await window.Utils.fileToBase64(coverFileInput.files[0]);
        }

        this.storage.updateGroup(activeGroup.id, {
          name,
          icon,
          color,
          iconImage,
          coverImage
        });

        this.closeModal('modal-edit-group');
        window.Utils.showToast('Grupo actualizado con éxito ✨', 'success');
        this.updateHeader();
        this.renderInicio();
      };
    }

    // 2. Formulario Crear Grupo
    const formCreateGroup = document.getElementById('form-create-group');
    if (formCreateGroup) {
      formCreateGroup.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-group-name').value.trim();
        const icon = document.getElementById('new-group-icon').value.trim() || '🌟';
        const color = document.getElementById('new-group-color').value;
        const coverUrl = document.getElementById('new-group-cover-url').value.trim();
        const coverFile = document.getElementById('new-group-cover-file')?.files?.[0];
        const iconFile = document.getElementById('new-group-icon-file')?.files?.[0];

        let iconImage = '';
        if (iconFile) iconImage = await window.Utils.fileToBase64(iconFile);

        let coverImage = coverUrl;
        if (coverFile) coverImage = await window.Utils.fileToBase64(coverFile);

        const newGroup = this.storage.createGroup(name, icon, color, coverImage, iconImage);
        this.closeModal('modal-create-group');
        window.Utils.showToast(`¡Grupo "${newGroup.name}" creado! Código: ${newGroup.code}`, 'success');
        
        this.enterActiveGroupDirectly();
      };
    }

    // 3. Formulario Unirse a Grupo
    const formJoinGroup = document.getElementById('form-join-group');
    if (formJoinGroup) {
      formJoinGroup.onsubmit = (e) => {
        e.preventDefault();
        const code = document.getElementById('join-group-code-input').value.trim().toUpperCase();
        if (code.length !== 6) {
          window.Utils.showToast('El código debe tener 6 caracteres', 'error');
          return;
        }

        try {
          const joined = this.storage.joinGroupByCode(code);
          if (joined) {
            this.closeModal('modal-join-group');
            window.Utils.showToast(`¡Te has unido a "${joined.name}"! 🚀`, 'success');
            this.enterActiveGroupDirectly();
          }
        } catch (err) {
          window.Utils.showToast(err.message || 'Error al unirse al grupo', 'error');
        }
      };
    }

    // 4. Formulario Personalizar Perfil
    const formProfile = document.getElementById('form-profile');
    if (formProfile) {
      formProfile.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name-input').value.trim();
        const handle = document.getElementById('profile-handle-input').value.trim();
        const bio = document.getElementById('profile-bio-input').value.trim();
        const statusMsg = document.getElementById('profile-status-input').value.trim();
        const gender = document.getElementById('profile-gender-select').value;
        const color = this.activeProfileColor || document.getElementById('profile-color-input').value;
        const avatarFile = document.getElementById('profile-avatar-file')?.files?.[0];

        let avatar = this.activeUploadedAvatar || '';
        if (avatarFile) {
          avatar = await window.Utils.fileToBase64(avatarFile);
        }

        const updated = this.storage.saveUserProfile({
          name,
          handle,
          bio,
          statusMsg,
          gender,
          favoriteColor: color,
          avatar: avatar,
          presetAvatar: avatar ? '' : (this.activePresetAvatar || '👨‍🚀')
        });

        this.closeModal('modal-profile');
        window.Utils.showToast('¡Perfil personalizado con éxito! ✨', 'success');
        this.updateHeader();
        this.renderInicio();
      };
    }

    // 5. Formulario Recuerdo (NÚCLEO EMOCIONAL & DIARIO CON SUBIDA A GOOGLE DRIVE)
    const formMemory = document.getElementById('form-memory');
    if (formMemory) {
      formMemory.onsubmit = async (e) => {
        e.preventDefault();

        // Mutex para evitar envíos múltiples o duplicados
        if (this.isSubmittingMemory) return;
        this.isSubmittingMemory = true;

        const btnSubmit = formMemory.querySelector('button[type="submit"]');
        const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>⏳</span><span>Guardando y subiendo a Drive...</span>';
        }

        try {
          const id = document.getElementById('memory-edit-id').value || null;
          const title = document.getElementById('memory-title-input').value.trim();
          const date = document.getElementById('memory-date-input').value;
          const location = document.getElementById('memory-location-input').value.trim();
          const description = document.getElementById('memory-desc-input').value.trim();
          const auraColor = document.getElementById('memory-aura-color').value || '#F59E0B';
          const isFeatured = document.getElementById('memory-is-featured').value === 'true';
          const audioData = document.getElementById('memory-audio-data').value;
          const songDataRaw = document.getElementById('memory-song-data').value;

          let songObj = null;
          if (songDataRaw) {
            try { songObj = JSON.parse(songDataRaw); } catch (_) {}
          }

          // Portada
          let coverImage = '';
          let isCoverVideo = false;

          if (this.selectedMemoryCover && this.selectedMemoryCover.dataUrl) {
            coverImage = this.selectedMemoryCover.dataUrl;
            isCoverVideo = Boolean(this.selectedMemoryCover.isVideo);
          } else if (id) {
            const existing = this.storage.getMemories().find(m => m.id === id);
            if (existing) {
              coverImage = existing.coverImage || '';
              isCoverVideo = Boolean(existing.isVideo);
            }
          } else {
            coverImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
          }

          // Galería completa (portada + fotos + videos)
          let photos = [];
          if (coverImage) {
            photos.push(coverImage);
          }
          if (this.selectedMemoryGallery && this.selectedMemoryGallery.length > 0) {
            this.selectedMemoryGallery.forEach(item => {
              if (item.dataUrl && !photos.includes(item.dataUrl)) {
                photos.push(item.dataUrl);
              }
            });
          }

          const profile = this.storage.getUserProfile() || {};
          const author = {
            id: profile.id,
            name: profile.name || 'Kevin',
            color: profile.favoriteColor || '#6366F1',
            avatar: profile.avatar || ''
          };

          // --- ESTRUCTURA Y SUBIDA AUTOMÁTICA A GOOGLE DRIVE ---
          const driveFolderUrl = this.storage.getDriveFolder();
          let driveUploadInfo = null;

          if (driveFolderUrl) {
            const safeTitle = title || 'Recuerdo';
            const safeDate = date || new Date().toISOString().split('T')[0];
            const subfolderName = `${safeTitle} - ${safeDate}`;

            let photoCounter = 1;
            let videoCounter = 1;
            const organizedFiles = [];

            // 1. Portada
            if (this.selectedMemoryCover) {
              const ext = this.selectedMemoryCover.name?.split('.').pop() || (isCoverVideo ? 'mp4' : 'jpg');
              organizedFiles.push({
                name: isCoverVideo ? `Video_Portada.${ext}` : `Portada.${ext}`,
                type: isCoverVideo ? 'video' : 'photo'
              });
            }

            // 2. Galería cuadrada (Foto 1, Foto 2, Video 1...)
            this.selectedMemoryGallery.forEach(item => {
              const ext = item.name?.split('.').pop() || (item.isVideo ? 'mp4' : 'jpg');
              if (item.isVideo) {
                organizedFiles.push({ name: `Video ${videoCounter++}.${ext}`, type: 'video' });
              } else {
                organizedFiles.push({ name: `Foto ${photoCounter++}.${ext}`, type: 'photo' });
              }
            });

            // Invocar el motor GoogleDriveSync
            if (window.GoogleDriveSync) {
              try {
                const webhookUrl = this.storage.getDriveWebhook ? this.storage.getDriveWebhook() : '';
                const driveRes = await window.GoogleDriveSync.uploadMemoryToDrive(
                  { title: safeTitle, date: safeDate, coverImage, isVideo: isCoverVideo, photos },
                  driveFolderUrl,
                  webhookUrl
                );
                driveUploadInfo = {
                  folderUrl: driveRes.folderUrl || driveFolderUrl,
                  subfolderName: driveRes.folderName || subfolderName,
                  filesCount: driveRes.filesCount || organizedFiles.length,
                  files: organizedFiles,
                  uploadedAt: new Date().toISOString()
                };
              } catch (err) {
                console.warn('Google Drive sync:', err);
                driveUploadInfo = {
                  folderUrl: driveFolderUrl,
                  subfolderName: subfolderName,
                  filesCount: organizedFiles.length,
                  files: organizedFiles,
                  uploadedAt: new Date().toISOString()
                };
              }
            }
          }

          const memoryObj = {
            id,
            title,
            date,
            location,
            description,
            auraColor,
            isFeatured,
            coverImage,
            isVideo: isCoverVideo,
            photos: photos,
            photosCount: photos.length,
            author,
            song: songObj,
            audioNote: audioData ? { duration: '0:45', audioUrl: audioData } : null,
            driveUpload: driveUploadInfo,
            createdAt: new Date().toISOString()
          };

          this.storage.saveMemory(memoryObj);
          this.closeModal('modal-memory');

          if (driveUploadInfo) {
            window.Utils.showToast(`📁 Organizado en Google Drive: "${driveUploadInfo.subfolderName}" (${driveUploadInfo.filesCount} archivos) ☁️✨`, 'success');
          } else {
            window.Utils.showToast('¡Recuerdo inmortalizado con éxito! ✨', 'success');
          }

          this.renderMemories();
          this.renderInicio();
        } catch (submitErr) {
          console.error('Error saving memory:', submitErr);
          window.Utils.showToast('Ocurrió un problema al guardar el recuerdo', 'error');
        } finally {
          this.isSubmittingMemory = false;
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = origBtnHtml || '<span class="bloom-icon">✨</span><span>Inmortalizar Recuerdo</span>';
          }
        }
      };
    }

    // 5.04 Formulario Vincular Carpeta y Webhook de Google Drive
    const formDrive = document.getElementById('form-drive-sync');
    if (formDrive) {
      formDrive.onsubmit = (e) => {
        e.preventDefault();
        const url = document.getElementById('drive-folder-url-input').value.trim();
        const webhookUrl = document.getElementById('drive-webhook-url-input')?.value.trim() || '';
        this.storage.saveDriveFolder(url, webhookUrl);
        this.closeModal('modal-drive-sync');
        window.Utils.showToast('📁 Configuración de Google Drive guardada con éxito ☁️✨', 'success');
      };
    }

    // 5.1 Formulario Plan a Futuro / Cita
    const formPlan = document.getElementById('form-plan');
    if (formPlan) {
      formPlan.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('plan-id').value || null;
        const title = document.getElementById('plan-title-input').value.trim();
        const date = document.getElementById('plan-date-input').value;
        const time = document.getElementById('plan-time-input').value;
        const category = document.getElementById('plan-category-select').value;
        const location = document.getElementById('plan-location-input').value.trim();
        const description = document.getElementById('plan-desc-input').value.trim();

        const profile = this.storage.getUserProfile() || {};
        const author = {
          id: profile.id,
          name: profile.name || 'Kevin',
          color: profile.favoriteColor || '#6366F1'
        };

        const planObj = {
          id,
          title,
          date,
          time,
          category,
          location,
          description,
          author,
          createdAt: new Date().toISOString()
        };

        this.storage.savePlan(planObj);
        this.closeModal('modal-plan');
        window.Utils.showToast('¡Plan a futuro agendado con éxito! 🗓️✨', 'success');
        this.initMemoriesCalendar();
        this.renderInicio();
      };
    }

    // 6. Formulario Película (ATRIA FULL PARITY)
    const formMovie = document.getElementById('form-movie');
    if (formMovie) {
      formMovie.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('movie-id').value;
        const title = document.getElementById('movie-title-input').value.trim();
        const year = parseInt(document.getElementById('movie-year-input').value, 10);
        const proposedBy = document.getElementById('movie-proposed-select').value;
        const priority = parseInt(document.getElementById('movie-priority-select').value, 10) || 5;
        const status = document.getElementById('movie-status-select').value;
        const ratingVal = document.getElementById('movie-rating-input').value;
        const comment = document.getElementById('movie-comment-input').value.trim();
        const poster = document.getElementById('movie-poster-url').value;

        const user = this.storage.getUserProfile();
        const movieObj = {
          id: id || null,
          title,
          year,
          proposedBy,
          priority,
          status,
          poster: poster || null,
          ratings: {},
          comments: {}
        };

        if (id) {
          const existing = this.storage.getMovies().find(m => m.id === id);
          if (existing) {
            movieObj.ratings = { ...(existing.ratings || {}) };
            movieObj.comments = { ...(existing.comments || {}) };
            movieObj.poster = existing.poster || poster;
          }
        }

        if (ratingVal !== '') {
          movieObj.ratings[user?.id] = parseFloat(ratingVal);
        }
        if (comment !== '') {
          movieObj.comments[user?.id] = comment;
        }

        this.storage.saveMovie(movieObj);
        this.closeModal('modal-movie');
        window.Utils.showToast('Película guardada en la biblioteca 🎬', 'success');
        this.renderMovies();
        this.renderInicio();
      };
    }

    // 7. Formulario Canción Colaborativa (Manejado por initSongModalInteractions)

    // 8. Formulario Serie
    const formSeries = document.getElementById('form-series');
    if (formSeries) {
      formSeries.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('series-title-input').value.trim();
        const season = parseInt(document.getElementById('series-season-input').value, 10) || 1;
        const episode = parseInt(document.getElementById('series-episode-input').value, 10) || 1;
        const platform = document.getElementById('series-platform-input').value.trim();
        const poster = document.getElementById('series-poster-url').value;

        this.storage.saveSeries({
          title,
          currentSeason: season,
          currentEpisode: episode,
          platform,
          poster
        });

        this.closeModal('modal-series');
        window.Utils.showToast('Serie añadida 📺', 'success');
        this.renderSeries();
        this.renderInicio();
      };
    }

    // 9. Formulario Objetivo / Sueño (ATRIA PARITY)
    const formGoal = document.getElementById('form-goal');
    if (formGoal) {
      formGoal.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('goal-title-input').value.trim();
        const category = document.getElementById('goal-category-select').value;
        const targetDate = document.getElementById('goal-date-input').value;
        const partsRaw = document.getElementById('goal-participants-input').value.trim();
        const participants = partsRaw ? partsRaw.split(',').map(p => p.trim()) : [];

        this.storage.saveGoal({
          title,
          category,
          targetDate,
          participants
        });

        this.closeModal('modal-goal');
        window.Utils.showToast('Sueño guardado en el frasco ✨🌟', 'success');
        this.renderGoals();
        this.renderInicio();
      };
    }

    // 10. Formulario Nota (ATRIA PARITY)
    const formNote = document.getElementById('form-note');
    if (formNote) {
      formNote.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('note-title-input').value.trim();
        const type = document.getElementById('note-type-select').value;
        const content = document.getElementById('note-content-input').value.trim();
        const imgFile = document.getElementById('note-image-file')?.files?.[0];

        let image = '';
        if (imgFile) image = await window.Utils.fileToBase64(imgFile);

        this.storage.saveNote({
          title,
          type,
          content,
          image,
          author: this.storage.getUserProfile()?.name || 'Miembro'
        });

        this.closeModal('modal-note');
        window.Utils.showToast('Nota publicada en el muro 💌', 'success');
        this.renderNotes();
      };
    }

    // 11. Formulario Comentario de Recuerdo
    const formComment = document.getElementById('form-add-comment');
    if (formComment) {
      formComment.onsubmit = (e) => {
        e.preventDefault();
        const memoryId = document.getElementById('comment-memory-id').value;
        const text = document.getElementById('comment-text-input').value.trim();
        if (!text) return;

        this.storage.addMemoryComment(memoryId, text);
        document.getElementById('comment-text-input').value = '';
        this.populateMemoryComments(memoryId);
        this.renderMemories();
      };
    }
  }

  // --- BÚSQUEDAS MULTIMEDIA ---
  bindSearchEvents() {
    const musicForm = document.getElementById('music-search-form');
    if (musicForm) {
      musicForm.onsubmit = async (e) => {
        e.preventDefault();
        const query = document.getElementById('music-search-input').value.trim();
        const resultsBox = document.getElementById('music-search-results');
        if (!query || !resultsBox) return;

        resultsBox.innerHTML = '<div style="color: var(--color-text-secondary); padding: 0.5rem;">Buscando en iTunes...</div>';
        const songs = await this.media.searchSongs(query);

        if (songs.length === 0) {
          resultsBox.innerHTML = '<div style="color: var(--color-error); padding: 0.5rem;">No se encontraron resultados.</div>';
          return;
        }

        resultsBox.innerHTML = `
          <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; max-height: 250px; overflow-y: auto;">
            ${songs.map((s, idx) => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.4rem; border-bottom: 1px solid var(--color-border);">
                <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
                  <img src="${s.artwork || 'assets/icon.png'}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;" alt="art" />
                  <div style="min-width: 0;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(s.title)}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${window.Utils.sanitizeHTML(s.artist)}</div>
                  </div>
                </div>
                <button type="button" class="btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.app.addSongFromSearch(${idx})">
                  + Añadir
                </button>
              </div>
            `).join('')}
          </div>
        `;
        this.lastMusicSearch = songs;
      };
    }

    const movieForm = document.getElementById('movie-search-form');
    if (movieForm) {
      movieForm.onsubmit = async (e) => {
        e.preventDefault();
        const query = document.getElementById('movie-search-input').value.trim();
        const resultsBox = document.getElementById('movie-search-results');
        if (!query || !resultsBox) return;

        resultsBox.innerHTML = '<div style="color: var(--color-text-secondary); padding: 0.5rem;">Buscando en TMDb...</div>';
        const movies = await this.media.searchMovies(query);

        if (movies.length === 0) {
          resultsBox.innerHTML = '<div style="color: var(--color-error); padding: 0.5rem;">No se encontraron películas.</div>';
          return;
        }

        resultsBox.innerHTML = `
          <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; max-height: 250px; overflow-y: auto;">
            ${movies.map((m, idx) => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.4rem; border-bottom: 1px solid var(--color-border);">
                <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
                  <img src="${m.poster || 'assets/icon.png'}" style="width: 32px; height: 46px; border-radius: 4px; object-fit: cover;" alt="poster" />
                  <div style="min-width: 0;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(m.title)} (${m.year || ''})</div>
                    <div style="font-size: 0.75rem; color: var(--color-gold);">⭐ TMDb ${m.tmdbRating || 'N/A'}</div>
                  </div>
                </div>
                <button type="button" class="btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.app.addMovieFromSearch(${idx})">
                  + Añadir
                </button>
              </div>
            `).join('')}
          </div>
        `;
        this.lastMovieSearch = movies;
      };
    }
  }

  addSongFromSearch(index) {
    if (this.lastMusicSearch && this.lastMusicSearch[index]) {
      const s = this.lastMusicSearch[index];
      this.storage.saveSong({
        title: s.title,
        artist: s.artist,
        artwork: s.artwork,
        previewUrl: s.previewUrl,
        rating: 5,
        addedBy: this.storage.getUserProfile()?.name || 'Miembro'
      });
      document.getElementById('music-search-results').innerHTML = '';
      document.getElementById('music-search-input').value = '';
      window.Utils.showToast(`"${s.title}" añadida a Música 🎵`, 'success');
      this.renderSongs();
      this.renderInicio();
    }
  }

  addMovieFromSearch(index) {
    if (this.lastMovieSearch && this.lastMovieSearch[index]) {
      const m = this.lastMovieSearch[index];
      this.openAddMovieModal(m);
    }
  }

  // --- COMENTARIOS DE RECUERDOS ---
  openMemoryComments(memoryId) {
    document.getElementById('comment-memory-id').value = memoryId;
    this.populateMemoryComments(memoryId);
    this.openModal('modal-memory-comments');
  }

  populateMemoryComments(memoryId) {
    const list = document.getElementById('memory-comments-list');
    const memory = this.storage.getMemories().find(m => m.id === memoryId);
    if (!list || !memory) return;

    const comments = memory.comments || [];
    if (comments.length === 0) {
      list.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 0.5rem 0;">Aún no hay comentarios. ¡Sé el primero!</div>';
      return;
    }

    list.innerHTML = comments.map(c => `
      <div style="background: #F8FAFC; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.6rem 0.8rem; margin-bottom: 0.5rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-primary); font-weight: 700;">
          <span>${window.Utils.sanitizeHTML(c.author || 'Miembro')}</span>
          <span style="color: var(--color-text-muted); font-weight: 400;">${window.Utils.formatDateTimeES(c.createdAt)}</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--color-text-main); margin-top: 0.2rem;">${window.Utils.sanitizeHTML(c.text)}</div>
      </div>
    `).join('');
  }

  // --- LIGHTBOX ---
  openLightbox(src) {
    const img = document.getElementById('lightbox-img');
    if (img && src) {
      img.src = src;
      this.openModal('modal-lightbox');
    }
  }
}

// Inicialización Global de LUMA
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LumaApp();
});