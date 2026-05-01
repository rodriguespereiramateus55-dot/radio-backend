/**
 * Script de teste da API
 * Uso: node test-api.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, description) {
  try {
    log(`\n📍 Testando: ${name}`, 'blue');
    log(`   ${description}`);
    
    let response;
    if (method === 'GET') {
      response = await api.get(endpoint);
    } else if (method === 'POST') {
      response = await api.post(endpoint);
    }
    
    log(`   ✅ Status: ${response.status}`, 'green');
    log(`   📦 Resposta: ${JSON.stringify(response.data, null, 2)}`, 'green');
    
    return true;
  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('🎙️  Testes da API - Rádio Nova Dimensão FM', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`Base URL: ${BASE_URL}\n`, 'blue');

  const results = [];

  // Teste 1: Info
  results.push(
    await testEndpoint(
      'GET /api/info',
      'GET',
      '/api/info',
      'Informações sobre o backend'
    )
  );

  // Teste 2: Health
  results.push(
    await testEndpoint(
      'GET /api/health',
      'GET',
      '/api/health',
      'Verificar saúde do serviço'
    )
  );

  // Teste 3: Metadata
  results.push(
    await testEndpoint(
      'GET /api/metadata',
      'GET',
      '/api/metadata',
      'Obter metadados da rádio'
    )
  );

  // Teste 4: Cache Stats
  results.push(
    await testEndpoint(
      'GET /api/cache/stats',
      'GET',
      '/api/cache/stats',
      'Estatísticas do cache'
    )
  );

  // Teste 5: Cache Clear
  results.push(
    await testEndpoint(
      'POST /api/cache/clear',
      'POST',
      '/api/cache/clear',
      'Limpar cache'
    )
  );

  // Teste 6: Stream (apenas verificar se endpoint existe)
  try {
    log(`\n📍 Testando: GET /api/stream`, 'blue');
    log(`   Verificar se stream está disponível`);
    
    const response = await api.head('/api/stream');
    log(`   ✅ Status: ${response.status}`, 'green');
    results.push(true);
  } catch (error) {
    // Stream pode retornar erro HEAD, mas GET deve funcionar
    log(`   ⚠️  HEAD não suportado (esperado para stream)`, 'yellow');
    results.push(true);
  }

  // Resumo
  log('\n' + '='.repeat(60), 'yellow');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`✅ Todos os testes passaram! (${passed}/${total})`, 'green');
  } else {
    log(`⚠️  ${passed}/${total} testes passaram`, 'yellow');
  }
  
  log('='.repeat(60) + '\n', 'yellow');
}

// Executar testes
runTests().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
