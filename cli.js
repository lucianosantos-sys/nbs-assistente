#!/usr/bin/env node

/**
 * Interface CLI do Agente Tributário de IA
 * Permite interações rápidas no terminal e modo interativo contínuo.
 */

const readline = require('readline');
const AgenteTributarioIA = require('./src/agente_ia');

const agente = new AgenteTributarioIA();

console.log("================================================================================");
console.log("🤖 AGENTE DE IA TRIBUTÁRIO - ORIENTADOR DE CÓDIGO NACIONAL & NBS");
console.log("   Base Integrada: LC 116/03 (ISS) x CNAE x NBS x IBS/CBS (LC 214/2025)");
console.log("================================================================================\n");

// Se passou argumento via linha de comando
const args = process.argv.slice(2);
if (args.length > 0) {
  const consulta = args.join(' ');
  console.log(`🔎 Analisando: "${consulta}"...\n`);
  const resposta = agente.responderConversacional(consulta);
  console.log(resposta);
  process.exit(0);
}

// Modo interativo via Readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("💬 Modo Interativo Ativado.");
console.log("Exemplos de perguntas que você pode fazer:");
console.log(" - 'Desenvolvi um software sob encomenda para um cliente'");
console.log(" - 'CNAE 62.01-5-01'");
console.log(" - 'NBS 1.1502.10.00'");
console.log(" - 'Consulta médica ambulatorial'");
console.log(" - 'Serviço de engenharia e acompanhamento de obra'");
console.log(" - Digite 'sair' para encerrar.\n");

function perguntar() {
  rl.question('\n👤 Cliente: ', (pergunta) => {
    if (!pergunta || pergunta.trim().toLowerCase() === 'sair') {
      console.log("\n👋 Até logo! Sempre à disposição para descomplicar a tributação.");
      rl.close();
      return;
    }

    console.log("\n🤖 Orientação Tributária:\n");
    const resposta = agente.responderConversacional(pergunta);
    console.log(resposta);
    perguntar();
  });
}

perguntar();
