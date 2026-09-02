/**
 * LUMA 🌟 - Servicio de Medios y Reproductor Singleton
 */

class LumaAudioManager {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.isPlaying = false;
    this.listeners = [];

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener('error', (err) => {
      console.warn('Error en reproducción de audio:', err);
      this.isPlaying = false;
      this.notify();
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getState());
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    return {
      track: this.currentTrack,
      isPlaying: this.isPlaying,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration
    };
  }

  playTrack(track) {
    if (!track || !track.previewUrl) {
      window.Utils.showToast('Preview no disponible para esta canción', 'info');
      return;
    }

    if (this.currentTrack && this.currentTrack.previewUrl === track.previewUrl) {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    this.audio.pause();
    this.audio.src = track.previewUrl;
    this.currentTrack = track;
    this.audio.load();
    this.audio.play().catch(e => {
      console.warn('Autoplay bloqueado o error:', e);
      this.isPlaying = false;
      this.notify();
    });
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    if (this.audio.src) {
      this.audio.play().catch(() => {});
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentTrack = null;
    this.isPlaying = false;
    this.notify();
  }
}

window.audioManager = new LumaAudioManager();

window.MediaService = {
  async searchSongs(query) {
    if (!query || !query.trim()) return [];
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10&country=ES`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.results || []).map(item => ({
        id: 'itunes_' + item.trackId,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        previewUrl: item.previewUrl,
        artwork: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        trackTimeMillis: item.trackTimeMillis || 210000,
        externalUrl: item.trackViewUrl
      }));
    } catch (err) {
      console.warn('Error buscando canciones en iTunes:', err);
      return [];
    }
  },

  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    try {
      const { baseUrl, apiKey, language, imageBaseUrl } = window.CONFIG.tmdb;
      const url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.results || []).slice(0, 10).map(m => ({
        id: 'tmdb_movie_' + m.id,
        title: m.title,
        originalTitle: m.original_title,
        year: m.release_date ? m.release_date.split('-')[0] : '',
        overview: m.overview,
        poster: m.poster_path ? `${imageBaseUrl}${m.poster_path}` : '',
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : '',
        voteAverage: m.vote_average ? m.vote_average.toFixed(1) : 'N/A'
      }));
    } catch (err) {
      console.warn('Error buscando películas en TMDb:', err);
      return [];
    }
  },

  async searchSeries(query) {
    if (!query || !query.trim()) return [];
    try {
      const { baseUrl, apiKey, language, imageBaseUrl } = window.CONFIG.tmdb;
      const url = `${baseUrl}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.results || []).slice(0, 10).map(s => ({
        id: 'tmdb_series_' + s.id,
        title: s.name,
        originalTitle: s.original_name,
        year: s.first_air_date ? s.first_air_date.split('-')[0] : '',
        overview: s.overview,
        poster: s.poster_path ? `${imageBaseUrl}${s.poster_path}` : '',
        backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w1280${s.backdrop_path}` : '',
        voteAverage: s.vote_average ? s.vote_average.toFixed(1) : 'N/A'
      }));
    } catch (err) {
      console.warn('Error buscando series en TMDb:', err);
      return [];
    }
  },

  async fetchLyrics(artist, title) {
    try {
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Lyrics not found');
      const data = await res.json();
      return data.plainLyrics || data.syncedLyrics || null;
    } catch (err) {
      return null;
    }
  },

  spotifyUrl(title, artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  },

  youtubeUrl(title, artist) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
  },

  geniusUrl(title, artist) {
    return `https://genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
  }
};