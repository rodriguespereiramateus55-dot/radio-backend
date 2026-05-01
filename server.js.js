const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config');
const apiRoutes = require('./routes/api');

// Inicializar aplicação Express
const app = express();

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Logging de requisições
app.use(morgan('combined'));

// CORS - Permitir requisições de qualquer origem
app.use(cors(config.cors));

// Compressão de respostas
app.use(compression());

// Parser JSON
app.use(express.json());

// Parser URL-encoded
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROTAS
// ============================================

// Health check simples
app.get('/', (req, res) => {
  res.json({
    message: 'Rádio Nova Dimensão FM - Backend',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      metadata: '/api/metadata',
      stream: '/api/stream',
      health: '/api/health',
      info: '/api/info',
      cacheStats: '/api/cache/stats',
      cacheClear: '/api/cache/clear',
    },
  });
});

// Rotas da API
app.use('/api', apiRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  });
});

// Erro global
app.use((err, req, res, next) => {
  console.error('[Server] Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro desconhecido',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎙️  Rádio Nova Dimensão FM - Backend');
  console.log('='.repeat(60));
  console.log(`✅ Servidor iniciado na porta ${PORT}`);
  console.log(`📡 Ambiente: ${config.nodeEnv}`);
  console.log(`🎵 Stream: ${config.streaming.url}`);
  console.log(`📊 Metadados: ${config.metadata.apiUrl}`);
  console.log(`⏱️  Cache TTL: ${config.metadata.cacheTtl}s`);
  console.log('='.repeat(60) + '\n');
});

// ============================================
// TRATAMENTO DE SINAIS
// ============================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM recebido. Encerrando gracefully...');
  server.close(() => {
    console.log('[Server] Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT recebido. Encerrando gracefully...');
  server.close(() => {
    console.log('[Server] Servidor encerrado');
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('[Server] Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Promise rejeitada não tratada:', reason);
  process.exit(1);
});

module.exports = app;
