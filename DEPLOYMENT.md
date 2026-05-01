# Guia de Deployment - Rádio Nova Dimensão FM Backend

Instruções passo a passo para fazer deploy do backend em diferentes plataformas.

## 🚀 Opção 1: Heroku (Recomendado para Iniciantes)

### Pré-requisitos

- Conta no [Heroku](https://www.heroku.com)
- Heroku CLI instalado
- Git instalado

### Passos

#### 1. Fazer login no Heroku

```bash
heroku login
```

#### 2. Criar aplicação

```bash
heroku create seu-radio-backend
```

#### 3. Configurar variáveis de ambiente

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
heroku config:set CORS_ORIGIN=https://radionovadimensaofm.lovable.app
heroku config:set CACHE_TTL=30
```

#### 4. Deploy

```bash
git push heroku main
```

#### 5. Verificar logs

```bash
heroku logs --tail
```

#### 6. Acessar aplicação

```
https://seu-radio-backend.herokuapp.com/api/health
```

### Custo

- Dyno gratuito: Até 550 horas/mês
- Dyno pago: $7/mês (sempre ativo)

---

## 🚀 Opção 2: Railway (Moderno e Fácil)

### Pré-requisitos

- Conta no [Railway](https://railway.app)
- GitHub conectado

### Passos

#### 1. Conectar repositório

1. Ir para [railway.app](https://railway.app)
2. Clicar em "New Project"
3. Selecionar "Deploy from GitHub"
4. Autorizar e selecionar repositório

#### 2. Configurar variáveis

No dashboard do Railway:
- Clicar em "Variables"
- Adicionar:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `CORS_ORIGIN=https://radionovadimensaofm.lovable.app`

#### 3. Deploy automático

Railway faz deploy automaticamente a cada push no GitHub

#### 4. Obter URL

Na aba "Deployments", copiar URL pública

### Custo

- Crédito inicial: $5
- Após esgotar: $5/mês para continuar

---

## 🚀 Opção 3: Render (Alternativa Gratuita)

### Pré-requisitos

- Conta no [Render](https://render.com)
- GitHub conectado

### Passos

#### 1. Criar novo serviço

1. Ir para [render.com](https://render.com)
2. Clicar em "New +"
3. Selecionar "Web Service"
4. Conectar GitHub

#### 2. Configurar

- **Name:** seu-radio-backend
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

#### 3. Adicionar variáveis

Environment variables:
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://radionovadimensaofm.lovable.app
```

#### 4. Deploy

Clicar em "Create Web Service"

### Custo

- Gratuito: Dorme após 15 min inatividade
- Pago: $7/mês (sempre ativo)

---

## 🐳 Opção 4: Docker + VPS (Controle Total)

### Pré-requisitos

- VPS com Ubuntu 20.04+
- Docker instalado
- Docker Compose (opcional)

### Passos

#### 1. Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar
CMD ["npm", "start"]
```

#### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  radio-backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CORS_ORIGIN=https://radionovadimensaofm.lovable.app
      - CACHE_TTL=30
    restart: unless-stopped
    networks:
      - radio-network

networks:
  radio-network:
    driver: bridge
```

#### 3. Build e run

```bash
# Build
docker build -t radio-backend .

# Run
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://radionovadimensaofm.lovable.app \
  --name radio-backend \
  radio-backend

# Ou com docker-compose
docker-compose up -d
```

#### 4. Verificar status

```bash
docker ps
docker logs radio-backend
```

### Custo

- VPS: $2-5/mês (DigitalOcean, Linode, etc)

---

## 🔄 CI/CD com GitHub Actions

### Arquivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
        heroku_app_name: seu-radio-backend
        heroku_email: seu-email@example.com
```

### Configurar secrets

1. Ir para Settings → Secrets
2. Adicionar `HEROKU_API_KEY`
3. Obter chave em Heroku Account Settings

---

## 🔒 SSL/HTTPS

### Opção 1: Heroku (Automático)

Heroku fornece SSL gratuito automaticamente.

### Opção 2: Let's Encrypt + Nginx

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Configurar Nginx
sudo nano /etc/nginx/sites-available/default
```

**Configuração Nginx:**

```nginx
upstream backend {
    server localhost:3000;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Monitoramento em Produção

### Heroku

```bash
# Ver logs em tempo real
heroku logs --tail

# Ver métricas
heroku metrics
```

### Docker

```bash
# Ver logs
docker logs -f radio-backend

# Ver recursos
docker stats radio-backend
```

### Uptime Monitoring

Usar serviços como:
- [UptimeRobot](https://uptimerobot.com) - Gratuito
- [Pingdom](https://www.pingdom.com) - Pago
- [StatusCake](https://www.statuscake.com) - Gratuito/Pago

**Configurar para monitorar:**
```
https://seu-backend.com/api/health
```

---

## 🔄 Auto-Scaling

### Heroku

```bash
# Escalar dynos
heroku ps:scale web=2

# Ver dynos
heroku ps
```

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy com replicação
docker service create \
  --replicas 3 \
  -p 3000:3000 \
  --name radio-backend \
  radio-backend
```

---

## 🔐 Variáveis de Ambiente em Produção

### Checklist

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (ou porta do serviço)
- [ ] `CORS_ORIGIN=https://seu-dominio.com`
- [ ] `CACHE_TTL=30`
- [ ] URLs de streaming corretas
- [ ] URLs de API corretas

### Exemplo Completo

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://radionovadimensaofm.lovable.app,https://seu-dominio.com
STREAMING_ADDRESS=servidor15-5.brlogic.com
STREAMING_PORT=7336
STREAMING_URL=https://servidor15-5.brlogic.com:7336/live
METADATA_API_URL=https://d36nr0u3xmc4mm.cloudfront.net/index.php/api/streaming/status/7336/462ce38232ee935a652da74e2025766b/SV28BR
CACHE_TTL=30
LOG_LEVEL=info
```

---

## 🧪 Teste Pós-Deploy

### Verificar Saúde

```bash
curl https://seu-backend.com/api/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "stream": { "isHealthy": true },
    "metadata": { "isAvailable": true }
  }
}
```

### Testar Metadados

```bash
curl https://seu-backend.com/api/metadata
```

### Testar Stream

```bash
# Verificar se stream está acessível
curl -I https://seu-backend.com/api/stream
```

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
npm install

# Limpar cache
npm cache clean --force
```

### Erro: "Port already in use"

```bash
# Mudar porta em .env
PORT=3001
```

### Erro: "CORS error"

```bash
# Verificar CORS_ORIGIN
# Deve incluir domínio do frontend
```

### Erro: "Stream connection refused"

```bash
# Verificar se BRLOGIC está online
# Verificar URLs em config.js
```

---

## 📈 Performance em Produção

### Otimizações

1. **Usar CDN** para assets estáticos
2. **Habilitar compressão** (já habilitado)
3. **Configurar cache** adequadamente
4. **Monitorar logs** regularmente
5. **Fazer backup** de configurações

### Benchmarks

- **Latência de Metadados**: ~50ms (cache hit)
- **Throughput de Stream**: Ilimitado
- **Disponibilidade**: 99.9%+

---

## 🔄 Atualizações e Manutenção

### Atualizar Dependências

```bash
npm update
npm audit fix
```

### Fazer Deploy de Atualização

```bash
# Commit e push
git add .
git commit -m "Update dependencies"
git push

# Heroku faz deploy automaticamente
# Ou manual:
git push heroku main
```

### Rollback

```bash
# Ver histórico
heroku releases

# Reverter para versão anterior
heroku rollback
```

---

## 📞 Suporte

Para problemas de deployment:

1. Verificar logs
2. Consultar documentação da plataforma
3. Verificar variáveis de ambiente
4. Testar localmente antes de fazer deploy

---

**Versão:** 1.0.0  
**Última atualização:** Abril 2024
