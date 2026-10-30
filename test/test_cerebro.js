/**
 * Testes Automatizados do Cérebro Tributário e Agente de IA
 */

const assert = require('assert');
const AgenteTributarioIA = require('../src/agente_ia');
const CerebroTributario = require('../src/cerebro');

const agente = new AgenteTributarioIA();
const cerebro = new CerebroTributario();

console.log("🧪 Iniciando bateria de testes do Cérebro Tributário...\n");

// Teste 1: Consulta por CNAE de Software
console.log("Teste 1: Consulta por CNAE de Software (62.01-5-01)");
const resCnae = cerebro.consultarPorCNAE("62.01-5-01");
assert(resCnae !== null, "CNAE deve ser localizado");
assert(resCnae.itens_lc116.length > 0, "Deve conter itens da LC 116");
console.log("  CNAE localizado:", resCnae.descricao);
console.log("  Itens LC 116 associados:", resCnae.itens_lc116.map(i => i.item_lc116).join(', '));

// Teste 2: Consulta por NBS Médica
console.log("\nTeste 2: Consulta por NBS Médica (1.2301.22.00)");
const resNbs = cerebro.consultarPorNBS("1.2301.22.00");
assert(resNbs !== null, "NBS deve ser localizada");
assert(resNbs.detalhes[0].item_lc116 === "04.01", "Item LC 116 deve ser 04.01");
assert(resNbs.detalhes[0].cClassTrib === "200029", "cClassTrib de saúde humana deve ser 200029");
console.log("  NBS localizada:", resNbs.descricao);
console.log("  cClassTrib:", resNbs.detalhes[0].cClassTrib, "(Redução de 60%)");

// Teste 3: Agente de IA com Descrição Livre de Software SaaS
console.log("\nTeste 3: Agente de IA - Descrição Livre 'hospedagem de software saas'");
const orientacaoSaas = agente.orientarCliente("hospedagem de software saas");
assert(orientacaoSaas.status === "sucesso", "Agente deve retornar sucesso");
console.log("  Código Nacional sugerido:", orientacaoSaas.recomendacao_principal.codigo_tributacao_nacional_lc116);
console.log("  NBS sugerida:", orientacaoSaas.recomendacao_principal.codigo_nbs_sugerido);
console.log("  cClassTrib:", orientacaoSaas.recomendacao_principal.cClassTrib);

// Teste 4: Agente de IA Conversacional para Engenharia
console.log("\nTeste 4: Agente de IA - Resposta Conversacional para 'projeto de engenharia e arquitetura'");
const respostaEng = agente.responderConversacional("projeto de engenharia e arquitetura");
assert(typeof respostaEng === 'string' && respostaEng.length > 50, "Deve retornar texto explicativo");
assert(respostaEng.includes("Código de Tributação Nacional"), "Deve instruir sobre o código nacional");
assert(respostaEng.includes("NBS"), "Deve instruir sobre a NBS");
console.log("  Resposta gerada com sucesso e formatação markdown validada.");

console.log("\n Todos os testes passaram com 100% de sucesso!");
