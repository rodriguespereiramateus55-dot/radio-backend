# Arquitetura Técnica - Backend Rádio Nova Dimensão FM

Documento detalhado sobre a arquitetura, design patterns e decisões técnicas do backend.

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Global                        │   │
│  │  - CORS  - Compression  - Logging  - JSON Parser     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │              Router (API Routes)                      │   │
│  │  - /api/metadata   - /api/stream                      │   │
│  │  - /api/health     - /api/info                        │   │
│  │  - /api/cache/*                                       │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │           Service Layer                               │   │
│  │  ┌──────────────────┐    ┌──────────────────┐        │   │
│  │  │ MetadataService  │    │  StreamService   │        │   │
│  │  │                  │    │                  │        │   │
│  │  │ - fetchMetadata()│    │ - proxyStream()  │        │   │
│  │  │ - parseMetadata()│    │ - checkHealth()  │        │   │
│  │  │ - clearCache()   │    │ - retryLogic()   │        │   │
│  │  └──────────────────┘    └──────────────────┘        │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                   │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │         Cache Layer (Node-Cache)                      │   │
│  │  - TTL: 30 segundos                                   │   │
│  │  - Fallback automático                                │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
   ┌────▼─────┐                          ┌──────▼──────┐
   │ BRLOGIC  │                          │   Clients   │
   │ Streaming│                          │  (Frontend) │
   └──────────┘                          └─────────────┘
```

## 🏗️ Estrutura de Diretórios

```
radio-backend/
├── server.js                 # Entrada principal
├── config.js                 # Configurações centralizadas
├── package.json              # Dependências
├── .env                      # Variáveis de ambiente
├── .gitignore                # Git ignore
├── README.md                 # Documentação principal
├── INTEGRATION_GUIDE.md      # Guia de integração
├── ARCHITECTURE.md           # Este arquivo
├── example.html              # Exemplo de uso
├── test-api.js               # Script de testes
│
├── services/
│   ├── metadataService.js    # Lógica de metadados
│   └── streamService.js      # Lógica de streaming
│
└── routes/
    └── api.js                # Definição de rotas
```

## 🔄 Fluxo de Requisições

### 1. Requisição de Metadados

```
Cliente (Frontend)
    │
    ├─ GET /api/metadata
    │
    ▼
Express Router
    │
    ├─ Valida requisição
    │
    ▼
MetadataService.fetchMetadata()
    │
    ├─ Verifica Cache (Node-Cache)
    │  │
    │  ├─ HIT  → Retorna dados em cache
    │  │
    │  └─ MISS → Continua
    │
    ├─ Requisição HTTP para BRLOGIC API
    │  │
    │  ├─ Sucesso → parseMetadata()
    │  │           → Armazena em cache
    │  │           → Retorna dados
    │  │
    │  └─ Erro → Tenta cache expirado
    │           → Se vazio → Retorna fallback
    │
    ▼
Response JSON
    │
    ▼
Cliente (Frontend)
```

### 2. Requisição de Stream

```
Cliente (Frontend)
    │
    ├─ GET /api/stream
    │
    ▼
Express Router
    │
    ├─ Valida requisição
    │
    ▼
StreamService.proxyStream()
    │
    ├─ Tentativa 1/3
    │  ├─ Conecta a BRLOGIC
    │  ├─ Configura headers
    │  ├─ Inicia pipe do stream
    │  │
    │  ├─ Sucesso → Retorna stream
    │  │
    │  └─ Erro → Aguarda + tenta novamente
    │
    ├─ Tentativa 2/3 (com backoff)
    │
    ├─ Tentativa 3/3 (com backoff maior)
    │
    └─ Todas falharam → Retorna erro 503
    │
    ▼
Stream de Áudio
    │
    ▼
Cliente (Frontend)
```

## 🔐 Padrões de Design

### 1. Service Layer Pattern

Separação clara entre rotas e lógica de negócio:

```javascript
// routes/api.js - Apenas coordenação
router.get('/metadata', async (req, res) => {
  const metadata = await metadataService.fetchMetadata();
  res.json(metadata);
});

// services/metadataService.js - Lógica complexa
async function fetchMetadata() {
  // Lógica de cache, retry, fallback, etc.
}
```

**Benefícios:**
- Testabilidade
- Reutilização
- Manutenibilidade

### 2. Cache-Aside Pattern

```javascript
async function fetchMetadata() {
  // 1. Verificar cache
  const cached = cache.get('metadata');
  if (cached) return cached;
  
  // 2. Se não em cache, buscar de fonte
  const data = await fetchFromAPI();
  
  // 3. Armazenar em cache
  cache.set('metadata', data);
  
  return data;
}
```

**Benefícios:**
- Reduz carga na API
- Melhora performance
- Fallback automático

### 3. Retry with Exponential Backoff

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 1.5,
};

// Tentativa 1: aguarda 1000ms
// Tentativa 2: aguarda 1500ms
// Tentativa 3: aguarda 2250ms
```

**Benefícios:**
- Resiliência a falhas temporárias
- Não sobrecarrega servidor
- Melhora taxa de sucesso

### 4. Graceful Degradation

```javascript
// Se API falha, retorna dados em cache
// Se cache vazio, retorna dados padrão
// Nunca retorna erro completo ao usuário
```

**Benefícios:**
- Melhor UX
- Serviço sempre disponível
- Fallback automático

## 📊 Fluxo de Dados

### Estrutura de Resposta de Metadados

```javascript
{
  "success": true,
  "data": {
    "isOnline": true,
    "currentTrack": "Nome da Música",
    "artist": "Nome do Artista",
    "cover": "URL da imagem",
    "listeners": 150,
    "bitrate": "128 kbps",
    "sampleRate": "44.1 kHz",
    "streamingType": "live",
    "timestamp": "2024-04-28T11:00:00.000Z",
    "isStale": false
  },
  "timestamp": "2024-04-28T11:00:00.000Z"
}
```

### Estrutura de Resposta de Health

```javascript
{
  "success": true,
  "status": "healthy",
  "services": {
    "stream": {
      "isHealthy": true,
      "statusCode": 200,
      "contentType": "audio/mpeg",
      "timestamp": "2024-04-28T11:00:00.000Z"
    },
    "metadata": {
      "isAvailable": true,
      "isStale": false
    }
  },
  "timestamp": "2024-04-28T11:00:00.000Z"
}
```

## ⚙️ Configurações

### Arquivo config.js

```javascript
module.exports = {
  // Ambiente
  nodeEnv: 'production',
  port: 3000,

  // Streaming
  streaming: {
    address: 'servidor15-5.brlogic.com',
    port: '7336',
    url: 'https://servidor15-5.brlogic.com:7336/live',
    source: 'website',
  },

  // Metadados
  metadata: {
    apiUrl: 'https://d36nr0u3xmc4mm.cloudfront.net/...',
    cacheTtl: 30,
    timeout: 5000,
  },

  // CORS
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
```

## 🛡️ Tratamento de Erros

### Estratégia de Fallback

```
┌─ Requisição para API BRLOGIC
│
├─ Sucesso? → Retorna dados
│
└─ Erro?
   │
   ├─ Cache disponível? → Retorna cache (marcado como "stale")
   │
   └─ Cache vazio?
      │
      └─ Retorna dados padrão (fallback)
```

### Códigos de Status HTTP

| Código | Cenário | Ação |
|--------|---------|------|
| 200 | Sucesso | Retorna dados |
| 503 | Serviço indisponível | Retry automático |
| 504 | Gateway timeout | Retry com backoff |
| 500 | Erro interno | Log + fallback |

## 🔍 Logging

### Níveis de Log

```javascript
console.log('[MetadataService] Buscando metadados...');
console.error('[StreamService] Erro na tentativa 1:', error.message);
console.warn('[API] Dados em cache expirados');
```

### Formato

```
[NomeDo Serviço] Mensagem descritiva
```

## 📈 Performance

### Otimizações Implementadas

1. **Compressão**: Middleware `compression` reduz tamanho de respostas
2. **Cache**: TTL de 30s reduz requisições à API
3. **Streaming**: Pipe direto evita buffer em memória
4. **Timeout**: Evita requisições penduradas

### Métricas

- **Latência de Metadados**: ~50ms (cache hit), ~500ms (cache miss)
- **Throughput de Stream**: Ilimitado (pipe nativo)
- **Taxa de Cache Hit**: ~90% em uso normal

## 🔐 Segurança

### Implementações

1. **CORS**: Controla origens permitidas
2. **Timeout**: Evita DoS
3. **Validação**: Valida entrada de requisições
4. **Headers**: Define headers de segurança padrão

### Considerações

- Usar HTTPS em produção
- Limitar CORS a domínios específicos
- Implementar rate limiting (opcional)
- Usar API key para endpoints sensíveis (opcional)

## 🚀 Escalabilidade

### Limitações Atuais

- Single process (não distribuído)
- Cache em memória (não persistente)
- Sem load balancing

### Melhorias Futuras

1. **Clustering**: Usar `cluster` module do Node.js
2. **Cache Distribuído**: Redis para cache compartilhado
3. **Load Balancer**: Nginx/HAProxy na frente
4. **Monitoring**: Prometheus + Grafana
5. **CI/CD**: GitHub Actions ou similar

## 📝 Exemplo de Fluxo Completo

### Usuário abre o player

```
1. Frontend carrega
2. Requisição GET /api/health
   ├─ Backend verifica saúde
   ├─ Retorna status "healthy"
3. Requisição GET /api/metadata
   ├─ Backend verifica cache
   ├─ Cache vazio, busca API BRLOGIC
   ├─ Armazena em cache
   ├─ Retorna metadados
4. Frontend exibe nome da música
5. Usuário clica em "Play"
6. Requisição GET /api/stream
   ├─ Backend conecta a BRLOGIC
   ├─ Inicia pipe do stream
   ├─ Retorna stream de áudio
7. Frontend reproduz áudio
8. A cada 10s, requisição GET /api/metadata
   ├─ Backend retorna dados do cache
   ├─ Frontend atualiza metadados
```

## 🧪 Testes

### Teste Manual

```bash
# Verificar saúde
curl http://localhost:3000/api/health

# Obter metadados
curl http://localhost:3000/api/metadata

# Limpar cache
curl -X POST http://localhost:3000/api/cache/clear
```

### Teste Automatizado

```bash
node test-api.js
```

## 📚 Dependências

| Pacote | Versão | Propósito |
|--------|--------|----------|
| express | 4.18.2 | Framework web |
| axios | 1.6.0 | HTTP client |
| cors | 2.8.5 | CORS middleware |
| compression | 1.7.4 | Compressão de resposta |
| dotenv | 16.3.1 | Variáveis de ambiente |
| node-cache | 5.1.2 | Cache em memória |
| morgan | 1.10.0 | Logging de requisições |

## 🔄 Ciclo de Vida da Aplicação

```
1. Inicialização
   ├─ Carregar .env
   ├─ Carregar config.js
   ├─ Inicializar Express
   ├─ Configurar middleware
   ├─ Configurar rotas
   └─ Iniciar servidor

2. Operação Normal
   ├─ Receber requisições
   ├─ Processar via rotas
   ├─ Executar serviços
   ├─ Retornar respostas
   └─ Registrar logs

3. Encerramento Graceful
   ├─ Receber SIGTERM/SIGINT
   ├─ Parar de aceitar requisições
   ├─ Aguardar requisições ativas
   ├─ Fechar conexões
   └─ Sair do processo
```

## 📞 Suporte

Para dúvidas sobre a arquitetura, consultar:
- README.md - Documentação geral
- INTEGRATION_GUIDE.md - Integração com frontend
- Comentários no código

---

**Versão:** 1.0.0  
**Última atualização:** Abril 2024
