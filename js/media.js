/**
 * LUMA 🌟 - Servicio Multimedia (Música, TMDb Cine/Series, Audio Singleton y Letras)
 */

// Singleton de Control de Audio Global (Exclusión Mutua Estricta)
class LumaAudioManager {
  constructor() {
    this.audioElement = new Audio();
    this.currentTrack = null;
    this.isPlaying = false;
    this.listeners = [];

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Error en reproducción de audio:', e);
      this.isPlaying = false;
      this.notify();
    });
  }

  // Reproducir una pista (detiene automáticamente cualquier otro audio anterior)
  playTrack(track) {
    if (!track || !track.previewUrl) {
      window.Utils.showToast('Esta canción no tiene preview disponible', 'info');
      return;
    }

    if (this.currentTrack && this.currentTrack.previewUrl === track.previewUrl) {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.audioElement.play().catch(() => {});
      }
      return;
    }

    this.stop();
    this.currentTrack = track;
    this.audioElement.src = track.previewUrl;
    this.audioElement.load();
    this.audioElement.play().catch((err) => {
      console.warn('No se pudo iniciar reproducción automática:', err);
    });
    this.notify();
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.notify();
  }

  resume() {
    if (this.audioElement.src) {
      this.audioElement.play().catch(() => {});
    }
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.removeAttribute('src');
    this.audioElement.load();
    this.currentTrack = null;
    this.isPlaying = false;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener({ isPlaying: this.isPlaying, track: this.currentTrack });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    const state = { isPlaying: this.isPlaying, track: this.currentTrack };
    this.listeners.forEach(cb => {
      try { cb(state); } catch (e) {}
    });
  }
}

window.audioManager = new LumaAudioManager();

window.MediaService = {
  // URLs externas
  spotifyUrl(title, artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  },

  youtubeUrl(title, artist) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist} official`)}`;
  },

  geniusUrl(title, artist) {
    return `https://genius.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
  },

  // Búsqueda de Canciones en iTunes Search API (Devuelve previews oficiales de 30s)
  async searchSongs(query) {
    if (!query || !query.trim()) return [];
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=es`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error buscando canciones');
      const data = await res.json();
      if (!data.results) return [];

      return data.results.map(item => ({
        id: 'itunes-' + item.trackId,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || '',
        artwork: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        previewUrl: item.previewUrl || '',
        durationMs: item.trackTimeMillis || 0,
        releaseYear: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null
      }));
    } catch (err) {
      console.warn('Error en búsqueda de música:', err);
      return [];
    }
  },

  // Obtener letra de canción desde LRCLIB
  async fetchLyrics(artist, title) {
    if (!artist || !title) return '';
    try {
      const cleanArtist = artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.plainLyrics) return data.plainLyrics.trim();
      }
    } catch (e) {}
    return '';
  },

  // Búsqueda de Películas en TMDb
  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    const apiKey = window.CONFIG.media.tmdbApiKey;
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map(m => ({
        tmdbId: m.id,
        title: m.title,
        year: m.release_date ? m.release_date.substring(0, 4) : '',
        poster: m.poster_path ? `${window.CONFIG.media.tmdbImageBaseUrl}${m.poster_path}` : '',
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : '',
        synopsis: m.overview || 'Sin descripción disponible.',
        tmdbRating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A'
      }));
    } catch (e) {
      console.warn('Error buscando películas en TMDb:', e);
      return [];
    }
  },

  // Búsqueda de Series en TMDb
  async searchSeries(query) {
    if (!query || !query.trim()) return [];
    const apiKey = window.CONFIG.media.tmdbApiKey;
    try {
      const url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map(s => ({
        tmdbId: s.id,
        title: s.name,
        year: s.first_air_date ? s.first_air_date.substring(0, 4) : '',
        poster: s.poster_path ? `${window.CONFIG.media.tmdbImageBaseUrl}${s.poster_path}` : '',
        backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : '',
        synopsis: s.overview || 'Sin descripción disponible.',
        tmdbRating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A'
      }));
    } catch (e) {
      console.warn('Error buscando series en TMDb:', e);
      return [];
    }
  }
};
