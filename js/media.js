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

  tmdbGenres: {
    28: 'Acción',
    12: 'Aventura',
    16: 'Animación',
    35: 'Comedia',
    80: 'Crimen',
    99: 'Documental',
    18: 'Drama',
    10751: 'Familia',
    14: 'Fantasía',
    36: 'Historia',
    27: 'Terror',
    10402: 'Música',
    9648: 'Misterio',
    10749: 'Romance',
    878: 'Ciencia ficción',
    10770: 'Película de TV',
    53: 'Suspense',
    10752: 'Bélica',
    37: 'Western'
  },

  getGenreNames(genreIds) {
    if (!Array.isArray(genreIds)) return '';
    return genreIds
      .map(id => this.tmdbGenres[id])
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
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
        tmdbId: m.id,
        title: m.title,
        originalTitle: m.original_title,
        year: m.release_date ? m.release_date.split('-')[0] : '',
        overview: m.overview || 'Sin sinopsis disponible.',
        poster: m.poster_path ? `${imageBaseUrl}${m.poster_path}` : 'assets/icon.png',
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : '',
        voteAverage: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
        genres: this.getGenreNames(m.genre_ids) || 'Cine',
        genreIds: m.genre_ids || []
      }));
    } catch (err) {
      console.warn('Error buscando películas en TMDb:', err);
      return [];
    }
  },

  async getMovieDetails(tmdbId) {
    if (!tmdbId) return null;
    try {
      const { baseUrl, apiKey, language, imageBaseUrl } = window.CONFIG.tmdb;
      const url = `${baseUrl}/movie/${tmdbId}?api_key=${apiKey}&language=${language}&append_to_response=images,videos`;
      const res = await fetch(url);
      const data = await res.json();

      const hours = data.runtime ? Math.floor(data.runtime / 60) : 0;
      const mins = data.runtime ? data.runtime % 60 : 0;
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : (mins > 0 ? `${mins}m` : '');

      const genresFormatted = (data.genres || []).map(g => g.name).slice(0, 3).join(', ');

      const gallery = (data.images && data.images.backdrops || [])
        .slice(0, 8)
        .map(img => `https://image.tmdb.org/t/p/w780${img.file_path}`);

      let trailerUrl = '';
      if (data.videos && data.videos.results) {
        const trailer = data.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        if (trailer) {
          trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      return {
        tmdbId: data.id,
        title: data.title,
        originalTitle: data.original_title,
        year: data.release_date ? data.release_date.split('-')[0] : '',
        duration: durationFormatted,
        runtimeMinutes: data.runtime || 0,
        genres: genresFormatted || 'Cine',
        overview: data.overview || 'Sin sinopsis disponible.',
        poster: data.poster_path ? `${imageBaseUrl}${data.poster_path}` : 'assets/icon.png',
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
        voteAverage: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
        gallery,
        trailerUrl
      };
    } catch (err) {
      console.warn('Error obteniendo detalles de película TMDb:', err);
      return null;
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