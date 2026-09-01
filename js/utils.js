/**
 * Patico Wrapped 🌻 - Utilidades y Formateadores
 */

window.Utils = {
  // Formateador numérico en español (ej. 25.039)
  formatNumberES: (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('es-ES').format(num);
  },

  // Formateador de decimales / porcentajes en español (ej. 56,87 %)
  formatDecimalES: (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return '0,00';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },

  // Formateador de fecha completa DD/MM/AAAA
  formatDateES: (dateInput) => {
    if (!dateInput) return 'Fecha no disponible';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  },

  // Formateador de fecha y hora completa: DD/MM/AAAA, HH:MM
  formatDateTimeES: (dateInput) => {
    if (!dateInput) return 'No disponible';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'No disponible';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  },

  // Sanitización contra inyección de HTML / XSS
  sanitizeHTML: (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Generador de UUID único
  generateUUID: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  },

  // Toast de notificación flotante
  showToast: (message, type = 'info', duration = 3500) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `patico-toast patico-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '🌻' : type === 'error' ? '⚠️' : '✨'}</span>
      <span class="toast-msg">${window.Utils.sanitizeHTML(message)}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  // Compresor de fotos en el navegador (cliente) para soportar alto volumen sin colapsar memoria
  compressImage: (file, maxWidth = 1400, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      if (!file.type || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxWidth) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxWidth) / h);
              h = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
