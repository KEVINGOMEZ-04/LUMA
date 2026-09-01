/**
 * LUMA 🌟 - Utilidades y Helpers Globales
 */
window.Utils = {
  // Generador de código de grupo único de 6 caracteres (ej. A7KF92)
  generateGroupCode: () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Generador de UUID v4 estándar
  generateUUID: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'luma-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  },

  // Sanitización de cadenas HTML contra ataques XSS
  sanitizeHTML: (str) => {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // Formateador de números (ej. 1.250)
  formatNumberES: (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('es-ES').format(num);
  },

  // Formateador de decimales / porcentajes (ej. 98,5 %)
  formatDecimalES: (num, decimals = 1) => {
    if (typeof num !== 'number' || isNaN(num)) return '0,0';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },

  // Formateador de fechas cortas (DD/MM/AAAA)
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

  // Formateador de fecha y hora completa
  formatDateTimeES: (dateInput) => {
    if (!dateInput) return 'No disponible';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'No disponible';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  },

  // Sistema de Notificaciones Toasts Flotantes
  showToast: (message, type = 'info', duration = 3000) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `luma-toast luma-toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icon = type === 'success' ? '✨' : type === 'error' ? '⚠️' : '🌟';
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Copiar texto al portapapeles con feedback
  copyToClipboard: async (text, successMsg = '¡Copiado al portapapeles! 📋') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      window.Utils.showToast(successMsg, 'success');
      return true;
    } catch (err) {
      window.Utils.showToast('No se pudo copiar el texto', 'error');
      return false;
    }
  },

  // Compresión ultrarrápida de imágenes con Canvas
  compressImage: (fileOrUrl, maxWidth = 1280, quality = 0.82) => {
    return new Promise((resolve) => {
      if (!fileOrUrl) return resolve('');

      const handleSrc = (src) => {
        if (typeof src !== 'string' || !src) return resolve('');
        if (src.startsWith('http://') || src.startsWith('https://')) return resolve(src);

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
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };

      if (typeof fileOrUrl === 'string') {
        handleSrc(fileOrUrl);
      } else if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => handleSrc(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrUrl);
      } else {
        resolve('');
      }
    });
  }
};
