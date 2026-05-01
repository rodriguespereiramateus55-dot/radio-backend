# Guia de Integração - Frontend Lovable + Backend BRLOGIC

Este guia detalha como integrar o backend da Rádio Nova Dimensão FM com seu frontend criado no Lovable.

## 🔗 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Lovable)                        │
│  - Interface do usuário                                      │
│  - Player de áudio visual                                    │
│  - Exibição de metadados                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  - Proxy de stream                                           │
│  - API de metadados                                          │
│  - Cache inteligente                                         │
│  - Health check                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           BRLOGIC (Servidor de Streaming)                    │
│  - servidor15-5.brlogic.com:7336                            │
│  - Stream de áudio ao vivo                                   │
│  - Metadados da transmissão                                  │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Integração no Frontend React/Vue/Angular

### 1. Configurar URL do Backend

Criar arquivo de configuração:

```javascript
// src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const ENDPOINTS = {
  metadata: `${API_BASE_URL}/api/metadata`,
  stream: `${API_BASE_URL}/api/stream`,
  health: `${API_BASE_URL}/api/health`,
  info: `${API_BASE_URL}/api/info`,
};
```

### 2. Criar Hook/Service para Metadados

**React (Hook):**

```javascript
// src/hooks/useRadioMetadata.js
import { useState, useEffect } from 'react';
import { ENDPOINTS } from '../config/api';

export function useRadioMetadata() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(ENDPOINTS.metadata);
        const data = await response.json();
        
        if (data.success) {
          setMetadata(data.data);
        } else {
          setError('Erro ao buscar metadados');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Buscar imediatamente
    fetchMetadata();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchMetadata, 10000);

    return () => clearInterval(interval);
  }, []);

  return { metadata, loading, error };
}
```

**Uso no componente:**

```javascript
// src/components/RadioPlayer.jsx
import { useRadioMetadata } from '../hooks/useRadioMetadata';
import { ENDPOINTS } from '../config/api';

export function RadioPlayer() {
  const { metadata, loading, error } = useRadioMetadata();

  return (
    <div className="player">
      {/* Player de Áudio */}
      <audio controls style={{ width: '100%' }}>
        <source src={ENDPOINTS.stream} type="audio/mpeg" />
        Seu navegador não suporta o elemento de áudio.
      </audio>

      {/* Metadados */}
      <div className="metadata">
        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : metadata ? (
          <>
            <h2>{metadata.currentTrack}</h2>
            <p>{metadata.artist}</p>
            {metadata.cover && (
              <img src={metadata.cover} alt="Capa" />
            )}
            <p className="listeners">
              👥 {metadata.listeners} ouvintes
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
```

### 3. Monitorar Saúde do Backend

```javascript
// src/hooks/useBackendHealth.js
import { useState, useEffect } from 'react';
import { ENDPOINTS } from '../config/api';

export function useBackendHealth() {
  const [health, setHealth] = useState(null);
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(ENDPOINTS.health);
        const data = await response.json();
        
        setHealth(data);
        setIsHealthy(data.success);
      } catch (err) {
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // A cada 30s

    return () => clearInterval(interval);
  }, []);

  return { health, isHealthy };
}
```

## 🌐 Variáveis de Ambiente

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=5000
```

### Backend (.env)

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://localhost:3000,https://seu-dominio.com
CACHE_TTL=30
```

## 🔐 CORS em Produção

Quando fazer deploy, atualizar CORS para aceitar apenas seu domínio:

```javascript
// config.js
cors: {
  origin: [
    'https://radionovadimensaofm.lovable.app',
    'https://seu-dominio-customizado.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
}
```

## 📡 Exemplos de Requisições

### cURL

```bash
# Obter metadados
curl http://localhost:3000/api/metadata

# Verificar saúde
curl http://localhost:3000/api/health

# Obter informações
curl http://localhost:3000/api/info
```

### JavaScript Fetch

```javascript
// Metadados
fetch('http://localhost:3000/api/metadata')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Stream
const audio = document.querySelector('audio');
audio.src = 'http://localhost:3000/api/stream';
audio.play();
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
});

// Metadados
api.get('/metadata').then(res => console.log(res.data.data));

// Health
api.get('/health').then(res => console.log(res.data.status));
```

## 🚀 Deploy Completo

### 1. Backend (Heroku/Railway/Render)

```bash
# Deploy no Heroku
heroku create seu-radio-backend
heroku config:set NODE_ENV=production
git push heroku main
```

### 2. Frontend (Lovable/Vercel/Netlify)

Atualizar variável de ambiente:

```env
REACT_APP_API_URL=https://seu-radio-backend.herokuapp.com
```

### 3. Configurar DNS (opcional)

Se usar domínio customizado:

```
backend.radionovadimensao.com.br → seu-radio-backend.herokuapp.com
```

## 🔄 Fluxo de Dados

### 1. Usuário Clica em "Play"

```
Frontend → Backend (/api/stream)
Backend → BRLOGIC (servidor15-5.brlogic.com:7336)
BRLOGIC → Backend (stream de áudio)
Backend → Frontend (proxy do stream)
```

### 2. Atualizar Metadados

```
Frontend → Backend (/api/metadata) [a cada 10s]
Backend → Cache (verifica)
Cache Hit → Backend → Frontend (instantâneo)
Cache Miss → Backend → BRLOGIC API
BRLOGIC API → Backend (metadados)
Backend → Cache (armazena)
Backend → Frontend (metadados)
```

## 🛠️ Troubleshooting de Integração

### Problema: CORS Error

**Solução:**
```javascript
// Verificar se CORS_ORIGIN está correto no backend
// Deve incluir o domínio do frontend
```

### Problema: Stream não funciona

**Solução:**
```javascript
// Verificar se o backend está rodando
fetch('http://seu-backend:3000/api/health')
  .then(res => res.json())
  .then(data => console.log(data.status));
```

### Problema: Metadados não atualizam

**Solução:**
```javascript
// Limpar cache do backend
fetch('http://seu-backend:3000/api/cache/clear', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data));
```

### Problema: Áudio com lag/buffering

**Solução:**
1. Aumentar `CACHE_TTL` no backend
2. Usar CDN para o stream
3. Verificar velocidade de conexão

## 📊 Monitoramento em Produção

### Verificar Status

```bash
# Health check
curl https://seu-backend.com/api/health

# Informações
curl https://seu-backend.com/api/info

# Estatísticas de cache
curl https://seu-backend.com/api/cache/stats
```

### Logs

Monitorar logs do backend:

```bash
# Heroku
heroku logs --tail

# Docker
docker logs -f container-id
```

## 🎯 Checklist de Integração

- [ ] Backend instalado e rodando localmente
- [ ] Frontend consegue acessar `/api/metadata`
- [ ] Frontend consegue acessar `/api/stream`
- [ ] Áudio toca corretamente
- [ ] Metadados atualizam a cada 10 segundos
- [ ] Health check retorna status "healthy"
- [ ] CORS configurado corretamente
- [ ] Backend deployado em produção
- [ ] Frontend aponta para URL correta do backend
- [ ] Testes em diferentes navegadores

## 📞 Suporte

Para problemas de integração, verificar:

1. Logs do backend
2. Console do navegador (DevTools)
3. Network tab (requisições HTTP)
4. Endpoint `/api/health` para status

---

**Última atualização:** Abril 2024
