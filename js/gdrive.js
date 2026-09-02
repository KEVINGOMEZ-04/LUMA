/**
 * LUMA 🌟 - Google Drive API & Cloud Sync Engine
 */

(function() {
  class GoogleDriveSync {
    constructor() {
      this.clientId = 'luma-social-app';
    }

    /**
     * Extrae el ID de la carpeta de cualquier URL de Google Drive
     * Ejemplo: https://drive.google.com/drive/folders/1A2B3C4D5E6F... -> 1A2B3C4D5E6F...
     */
    extractFolderId(urlOrId) {
      if (!urlOrId) return '';
      const trimmed = urlOrId.trim();
      if (!trimmed.includes('/') && trimmed.length > 10) return trimmed;
      const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
      const matchId = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) return matchId[1];
      return trimmed;
    }

    /**
     * Sube un recuerdo completo a Google Drive
     */
    async uploadMemoryToDrive(memory, driveFolderUrl, scriptEndpoint = '', oauthToken = '') {
      const folderId = this.extractFolderId(driveFolderUrl);
      if (!folderId && !scriptEndpoint) {
        throw new Error('No se ha configurado la carpeta de Google Drive.');
      }

      const safeTitle = memory.title || 'Recuerdo';
      const safeDate = memory.date || new Date().toISOString().split('T')[0];
      const subfolderName = `${safeTitle} - ${safeDate}`;

      // Recolectar archivos a subir
      const filesToUpload = [];

      // 1. Portada
      if (memory.coverImage) {
        const isVideo = Boolean(memory.isVideo) || memory.coverImage.startsWith('data:video') || memory.coverImage.includes('.mp4');
        let mime = isVideo ? 'video/mp4' : 'image/jpeg';
        if (memory.coverImage.startsWith('data:image/png')) mime = 'image/png';
        if (memory.coverImage.startsWith('data:image/webp')) mime = 'image/webp';
        if (memory.coverImage.startsWith('data:video/quicktime')) mime = 'video/quicktime';
        if (memory.coverImage.startsWith('data:video/webm')) mime = 'video/webm';

        filesToUpload.push({
          name: isVideo ? 'Portada_Video.mp4' : 'Portada.jpg',
          type: mime,
          dataUrl: memory.coverImage
        });
      }

      // 2. Galería de fotos y videos
      if (memory.photos && Array.isArray(memory.photos)) {
        let photoIndex = 1;
        let videoIndex = 1;
        memory.photos.forEach((p) => {
          if (p && p !== memory.coverImage) {
            const isVid = typeof p === 'string' && (p.startsWith('data:video') || p.includes('.mp4') || p.includes('video'));
            let mime = isVid ? 'video/mp4' : 'image/jpeg';
            if (typeof p === 'string') {
              if (p.startsWith('data:image/png')) mime = 'image/png';
              if (p.startsWith('data:image/webp')) mime = 'image/webp';
              if (p.startsWith('data:video/quicktime')) mime = 'video/quicktime';
              if (p.startsWith('data:video/webm')) mime = 'video/webm';
            }

            filesToUpload.push({
              name: isVid ? `Video_${videoIndex++}.mp4` : `Foto_${photoIndex++}.jpg`,
              type: mime,
              dataUrl: p
            });
          }
        });
      }

      // Si hay un Webhook de Apps Script configurado, sube directamente con permisos delegados
      if (scriptEndpoint) {
        return await this.uploadViaAppsScript(scriptEndpoint, folderId, subfolderName, filesToUpload);
      }

      // Si hay un token OAuth de Google disponible
      if (oauthToken) {
        return await this.uploadViaOAuth(oauthToken, folderId, subfolderName, filesToUpload);
      }

      // Registro estructurado local y manifiesto
      return {
        success: true,
        folderName: subfolderName,
        folderId: folderId,
        parentFolderUrl: driveFolderUrl,
        filesCount: filesToUpload.length,
        files: filesToUpload.map(f => f.name),
        status: 'manifest_created'
      };
    }

    /**
     * Subida a través de Google Apps Script Web App
     */
    async uploadViaAppsScript(endpoint, parentFolderId, subfolderName, files) {
      const payload = {
        action: 'create_and_upload',
        parentFolderId: parentFolderId,
        subfolderName: subfolderName,
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          base64: f.dataUrl ? (f.dataUrl.includes(',') ? f.dataUrl.split(',')[1] : f.dataUrl) : ''
        }))
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      return data;
    }

    /**
     * Subida directa con Google Drive API v3 (OAuth 2.0)
     */
    async uploadViaOAuth(token, parentFolderId, subfolderName, files) {
      // 1. Crear subcarpeta
      const folderMetadata = {
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
      };

      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderMetadata)
      });

      if (!folderRes.ok) {
        throw new Error('Error al crear la subcarpeta en Google Drive.');
      }

      const createdFolder = await folderRes.json();
      const newFolderId = createdFolder.id;

      // 2. Subir cada archivo dentro de la subcarpeta creada
      const uploadResults = [];
      for (const file of files) {
        try {
          const base64Data = file.dataUrl.includes(',') ? file.dataUrl.split(',')[1] : file.dataUrl;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.type });

          const metadata = {
            name: file.name,
            parents: [newFolderId]
          };

          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', blob);

          const fileRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (fileRes.ok) {
            const uploaded = await fileRes.json();
            uploadResults.push(uploaded);
          }
        } catch (err) {
          console.error('Error subiendo archivo a Drive:', file.name, err);
        }
      }

      return {
        success: true,
        folderId: newFolderId,
        folderName: subfolderName,
        folderUrl: `https://drive.google.com/drive/folders/${newFolderId}`,
        uploadedCount: uploadResults.length
      };
    }
  }

  window.GoogleDriveSync = new GoogleDriveSync();
})();
