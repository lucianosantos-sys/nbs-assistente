# 🧠 NBS ASSISTENTE - CÉREBRO TRIBUTÁRIO & AGENTE DE IA

> Sistema inteligente de correlação e orientação fiscal: **CNAE x Item LC 116 (Código de Tributação Nacional) x NBS (Nomenclatura Brasileira de Serviços) x Reforma Tributária IBS/CBS (LC 214/2025)**.

---

## 🎯 Objetivo do Projeto

Com a transição para a **NFS-e Padrão Nacional** e as regras da **Reforma Tributária (Lei Complementar nº 214/2025)**, as empresas e contadores enfrentam o desafio diário de preencher corretamente:
1. **Código de Tributação Nacional** (Item da LC 116/2003);
2. **Código NBS** (Nomenclatura Brasileira de Serviços);
3. **Classificação Tributária Nacional (cClassTrib)**;
4. **CST do IBS/CBS** (000, 200, 400, 410, etc.);
5. **Local de Incidência** (Regra de destino vs estabelecimento prestador);
6. **Alíquota e Regimes de Redução** (ex: redução de 60% para saúde e educação, alíquota zero, etc.).

Este projeto consolida todos os dados em **arquivos JSON estruturados e indexados**, acompanhados de um **Agente de IA Especialista** que guia os clientes passo a passo na emissão dos documentos fiscais sem erros.

---

## 📂 Bases de Dados Geradas em JSON (`/data`)

| Arquivo | Descrição |
|---|---|
| [`data/cnae_lc116.json`](./data/cnae_lc116.json) | Tabela oficial de correlação **CNAE x Item LC 116**, alíquotas de ISS, retenção na fonte e domicílio fiscal. |
| [`data/lc116_nbs_reforma.json`](./data/lc116_nbs_reforma.json) | Correlação de cada **Item da LC 116** para códigos **NBS**, INDOP, Local de Incidência do IBS e cClassTrib. |
| [`data/cst_cclasstrib.json`](./data/cst_cclasstrib.json) | Tabela completa de **CSTs do IBS/CBS**, códigos `cClassTrib`, alíquotas reduzidas (60%, 40%, 30%, zero), artigos da LC 214/25 e flags de documentos eletrônicos (NF-e, NFS-e, etc.). |
| [`data/cerebro_tributario_completo.json`](./data/cerebro_tributario_completo.json) | **O Grafo Unificado Completo**: Conecta CNAE ➡️ Item LC 116 ➡️ NBS ➡️ cClassTrib ➡️ CST IBS/CBS em uma única base relacional. |

---

## 🤖 Como Utilizar o Agente de IA

### 1. Linha de Comando (CLI Rápido)
Você pode fazer perguntas diretamente no terminal:

```bash
# Consulta por descrição livre do serviço:
node cli.js "desenvolvimento de software saas"

# Consulta por código CNAE da empresa:
node cli.js "62.01-5-01"

# Consulta por código NBS:
node cli.js "1.2301.22.00"
```

### 2. Modo Chat Interativo no Terminal
Execute sem argumentos para abrir o assistente conversacional contínuo:
```bash
npm start
# ou: node cli.js
```

### 3. Interface Visual e API REST Web
Inicie o servidor integrado (sem dependências externas):
```bash
node server.js
```
Acesse no navegador: **`http://localhost:3000`**

A **API REST** fica disponível em:
```
GET /api/orientar?q=desenvolvimento+de+software
```

### 4. Uso Programático em Node.js
```javascript
const AgenteTributarioIA = require('./src/agente_ia');

const agente = new AgenteTributarioIA();

// Resposta estruturada (JSON)
const orientacao = agente.orientarCliente("clinica medica consultas");
console.log(orientacao.recomendacao_principal);

// Resposta didática formatada em Markdown para o usuário final
const textoFormatado = agente.responderConversacional("62.01-5-01");
console.log(textoFormatado);
```

---

## 🧪 Testes Automatizados

Para rodar a bateria de testes e conferir a integridade das regras:
```bash
npm test
```

---

## ⚖️ Fundamentação Legal
- **Lei Complementar nº 116/2003** (Normas gerais do ISSQN e Lista de Serviços);
- **Lei Complementar nº 214/2025** (Instituição e regulamentação do IBS e CBS - Reforma Tributária);
- **Nomenclatura Brasileira de Serviços (NBS)** (Decreto nº 7.708/2012 e atualizações);
- **Classificação Nacional de Atividades Econômicas (CNAE 2.3 - IBGE/Concla)**.
