const axios = require('axios');
const config = require('../config');

/**
 * Configuração de retry para requisições de stream
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  backoffMultiplier: 1.5,
};

/**
 * Obtém o stream de áudio da BRLOGIC com retry automático
 * @param {Object} res - Response object do Express
 * @returns {Promise<void>}
 */
async function proxyStream(res) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`[StreamService] Tentativa ${attempt}/${RETRY_CONFIG.maxRetries} de conexão ao stream...`);
      
      const streamUrl = `${config.streaming.url}?source=${config.streaming.source}`;
      
      const response = await axios.get(streamUrl, {
        responseType: 'stream',
        timeout: 10000,
        headers: {
          'User-Agent': 'RadioNovaDimensaoFM/1.0',
          'Accept': '*/*',
          'Range': 'bytes=0-',
        },
        // Não seguir redirects automáticos para evitar problemas
        maxRedirects: 5,
      });

      // Configurar headers de resposta
      res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
      res.setHeader('Content-Length', response.headers['content-length'] || '');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log('[StreamService] Stream conectado com sucesso');
      
      // Pipar o stream
      response.data.pipe(res);

      // Tratamento de erros no stream
      response.data.on('error', (error) => {
        console.error('[StreamService] Erro no stream de dados:', error.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Erro ao transmitir áudio' });
        }
      });

      res.on('close', () => {
        console.log('[StreamService] Conexão de stream encerrada pelo cliente');
        response.data.destroy();
      });

      return; // Sucesso, sair da função
    } catch (error) {
      lastError = error;
      console.error(`[StreamService] Erro na tentativa ${attempt}:`, error.message);

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`[StreamService] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.error('[StreamService] Todas as tentativas de conexão falharam');
  
  if (!res.headersSent) {
    res.status(503).json({
      error: 'Serviço de streaming temporariamente indisponível',
      message: lastError?.message || 'Erro desconhecido',
      retryAfter: 30,
    });
  }
}

/**
 * Verifica a saúde do stream
 * @returns {Promise<Object>} Status do stream
 */
async function checkStreamHealth() {
  try {
    console.log('[StreamService] Verificando saúde do stream...');
    
    const streamUrl = `${config.streaming.url}?source=${config.streaming.source}`;
    
    const response = await axios.head(streamUrl, {
      timeout: 5000,
      maxRedirects: 5,
    });

    const isHealthy = response.status >= 200 && response.status < 300;
    
    return {
      isHealthy,
      statusCode: response.status,
      contentType: response.headers['content-type'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[StreamService] Erro ao verificar saúde do stream:', error.message);
    
    return {
      isHealthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  proxyStream,
  checkStreamHealth,
};
