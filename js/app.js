/**
 * LUMA 🌟 - Controlador Principal de Aplicación
 * Plataforma social de grupos privados.
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
    // 1. Iniciar Canvas de Fondo
    if (window.StarfieldBackground) {
      new window.StarfieldBackground('stars-canvas');
    }

    // 2. Registrar Service Worker PWA
    this.registerServiceWorker();

    // 3. Suscribirse a cambios de datos y presencia
    this.bindSubscriptions();

    // 4. Configurar Navegación por Hash y Píldoras
    this.setupNavigation();

    // 5. Vincular Eventos de Modales y Formularios
    this.bindModalEvents();
    this.bindFormEvents();
    this.bindSearchEvents();

    // 6. Verificar Estado de Onboarding vs Dashboard
    this.checkInitialState();
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

    if (!profile || !profile.name || !groups || groups.length === 0 || !activeGroup) {
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

  bindOnboardingActions() {
    const btnHost = document.getElementById('btn-onboarding-host');
    const btnCode = document.getElementById('btn-onboarding-code');
    const btnGroups = document.getElementById('btn-onboarding-groups');
    const btnProfile = document.getElementById('btn-onboarding-profile');

    if (btnHost) {
      btnHost.onclick = () => {
        this.ensureProfileThen(() => this.openModal('modal-create-group'));
      };
    }
    if (btnCode) {
      btnCode.onclick = () => {
        this.ensureProfileThen(() => this.openModal('modal-join-group'));
      };
    }
    if (btnGroups) {
      btnGroups.onclick = () => {
        this.openGroupsListModal();
      };
    }
    if (btnProfile) {
      btnProfile.onclick = () => {
        this.populateProfileModal();
        this.openModal('modal-profile');
      };
    }
  }

  ensureProfileThen(callback) {
    const profile = this.storage.getUserProfile();
    if (!profile || !profile.name) {
      window.Utils.showToast('Por favor personaliza tu nombre de perfil primero', 'info');
      this.populateProfileModal();
      this.openModal('modal-profile');
      this.pendingAfterProfile = callback;
    } else {
      callback();
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

    document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
    const activePill = document.getElementById(`nav-pill-${target}`);
    if (activePill) activePill.classList.add('active');

    document.querySelectorAll('.luma-section').forEach(s => s.classList.remove('active'));
    const activeSection = document.getElementById(`section-${target}`);
    if (activeSection) activeSection.classList.add('active');

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
      case 'insights': this.renderInsights(); break;
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

    const iconStr = group.iconImage ? '🖼️' : (group.icon || '🌟');
    if (nameEl) nameEl.textContent = `${iconStr} ${group.name}`;
    if (dotEl) {
      dotEl.style.backgroundColor = group.color || '#7C3AED';
      dotEl.style.color = group.color || '#7C3AED';
    }
    if (codeEl) {
      codeEl.textContent = group.code || '------';
      codeEl.onclick = (e) => {
        e.stopPropagation();
        window.Utils.copyToClipboard(group.code, `Código ${group.code} copiado 📋`);
      };
    }

    // Botón / Chip de Grupo abre el menú de opciones de grupo
    const groupChip = document.getElementById('header-group-chip');
    if (groupChip) {
      groupChip.onclick = () => this.openGroupMenuModal();
    }

    // Actualizar Única Casilla del Perfil Activo en el Header
    const avatarWrap = document.getElementById('header-user-avatar-img-wrap');
    const avatarText = document.getElementById('header-user-avatar-text');
    if (avatarWrap && profile) {
      avatarWrap.style.backgroundColor = profile.favoriteColor || '#7C3AED';
      if (profile.avatar) {
        avatarWrap.innerHTML = `<img src="${window.Utils.sanitizeHTML(profile.avatar)}" alt="${window.Utils.sanitizeHTML(profile.name)}" />`;
      } else {
        avatarWrap.innerHTML = `<span>${(profile.name || 'U').charAt(0).toUpperCase()}</span>`;
      }
    }

    const profileBtn = document.getElementById('header-profile-avatar-btn');
    if (profileBtn) {
      profileBtn.onclick = () => this.openMembersPresenceModal();
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

    // 1. Editar Grupo
    const btnEdit = document.getElementById('btn-menu-action-edit');
    if (btnEdit) {
      btnEdit.onclick = () => {
        this.closeModal('modal-group-menu');
        this.openEditGroupModal();
      };
    }

    // 2. Mis Grupos / Cambiar
    const btnSwitch = document.getElementById('btn-menu-action-switch');
    if (btnSwitch) {
      btnSwitch.onclick = () => {
        this.closeModal('modal-group-menu');
        this.openGroupsListModal();
      };
    }

    // 3. Volver al Menú Principal
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

    // 4. Salir del Grupo
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

  // --- MODAL: MIEMBROS Y ESTADO DE CONEXIÓN ---
  openMembersPresenceModal() {
    this.populateMembersPresenceModal(this.presence.presenceMap || {});
    this.openModal('modal-members-presence');
  }

  populateMembersPresenceModal(presenceMap) {
    const profile = this.storage.getUserProfile() || {};
    const group = this.storage.getActiveGroup();
    if (!group) return;

    // Mi Perfil
    const myAvatar = document.getElementById('presence-modal-my-avatar');
    const myName = document.getElementById('presence-modal-my-name');
    const myBio = document.getElementById('presence-modal-my-bio');

    if (myAvatar) {
      myAvatar.style.backgroundColor = profile.favoriteColor || '#7C3AED';
      if (profile.avatar) {
        myAvatar.innerHTML = `<img src="${window.Utils.sanitizeHTML(profile.avatar)}" alt="${window.Utils.sanitizeHTML(profile.name)}" />`;
      } else {
        myAvatar.innerHTML = `<span>${(profile.name || 'U').charAt(0).toUpperCase()}</span>`;
      }
    }
    if (myName) myName.textContent = profile.name || 'Mi Perfil';
    if (myBio) myBio.textContent = profile.bio || 'Sin biografía añadida';

    const btnEditProfile = document.getElementById('btn-presence-modal-edit-profile');
    if (btnEditProfile) {
      btnEditProfile.onclick = () => {
        this.closeModal('modal-members-presence');
        this.populateProfileModal();
        this.openModal('modal-profile');
      };
    }

    // Lista de Miembros
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
      const isOnline = Boolean(pData.online || pData.state === 'online');
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

      let lastSeenText = '';
      if (pData.lastSeen) {
        lastSeenText = `Última vez: ${window.Utils.formatDateTimeES(new Date(pData.lastSeen).toISOString())}`;
      } else if (m.joinedAt) {
        lastSeenText = `Miembro desde ${window.Utils.formatDateES(m.joinedAt)}`;
      }

      const card = document.createElement('div');
      card.className = 'member-presence-card';
      card.innerHTML = `
        <div class="member-card-left">
          <div class="member-card-avatar" style="background-color: ${m.color || '#7C3AED'};">
            ${m.avatar ? `<img src="${window.Utils.sanitizeHTML(m.avatar)}" alt="${window.Utils.sanitizeHTML(m.name)}" />` : (m.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <strong style="font-size: 0.9rem; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${window.Utils.sanitizeHTML(m.name)}
              </strong>
              ${isHost ? '<span class="user-role-badge">Host</span>' : ''}
              ${isMe ? '<span class="user-role-badge self">Tú</span>' : ''}
            </div>
            <div style="font-size: 0.72rem; color: var(--color-text-muted);">${lastSeenText}</div>
          </div>
        </div>
        <div class="member-card-status-pill ${statusClass}">${statusLabel}</div>
      `;
      listContainer.appendChild(card);
    });
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
        coverImg.style.display = 'none';
        coverWrap.style.background = `linear-gradient(135deg, ${group.color || '#7C3AED'}44 0%, #0F172A 100%)`;
      }
    }

    const btnChangeCover = document.getElementById('btn-edit-cover-quick');
    if (btnChangeCover) {
      btnChangeCover.onclick = () => this.openEditGroupModal();
    }

    // 2. Logo / Icono del Grupo
    const iconDisplay = document.getElementById('group-hero-icon-display');
    const iconBox = document.getElementById('group-hero-icon-box');
    if (iconDisplay) {
      if (group.iconImage) {
        iconDisplay.innerHTML = `<img src="${group.iconImage}" alt="Logo" style="width:100%; height:100%; object-fit:cover;" />`;
      } else {
        iconDisplay.textContent = group.icon || '🌟';
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
      members.slice(0, 6).forEach(m => {
        const pill = document.createElement('div');
        pill.className = 'hero-member-avatar-pill';
        pill.title = m.name;
        pill.style.backgroundColor = m.color || '#7C3AED';
        if (m.avatar) {
          pill.innerHTML = `<img src="${window.Utils.sanitizeHTML(m.avatar)}" alt="${window.Utils.sanitizeHTML(m.name)}" />`;
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

    // 6. Insights en Inicio (Bloque Rápido)
    const stats = this.storage.calculateInsights();
    const hMem = document.getElementById('home-insight-stat-memories');
    const hMon = document.getElementById('home-insight-stat-month');
    const hMov = document.getElementById('home-insight-stat-movie');
    const hArt = document.getElementById('home-insight-stat-artist');
    const hSer = document.getElementById('home-insight-stat-series');
    const hGoa = document.getElementById('home-insight-stat-goals');

    if (hMem) hMem.textContent = stats.totalMemories;
    if (hMon) hMon.textContent = stats.mostActiveMonth;
    if (hMov) hMov.textContent = stats.topMovie;
    if (hArt) hArt.textContent = stats.topArtist;
    if (hSer) hSer.textContent = stats.topSeries;
    if (hGoa) hGoa.textContent = `${stats.goalsPct}% (${stats.completedGoals}/${stats.totalGoals})`;

    // 7. Actividad Reciente del Grupo (Incluyendo Miembros Nuevos)
    const feedContainer = document.getElementById('activity-feed-container');
    if (!feedContainer) return;

    const data = this.storage.getGroupData();
    const allItems = [
      // Miembros que se unieron
      ...(group.members || []).map(m => ({
        _type: 'miembro',
        icon: '👤',
        label: 'Nuevo Miembro Unido',
        title: `${m.name} se unió al grupo`,
        date: m.joinedAt || group.createdAt
      })),
      ...(data.memories || []).map(m => ({ ...m, _type: 'recuerdo', icon: '📸', label: 'Nuevo Recuerdo' })),
      ...(data.songs || []).map(s => ({ ...s, _type: 'musica', icon: '🎵', label: 'Canción Añadida' })),
      ...(data.movies || []).map(m => ({ ...m, _type: 'cine', icon: '🎬', label: 'Película Recomendada' })),
      ...(data.goals || []).map(g => ({ ...g, _type: 'objetivos', icon: '✨', label: 'Objetivo Compartido' })),
      ...(data.notes || []).map(n => ({ ...n, _type: 'notas', icon: '📝', label: 'Nota en Tablero' }))
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
    allItems.slice(0, 8).forEach(item => {
      const card = document.createElement('div');
      card.className = 'activity-item-card';
      card.innerHTML = `
        <div class="activity-icon-badge">${item.icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.72rem; color: var(--color-accent); font-weight: 700; text-transform: uppercase;">${item.label}</div>
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${window.Utils.sanitizeHTML(item.title || item.name || 'Sin título')}
          </div>
          <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 0.2rem;">
            ${window.Utils.formatDateES(item.createdAt || item.date)}
          </div>
        </div>
      `;
      feedContainer.appendChild(card);
    });
  }

  // --- MODAL: EDITAR GRUPO ---
  openEditGroupModal() {
    const group = this.storage.getActiveGroup();
    if (!group) return;

    document.getElementById('edit-group-name').value = group.name || '';
    document.getElementById('edit-group-icon').value = group.icon || '🌟';
    document.getElementById('edit-group-color').value = group.color || '#7C3AED';
    document.getElementById('edit-group-cover-url').value = group.coverImage || '';

    this.openModal('modal-edit-group');
  }  // --- 2. RENDER RECUERDOS ---
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
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">📸</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">Aún no hay recuerdos guardados en este grupo.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-memory').click()">
            + Añadir el Primer Recuerdo
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    memories.forEach(mem => {
      const card = document.createElement('div');
      card.className = 'memory-card';

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

      card.innerHTML = `
        ${coverHtml}
        <div class="memory-body">
          <div class="memory-header-row">
            <span class="memory-date">${window.Utils.formatDateES(mem.date)}</span>
            ${mem.location ? `<span class="memory-location-tag">📍 ${window.Utils.sanitizeHTML(mem.location)}</span>` : ''}
          </div>
          <h3 class="memory-title">${window.Utils.sanitizeHTML(mem.title)}</h3>
          ${mem.description ? `<p class="memory-desc">${window.Utils.sanitizeHTML(mem.description)}</p>` : ''}
          ${songHtml}
          <div class="memory-footer">
            <span class="memory-author-tag">👤 ${window.Utils.sanitizeHTML(mem.author?.name || 'Miembro')}</span>
            <button type="button" class="memory-comments-btn" onclick="window.app.openMemoryComments('${mem.id}')">
              💬 ${(mem.comments || []).length} comentarios
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    const sortSelect = document.getElementById('select-sort-memories');
    if (sortSelect) {
      sortSelect.onchange = () => this.renderMemories();
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
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">🎵</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">No hay canciones añadidas al grupo todavía.</p>
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
        ${song.review ? `<div style="font-size: 0.82rem; color: var(--color-text-secondary); font-style: italic;">«${window.Utils.sanitizeHTML(song.review)}»</div>` : ''}
        <div class="song-actions">
          <button type="button" class="btn-play-preview" onclick="window.app.playTrackDirectly('${song.id}')">
            <span>▶</span> Reproducir Preview
          </button>
          <button type="button" class="btn-ghost" style="font-size: 0.78rem;" onclick="window.app.showLyrics('${window.Utils.sanitizeHTML(song.artist)}', '${window.Utils.sanitizeHTML(song.title)}')">
            📄 Letra
          </button>
        </div>
      `;
      container.appendChild(card);
    });
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

  // --- 4. RENDER CINE (PELÍCULAS) ---
  renderMovies() {
    const container = document.getElementById('movies-grid-list');
    if (!container) return;

    let movies = this.storage.getMovies();
    const filterStatus = document.getElementById('filter-movies-status')?.value || 'all';

    if (filterStatus !== 'all') {
      movies = movies.filter(m => m.status === filterStatus);
    }

    if (movies.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">🎬</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">No hay películas en esta lista.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-movie').click()">
            + Añadir Película desde TMDb
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    movies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';

      const poster = movie.poster || 'assets/icon.png';
      const avgBadge = movie.groupAverage ? `<div class="movie-score-badge">⭐ ${movie.groupAverage}</div>` : '';
      const platform = movie.platform ? `<div class="movie-platform-badge">${window.Utils.sanitizeHTML(movie.platform)}</div>` : '';

      const ratingsObj = movie.ratings || {};
      const ratingsHtml = Object.entries(ratingsObj).map(([uid, r]) => {
        return `<span class="user-rating-chip">⭐ ${r}/10</span>`;
      }).join('');

      card.innerHTML = `
        <div class="movie-poster-wrap">
          <img src="${poster}" class="movie-poster-img" alt="${window.Utils.sanitizeHTML(movie.title)}" loading="lazy" />
          ${avgBadge}
          ${platform}
        </div>
        <div class="movie-info">
          <h3 class="movie-title">${window.Utils.sanitizeHTML(movie.title)} ${movie.year ? `(${movie.year})` : ''}</h3>
          <div class="movie-recommender">Por: ${window.Utils.sanitizeHTML(movie.proposedBy || 'Miembro')}</div>
          ${ratingsHtml ? `<div class="movie-ratings-pills">${ratingsHtml}</div>` : ''}
          <div style="margin-top: auto; padding-top: 0.75rem; display: flex; justify-content: space-between;">
            <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.app.openRateMovieModal('${movie.id}')">
              ⭐ Calificar
            </button>
            <button type="button" class="btn-ghost" style="font-size: 0.75rem; color: var(--color-error);" onclick="window.app.deleteMovie('${movie.id}')">
              🗑️
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    const statusFilter = document.getElementById('filter-movies-status');
    if (statusFilter) statusFilter.onchange = () => this.renderMovies();
  }

  openRateMovieModal(movieId) {
    const movie = this.storage.getMovies().find(m => m.id === movieId);
    if (!movie) return;

    const user = this.storage.getUserProfile();
    document.getElementById('rate-movie-id').value = movieId;
    document.getElementById('rate-movie-title').textContent = `${movie.title} (${movie.year || ''})`;
    document.getElementById('movie-user-rating-input').value = (movie.ratings && movie.ratings[user?.id]) || 10;
    document.getElementById('movie-user-comment-input').value = (movie.comments && movie.comments[user?.id]) || '';

    this.openModal('modal-rate-movie');
  }

  deleteMovie(movieId) {
    if (confirm('¿Eliminar esta película de la lista?')) {
      this.storage.deleteMovie(movieId);
      window.Utils.showToast('Película eliminada', 'info');
      this.renderMovies();
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
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">📺</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">No hay series en esta sección.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-series').click()">
            + Añadir Serie desde TMDb
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
        <div class="movie-poster-wrap">
          <img src="${poster}" class="movie-poster-img" alt="${window.Utils.sanitizeHTML(series.title)}" loading="lazy" />
          ${series.platform ? `<div class="movie-platform-badge">${window.Utils.sanitizeHTML(series.platform)}</div>` : ''}
        </div>
        <div class="movie-info">
          <h3 class="movie-title">${window.Utils.sanitizeHTML(series.title)}</h3>
          <div style="font-size: 0.8rem; color: var(--color-accent); font-weight: 600;">
            Temp. ${series.currentSeason || 1} · Cap. ${curEp} / ${totEp}
          </div>
          <div class="series-progress-bar-wrap">
            <div class="series-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
          <div style="display: flex; gap: 0.4rem; margin-top: auto; padding-top: 0.5rem;">
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
      this.storage.saveSeries(series);
      this.renderSeries();
    }
  }

  // --- 6. RENDER NOTAS ---
  renderNotes() {
    const container = document.getElementById('notes-grid-list');
    if (!container) return;

    let notes = this.storage.getNotes();
    const filterType = document.getElementById('filter-notes-type')?.value || 'all';

    if (filterType !== 'all') {
      notes = notes.filter(n => n.type === filterType);
    }

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">📝</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">El tablero está despejado.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-note').click()">
            + Escribir una Nota o Idea
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';

      const typeClass = (note.type || 'nota').toLowerCase();
      let imgHtml = '';
      if (note.image) {
        imgHtml = `<img src="${note.image}" class="note-img-thumb" alt="Adjunto" onclick="window.app.openLightbox('${note.image}')" loading="lazy" />`;
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="note-type-badge ${typeClass}">${window.Utils.sanitizeHTML(note.type || 'Nota')}</span>
          <button type="button" class="btn-ghost" style="padding: 0.2rem; font-size: 0.75rem; color: var(--color-error);" onclick="window.app.deleteNote('${note.id}')">🗑️</button>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-main); margin-top: 0.2rem;">
          ${window.Utils.sanitizeHTML(note.title)}
        </h3>
        <p class="note-content">${window.Utils.sanitizeHTML(note.content)}</p>
        ${imgHtml}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.6rem; border-top: 1px solid var(--color-glass-border); font-size: 0.75rem; color: var(--color-text-muted);">
          <span>👤 ${window.Utils.sanitizeHTML(note.author || 'Miembro')}</span>
          <span>${window.Utils.formatDateES(note.createdAt)}</span>
        </div>
      `;
      container.appendChild(card);
    });

    const typeFilter = document.getElementById('filter-notes-type');
    if (typeFilter) typeFilter.onchange = () => this.renderNotes();
  }

  deleteNote(noteId) {
    if (confirm('¿Eliminar esta nota del tablero?')) {
      this.storage.deleteNote(noteId);
      this.renderNotes();
    }
  }

  // --- 7. RENDER OBJETIVOS ---
  renderGoals() {
    const container = document.getElementById('goals-grid-list');
    if (!container) return;

    let goals = this.storage.getGoals();
    const filterCat = document.getElementById('filter-goals-category')?.value || 'all';
    const filterStatus = document.getElementById('filter-goals-status')?.value || 'all';

    if (filterCat !== 'all') goals = goals.filter(g => g.category === filterCat);
    if (filterStatus !== 'all') goals = goals.filter(g => g.status === filterStatus);

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
          <span style="font-size: 2.2rem;">🎯</span>
          <p style="margin-top: 0.5rem; font-size: 1rem;">No hay metas en esta categoría.</p>
          <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('btn-new-goal').click()">
            + Crear Objetivo Compartido
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    goals.forEach(goal => {
      const card = document.createElement('div');
      const isDone = goal.status === 'Cumplido';
      card.className = `goal-card ${isDone ? 'completed' : ''}`;

      card.innerHTML = `
        <div class="goal-top-row">
          <span class="goal-category-badge">${window.Utils.sanitizeHTML(goal.category || 'General')}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: ${isDone ? 'var(--color-success)' : 'var(--color-accent)'};">
            ${isDone ? '✅ Cumplido' : '🌱 Pendiente'}
          </span>
        </div>
        <h3 class="goal-title">${window.Utils.sanitizeHTML(goal.title)}</h3>
        ${goal.targetDate ? `<div style="font-size: 0.8rem; color: var(--color-text-secondary);">📅 Fecha objetivo: <strong>${window.Utils.formatDateES(goal.targetDate)}</strong></div>` : ''}
        ${goal.participants && goal.participants.length > 0 ? `
          <div class="goal-participants">
            <span>👥 Participantes:</span>
            <span>${window.Utils.sanitizeHTML(goal.participants.join(', '))}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.6rem;">
          <button type="button" class="${isDone ? 'btn-secondary' : 'btn-primary'}" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;" onclick="window.app.toggleGoal('${goal.id}')">
            ${isDone ? 'Desmarcar' : '✨ ¡Cumplido!'}
          </button>
          <button type="button" class="btn-ghost" style="color: var(--color-error); font-size: 0.8rem;" onclick="window.app.deleteGoal('${goal.id}')">
            🗑️
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    const catFilter = document.getElementById('filter-goals-category');
    if (catFilter) catFilter.onchange = () => this.renderGoals();
    const statFilter = document.getElementById('filter-goals-status');
    if (statFilter) statFilter.onchange = () => this.renderGoals();
  }

  toggleGoal(goalId) {
    this.storage.toggleGoalStatus(goalId);
    window.Utils.showToast('Estado del objetivo actualizado ✨', 'success');
    this.renderGoals();
  }

  deleteGoal(goalId) {
    if (confirm('¿Eliminar este objetivo?')) {
      this.storage.deleteGoal(goalId);
      this.renderGoals();
    }
  }

  // --- 8. RENDER LUMA INSIGHTS ---
  renderInsights() {
    const stats = this.storage.calculateInsights();

    const memEl = document.getElementById('insight-stat-memories');
    const monEl = document.getElementById('insight-stat-month');
    const movEl = document.getElementById('insight-stat-movie');
    const artEl = document.getElementById('insight-stat-artist');
    const serEl = document.getElementById('insight-stat-series');
    const goaEl = document.getElementById('insight-stat-goals');

    if (memEl && window.Animations) window.Animations.animateCounter(memEl, stats.totalMemories);
    if (monEl) monEl.textContent = stats.mostActiveMonth;
    if (movEl) movEl.textContent = stats.topMovie;
    if (artEl) artEl.textContent = stats.topArtist;
    if (serEl) serEl.textContent = stats.topSeries;
    if (goaEl) goaEl.textContent = `${stats.goalsPct}% (${stats.completedGoals}/${stats.totalGoals})`;

    const chartContainer = document.getElementById('insights-monthly-chart');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';
    const maxCount = Math.max(1, ...stats.monthlyData.map(d => d.count));

    stats.monthlyData.forEach(d => {
      const col = document.createElement('div');
      col.className = 'chart-bar-col';
      const heightPct = Math.max(8, Math.round((d.count / maxCount) * 100));

      col.innerHTML = `
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-accent);">${d.count > 0 ? d.count : ''}</div>
        <div class="chart-bar-fill" style="height: ${heightPct}%;" title="${d.month}: ${d.count} actividades"></div>
        <span class="chart-bar-label">${d.month}</span>
      `;
      chartContainer.appendChild(col);
    });
  }  // --- REPRODUCTOR MINI-AUDIO ---
  renderAudioPlayerBar(state) {
    const playerBar = document.getElementById('luma-audio-player');
    if (!playerBar) return;

    if (!state.track) {
      playerBar.style.display = 'none';
      return;
    }

    playerBar.style.display = 'flex';
    const artEl = document.getElementById('player-bar-artwork');
    const titleEl = document.getElementById('player-bar-title');
    const artistEl = document.getElementById('player-bar-artist');
    const toggleBtn = document.getElementById('btn-player-toggle');
    const eqEl = document.getElementById('player-bar-equalizer');

    if (artEl) artEl.src = state.track.artwork || 'assets/icon.png';
    if (titleEl) titleEl.textContent = state.track.title || 'Canción';
    if (artistEl) artistEl.textContent = state.track.artist || '';

    if (toggleBtn) {
      toggleBtn.textContent = state.isPlaying ? '⏸' : '▶';
      toggleBtn.onclick = () => {
        if (state.isPlaying) this.audioManager.pause();
        else this.audioManager.resume();
      };
    }

    if (eqEl) {
      eqEl.style.opacity = state.isPlaying ? '1' : '0.2';
    }

    const closeBtn = document.getElementById('btn-player-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.audioManager.stop();
    }
  }

  // --- GESTIÓN DE MODALES ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  bindModalEvents() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.onclick = () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      };
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      };
    });

    const btnNewMem = document.getElementById('btn-new-memory');
    if (btnNewMem) {
      btnNewMem.onclick = () => {
        document.getElementById('form-memory')?.reset();
        document.getElementById('memory-edit-id').value = '';
        document.getElementById('memory-date-input').value = new Date().toISOString().split('T')[0];
        this.openModal('modal-memory');
      };
    }

    const btnNewSong = document.getElementById('btn-new-song');
    if (btnNewSong) {
      btnNewSong.onclick = () => {
        document.getElementById('form-song')?.reset();
        const user = this.storage.getUserProfile();
        if (user && user.name) document.getElementById('song-recommender-input').value = user.name;
        this.openModal('modal-song');
      };
    }

    const btnNewMovie = document.getElementById('btn-new-movie');
    if (btnNewMovie) {
      btnNewMovie.onclick = () => {
        const query = prompt('¿Qué película quieres buscar en TMDb?');
        if (query) {
          document.getElementById('movie-search-input').value = query;
          document.getElementById('movie-search-form').dispatchEvent(new Event('submit'));
        }
      };
    }

    const btnNewSeries = document.getElementById('btn-new-series');
    if (btnNewSeries) {
      btnNewSeries.onclick = () => {
        document.getElementById('form-series')?.reset();
        this.openModal('modal-series');
      };
    }

    const btnNewGoal = document.getElementById('btn-new-goal');
    if (btnNewGoal) {
      btnNewGoal.onclick = () => {
        document.getElementById('form-goal')?.reset();
        this.openModal('modal-goal');
      };
    }

    const btnNewNote = document.getElementById('btn-new-note');
    if (btnNewNote) {
      btnNewNote.onclick = () => {
        document.getElementById('form-note')?.reset();
        this.openModal('modal-note');
      };
    }
  }

  openGroupsListModal() {
    const listContainer = document.getElementById('groups-switcher-list');
    if (!listContainer) return;

    const groups = this.storage.getGroups();
    const activeId = this.storage.getActiveGroupId();
    listContainer.innerHTML = '';

    groups.forEach(g => {
      const isCur = g.id === activeId;
      const item = document.createElement('div');
      item.className = 'glass-card';
      item.style.padding = '0.85rem';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.cursor = 'pointer';
      if (isCur) item.style.borderColor = 'var(--color-primary-light)';

      const iconElem = g.iconImage ? `<img src="${g.iconImage}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" alt="icon" />` : `<span style="font-size: 1.4rem;">${g.icon || '🌟'}</span>`;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          ${iconElem}
          <div>
            <strong style="color: var(--color-text-main);">${window.Utils.sanitizeHTML(g.name)}</strong>
            <div style="font-size: 0.75rem; color: var(--color-accent); font-family: var(--font-mono);">Código: ${g.code} · ${(g.members || []).length} miembros</div>
          </div>
        </div>
        ${isCur ? '<span style="color: var(--color-accent); font-weight: 700;">Activo ✓</span>' : '<button class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Cambiar</button>'}
      `;

      item.onclick = () => {
        if (!isCur) {
          this.storage.setActiveGroupId(g.id);
          this.closeModal('modal-groups-list');
          this.checkInitialState();
        }
      };

      listContainer.appendChild(item);
    });

    document.getElementById('btn-modal-open-join').onclick = () => {
      this.closeModal('modal-groups-list');
      this.openModal('modal-join-group');
    };
    document.getElementById('btn-modal-open-create').onclick = () => {
      this.closeModal('modal-groups-list');
      this.openModal('modal-create-group');
    };

    this.openModal('modal-groups-list');
  }

  populateProfileModal() {
    const profile = this.storage.getUserProfile() || {};
    document.getElementById('profile-name-input').value = profile.name || '';
    document.getElementById('profile-bio-input').value = profile.bio || '';
    document.getElementById('profile-gender-select').value = profile.gender || 'No especificado';
    document.getElementById('profile-color-input').value = profile.favoriteColor || '#7C3AED';

    const countEl = document.getElementById('profile-bio-counter');
    if (countEl) countEl.textContent = `${(profile.bio || '').length} / 120`;

    const bioInput = document.getElementById('profile-bio-input');
    if (bioInput) {
      bioInput.oninput = () => {
        if (countEl) countEl.textContent = `${bioInput.value.length} / 120`;
      };
    }
  }

  // --- FORMULARIOS ---
  bindFormEvents() {
    // 1. Formulario Editar Grupo
    document.getElementById('form-edit-group')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const group = this.storage.getActiveGroup();
      if (!group) return;

      const name = document.getElementById('edit-group-name').value.trim();
      const icon = document.getElementById('edit-group-icon').value.trim() || '🌟';
      const color = document.getElementById('edit-group-color').value;
      const coverUrl = document.getElementById('edit-group-cover-url').value.trim();
      const coverFile = document.getElementById('edit-group-cover-file');
      const iconFile = document.getElementById('edit-group-icon-file');

      let coverImage = coverUrl || group.coverImage || '';
      if (coverFile && coverFile.files && coverFile.files[0]) {
        coverImage = await window.Utils.compressImage(coverFile.files[0], 1200, 0.8);
      }

      let iconImage = group.iconImage || '';
      if (iconFile && iconFile.files && iconFile.files[0]) {
        iconImage = await window.Utils.compressImage(iconFile.files[0], 400, 0.85);
      }

      this.storage.updateGroup(group.id, {
        name,
        icon,
        iconImage,
        coverImage,
        color
      });

      this.closeModal('modal-edit-group');
      window.Utils.showToast('¡Información del grupo actualizada! ✨', 'success');
      this.updateHeader();
      this.renderInicio();
    });

    // 2. Formulario Perfil
    document.getElementById('form-profile')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name-input').value.trim();
      const bio = document.getElementById('profile-bio-input').value.trim();
      const gender = document.getElementById('profile-gender-select').value;
      const color = document.getElementById('profile-color-input').value;
      const fileInput = document.getElementById('profile-avatar-file');

      let avatar = this.storage.getUserProfile()?.avatar || '';
      if (fileInput && fileInput.files && fileInput.files[0]) {
        avatar = await window.Utils.compressImage(fileInput.files[0], 400, 0.85);
      }

      this.storage.saveUserProfile({
        name,
        bio,
        gender,
        favoriteColor: color,
        avatar
      });

      this.closeModal('modal-profile');
      window.Utils.showToast('¡Perfil guardado con éxito! 🌟', 'success');

      if (this.pendingAfterProfile) {
        const cb = this.pendingAfterProfile;
        this.pendingAfterProfile = null;
        cb();
      } else {
        this.checkInitialState();
      }
    });

    // 3. Formulario Crear Grupo
    document.getElementById('form-create-group')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-group-name').value.trim();
      const icon = document.getElementById('new-group-icon').value.trim() || '🌟';
      const color = document.getElementById('new-group-color').value;
      const urlInput = document.getElementById('new-group-cover-url').value.trim();
      const coverFile = document.getElementById('new-group-cover-file');
      const iconFile = document.getElementById('new-group-icon-file');

      let cover = urlInput;
      if (coverFile && coverFile.files && coverFile.files[0]) {
        cover = await window.Utils.compressImage(coverFile.files[0], 1200, 0.8);
      }

      let iconImage = '';
      if (iconFile && iconFile.files && iconFile.files[0]) {
        iconImage = await window.Utils.compressImage(iconFile.files[0], 400, 0.85);
      }

      const newGroup = this.storage.createGroup(name, icon, color, cover, iconImage);
      this.closeModal('modal-create-group');
      window.Utils.showToast(`¡Grupo "${name}" creado! Código: ${newGroup.code}`, 'success');
      this.checkInitialState();
    });

    // 4. Formulario Unirse a Grupo
    document.getElementById('form-join-group')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('join-group-code-input').value.trim();
      try {
        const group = await this.storage.joinGroupByCode(code);
        this.closeModal('modal-join-group');
        window.Utils.showToast(`¡Te has unido a "${group.name}"! 🚀`, 'success');
        this.checkInitialState();
      } catch (err) {
        window.Utils.showToast(err.message || 'Código inválido o grupo no encontrado', 'error');
      }
    });

    // 5. Formulario Recuerdo
    document.getElementById('form-memory')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('memory-title-input').value.trim();
      const date = document.getElementById('memory-date-input').value;
      const location = document.getElementById('memory-location-input').value.trim();
      const description = document.getElementById('memory-desc-input').value.trim();
      const songTitle = document.getElementById('memory-song-title').value.trim();
      const songArtist = document.getElementById('memory-song-artist').value.trim();
      const songPreview = document.getElementById('memory-song-preview').value.trim();
      const coverFile = document.getElementById('memory-cover-file');
      const photosFiles = document.getElementById('memory-photos-file');

      let coverImage = '';
      if (coverFile && coverFile.files && coverFile.files[0]) {
        coverImage = await window.Utils.compressImage(coverFile.files[0], 1200, 0.8);
      }

      const photos = [];
      if (photosFiles && photosFiles.files && photosFiles.files.length > 0) {
        for (let i = 0; i < photosFiles.files.length; i++) {
          const comp = await window.Utils.compressImage(photosFiles.files[i], 1200, 0.8);
          if (comp) photos.push(comp);
        }
      }

      const user = this.storage.getUserProfile();
      this.storage.saveMemory({
        title,
        date,
        location,
        description,
        coverImage,
        photos,
        author: { id: user?.id, name: user?.name || 'Miembro' },
        song: { title: songTitle, artist: songArtist, previewUrl: songPreview }
      });

      this.closeModal('modal-memory');
      window.Utils.showToast('¡Recuerdo guardado! 📸', 'success');
      this.renderMemories();
    });

    // 6. Formulario Canción
    document.getElementById('form-song')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('song-title-input').value.trim();
      const artist = document.getElementById('song-artist-input').value.trim();
      const rating = Number(document.getElementById('song-rating-select').value);
      const addedBy = document.getElementById('song-recommender-input').value.trim();
      const review = document.getElementById('song-review-input').value.trim();
      const previewUrl = document.getElementById('song-preview-url').value;
      const artwork = document.getElementById('song-artwork-url').value;

      this.storage.saveSong({
        title, artist, rating, addedBy, review, previewUrl, artwork
      });

      this.closeModal('modal-song');
      window.Utils.showToast('¡Canción añadida! 🎵', 'success');
      this.renderSongs();
    });

    // 7. Formulario Calificar Película
    document.getElementById('form-rate-movie')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const movieId = document.getElementById('rate-movie-id').value;
      const rating = document.getElementById('movie-user-rating-input').value;
      const comment = document.getElementById('movie-user-comment-input').value.trim();
      const user = this.storage.getUserProfile();

      this.storage.rateMovie(movieId, user?.id || 'anon', rating, comment);
      this.closeModal('modal-rate-movie');
      window.Utils.showToast('Calificación guardada ⭐', 'success');
      this.renderMovies();
    });

    // 8. Formulario Serie
    document.getElementById('form-series')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('series-title-input').value.trim();
      const currentSeason = Number(document.getElementById('series-season-input').value);
      const currentEpisode = Number(document.getElementById('series-episode-input').value);
      const platform = document.getElementById('series-platform-input').value.trim();
      const poster = document.getElementById('series-poster-url').value;
      const user = this.storage.getUserProfile();

      this.storage.saveSeries({
        title, currentSeason, currentEpisode, totalEpisodes: 10, platform, poster, proposedBy: user?.name
      });

      this.closeModal('modal-series');
      window.Utils.showToast('Serie añadida 📺', 'success');
      this.renderSeries();
    });

    // 9. Formulario Objetivo
    document.getElementById('form-goal')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('goal-title-input').value.trim();
      const category = document.getElementById('goal-category-select').value;
      const targetDate = document.getElementById('goal-date-input').value;
      const partsRaw = document.getElementById('goal-participants-input').value.trim();
      const participants = partsRaw ? partsRaw.split(',').map(p => p.trim()) : [];

      this.storage.saveGoal({
        title, category, targetDate, participants, status: 'Pendiente'
      });

      this.closeModal('modal-goal');
      window.Utils.showToast('Objetivo compartido creado 🎯', 'success');
      this.renderGoals();
    });

    // 10. Formulario Nota
    document.getElementById('form-note')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('note-title-input').value.trim();
      const type = document.getElementById('note-type-select').value;
      const content = document.getElementById('note-content-input').value.trim();
      const fileInput = document.getElementById('note-image-file');
      const user = this.storage.getUserProfile();

      let image = '';
      if (fileInput && fileInput.files && fileInput.files[0]) {
        image = await window.Utils.compressImage(fileInput.files[0], 1000, 0.8);
      }

      this.storage.saveNote({
        title, type, content, image, author: user?.name || 'Miembro'
      });

      this.closeModal('modal-note');
      window.Utils.showToast('Nota publicada en el tablero 📌', 'success');
      this.renderNotes();
    });

    // 11. Formulario Comentario
    document.getElementById('form-add-comment')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const memoryId = document.getElementById('comment-memory-id').value;
      const text = document.getElementById('comment-text-input').value.trim();
      const user = this.storage.getUserProfile();

      if (text && memoryId) {
        this.storage.addCommentToMemory(memoryId, user?.name || 'Miembro', text);
        document.getElementById('comment-text-input').value = '';
        this.openMemoryComments(memoryId);
        this.renderMemories();
      }
    });
  }

  // --- BÚSQUEDAS TMDB E ITUNES ---
  bindSearchEvents() {
    document.getElementById('music-search-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = document.getElementById('music-search-input').value.trim();
      const resultsContainer = document.getElementById('music-search-results');
      if (!resultsContainer) return;

      resultsContainer.innerHTML = '<div style="color: var(--color-accent); padding: 1rem;">Buscando en iTunes...</div>';
      const results = await this.media.searchSongs(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="color: var(--color-text-muted); padding: 1rem;">No se encontraron canciones.</div>';
        return;
      }

      resultsContainer.innerHTML = `
        <div style="background: var(--color-glass-card); border: 1px solid var(--color-glass-border); border-radius: var(--radius-lg); padding: 1rem;">
          <h4 style="font-size: 0.95rem; color: var(--color-accent); margin-bottom: 0.75rem;">Resultados de Búsqueda:</h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 250px; overflow-y: auto;">
            ${results.map(r => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem; background: rgba(15, 23, 42, 0.6); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0;">
                  <img src="${r.artwork}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;" alt="art" />
                  <div style="min-width: 0;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.Utils.sanitizeHTML(r.title)}</div>
                    <div style="font-size: 0.75rem; color: var(--color-accent);">${window.Utils.sanitizeHTML(r.artist)}</div>
                  </div>
                </div>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn-ghost" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="window.audioManager.playTrack(${JSON.stringify(r).replace(/"/g, '&quot;')})">▶ Preview</button>
                  <button type="button" class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="window.app.quickAddSong(${JSON.stringify(r).replace(/"/g, '&quot;')})">+ Añadir</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    document.getElementById('movie-search-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = document.getElementById('movie-search-input').value.trim();
      const resultsContainer = document.getElementById('movie-search-results');
      if (!resultsContainer) return;

      resultsContainer.innerHTML = '<div style="color: var(--color-accent); padding: 1rem;">Buscando en TMDb...</div>';
      const results = await this.media.searchMovies(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="color: var(--color-text-muted); padding: 1rem;">No se encontraron películas.</div>';
        return;
      }

      resultsContainer.innerHTML = `
        <div style="background: var(--color-glass-card); border: 1px solid var(--color-glass-border); border-radius: var(--radius-lg); padding: 1rem;">
          <h4 style="font-size: 0.95rem; color: var(--color-accent); margin-bottom: 0.75rem;">Películas encontradas en TMDb:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; max-height: 350px; overflow-y: auto;">
            ${results.map(m => `
              <div style="background: rgba(15, 23, 42, 0.7); border-radius: var(--radius-sm); overflow: hidden; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
                <img src="${m.poster || 'assets/icon.png'}" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 4px;" alt="poster" />
                <strong style="font-size: 0.85rem; color: #fff;">${window.Utils.sanitizeHTML(m.title)} (${m.year})</strong>
                <button type="button" class="btn-primary" style="margin-top: auto; padding: 0.35rem; font-size: 0.75rem;" onclick="window.app.quickAddMovie(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                  + Añadir a la Lista
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    document.getElementById('series-search-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = document.getElementById('series-search-input').value.trim();
      const resultsContainer = document.getElementById('series-search-results');
      if (!resultsContainer) return;

      resultsContainer.innerHTML = '<div style="color: var(--color-accent); padding: 1rem;">Buscando series en TMDb...</div>';
      const results = await this.media.searchSeries(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="color: var(--color-text-muted); padding: 1rem;">No se encontraron series.</div>';
        return;
      }

      resultsContainer.innerHTML = `
        <div style="background: var(--color-glass-card); border: 1px solid var(--color-glass-border); border-radius: var(--radius-lg); padding: 1rem;">
          <h4 style="font-size: 0.95rem; color: var(--color-accent); margin-bottom: 0.75rem;">Series encontradas:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; max-height: 350px; overflow-y: auto;">
            ${results.map(s => `
              <div style="background: rgba(15, 23, 42, 0.7); border-radius: var(--radius-sm); overflow: hidden; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
                <img src="${s.poster || 'assets/icon.png'}" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 4px;" alt="poster" />
                <strong style="font-size: 0.85rem; color: #fff;">${window.Utils.sanitizeHTML(s.title)} (${s.year})</strong>
                <button type="button" class="btn-primary" style="margin-top: auto; padding: 0.35rem; font-size: 0.75rem;" onclick="window.app.quickAddSeries(${JSON.stringify(s).replace(/"/g, '&quot;')})">
                  + Añadir a Series
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  }

  quickAddSong(songData) {
    const user = this.storage.getUserProfile();
    this.storage.saveSong({
      title: songData.title,
      artist: songData.artist,
      previewUrl: songData.previewUrl,
      artwork: songData.artwork,
      rating: 5,
      addedBy: user?.name || 'Miembro',
      review: ''
    });
    document.getElementById('music-search-results').innerHTML = '';
    window.Utils.showToast('¡Canción añadida al grupo! 🎵', 'success');
    this.renderSongs();
  }

  quickAddMovie(movieData) {
    const user = this.storage.getUserProfile();
    this.storage.saveMovie({
      title: movieData.title,
      year: movieData.year,
      poster: movieData.poster,
      synopsis: movieData.synopsis,
      proposedBy: user?.name || 'Miembro',
      platform: 'Por definir',
      status: 'Por ver',
      ratings: {}
    });
    document.getElementById('movie-search-results').innerHTML = '';
    window.Utils.showToast('¡Película añadida al cine del grupo! 🍿', 'success');
    this.renderMovies();
  }

  quickAddSeries(seriesData) {
    const user = this.storage.getUserProfile();
    this.storage.saveSeries({
      title: seriesData.title,
      year: seriesData.year,
      poster: seriesData.poster,
      synopsis: seriesData.synopsis,
      proposedBy: user?.name || 'Miembro',
      currentSeason: 1,
      currentEpisode: 1,
      totalEpisodes: 10,
      status: 'Viendo'
    });
    document.getElementById('series-search-results').innerHTML = '';
    window.Utils.showToast('¡Serie añadida! 📺', 'success');
    this.renderSeries();
  }

  openMemoryComments(memoryId) {
    const memory = this.storage.getMemories().find(m => m.id === memoryId);
    if (!memory) return;

    document.getElementById('comment-memory-id').value = memoryId;
    const listEl = document.getElementById('memory-comments-list');
    if (!listEl) return;

    const comments = memory.comments || [];
    if (comments.length === 0) {
      listEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Sé el primero en comentar este recuerdo ✨</div>';
    } else {
      listEl.innerHTML = comments.map(c => `
        <div style="background: rgba(15, 23, 42, 0.6); border-radius: var(--radius-sm); padding: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-accent); font-weight: 700; margin-bottom: 0.2rem;">
            <span>${window.Utils.sanitizeHTML(c.authorName)}</span>
            <span style="color: var(--color-text-muted); font-weight: normal;">${window.Utils.formatDateTimeES(c.createdAt)}</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--color-text-main);">${window.Utils.sanitizeHTML(c.text)}</div>
        </div>
      `).join('');
    }

    this.openModal('modal-memory-comments');
  }

  openLightbox(imageSrc) {
    const img = document.getElementById('lightbox-img');
    if (img && imageSrc) {
      img.src = imageSrc;
      this.openModal('modal-lightbox');
    }
  }
}

// Iniciar LUMA al cargar DOM
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LumaApp();
});