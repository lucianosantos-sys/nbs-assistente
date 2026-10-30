/**
 * SERVIDOR WEB E API REST DO AGENTE TRIBUTÁRIO DE IA
 * Servidor leve sem dependências externas (usa apenas http e fs nativos do Node.js).
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const AgenteTributarioIA = require('./src/agente_ia');

const agente = new AgenteTributarioIA();
const PORT = process.env.PORT || 3000;

const htmlInterface = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const cleanPath = (parsedUrl.pathname || '').replace(/^\/public/, '');

  // Endpoint da API: /api/orientar?q=...
  if (cleanPath === '/api/orientar' || cleanPath.startsWith('/api/orientar')) {
    const q = parsedUrl.query.q || '';
    const orientacao = agente.orientarCliente(q);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(orientacao, null, 2));
  }

  // Página HTML principal
  if (cleanPath === '/' || cleanPath === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(htmlInterface);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Página não encontrada.');
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🌐 Servidor do Agente Tributário de IA ativo na porta ${PORT}`);
    console.log(`👉 Acesse no navegador: http://localhost:${PORT}`);
    console.log(`📡 API REST disponível em: http://localhost:${PORT}/api/orientar?q=sua_consulta`);
  });
}

module.exports = server;
