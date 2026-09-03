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

  async fetchTmdbWithFallback(endpoint) {
    const tmdbConfig = window.CONFIG?.tmdb || {};
    const keys = [
      tmdbConfig.apiKey,
      ...(tmdbConfig.backupKeys || []),
      'e9e9d8da18ae29fc430845952232787c',
      '8265bd1679663a7ea12ac168da84d2e8',
      'cfe422613b250f702980a3bbf9e90716'
    ].filter(Boolean);

    const baseUrl = tmdbConfig.baseUrl || 'https://api.themoviedb.org/3';
    const language = tmdbConfig.language || 'es-ES';

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${baseUrl}${endpoint}${sep}api_key=${key}&language=${language}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn(`Intento TMDb con clave ${i + 1} falló:`, err);
      }
    }
    return null;
  },

  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    const trimmed = query.trim();
    try {
      const data = await this.fetchTmdbWithFallback(`/search/movie?query=${encodeURIComponent(trimmed)}&page=1`);
      const imageBaseUrl = window.CONFIG?.tmdb?.imageBaseUrl || 'https://image.tmdb.org/t/p/w500';

      if (data && data.results && data.results.length > 0) {
        return data.results.slice(0, 12).map(m => ({
          id: 'tmdb_movie_' + m.id,
          tmdbId: m.id,
          title: m.title,
          originalTitle: m.original_title,
          year: m.release_date ? m.release_date.split('-')[0] : '',
          overview: m.overview || 'Sin sinopsis disponible.',
          poster: m.poster_path ? `${imageBaseUrl}${m.poster_path}` : 'assets/icon.png',
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : '',
          voteAverage: m.vote_average ? m.vote_average.toFixed(1) : '8.5',
          genres: this.getGenreNames(m.genre_ids) || 'Cine',
          genreIds: m.genre_ids || []
        }));
      }
    } catch (err) {
      console.warn('Error buscando películas en TMDb:', err);
    }
    return [];
  },

  async getMovieDetails(tmdbId) {
    if (!tmdbId) return null;
    try {
      const data = await this.fetchTmdbWithFallback(`/movie/${tmdbId}?append_to_response=images,videos`);
      const imageBaseUrl = window.CONFIG?.tmdb?.imageBaseUrl || 'https://image.tmdb.org/t/p/w500';

      if (!data) return null;

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
        voteAverage: data.vote_average ? data.vote_average.toFixed(1) : '8.5',
        gallery,
        trailerUrl
      };
    } catch (err) {
      console.warn('Error obteniendo detalles en TMDb:', err);
      return null;
    }
  },

  async getMovieWatchProviders(tmdbId) {
    if (!tmdbId) return null;
    try {
      const data = await this.fetchTmdbWithFallback(`/movie/${tmdbId}/watch/providers`);
      if (!data || !data.results) return null;

      const results = data.results;
      const priorityCountries = ['CO', 'MX', 'ES', 'AR', 'CL', 'US'];
      let selectedCountry = priorityCountries.find(c => results[c] && (results[c].flatrate || results[c].rent || results[c].buy || results[c].ads));
      if (!selectedCountry) {
        selectedCountry = Object.keys(results).find(c => results[c] && (results[c].flatrate || results[c].rent || results[c].buy || results[c].ads));
      }

      if (!selectedCountry || !results[selectedCountry]) return null;

      const countryData = results[selectedCountry];
      const providersMap = new Map();

      (countryData.flatrate || []).forEach(p => {
        if (!providersMap.has(p.provider_id)) {
          providersMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : '',
            type: 'Suscripción'
          });
        }
      });

      (countryData.ads || []).forEach(p => {
        if (!providersMap.has(p.provider_id)) {
          providersMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : '',
            type: 'Gratis'
          });
        }
      });

      (countryData.rent || []).forEach(p => {
        if (!providersMap.has(p.provider_id)) {
          providersMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : '',
            type: 'Alquiler'
          });
        }
      });

      return {
        country: selectedCountry,
        link: countryData.link || '',
        providers: Array.from(providersMap.values())
      };
    } catch (err) {
      console.warn('Error obteniendo plataformas en TMDb:', err);
      return null;
    }
  },

  async searchSeries(query) {
    if (!query || !query.trim()) return [];
    try {
      const data = await this.fetchTmdbWithFallback(`/search/tv?query=${encodeURIComponent(query)}&page=1`);
      if (!data || !data.results) return [];
      const imageBaseUrl = window.CONFIG?.tmdb?.imageBaseUrl || 'https://image.tmdb.org/t/p/w500';

      return data.results.slice(0, 12).map(s => {
        const year = s.first_air_date ? s.first_air_date.split('-')[0] : '';
        return {
          tmdbId: s.id,
          id: 'tmdb_series_' + s.id,
          title: s.name,
          originalTitle: s.original_name,
          year,
          overview: s.overview || 'Sin sinopsis disponible.',
          poster: s.poster_path ? `${imageBaseUrl}${s.poster_path}` : 'assets/icon.png',
          backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w1280${s.backdrop_path}` : '',
          voteAverage: s.vote_average ? s.vote_average.toFixed(1) : '8.5'
        };
      });
    } catch (err) {
      console.warn('Error buscando series en TMDb:', err);
      return [];
    }
  },

  async getSeriesDetails(seriesId) {
    if (!seriesId) return null;
    try {
      const data = await this.fetchTmdbWithFallback(`/tv/${seriesId}?append_to_response=watch/providers`);
      if (!data) return null;

      const imageBaseUrl = window.CONFIG?.tmdb?.imageBaseUrl || 'https://image.tmdb.org/t/p/w500';
      const firstYear = data.first_air_date ? data.first_air_date.split('-')[0] : '';
      const lastYear = data.last_air_date ? data.last_air_date.split('-')[0] : '';
      const yearsFormatted = firstYear ? (lastYear && lastYear !== firstYear ? `${firstYear}–${lastYear}` : firstYear) : '';

      const genresFormatted = (data.genres || []).map(g => g.name).slice(0, 3).join(', ');

      // Determinar plataforma principal (de networks o watch/providers)
      let platform = (data.networks && data.networks[0]) ? data.networks[0].name : '';
      if (!platform && data['watch/providers'] && data['watch/providers'].results) {
        const wp = data['watch/providers'].results;
        const country = wp.CO || wp.MX || wp.ES || wp.US || Object.values(wp)[0];
        if (country && country.flatrate && country.flatrate[0]) {
          platform = country.flatrate[0].provider_name;
        }
      }
      if (!platform) platform = 'Streaming';

      // Filtrar temporadas (omitir temporada 0 si son solo extras/especiales, salvo que sea la única)
      let seasons = (data.seasons || [])
        .filter(s => s.season_number > 0 && s.episode_count > 0)
        .map(s => ({
          seasonNumber: s.season_number,
          name: s.name || `Temporada ${s.season_number}`,
          episodeCount: s.episode_count || 1,
          poster: s.poster_path ? `${imageBaseUrl}${s.poster_path}` : ''
        }));

      if (seasons.length === 0 && data.seasons && data.seasons.length > 0) {
        seasons = data.seasons.map(s => ({
          seasonNumber: s.season_number,
          name: s.name || `Temporada ${s.season_number}`,
          episodeCount: s.episode_count || 1,
          poster: s.poster_path ? `${imageBaseUrl}${s.poster_path}` : ''
        }));
      }

      const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodeCount, 0);

      return {
        tmdbId: data.id,
        title: data.name,
        originalTitle: data.original_name,
        years: yearsFormatted,
        genres: genresFormatted || 'Drama, Serie',
        overview: data.overview || 'Sin sinopsis disponible.',
        platform,
        poster: data.poster_path ? `${imageBaseUrl}${data.poster_path}` : 'assets/icon.png',
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
        numberOfSeasons: seasons.length || data.number_of_seasons || 1,
        totalEpisodes: totalEpisodes || data.number_of_episodes || 1,
        voteAverage: data.vote_average ? data.vote_average.toFixed(1) : '8.5',
        seasons
      };
    } catch (err) {
      console.warn('Error obteniendo detalles de serie en TMDb:', err);
      return null;
    }
  },

  async getSeasonEpisodes(seriesId, seasonNumber = 1) {
    if (!seriesId) return [];
    try {
      const data = await this.fetchTmdbWithFallback(`/tv/${seriesId}/season/${seasonNumber}`);
      if (!data || !data.episodes) return [];

      return data.episodes.map(ep => {
        const runtime = ep.runtime ? `${ep.runtime} min` : '42 min';
        return {
          episodeNumber: ep.episode_number,
          seasonNumber: ep.season_number || seasonNumber,
          name: ep.name || `Episodio ${ep.episode_number}`,
          overview: ep.overview || 'Sin descripción disponible para este episodio.',
          duration: runtime,
          runtimeMinutes: ep.runtime || 42,
          still: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : 'assets/icon.png',
          airDate: ep.air_date || '',
          voteAverage: ep.vote_average ? ep.vote_average.toFixed(1) : '8.0'
        };
      });
    } catch (err) {
      console.warn(`Error obteniendo episodios de temporada ${seasonNumber} de serie ${seriesId}:`, err);
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