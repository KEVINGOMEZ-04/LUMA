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
  }  // --- 2. RENDER RECUERDOS (ATRIA TIMELINE TRAIL) ---
  renderMemories() {
    const container = document.getElementById('memories-grid-list');
    if (!container) return;

    let memories = this.storage.getMemories();
    const sortVal = document.getElementById('select-sort-memories')?.value || 'desc';

    memories.sort((a, b) => {
      const tA = new Date(a.date || a.createdAt).getTime();
      const tB = new Date(b.date || b.createdAt).getTime();
      return sortVal === 'asc' ? tA - tB : tB - tA;
    });

    if (memories.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary); background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <span style="font-size: 2.2rem;">📸</span>
          <p style="margin-top: 0.5rem; font-size: 1rem; color: var(--color-text-main);">Aún no hay recuerdos guardados en este grupo.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-memory').click()">
            + Añadir el Primer Recuerdo 🌟
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = memories.map(mem => {
      const coverSrc = mem.coverImage || (mem.photos && mem.photos[0]) || '';
      const photosCount = (mem.photos && mem.photos.length) || (mem.coverImage ? 1 : 0);

      let coverHtml = '';
      if (coverSrc) {
        coverHtml = `
          <div class="memory-cover-wrap" onclick="window.app.openLightbox('${coverSrc}')">
            <img src="${coverSrc}" class="memory-cover-img" alt="${window.Utils.sanitizeHTML(mem.title)}" loading="lazy" />
            ${photosCount > 1 ? `<div class="memory-photos-badge">📷 ${photosCount} fotos</div>` : ''}
          </div>
        `;
      }

      let songHtml = '';
      if (mem.song && (mem.song.title || mem.song.previewUrl)) {
        songHtml = `
          <div class="memory-song-pill" onclick="window.app.playMemorySong('${mem.id}')">
            <div class="memory-song-info">
              <span>🎵</span>
              <span>${window.Utils.sanitizeHTML(mem.song.title)} - ${window.Utils.sanitizeHTML(mem.song.artist || '')}</span>
            </div>
            <span class="memory-revive-btn">
              <span>Revivir</span> ▶
            </span>
          </div>
        `;
      }

      return `
        <div class="memory-node" data-id="${mem.id}">
          <div class="luma-star-pin" title="Abrir recuerdo">🌟</div>
          <div class="memory-card-body">
            ${coverHtml}
            <div class="memory-body">
              <div class="memory-header-row">
                <div class="memory-date">
                  <span>📅 ${window.Utils.formatDateES(mem.date)}</span>
                  ${mem.status === 'Destacado' ? '<span style="color: var(--color-gold); font-weight: 700;">⭐ Destacado</span>' : ''}
                </div>
                ${mem.location ? `<span class="memory-location-tag">📍 ${window.Utils.sanitizeHTML(mem.location)}</span>` : ''}
              </div>
              <h3 class="memory-title">${window.Utils.sanitizeHTML(mem.title)}</h3>
              ${mem.description ? `<p class="memory-desc">${window.Utils.sanitizeHTML(mem.description)}</p>` : ''}
              ${songHtml}
              <div class="memory-footer">
                <span class="memory-author-tag">👤 ${window.Utils.sanitizeHTML(mem.author?.name || 'Miembro')}</span>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <button type="button" class="memory-comments-btn" onclick="window.app.openMemoryComments('${mem.id}')">
                    💬 ${(mem.comments || []).length}
                  </button>
                  <button type="button" class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.78rem;" onclick="window.app.editMemory('${mem.id}')">
                    Editar
                  </button>
                  <button type="button" class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.78rem; color: var(--color-error);" onclick="window.app.deleteMemory('${mem.id}')">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const sortSelect = document.getElementById('select-sort-memories');
    if (sortSelect) {
      sortSelect.onchange = () => this.renderMemories();
    }
  }

  editMemory(memId) {
    const mem = this.storage.getMemories().find(m => m.id === memId);
    if (!mem) return;

    document.getElementById('memory-edit-id').value = mem.id;
    document.getElementById('memory-title-input').value = mem.title || '';
    document.getElementById('memory-date-input').value = mem.date || '';
    document.getElementById('memory-location-input').value = mem.location || '';
    document.getElementById('memory-desc-input').value = mem.description || '';
    if (mem.song) {
      document.getElementById('memory-song-title').value = mem.song.title || '';
      document.getElementById('memory-song-artist').value = mem.song.artist || '';
      document.getElementById('memory-song-preview').value = mem.song.previewUrl || '';
    }
    this.openModal('modal-memory');
  }

  deleteMemory(id) {
    if (confirm('¿Seguro que deseas eliminar este recuerdo?')) {
      this.storage.deleteMemory(id);
      window.Utils.showToast('Recuerdo eliminado', 'info');
      this.renderMemories();
      this.renderInicio();
    }
  }

  playMemorySong(memoryId) {
    const memory = this.storage.getMemories().find(m => m.id === memoryId);
    if (memory && memory.song && memory.song.previewUrl) {
      this.audioManager.playTrack(memory.song);
    } else {
      window.Utils.showToast('Buscando preview de canción...', 'info');
      if (memory && memory.song && memory.song.title) {
        this.media.searchSongs(`${memory.song.title} ${memory.song.artist || ''}`).then(results => {
          if (results.length > 0 && results[0].previewUrl) {
            memory.song.previewUrl = results[0].previewUrl;
            this.storage.saveMemory(memory);
            this.audioManager.playTrack(results[0]);
          } else {
            window.Utils.showToast('No se encontró preview disponible', 'error');
          }
        });
      }
    }
  }

  // --- 3. RENDER MÚSICA ---
  renderSongs() {
    const container = document.getElementById('songs-grid-list');
    if (!container) return;

    const songs = this.storage.getSongs();
    if (songs.length === 0) {
      container.innerHTML = `
        <div class="song-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">🎵</span>
          <p style="margin-top: 0.5rem; font-size: 1rem; color: var(--color-text-main);">No hay canciones añadidas al grupo todavía.</p>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">Usa el buscador para añadir temas con preview oficial de 30s.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    songs.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-card';
      const artwork = song.artwork || 'assets/icon.png';

      card.innerHTML = `
        <div class="song-header">
          <img src="${artwork}" class="song-artwork" alt="${window.Utils.sanitizeHTML(song.title)}" loading="lazy" />
          <div class="song-details">
            <div class="song-title">${window.Utils.sanitizeHTML(song.title)}</div>
            <div class="song-artist">${window.Utils.sanitizeHTML(song.artist)}</div>
            <div class="song-rating-stars">${'⭐'.repeat(song.rating || 5)}</div>
          </div>
        </div>
        ${song.review ? `<div style="font-size: 0.82rem; color: var(--color-text-secondary); font-style: italic;">«${window.Utils.sanitizeHTML(song.review)}» — ${window.Utils.sanitizeHTML(song.addedBy || 'Miembro')}</div>` : ''}
        <div class="song-actions">
          <button type="button" class="btn-play-preview" onclick="window.app.playTrackDirectly('${song.id}')">
            <span>▶</span> Reproducir Preview
          </button>
          <div style="display: flex; gap: 0.3rem;">
            <button type="button" class="btn-ghost" style="font-size: 0.78rem;" onclick="window.app.showLyrics('${window.Utils.sanitizeHTML(song.artist)}', '${window.Utils.sanitizeHTML(song.title)}')">
              📄 Letra
            </button>
            <button type="button" class="btn-ghost" style="font-size: 0.78rem; color: var(--color-error);" onclick="window.app.deleteSong('${song.id}')">
              🗑️
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  deleteSong(songId) {
    if (confirm('¿Eliminar esta canción de la lista del grupo?')) {
      const data = this.storage.getGroupData();
      data.songs = (data.songs || []).filter(s => s.id !== songId);
      this.storage.saveGroupData(null, data);
      window.Utils.showToast('Canción eliminada', 'info');
      this.renderSongs();
      this.renderInicio();
    }
  }

  playTrackDirectly(songId) {
    const song = this.storage.getSongs().find(s => s.id === songId);
    if (song) {
      this.audioManager.playTrack(song);
    }
  }

  async showLyrics(artist, title) {
    this.openModal('modal-lyrics');
    const titleEl = document.getElementById('lyrics-title');
    const artistEl = document.getElementById('lyrics-artist');
    const bodyEl = document.getElementById('lyrics-content-body');
    const buttonsEl = document.getElementById('lyrics-platform-buttons');

    if (titleEl) titleEl.textContent = title;
    if (artistEl) artistEl.textContent = artist;
    if (bodyEl) bodyEl.textContent = 'Cargando letra...';

    if (buttonsEl) {
      buttonsEl.innerHTML = `
        <a href="${this.media.spotifyUrl(title, artist)}" target="_blank" class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.7rem;">🟢 Spotify</a>
        <a href="${this.media.youtubeUrl(title, artist)}" target="_blank" class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.7rem;">🔴 YouTube</a>
        <a href="${this.media.geniusUrl(title, artist)}" target="_blank" class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.7rem;">🟡 Genius</a>
      `;
    }

    const lyrics = await this.media.fetchLyrics(artist, title);
    if (bodyEl) {
      bodyEl.textContent = lyrics || 'No se encontró la letra para esta canción. Puedes verla directamente en Spotify o Genius con los enlaces.';
    }
  }

  // --- 4. RENDER CINE (ATRIA MOVIE RATING BAR & COMMENTS) ---
  renderMovies() {
    const container = document.getElementById('movies-grid-list');
    const filter = document.getElementById('filter-movies-status')?.value || 'all';
    if (!container) return;

    let list = this.storage.getMovies();
    if (filter !== 'all') {
      list = list.filter(m => m.status === filter);
    }

    if (list.length === 0) {
      container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); background: #fff; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">No hay películas registradas en esta categoría.</div>`;
      return;
    }

    const group = this.storage.getActiveGroup();
    const members = (group && group.members) || [];

    container.innerHTML = list.map(m => {
      const ratingsObj = m.ratings || {};
      const ratingEntries = Object.entries(ratingsObj).filter(([k, v]) => v !== null && v !== undefined && v !== '');

      let ratingHtml = '';
      if (ratingEntries.length > 0) {
        const sum = ratingEntries.reduce((acc, [, val]) => acc + parseFloat(val), 0);
        const avg = sum / ratingEntries.length;
        const breakdown = ratingEntries.map(([uid, score]) => {
          const mem = members.find(x => x.id === uid);
          const name = mem ? mem.name.split(' ')[0] : 'U';
          return `${name}: ${window.Utils.formatDecimalES(score, 1)}`;
        }).join(' | ');

        ratingHtml = `<span>Promedio: <strong style="color: var(--color-gold);">${window.Utils.formatDecimalES(avg, 2)}/10</strong></span> <span>(${breakdown})</span>`;
      } else {
        ratingHtml = `<span style="color: var(--color-text-muted); font-size: 0.8rem;">Sin calificar</span>`;
      }

      const commentsObj = m.comments || {};
      const commentsHtml = Object.entries(commentsObj).map(([uid, c]) => {
        if (!c) return '';
        const mem = members.find(x => x.id === uid);
        const name = mem ? mem.name : 'Miembro';
        return `<p class="movie-comment-quote">“${window.Utils.sanitizeHTML(c)}” — ${window.Utils.sanitizeHTML(name)}</p>`;
      }).join('');

      const statusClass = m.status === 'Favorita' ? 'Favorita' : m.status === 'Vista' ? 'Vista' : 'PorVer';
      const statusLabel = m.status === 'Favorita' ? '❤️ Favorita' : m.status === 'Vista' ? '🍿 Vista' : '🌱 Por ver';

      return `
        <div class="movie-card" data-id="${m.id}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="movie-badge-status ${statusClass}">${statusLabel}</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted); font-family: var(--font-mono);">${'⭐'.repeat(m.priority || 5)}</span>
            </div>
            <h3 class="movie-title-heading">
              ${window.Utils.sanitizeHTML(m.title)} <span style="font-size: 0.9rem; color: var(--color-text-secondary); font-family: var(--font-mono);">(${m.year || ''})</span>
            </h3>
            <p class="movie-meta-sub">Propuesta por: <strong>${window.Utils.sanitizeHTML(m.proposedBy || 'Miembro')}</strong> · Prioridad: ${m.priority || 5}/5 ⭐</p>
            ${commentsHtml ? `<div class="movie-comments-list">${commentsHtml}</div>` : ''}
          </div>
          <div>
            <div class="movie-rating-bar">${ratingHtml}</div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.85rem;">
              <button type="button" class="btn-secondary" onclick="window.app.openEditMovieModal('${m.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                Editar
              </button>
              <button type="button" class="btn-secondary" onclick="window.app.deleteMovie('${m.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; color: var(--color-error);">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('filter-movies-status')?.addEventListener('change', () => this.renderMovies());
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

    document.getElementById('btn-new-song')?.addEventListener('click', () => {
      document.getElementById('form-song')?.reset();
      this.openModal('modal-song');
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

    // 5. Formulario Recuerdo (ATRIA PARITY)
    const formMemory = document.getElementById('form-memory');
    if (formMemory) {
      formMemory.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('memory-title-input').value.trim();
        const date = document.getElementById('memory-date-input').value;
        const location = document.getElementById('memory-location-input').value.trim();
        const description = document.getElementById('memory-desc-input').value.trim();
        const songTitle = document.getElementById('memory-song-title').value.trim();
        const songArtist = document.getElementById('memory-song-artist').value.trim();
        const songPreview = document.getElementById('memory-song-preview').value.trim();

        const coverFile = document.getElementById('memory-cover-file')?.files?.[0];
        const photosFiles = document.getElementById('memory-photos-file')?.files || [];

        let coverImage = '';
        if (coverFile) coverImage = await window.Utils.fileToBase64(coverFile);

        let photos = [];
        for (let i = 0; i < photosFiles.length; i++) {
          photos.push(await window.Utils.fileToBase64(photosFiles[i]));
        }

        const newMem = {
          id: document.getElementById('memory-edit-id').value || null,
          title,
          date,
          location,
          description,
          coverImage,
          photos,
          song: songTitle ? { title: songTitle, artist: songArtist, previewUrl: songPreview } : null
        };

        this.storage.saveMemory(newMem);
        this.closeModal('modal-memory');
        window.Utils.showToast('Recuerdo guardado con éxito 📸🌻', 'success');
        this.renderMemories();
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

    // 7. Formulario Canción
    const formSong = document.getElementById('form-song');
    if (formSong) {
      formSong.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('song-title-input').value.trim();
        const artist = document.getElementById('song-artist-input').value.trim();
        const rating = parseInt(document.getElementById('song-rating-select').value, 10);
        const addedBy = document.getElementById('song-recommender-input').value.trim();
        const review = document.getElementById('song-review-input').value.trim();
        const previewUrl = document.getElementById('song-preview-url').value;
        const artwork = document.getElementById('song-artwork-url').value;

        this.storage.saveSong({
          title,
          artist,
          rating,
          addedBy: addedBy || this.storage.getUserProfile()?.name || 'Miembro',
          review,
          previewUrl,
          artwork
        });

        this.closeModal('modal-song');
        window.Utils.showToast('Canción añadida al grupo 🎵', 'success');
        this.renderSongs();
        this.renderInicio();
      };
    }

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
      this.storage.saveMovie({
        title: m.title,
        year: m.year,
        poster: m.poster,
        overview: m.overview,
        tmdbRating: m.tmdbRating,
        proposedBy: this.storage.getUserProfile()?.name || 'Miembro',
        status: 'Por ver'
      });
      document.getElementById('movie-search-results').innerHTML = '';
      document.getElementById('movie-search-input').value = '';
      window.Utils.showToast(`"${m.title}" añadida a Cine 🍿`, 'success');
      this.renderMovies();
      this.renderInicio();
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