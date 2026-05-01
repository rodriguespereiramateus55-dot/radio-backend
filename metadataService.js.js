const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config');

// Cache com TTL configurável
const cache = new NodeCache({ stdTTL: config.metadata.cacheTtl });

// Dados padrão para fallback
const DEFAULT_METADATA = {
  isOnline: false,
  currentTrack: 'Rádio Nova Dimensão FM',
  artist: 'Programação Musical',
  cover: null,
  listeners: 0,
  bitrate: '128 kbps',
  sampleRate: '44.1 kHz',
  timestamp: new Date().toISOString(),
};

/**
 * Busca metadados da API da BRLOGIC com tratamento de erros
 * @returns {Promise<Object>} Metadados da rádio
 */
async function fetchMetadata() {
  try {
    // Verificar cache primeiro
    const cached = cache.get('metadata');
    if (cached) {
      console.log('[MetadataService] Retornando dados do cache');
      return cached;
    }

    console.log('[MetadataService] Buscando metadados da API BRLOGIC...');
    
    const response = await axios.get(config.metadata.apiUrl, {
      timeout: config.metadata.timeout,
      headers: {
        'User-Agent': 'RadioNovaDimensaoFM/1.0',
        'Accept': 'application/json',
      },
    });

    // Processar resposta
    const metadata = parseMetadata(response.data);
    
    // Armazenar no cache
    cache.set('metadata', metadata);
    
    console.log('[MetadataService] Metadados obtidos com sucesso:', metadata);
    return metadata;
  } catch (error) {
    console.error('[MetadataService] Erro ao buscar metadados:', error.message);
    
    // Tentar retornar dados do cache mesmo que expirados
    const staleCache = cache.get('metadata');
    if (staleCache) {
      console.log('[MetadataService] Retornando dados em cache (expirado)');
      return { ...staleCache, isStale: true };
    }

    // Retornar dados padrão como fallback
    console.log('[MetadataService] Retornando dados padrão (fallback)');
    return DEFAULT_METADATA;
  }
}

/**
 * Processa a resposta da API BRLOGIC
 * @param {Object} data - Dados da API
 * @returns {Object} Metadados processados
 */
function parseMetadata(data) {
  try {
    // A API retorna um JSON com informações de streaming
    // Estrutura esperada: { isOnline, currentTrack, artist, cover, listeners, ... }
    
    return {
      isOnline: data.isOnline !== false,
      currentTrack: data.currentTrack || data.title || 'Programação Musical',
      artist: data.artist || data.artist_name || 'Rádio Nova Dimensão FM',
      cover: data.cover || data.cover_url || null,
      listeners: parseInt(data.listeners || data.listener_count || 0, 10),
      bitrate: data.bitrate || '128 kbps',
      sampleRate: data.sampleRate || data.sample_rate || '44.1 kHz',
      streamingType: data.streamingType || 'live',
      timestamp: new Date().toISOString(),
      isStale: false,
    };
  } catch (error) {
    console.error('[MetadataService] Erro ao processar metadados:', error.message);
    return DEFAULT_METADATA;
  }
}

/**
 * Limpa o cache de metadados
 */
function clearCache() {
  cache.del('metadata');
  console.log('[MetadataService] Cache limpo');
}

/**
 * Obtém informações do cache
 */
function getCacheStats() {
  return {
    keys: cache.keys(),
    stats: cache.getStats(),
  };
}

module.exports = {
  fetchMetadata,
  clearCache,
  getCacheStats,
};
