const url = require('url');
const AgenteTributarioIA = require('../src/agente_ia');

const agente = new AgenteTributarioIA();

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url || '', true);
  const query = (req.query && req.query.q) || (parsedUrl.query && parsedUrl.query.q) || '';

  const orientacao = agente.orientarCliente(query);

  if (res.status && typeof res.json === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(orientacao);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(orientacao, null, 2));
  }
};
