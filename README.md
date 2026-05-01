# Rádio Nova Dimensão FM - Backend

Backend profissional para a Rádio Nova Dimensão FM com integração completa à plataforma BRLOGIC. Sistema robusto, resiliente e pronto para produção.

## 🎯 Características

- **Proxy de Áudio Inteligente**: Transmissão de áudio com retry automático e tratamento de falhas
- **API de Metadados**: Busca em tempo real de informações da música (nome, artista, capa)
- **Sistema de Cache**: Cache inteligente com TTL configurável para otimizar performance
- **Health Check**: Monitoramento contínuo da saúde do serviço
- **CORS Habilitado**: Integração perfeita com frontends modernos
- **Logging Completo**: Rastreamento detalhado de todas as operações
- **Graceful Shutdown**: Encerramento elegante do servidor
- **Tratamento de Erros**: Sistema robusto de tratamento de exceções

## 📋 Requisitos

- Node.js 14+ 
- npm ou yarn
- Acesso à internet (para conectar à BRLOGIC)

## 🚀 Instalação

### 1. Clonar ou copiar o projeto

```bash
cd /home/ubuntu/radio-backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Editar o arquivo `.env` com suas configurações:

```bash
cp .env.example .env
nano .env
```

**Variáveis principais:**

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `NODE_ENV` | Ambiente (development/production) | production |
| `STREAMING_URL` | URL do stream BRLOGIC | https://servidor15-5.brlogic.com:7336/live |
| `METADATA_API_URL` | URL da API de metadados | https://d36nr0u3xmc4mm.cloudfront.net/... |
| `CACHE_TTL` | Tempo de cache em segundos | 30 |
| `CORS_ORIGIN` | Origem CORS permitida | * |

## 🏃 Executar

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

O servidor iniciará na porta configurada (padrão: 3000)

## 📡 Endpoints da API

### 1. **GET /api/metadata**

Retorna os metadados atuais da rádio.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "currentTrack": "Nome da Música",
    "artist": "Nome do Artista",
    "cover": "URL da capa",
    "listeners": 150,
    "bitrate": "128 kbps",
    "sampleRate": "44.1 kHz",
    "timestamp": "2024-04-28T11:00:00.000Z",
    "isStale": false
  },
  "timestamp": "2024-04-28T11:00:00.000Z"
}
```

### 2. **GET /api/stream**

Proxy do stream de áudio. Conectar um elemento `<audio>` a este endpoint.

**Uso no Frontend:**
```html
<audio controls>
  <source src="http://seu-backend:3000/api/stream" type="audio/mpeg">
</audio>
```

### 3. **GET /api/health**

Verifica a saúde do serviço.

**Resposta (Healthy):**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "stream": {
      "isHealthy": true,
      "statusCode": 200,
      "contentType": "audio/mpeg"
    },
    "metadata": {
      "isAvailable": true,
      "isStale": false
    }
  },
  "timestamp": "2024-04-28T11:00:00.000Z"
}
```

### 4. **GET /api/info**

Informações sobre o backend.

**Resposta:**
```json
{
  "success": true,
  "service": "Rádio Nova Dimensão FM Backend",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600
}
```

### 5. **GET /api/cache/stats**

Estatísticas do cache (desenvolvimento).

**Resposta:**
```json
{
  "success": true,
  "cache": {
    "keys": ["metadata"],
    "stats": {
      "ksize": 1,
      "vsize": 512,
      "hits": 45,
      "misses": 5
    }
  }
}
```

### 6. **POST /api/cache/clear**

Limpa o cache (desenvolvimento).

**Resposta:**
```json
{
  "success": true,
  "message": "Cache limpo com sucesso"
}
```

## 🔌 Integração com Frontend

### React/Vue/Angular

```javascript
// Buscar metadados
async function getMetadata() {
  const response = await fetch('http://seu-backend:3000/api/metadata');
  const data = await response.json();
  return data.data;
}

// Usar stream
const audioElement = document.querySelector('audio');
audioElement.src = 'http://seu-backend:3000/api/stream';
```

### HTML Simples

```html
<div id="player">
  <audio id="radioPlayer" controls>
    <source src="http://seu-backend:3000/api/stream" type="audio/mpeg">
  </audio>
  
  <div id="metadata">
    <p id="track">Carregando...</p>
    <p id="artist">Rádio Nova Dimensão FM</p>
  </div>
</div>

<script>
  async function updateMetadata() {
    const response = await fetch('http://seu-backend:3000/api/metadata');
    const data = await response.json();
    
    document.getElementById('track').textContent = data.data.currentTrack;
    document.getElementById('artist').textContent = data.data.artist;
  }
  
  // Atualizar a cada 10 segundos
  setInterval(updateMetadata, 10000);
  updateMetadata(); // Primeira execução
</script>
```

## 🛡️ Tratamento de Falhas

O backend implementa vários mecanismos de resiliência:

### 1. **Retry Automático**
- Tenta reconectar ao stream até 3 vezes com backoff exponencial
- Aguarda progressivamente mais tempo entre tentativas

### 2. **Cache com Fallback**
- Armazena metadados em cache por 30 segundos
- Se a API falhar, retorna dados em cache mesmo que expirados
- Marca dados como "stale" para o frontend tratar

### 3. **Dados Padrão**
- Se tudo falhar, retorna dados padrão da rádio
- Garante que o frontend nunca receba um erro completo

### 4. **Health Check**
- Monitora continuamente a saúde do stream
- Endpoint `/api/health` fornece status em tempo real

## 📊 Monitoramento

### Logs

O servidor registra todas as operações importantes:

```
[MetadataService] Buscando metadados da API BRLOGIC...
[StreamService] Tentativa 1/3 de conexão ao stream...
[StreamService] Stream conectado com sucesso
[API] Requisição de metadata recebida
```

### Métricas

Acessar `/api/cache/stats` para ver:
- Número de hits/misses do cache
- Tamanho dos dados em cache
- Chaves armazenadas

## 🔐 Segurança

- CORS configurável (padrão: aceita todas as origens)
- Headers de segurança padrão
- Timeout em requisições (5-10 segundos)
- Validação de entrada

## 📦 Estrutura do Projeto

```
radio-backend/
├── server.js              # Servidor principal
├── config.js              # Configurações centralizadas
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente
├── .gitignore             # Git ignore
├── README.md              # Esta documentação
├── services/
│   ├── metadataService.js # Serviço de metadados
│   └── streamService.js   # Serviço de stream
└── routes/
    └── api.js             # Rotas da API
```

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED"
- Verificar se a URL de streaming está correta
- Verificar conexão de internet
- Verificar se a BRLOGIC está online

### Erro: "CORS error"
- Verificar variável `CORS_ORIGIN` no `.env`
- Usar `*` para aceitar todas as origens (desenvolvimento)
- Especificar domínio específico em produção

### Erro: "Timeout"
- Aumentar `timeout` em `config.js`
- Verificar velocidade de conexão
- Verificar se a BRLOGIC está respondendo lentamente

### Cache não funciona
- Verificar `CACHE_TTL` no `.env`
- Usar `/api/cache/clear` para limpar manualmente
- Verificar logs para erros

## 🚀 Deploy

### Heroku

```bash
# 1. Criar app
heroku create seu-app-name

# 2. Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# 3. Deploy
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t radio-backend .
docker run -p 3000:3000 --env-file .env radio-backend
```

## 📝 Licença

MIT

## 👨‍💻 Suporte

Para problemas ou sugestões, entre em contato com o time de desenvolvimento da Rádio Nova Dimensão FM.

---

**Versão:** 1.0.0  
**Última atualização:** Abril 2024  
**Status:** ✅ Pronto para Produção
