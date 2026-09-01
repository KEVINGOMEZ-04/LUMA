/**
 * Patico Wrapped 🌻 - Servicio de Medios (Música y Películas)
 */

window.MediaService = {
  /**
   * Comprime una imagen (File, Blob o base64 DataURL) usando Canvas
   * Retorna una promesa con la versión comprimida en DataURL JPEG optimizada.
   */
  compressImage(fileOrDataUrl, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
    return new Promise((resolve) => {
      if (!fileOrDataUrl) return resolve('');

      const processImg = (src) => {
        if (!src || typeof src !== 'string') return resolve('');
        if (src.startsWith('http://') || src.startsWith('https://')) {
          // Si es una URL externa, no intentar comprimir en canvas por CORS
          return resolve(src);
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          try {
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } catch (e) {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };

      if (typeof fileOrDataUrl === 'string') {
        processImg(fileOrDataUrl);
      } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => processImg(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        resolve('');
      }
    });
  },

  spotifyUrl(title, artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  },

  youtubeUrl(title, artist) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist} official`)}`;
  },

  geniusUrl(title, artist) {
    return `https://genius.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
  },

  /**
   * Obtiene la letra de una canción desde LRCLIB o lyrics.ovh
   */
  async fetchLyrics(artist, title) {
    if (!artist || !title) return '';
    
    // 1. Intentar con LRCLIB (API pública y gratuita)
    try {
      const cleanArtist = artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.plainLyrics) {
          return data.plainLyrics.trim();
        }
      }

      // Si no encontró coincidencia exacta, probar búsqueda en LRCLIB
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          const match = searchData.find(item => item.plainLyrics) || searchData[0];
          if (match && match.plainLyrics) {
            return match.plainLyrics.trim();
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener letra de LRCLIB:', e);
    }

    // 2. Fallback con lyrics.ovh
    try {
      const cleanArtist = artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics) {
          return data.lyrics.trim();
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener letra de lyrics.ovh:', e);
    }

    return '';
  },

  /**
   * Búsqueda de canciones con metadatos completos y obtención de letra
   */
  async searchMusic(query) {
    if (!query || !query.trim()) return [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=song&limit=10`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length) {
          return data.results.map(song => {
            const title = song.trackName || 'Canción desconocida';
            const artist = song.artistName || 'Artista';
            const album = song.collectionName || '';
            const year = song.releaseDate ? new Date(song.releaseDate).getFullYear() : '';
            let cover = song.artworkUrl100 || '';
            if (cover) {
              cover = cover.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
            }

            return {
              title,
              artist,
              album,
              year,
              cover,
              spotifyUrl: this.spotifyUrl(title, artist),
              youtubeUrl: this.youtubeUrl(title, artist),
              lyricsUrl: this.geniusUrl(title, artist),
              previewUrl: song.previewUrl || '',
              lyrics: ''
            };
          });
        }
      }
    } catch (err) {
      console.warn('Error en búsqueda de música:', err);
    }

    return [];
  },

  /**
   * Búsqueda de películas con soporte TMDB y fallback universal
   */
  TMDB_GENRES: {
    // Películas
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen', 99: 'Documental',
    18: 'Drama', 10751: 'Familiar', 14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
    9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción', 10770: 'Película de TV',
    53: 'Suspenso', 10752: 'Bélica', 37: 'Western',
    // Series & Anime
    10759: 'Acción y Aventura', 10762: 'Infantil', 10763: 'Noticias', 10764: 'Reality',
    10765: 'Ciencia Ficción y Fantasía', 10766: 'Telenovela', 10767: 'Talk Show', 10768: 'Guerra y Política'
  },

  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;

    // 1. Motor Oficial: The Movie Database (TMDB) en Español Latino / Castellano
    if (tmdbKey) {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX&include_adult=false&query=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length) {
            // Ordenar por popularidad y votos
            const sortedResults = data.results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            return sortedResults.slice(0, 10).map(movie => {
              const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
              const year = (movie.release_date || '').slice(0, 4) || new Date().getFullYear();
              const genreNames = (movie.genre_ids || []).map(id => this.TMDB_GENRES[id]).filter(Boolean);
              const genre = genreNames.length ? genreNames.slice(0, 3).join(', ') : 'Cine';

              return {
                tmdbId: movie.id,
                title: movie.title || movie.original_title,
                year,
                poster,
                genre,
                synopsis: movie.overview || 'Película disponible en catálogo oficial.',
                imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
                platforms: ['Cine', 'Streaming'],
                imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${movie.title || movie.original_title} ${year}`)}`
              };
            });
          }
        }
      } catch (e) {
        console.warn('Error buscando en TMDB:', e);
      }
    }

    // 2. Motor de Películas con Carátulas en Alta Definición (iTunes Movie API)
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=movie&limit=8`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length) {
          return itunesData.results.map(m => {
            const cleanTitle = m.trackName || 'Película';
            const year = parseInt((m.releaseDate || '').slice(0, 4), 10) || new Date().getFullYear();
            let poster = m.artworkUrl100 || '';
            if (poster) {
              poster = poster.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
            }

            let platforms = ['Netflix', 'Prime Video', 'Apple TV'];
            const lower = (cleanTitle + ' ' + (m.primaryGenreName || '')).toLowerCase();
            if (lower.includes('disney') || lower.includes('pixar') || lower.includes('animac') || lower.includes('infantil') || lower.includes('kids')) {
              platforms = ['Disney+', 'Apple TV', 'Prime Video'];
            } else if (lower.includes('hbo') || lower.includes('warner') || lower.includes('dc')) {
              platforms = ['Max', 'Apple TV', 'Prime Video'];
            }

            return {
              title: cleanTitle,
              year,
              poster,
              genre: m.primaryGenreName || 'Cine',
              synopsis: m.longDescription || m.shortDescription || 'Película disponible en catálogo digital.',
              imdbRating: '',
              platforms,
              previewUrl: m.previewUrl || '',
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda con iTunes Movies:', e);
    }

    // 3. Fallback con Wikipedia REST API
    try {
      const openRes = await fetch(`https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&format=json&origin=*`);
      if (openRes.ok) {
        const openData = await openRes.json();
        const candidateTitles = openData[1] || [];
        const moviePromises = candidateTitles.slice(0, 5).map(async title => {
          try {
            const summaryRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            if (!summaryRes.ok) return null;
            const page = await summaryRes.json();
            const cleanTitle = page.title.replace(/\s*\(.*?\)/g, '').trim();
            const yearMatch = ((page.description || '') + ' ' + (page.extract || '')).match(/\b(19\d\d|20\d\d)\b/);
            const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

            return {
              title: cleanTitle,
              year,
              poster: page.thumbnail?.source || '',
              synopsis: page.extract || 'Película encontrada en el catálogo.',
              imdbRating: '',
              platforms: ['Netflix', 'Prime Video', 'Disney+'],
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          } catch (e) {
            return null;
          }
        });

        const wikiResults = (await Promise.all(moviePromises)).filter(Boolean);
        if (wikiResults.length) return wikiResults;
      }
    } catch (e) {
      console.warn('Error en búsqueda con Wikipedia:', e);
    }

    return [];
  },

  /**
   * Obtiene detalles extendidos de una película (plataformas, IMDb, sinopsis completa)
   */
  async movieDetails(movie) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    let enriched = { ...movie };

    // Si tiene TMDB ID y clave
    if (tmdbKey && movie.tmdbId) {
      try {
        const [detailsRes, providersRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`),
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`)
        ]);

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.poster_path) {
            enriched.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          }
          enriched.synopsis = details.overview || enriched.synopsis;
          if (details.genres && details.genres.length) {
            enriched.genre = details.genres.map(g => g.name).join(', ');
          }
          if (details.vote_average) {
            enriched.imdbRating = details.vote_average.toFixed(1);
          }
          if (details.imdb_id) {
            enriched.imdbUrl = `https://www.imdb.com/title/${details.imdb_id}/`;
          }
        }

        if (providersRes.ok) {
          const providers = await providersRes.json();
          const country = providers.results?.CO || providers.results?.MX || providers.results?.ES || providers.results?.US || {};
          const streamPlatforms = (country.flatrate || []).map(p => {
            const name = p.provider_name || '';
            if (name.includes('Disney')) return 'Disney+';
            if (name.includes('Amazon') || name.includes('Prime')) return 'Prime Video';
            if (name.includes('HBO') || name.includes('Max')) return 'Max';
            if (name.includes('Apple')) return 'Apple TV';
            return name;
          });
          const rentBuyPlatforms = [...(country.rent || []), ...(country.buy || [])].map(p => p.provider_name);
          const allPlatforms = Array.from(new Set([...streamPlatforms, ...rentBuyPlatforms]));
          if (allPlatforms.length) {
            enriched.platforms = allPlatforms;
          }
        }
      } catch (e) {
        console.warn('Error al obtener detalles en TMDB:', e);
      }
    }

    // Si no tiene IMDb URL, generar enlace de búsqueda
    if (!enriched.imdbUrl && enriched.title) {
      enriched.imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(`${enriched.title} ${enriched.year || ''}`)}`;
    }

    return enriched;
  },

  /**
   * ========================================================
   * BÚSQUEDA Y DETALLES DE SERIES Y ANIME 📺
   * ========================================================
   */

  async searchSeries(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;

    // 1. Motor Oficial: The Movie Database (TMDB) para Series & Anime
    if (tmdbKey) {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX&include_adult=false&query=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length) {
            const sortedResults = data.results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            return sortedResults.slice(0, 10).map(show => {
              const poster = show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '';
              const year = (show.first_air_date || '').slice(0, 4) || new Date().getFullYear();
              const genreNames = (show.genre_ids || []).map(id => this.TMDB_GENRES[id]).filter(Boolean);
              const genre = genreNames.length ? genreNames.slice(0, 3).join(', ') : 'Serie / Anime';

              return {
                tmdbId: show.id,
                title: show.name || show.original_name,
                originalTitle: show.original_name,
                year,
                poster,
                genre,
                synopsis: show.overview || 'Serie/Anime disponible en catálogo oficial.',
                imdbRating: show.vote_average ? show.vote_average.toFixed(1) : '',
                platforms: ['Streaming'],
                imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${show.name || show.original_name} ${year}`)}`
              };
            });
          }
        }
      } catch (e) {
        console.warn('Error buscando series en TMDB:', e);
      }
    }

    // 2. Fallback con iTunes TV Shows
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=tvSeason&limit=8`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length) {
          return itunesData.results.map(s => {
            const cleanTitle = s.collectionName || s.artistName || 'Serie';
            const year = parseInt((s.releaseDate || '').slice(0, 4), 10) || new Date().getFullYear();
            let poster = s.artworkUrl100 || '';
            if (poster) {
              poster = poster.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
            }

            return {
              title: cleanTitle,
              year,
              poster,
              genre: s.primaryGenreName || 'Serie',
              synopsis: s.longDescription || s.shortDescription || 'Serie de televisión.',
              imdbRating: '',
              platforms: ['Apple TV', 'Streaming'],
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda de series en iTunes:', e);
    }

    return [];
  },

  /**
   * Obtiene detalles completos de una serie (temporadas, sinopsis, streaming providers)
   */
  async seriesDetails(serie) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    let enriched = { ...serie };

    if (tmdbKey && serie.tmdbId) {
      try {
        const [detailsRes, providersRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/tv/${serie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`),
          fetch(`https://api.themoviedb.org/3/tv/${serie.tmdbId}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`)
        ]);

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.poster_path) {
            enriched.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          }
          enriched.synopsis = details.overview || enriched.synopsis;
          if (details.genres && details.genres.length) {
            enriched.genre = details.genres.map(g => g.name).join(', ');
          }
          enriched.seasonsCount = details.number_of_seasons || 1;
          enriched.episodesCount = details.number_of_episodes || 0;
          if (details.vote_average) {
            enriched.imdbRating = details.vote_average.toFixed(1);
          }

          // Construir temporadas iniciales con todos sus capítulos preinicializados
          const validSeasons = (details.seasons || []).filter(s => s.season_number > 0);
          enriched.seasons = validSeasons.map(s => {
            const epCount = s.episode_count || 0;
            const initialEpisodes = [];
            for (let i = 1; i <= epCount; i++) {
              initialEpisodes.push({
                episodeNumber: i,
                name: `Episodio ${i}`,
                overview: '',
                airDate: '',
                stillPath: '',
                watchedByKevin: false,
                watchedByWendy: false,
                watchedAtKevin: null,
                watchedAtWendy: null
              });
            }

            return {
              seasonNumber: s.season_number,
              name: s.name || `Temporada ${s.season_number}`,
              episodesCount: epCount,
              poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '',
              overview: s.overview || '',
              episodes: initialEpisodes
            };
          });

          // Cargar automáticamente metadatos completos de la Temporada 1
          if (enriched.seasons.length > 0) {
            try {
              const s1Episodes = await this.getSeasonEpisodes(serie.tmdbId, enriched.seasons[0].seasonNumber);
              if (s1Episodes && s1Episodes.length) {
                enriched.seasons[0].episodes = s1Episodes;
              }
            } catch (_) {}
          }
        }

        if (providersRes.ok) {
          const providers = await providersRes.json();
          const country = providers.results?.CO || providers.results?.MX || providers.results?.ES || providers.results?.US || {};
          const streamPlatforms = (country.flatrate || []).map(p => {
            const name = p.provider_name || '';
            if (name.includes('Disney')) return 'Disney+';
            if (name.includes('Amazon') || name.includes('Prime')) return 'Prime Video';
            if (name.includes('HBO') || name.includes('Max')) return 'Max';
            if (name.includes('Crunchyroll')) return 'Crunchyroll';
            if (name.includes('Apple')) return 'Apple TV';
            return name;
          });
          const allPlatforms = Array.from(new Set(streamPlatforms));
          if (allPlatforms.length) {
            enriched.platforms = allPlatforms;
          }
        }
      } catch (e) {
        console.warn('Error obteniendo detalles de serie en TMDB:', e);
      }
    }

    if (!enriched.imdbUrl && enriched.title) {
      enriched.imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(`${enriched.title} ${enriched.year || ''}`)}`;
    }

    return enriched;
  },

  /**
   * Obtiene la lista de capítulos de una temporada específica
   */
  async getSeasonEpisodes(tmdbId, seasonNumber) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    if (!tmdbKey || !tmdbId) return [];

    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`);
      if (res.ok) {
        const data = await res.json();
        if (data.episodes && Array.isArray(data.episodes)) {
          return data.episodes.map(ep => ({
            episodeNumber: ep.episode_number,
            name: ep.name || `Episodio ${ep.episode_number}`,
            overview: ep.overview || 'Sinopsis no disponible para este capítulo.',
            airDate: ep.air_date || '',
            stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : '',
            voteAverage: ep.vote_average ? ep.vote_average.toFixed(1) : '',
            watchedByKevin: false,
            watchedByWendy: false,
            watchedAtKevin: null,
            watchedAtWendy: null
          }));
        }
      }
    } catch (e) {
      console.warn(`Error al cargar capítulos de temporada ${seasonNumber}:`, e);
    }
    return [];
  }
};

/**
 * ========================================================
 * SERVICIO DE INTEGRACIÓN CON GOOGLE DRIVE 🌻📁
 * Genera carpetas estructuradas: "{Título} {Fecha}"
 * Sube portada en primer lugar y luego fotos de galería.
 * ========================================================
 */
window.GoogleDriveService = {
  // Estado del gestor de subidas en vivo
  uploadState: {
    isUploading: false,
    activeJob: null,
    queue: [],
    completedJobs: [],
    listeners: []
  },

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.uploadState.listeners.push(listener);
      listener(this.getState());
    }
  },

  notify() {
    const state = this.getState();
    this.uploadState.listeners.forEach(fn => {
      try { fn(state); } catch (e) { console.warn('Upload listener error:', e); }
    });
  },

  getState() {
    const { isUploading, activeJob, queue, completedJobs } = this.uploadState;
    const totalFiles = (activeJob ? activeJob.files.length : 0) + queue.reduce((acc, j) => acc + j.files.length, 0);
    const uploadedFiles = (activeJob ? activeJob.uploadedCount : 0);
    const percent = activeJob ? Math.round((activeJob.uploadedCount / Math.max(1, activeJob.files.length)) * 100) : (queue.length > 0 ? 0 : 100);

    return {
      isUploading,
      activeJob,
      queue,
      completedJobs,
      totalPendingFiles: totalFiles,
      uploadedFiles,
      percent: isUploading ? percent : 100,
      statusSummary: isUploading
        ? (activeJob ? `Subiendo ${activeJob.title} (${activeJob.uploadedCount}/${activeJob.files.length})` : 'Subiendo medios...')
        : (completedJobs.length > 0 ? 'Todo sincronizado con Google Drive ☁️' : 'Sin subidas activas')
    };
  },

  formatFolderName(title, dateStr) {
    const cleanTitle = (title || 'Recuerdo').replace(/[\\/:*?"<>|]/g, '').trim();
    let formattedDate = dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1];
        formattedDate = `${day} de ${month}`;
      }
    } catch (_) {}
    return `${cleanTitle} ${formattedDate}`;
  },

  /**
   * Encola la subida de un recuerdo a Google Drive
   */
  async uploadMemory(memoryData, coverFileOrUrl, galleryFilesOrUrls = []) {
    const folderName = this.formatFolderName(memoryData.title, memoryData.date);
    const rawFiles = [];

    if (coverFileOrUrl) {
      rawFiles.push({
        name: '01_Portada',
        data: coverFileOrUrl,
        isCover: true,
        displayName: 'Foto de Portada'
      });
    }

    if (Array.isArray(galleryFilesOrUrls)) {
      galleryFilesOrUrls.forEach((item, idx) => {
        const fileNum = String(idx + 2).padStart(2, '0');
        rawFiles.push({
          name: `${fileNum}_Foto_${idx + 1}`,
          data: item,
          isCover: false,
          displayName: `Foto Galería #${idx + 1}`
        });
      });
    }

    if (rawFiles.length === 0) {
      return { success: true, folderName };
    }

    const job = {
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: 'memory',
      title: memoryData.title || 'Recuerdo',
      folderName: folderName,
      files: rawFiles,
      uploadedCount: 0,
      status: 'pending',
      percent: 0,
      createdAt: new Date().toISOString()
    };

    this.uploadState.queue.push(job);
    this.notify();
    this.processQueue();

    return { success: true, folderName, jobId: job.id };
  },

  /**
   * Encola la subida de una foto de sueño a la carpeta Frasco de Sueños
   */
  async uploadDreamPhoto(dreamTitle, completedDate, photoData) {
    if (!photoData) return { success: false };
    const dateFormatted = this.formatFolderName('', completedDate || new Date().toISOString().split('T')[0]).trim();
    const cleanTitle = (dreamTitle || 'Sueño Cumplido').replace(/[\\/:*?"<>|]/g, '').trim();
    const fileName = `${cleanTitle} ${dateFormatted}.jpg`;

    const job = {
      id: 'job_dream_' + Date.now(),
      type: 'dream',
      title: cleanTitle,
      folderName: 'Frasco de Sueños',
      files: [{
        name: fileName,
        data: photoData,
        displayName: fileName
      }],
      uploadedCount: 0,
      status: 'pending',
      percent: 0,
      createdAt: new Date().toISOString()
    };

    this.uploadState.queue.push(job);
    this.notify();
    this.processQueue();

    return { success: true, fileName, jobId: job.id };
  },

  /**
   * Procesador secuencial de la cola en segundo plano (chunked upload)
   */
  async processQueue() {
    if (this.uploadState.isUploading) return;
    if (this.uploadState.queue.length === 0) {
      this.uploadState.isUploading = false;
      this.uploadState.activeJob = null;
      this.notify();
      return;
    }

    this.uploadState.isUploading = true;
    const currentJob = this.uploadState.queue.shift();
    this.uploadState.activeJob = currentJob;
    currentJob.status = 'uploading';
    this.notify();

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbwlvCsQoPOFWsE1JEirVv16Fy2IFwzsOAUxwJtFn-QRg9u4HWpv8JowqniTGZ72OY4o/exec';
    const chunkSize = 6; // Lote optimizado de 6 fotos comprimidas por petición

    try {
      for (let i = 0; i < currentJob.files.length; i += chunkSize) {
        const batch = currentJob.files.slice(i, i + chunkSize);
        
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'createFolderAndUpload',
            parentFolderId: '1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm',
            folderName: currentJob.folderName,
            files: batch,
            reuseExistingFolder: true
          })
        });

        currentJob.uploadedCount += batch.length;
        currentJob.percent = Math.round((currentJob.uploadedCount / currentJob.files.length) * 100);
        this.notify();

        // Breve pausa para no saturar la red
        await new Promise(r => setTimeout(r, 300));
      }

      currentJob.status = 'completed';
      currentJob.completedAt = new Date().toISOString();
      this.uploadState.completedJobs.unshift(currentJob);
      if (this.uploadState.completedJobs.length > 8) {
        this.uploadState.completedJobs.pop();
      }
    } catch (err) {
      console.warn('Error en subida de medios a Google Drive:', err);
      currentJob.status = 'error';
      currentJob.error = err.message;
      this.uploadState.completedJobs.unshift(currentJob);
    } finally {
      this.uploadState.activeJob = null;
      this.uploadState.isUploading = false;
      this.notify();

      // Procesar siguiente trabajo en la cola si existe
      if (this.uploadState.queue.length > 0) {
        setTimeout(() => this.processQueue(), 500);
      }
    }
  }
};

/**
 * =========================================================================
 * SERVICIO DE GRABACIÓN DE NOTAS DE VOZ NATIVAS 🎙️
 * =========================================================================
 */
window.VoiceRecorder = {
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  startTime: 0,
  timerInterval: null,
  isRecording: false,

  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  async startRecording(onTimerTick = null) {
    this.cleanup();
    this.audioChunks = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu navegador o dispositivo no soporta grabación directa de audio.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : (MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''));
        }
      }

      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // trozos cada 250ms
      this.isRecording = true;
      this.startTime = Date.now();

      if (onTimerTick) {
        this.timerInterval = setInterval(() => {
          const elapsedMs = Date.now() - this.startTime;
          const totalSec = Math.floor(elapsedMs / 1000);
          const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
          const secs = String(totalSec % 60).padStart(2, '0');
          onTimerTick(`${mins}:${secs}`, totalSec);
        }, 500);
      }

      return true;
    } catch (err) {
      this.cleanup();
      console.error('Error al iniciar grabación de voz:', err);
      throw err;
    }
  },

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        this.cleanup();
        resolve(null);
        return;
      }

      const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            this.cleanup();
            resolve({
              blob: audioBlob,
              dataUrl: dataUrl,
              durationSec: durationSec
            });
          };
          reader.onerror = (e) => {
            this.cleanup();
            reject(e);
          };
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          this.cleanup();
          reject(e);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (_) {
        this.cleanup();
        resolve(null);
      }
    });
  },

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.onstop = null;
      try { this.mediaRecorder.stop(); } catch (_) {}
    }
    this.cleanup();
  },

  cleanup() {
    this.isRecording = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      try {
        this.stream.getTracks().forEach(track => track.stop());
      } catch (_) {}
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
};

window.MediaService.VoiceRecorder = window.VoiceRecorder;

/**
 * =========================================================================
 * BANCO DE PREGUNTAS DIARIAS DE PAREJA 💌✨
 * =========================================================================
 */
window.DailyQuestions = {
  BANK: [
    "¿Cuál fue el momento exacto en el que sentiste que te habías enamorado de mí?",
    "¿Qué es lo que más te hace sonreír cuando te acuerdas de mí en un día cualquiera?",
    "Si pudiéramos teletransportarnos a cualquier lugar del mundo ahora mismo, ¿a dónde iríamos?",
    "¿Cuál es tu recuerdo favorito de cuando empezamos a salir?",
    "¿Qué comida o postre me prepararías con mucho amor si tuvieras todo el día libre?",
    "¿Cuál es esa pequeña manía o gesto mío que te parece súper tierno?",
    "¿Qué canción sientes que cuenta mejor nuestra historia de amor?",
    "Si tuviéramos un día entero sin celulares ni responsabilidades, ¿cómo sería nuestro día perfecto?",
    "¿Cuál ha sido la cita más divertida o inesperada que hemos tenido?",
    "¿Qué es lo que más admiras de mi personalidad?",
    "¿En qué película o serie sientes que nos parecemos aunque sea un poquito?",
    "¿Cuál es el abrazo o beso nuestro que más grabado tienes en la mente?",
    "Si pudieras pedir un deseo para nuestro futuro dentro de 5 años, ¿cuál sería?",
    "¿Qué detalle que he tenido contigo te ha llegado más al corazón?",
    "¿Cuál es nuestro chiste o momento de risa incontrolable que nunca olvidarás?",
    "¿Qué apodo o forma cariñosa de llamarte es tu favorita?",
    "¿Qué es lo primero que pensaste cuando me viste por primera vez?",
    "Si tuviéramos que elegir una mascota imaginaria juntos, ¿cuál sería?",
    "¿Qué viaje o escapada juntos sueñas con hacer muy pronto?",
    "¿Qué es algo que aprendiste o mejoraste desde que estamos juntos?",
    "¿Cuál es la foto nuestra que más te encanta y por qué?",
    "¿Cómo describirías nuestro amor en tres palabras?",
    "¿Cuál es tu plan favorito para un día de lluvia y frío juntos?",
    "¿Qué es lo que más te gusta de cuando nos quedamos hablando hasta tarde?",
    "Si creáramos un restaurante juntos, ¿cómo se llamaría y qué serviríamos?",
    "¿Cuál fue el primer mensaje que te hizo sentir mariposas en el estómago?",
    "¿Qué es lo que más extrañas de mí cuando pasamos unos días sin vernos?",
    "¿Qué regalo o sorpresa mía te ha hecho más ilusión?",
    "Si escribiéramos un libro de nuestra historia, ¿cuál sería el título?",
    "¿Cuál es ese lugar secreto o rincón donde sientes que el tiempo se detiene con nosotros?",
    "¿Qué canción te gustaría que bailemos abrazados en la sala?",
    "¿Qué prenda o atuendo mío te parece que me queda mejor?",
    "¿Cuál ha sido nuestro mayor logro como equipo hasta ahora?",
    "¿Qué es algo nuevo que te gustaría que intentemos juntos este mes?",
    "¿Qué superpoder crees que tiene nuestra relación?",
    "Si tuvieras que describir mi abrazo, ¿cómo se siente?",
    "¿Qué aroma o perfume te recuerda de inmediato a mí?",
    "¿Cuál ha sido la conversación más profunda o bonita que hemos tenido?",
    "¿Qué juego, película o serie te mueres de ganas de ver o jugar conmigo?",
    "¿Qué es lo que más agradeces de tenernos el uno al otro hoy?",
    "¿Cuál es ese sueño loco que sabes que cumpliremos juntos?",
    "Si pudieras revivir un solo día de nuestra historia exactamente igual, ¿cuál sería?",
    "¿Qué es lo que más te calma o te da paz cuando estás conmigo?",
    "¿Cuál es la comida que siempre nos une o nos alegra el día?",
    "¿Qué promesa para nosotros quieres que recordemos siempre?",
    "¿Cómo supiste que éramos el uno para el otro?",
    "¿Qué es lo que más te emociona de nuestro futuro?",
    "Si tuviéramos una casa frente al mar o en la montaña, ¿cómo la decoraríamos?",
    "¿Qué es lo más lindo que te he dicho?",
    "¿Por qué soy tu persona favorita en todo el universo?"
  ],

  getQuestionForDate(dateStr) {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }
    // Hash determinista a partir de la fecha (YYYY-MM-DD)
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % this.BANK.length;
    return this.BANK[index];
  }
};

window.MediaService.DailyQuestions = window.DailyQuestions;


