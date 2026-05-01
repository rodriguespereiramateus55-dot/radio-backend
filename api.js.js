const express = require('express');
const router = express.Router();
const metadataService = require('../services/metadataService');
const streamService = require('../services/streamService');

/**
 * GET /api/metadata
 * Retorna os metadados atuais da rádio (música, artista, capa, etc)
 */
router.get('/metadata', async (req, res) => {
  try {
    console.log('[API] Requisição de metadados recebida');
    const metadata = await metadataService.fetchMetadata();
    
    res.json({
      success: true,
      data: metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao retornar metadados:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar metadados',
      message: error.message,
    });
  }
});

/**
 * GET /api/stream
 * Proxy do stream de áudio da BRLOGIC
 * Suporta range requests para seeking
 */
router.get('/stream', async (req, res) => {
  try {
    console.log('[API] Requisição de stream recebida');
    await streamService.proxyStream(res);
  } catch (error) {
    console.error('[API] Erro ao processar stream:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro ao processar stream',
        message: error.message,
      });
    }
  }
});

/**
 * GET /api/health
 * Verifica a saúde da rádio e do streaming
 */
router.get('/health', async (req, res) => {
  try {
    console.log('[API] Requisição de health check recebida');
    
    const streamHealth = await streamService.checkStreamHealth();
    const metadata = await metadataService.fetchMetadata();
    
    const isHealthy = streamHealth.isHealthy && metadata.isOnline !== false;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      services: {
        stream: streamHealth,
        metadata: {
          isAvailable: metadata.isOnline !== false,
          isStale: metadata.isStale || false,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao verificar saúde:', error.message);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/cache/stats
 * Retorna estatísticas do cache (apenas em desenvolvimento)
 */
router.get('/cache/stats', (req, res) => {
  try {
    console.log('[API] Requisição de estatísticas de cache recebida');
    const stats = metadataService.getCacheStats();
    
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao retornar estatísticas de cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas de cache',
      message: error.message,
    });
  }
});

/**
 * POST /api/cache/clear
 * Limpa o cache de metadados (apenas em desenvolvimento)
 */
router.post('/cache/clear', (req, res) => {
  try {
    console.log('[API] Requisição para limpar cache recebida');
    metadataService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao limpar cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar cache',
      message: error.message,
    });
  }
});

/**
 * GET /api/info
 * Retorna informações sobre o backend
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    service: 'Rádio Nova Dimensão FM Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
