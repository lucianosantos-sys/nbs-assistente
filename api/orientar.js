const AgenteTributarioIA = require('../src/agente_ia');

const agente = new AgenteTributarioIA();

module.exports = (req, res) => {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query && req.query.q) || '';
  const orientacao = agente.orientarCliente(query);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(orientacao);
};
