require('dotenv').config();

module.exports = {
  // Ambiente
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // BRLOGIC Streaming
  streaming: {
    address: process.env.STREAMING_ADDRESS || 'servidor15-5.brlogic.com',
    port: process.env.STREAMING_PORT || '7336',
    url: process.env.STREAMING_URL || 'https://servidor15-5.brlogic.com:7336/live',
    source: process.env.STREAMING_SOURCE || 'website',
  },

  // BRLOGIC Metadata API
  metadata: {
    apiUrl: process.env.METADATA_API_URL || 'https://d36nr0u3xmc4mm.cloudfront.net/index.php/api/streaming/status/7336/462ce38232ee935a652da74e2025766b/SV28BR',
    cacheTtl: parseInt(process.env.CACHE_TTL || '30', 10), // em segundos
    timeout: 5000, // timeout para requisições
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
