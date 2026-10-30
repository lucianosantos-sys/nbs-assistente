/**
 * AGENTE DE IA ESPECIALISTA EM TRIBUTAÇÃO NACIONAL E NBS
 * Assistente inteligente para guiar clientes no preenchimento de documentos fiscais
 * (NFS-e Nacional, NF-e, NFCom, EFD) com as regras da LC 116/2003 e Reforma Tributária (LC 214/2025).
 */

const CerebroTributario = require('./cerebro');

class AgenteTributarioIA {
  constructor() {
    this.cerebro = new CerebroTributario();
    this.nome = "TributaIA - Assistente Nacional de NBS & LC 116";
    this.versao = "2.0";
  }

  /**
   * Ponto de entrada principal: Analisa a solicitação do cliente em linguagem natural
   * ou parâmetros técnicos e gera um Parecer Didático de Preenchimento.
   */
  orientarCliente(input) {
    if (!input || input.trim().length === 0) {
      return {
        status: "erro",
        mensagem: "Por favor, informe a descrição do serviço prestado, seu CNAE ou o código NBS para que eu possa orientá-lo."
      };
    }

    const textoLimpo = input.trim();

    // 1. Consulta por Item LC 116 direto (ex: 01.01, 1.01, 04.01, etc.)
    if (/^(item\s*)?\d{1,2}\.\d{2}$/i.test(textoLimpo)) {
      const resItem = this.cerebro.consultarPorItemLC116(textoLimpo);
      if (resItem) {
        return this.formatarOrientacaoPorItemLC116(resItem);
      }
    }

    // 2. Consulta por CNAE (ex: 62.01-5-01 ou 6201501)
    if (/^\d{2}\.?\d{2}-?\d-?\d{2}$/.test(textoLimpo) || (/^\d{7}$/.test(textoLimpo) && !textoLimpo.startsWith('1'))) {
      const resultadoCnae = this.cerebro.consultarPorCNAE(textoLimpo);
      if (resultadoCnae) {
        return this.formatarOrientacaoPorCNAE(resultadoCnae);
      }
    }

    // 3. Consulta por NBS (ex: 1.1502.10.00 ou 115021000)
    if (/^1\.?\d{4}\.?\d{2}\.?\d{2}$/.test(textoLimpo) || (/^\d{9}$/.test(textoLimpo) && textoLimpo.startsWith('1'))) {
      const resultadoNbs = this.cerebro.consultarPorNBS(textoLimpo);
      if (resultadoNbs) {
        return this.formatarOrientacaoPorNBS(resultadoNbs);
      }
    }

    // 4. Consulta em Linguagem Natural / Descrição do Serviço
    const busca = this.cerebro.buscarServico(textoLimpo);
    if (!busca || busca.length === 0) {
      return {
        status: "nao_encontrado",
        mensagem: `Não encontrei correspondência exata para "${input}". Tente buscar por palavras-chave (ex: "software", "médico", "obras", "contabilidade", "advocacia") ou informe o CNAE.`
      };
    }

    return this.formatarOrientacaoPorBusca(textoLimpo, busca);
  }

  /**
   * Formata orientação quando o cliente pesquisa diretamente pelo Item da LC 116
   */
  formatarOrientacaoPorItemLC116(dadosItem) {
    const nbsLista = dadosItem.nbs_associadas || [];
    const nbsPrincipal = nbsLista[0] || {};
    const ref = nbsPrincipal.tributacao_reforma || {};

    return {
      status: "sucesso",
      modo: "consulta_lc116",
      codigo_tributacao_nacional_lc116: dadosItem.item_lc116,
      descricao_item_lc116: dadosItem.descricao,
      recomendacao_principal: {
        codigo_tributacao_nacional_lc116: dadosItem.item_lc116,
        descricao_item_lc116: dadosItem.descricao,
        codigo_nbs_sugerido: nbsPrincipal.codigo_nbs || "N/A",
        descricao_nbs: nbsPrincipal.descricao_nbs || "N/A",
        cClassTrib: nbsPrincipal.cClassTrib_padrao || "000001",
        cClassTrib_nome: nbsPrincipal.nome_cClassTrib || "Tributação integral",
        cst_ibs_cbs: ref.cst || "000",
        local_incidencia_reforma: nbsPrincipal.local_incidencia_ibs || "Domicílio principal do adquirente",
        regras_beneficio_reforma: {
          reducao_ibs: ref.reducao_percentual?.ibs || 0,
          reducao_cbs: ref.reducao_percentual?.cbs || 0,
          tipo_aliquota: ref.tipo_aliquota || "Padrão",
          fundamento_legal: ref.artigo_lc214 || "LC 214/2025"
        }
      },
      guia_de_preenchimento: [
        `1. No campo 'Código de Tributação Nacional' (Item da LC 116): Preencha '${dadosItem.item_lc116}'`,
        `2. No campo 'Código NBS': Utilize '${nbsPrincipal.codigo_nbs}' - ${nbsPrincipal.descricao_nbs}`,
        `3. No campo 'cClassTrib': Utilize '${nbsPrincipal.cClassTrib_padrao || "000001"}'`,
        `4. No campo 'CST IBS/CBS': Preencha '${ref.cst || "000"}'`,
        `5. Local de Incidência (Reforma): ${nbsPrincipal.local_incidencia_ibs || "Domicílio do adquirente"}`
      ],
      opcoes_alternativas: nbsLista.slice(1).map(n => ({
        nbs: n.codigo_nbs,
        descricao: n.descricao_nbs,
        item_lc116: dadosItem.item_lc116
      }))
    };
  }

  /**
   * Formata a recomendação para o cliente baseada em busca semântica
   */
  formatarOrientacaoPorBusca(termo, resultados) {
    const melhorOpcao = resultados[0];
    const outrasOpcoes = resultados.slice(1, 4);

    let orientacao = {
      status: "sucesso",
      consulta: termo,
      recomendacao_principal: {
        codigo_tributacao_nacional_lc116: melhorOpcao.item_lc116,
        descricao_item_lc116: melhorOpcao.item_lc116_descricao,
        codigo_nbs_sugerido: melhorOpcao.nbs || (melhorOpcao.nbs_compativeis && melhorOpcao.nbs_compativeis[0]?.codigo_nbs) || "Consulte as opções",
        descricao_nbs: melhorOpcao.nbs_descricao || (melhorOpcao.nbs_compativeis && melhorOpcao.nbs_compativeis[0]?.descricao_nbs) || "",
        cClassTrib: melhorOpcao.cClassTrib || (melhorOpcao.regras_reforma?.cClassTrib) || "000001",
        cClassTrib_nome: melhorOpcao.cClassTrib_nome || (melhorOpcao.regras_reforma?.nome) || "Situações tributadas integralmente pelo IBS e CBS",
        cst_ibs_cbs: melhorOpcao.regras_reforma?.cst || "000",
        local_incidencia_reforma: melhorOpcao.local_incidencia_ibs || "Domicílio principal do adquirente (Destino)",
        regras_beneficio_reforma: {
          reducao_ibs: melhorOpcao.regras_reforma?.reducao_percentual?.ibs || 0,
          reducao_cbs: melhorOpcao.regras_reforma?.reducao_percentual?.cbs || 0,
          tipo_aliquota: melhorOpcao.regras_reforma?.tipo_aliquota || "Padrão",
          fundamento_legal: melhorOpcao.regras_reforma?.artigo_lc214 || "LC 214/2025"
        }
      },
      guia_de_preenchimento: [
        `1. No campo 'Código de Tributação Nacional' (Item da LC 116): Selecione '${melhorOpcao.item_lc116}'`,
        `2. No campo 'Código NBS': Preencha '${melhorOpcao.nbs || (melhorOpcao.nbs_compativeis && melhorOpcao.nbs_compativeis[0]?.codigo_nbs)}'`,
        `3. No campo 'Classificação Tributária IBS/CBS (cClassTrib)': Utilize '${melhorOpcao.cClassTrib || "000001"}'`,
        `4. No campo 'CST IBS/CBS': Informe '${melhorOpcao.regras_reforma?.cst || "000"}'`,
        `5. Atenção ao Local de Incidência: Pela Reforma Tributária (LC 214/2025), este serviço é tributado no ${melhorOpcao.local_incidencia_ibs || "Domicílio do Adquirente"}.`
      ],
      opcoes_alternativas: outrasOpcoes.map(op => ({
        item_lc116: op.item_lc116,
        nbs: op.nbs || (op.nbs_compativeis && op.nbs_compativeis[0]?.codigo_nbs),
        descricao: op.nbs_descricao || op.item_lc116_descricao
      }))
    };

    return orientacao;
  }

  /**
   * Formata orientação quando o cliente fornece o CNAE da sua empresa
   */
  formatarOrientacaoPorCNAE(dadosCnae) {
    const itens = dadosCnae.itens_lc116 || [];
    const primeiroItem = itens[0] || {};
    const nbsLista = primeiroItem.nbs_disponiveis || [];
    const nbsPrincipal = nbsLista[0] || {};

    return {
      status: "sucesso",
      modo: "consulta_cnae",
      cnae_consultado: dadosCnae.cnae,
      descricao_empresa: dadosCnae.descricao,
      resumo_orientacao: {
        codigo_tributacao_nacional_lc116: primeiroItem.item_lc116,
        descricao_servico: primeiroItem.item_descricao,
        aliquota_iss_vigente: primeiroItem.aliquota_iss,
        local_iss_atual: primeiroItem.iss_devido_local_prestacao ? "Devido no local da prestação (fora do município)" : "Devido no estabelecimento prestador",
        nbs_padrao_sugerida: nbsPrincipal.codigo_nbs || "N/A",
        descricao_nbs: nbsPrincipal.descricao_nbs || "N/A",
        reforma_tributaria: {
          cClassTrib: nbsPrincipal.cClassTrib_padrao || "000001",
          nome_classificacao: nbsPrincipal.nome_cClassTrib || "Tributação integral",
          cst_ibs_cbs: nbsPrincipal.tributacao_reforma?.cst || "000",
          local_incidencia_ibs: nbsPrincipal.local_incidencia_ibs || "Domicílio do adquirente",
          reducao: nbsPrincipal.tributacao_reforma?.reducao_percentual || { ibs: 0, cbs: 0 }
        }
      },
      todas_nbs_compativeis_com_este_cnae: nbsLista.map(n => ({
        codigo_nbs: n.codigo_nbs,
        descricao: n.descricao_nbs,
        cClassTrib: n.cClassTrib_padrao,
        local_incidencia: n.local_incidencia_ibs
      })),
      passo_a_passo_emissao_nota: [
        `Passo 1: Selecione o Código de Tributação Nacional '${primeiroItem.item_lc116}' correspondente a '${primeiroItem.item_descricao}'.`,
        `Passo 2: Escolha a NBS adequada ao serviço executado (Recomendado: '${nbsPrincipal.codigo_nbs} - ${nbsPrincipal.descricao_nbs}').`,
        `Passo 3: Pela Reforma Tributária (LC 214/2025), classifique o cClassTrib como '${nbsPrincipal.cClassTrib_padrao || "000001"}' e CST '${nbsPrincipal.tributacao_reforma?.cst || "000"}'.`
      ]
    };
  }

  /**
   * Formata orientação quando o cliente já possui um código NBS e quer saber o código nacional e enquadramento
   */
  formatarOrientacaoPorNBS(dadosNbs) {
    const primeiroDetalhe = dadosNbs.detalhes[0] || {};
    const ref = primeiroDetalhe.reforma_tributaria || {};

    return {
      status: "sucesso",
      modo: "consulta_nbs",
      codigo_nbs: dadosNbs.codigo_nbs,
      descricao_nbs: dadosNbs.descricao,
      enquadramento: {
        codigo_tributacao_nacional_lc116: primeiroDetalhe.item_lc116,
        descricao_item_lc116: primeiroDetalhe.item_descricao,
        cClassTrib: primeiroDetalhe.cClassTrib,
        nome_cClassTrib: primeiroDetalhe.nome_cClassTrib,
        cst_ibs_cbs: ref.cst || "000",
        tipo_aliquota: ref.tipo_aliquota || "Padrão",
        reducao_aliquota: ref.reducao_percentual || { ibs: 0, cbs: 0 },
        local_incidencia_ibs: primeiroDetalhe.local_incidencia_ibs,
        fundamento_legal: ref.artigo_lc214 || "LC 214/2025"
      },
      instrucoes_de_preenchimento: [
        `Para esta NBS (${dadosNbs.codigo_nbs}), o Código de Tributação Nacional correspondente é ${primeiroDetalhe.item_lc116}.`,
        `No layout da Reforma Tributária, utilize cClassTrib = ${primeiroDetalhe.cClassTrib} e CST = ${ref.cst || "000"}.`,
        ref.reducao_percentual?.ibs > 0
          ? `Benefício Fiscal Identificado: Este serviço conta com redução de ${ref.reducao_percentual.ibs}% no IBS e CBS conforme ${ref.artigo_lc214}.`
          : `Tributação Padrão: Este serviço é tributado integralmente pelo IBS e CBS.`
      ]
    };
  }

  /**
   * Gera uma resposta conversacional amigável e explicativa em texto markdown
   */
  responderConversacional(pergunta) {
    const analise = this.orientarCliente(pergunta);
    if (analise.status !== 'sucesso') {
      return `Olá! Não consegui identificar os dados com exatidão para: "${pergunta}".\n\nPor gentileza, informe com mais detalhes o serviço prestado (exemplo: "desenvolvimento de aplicativo", "clínica médica", "consultoria de TI") ou forneça o número do seu CNAE.`;
    }

    if (analise.modo === 'consulta_cnae') {
      const r = analise.resumo_orientacao;
      let md = `### 🎯 Orientação para o CNAE: **${analise.cnae_consultado}**\n\n`;
      md += `**Atividade:** ${analise.descricao_empresa}\n\n`;
      md += `#### 📋 Códigos para Preenchimento do Documento Fiscal:\n`;
      md += `- **Código de Tributação Nacional (LC 116):** \`${r.codigo_tributacao_nacional_lc116}\` - *${r.descricao_servico}*\n`;
      md += `- **Código NBS Sugerido:** \`${r.nbs_padrao_sugerida}\` - *${r.descricao_nbs}*\n`;
      md += `- **Classificação Tributária IBS/CBS (cClassTrib):** \`${r.reforma_tributaria.cClassTrib}\` (*${r.reforma_tributaria.nome_classificacao}*)\n`;
      md += `- **CST IBS/CBS:** \`${r.reforma_tributaria.cst_ibs_cbs}\`\n`;
      md += `- **Local de Incidência (Reforma):** ${r.reforma_tributaria.local_incidencia_ibs}\n\n`;

      if (analise.todas_nbs_compativeis_com_este_cnae.length > 1) {
        md += `#### 🔍 Outras opções de NBS compatíveis com sua atividade:\n`;
        analise.todas_nbs_compativeis_com_este_cnae.slice(0, 5).forEach(n => {
          md += `- \`${n.codigo_nbs}\`: ${n.descricao}\n`;
        });
        md += `\n`;
      }

      md += `#### 💡 Passo a Passo:\n`;
      analise.passo_a_passo_emissao_nota.forEach(p => md += `- ${p}\n`);
      return md;
    }

    if (analise.modo === 'consulta_nbs') {
      const e = analise.enquadramento;
      let md = `### 🎯 Orientação para o Código NBS: **${analise.codigo_nbs}**\n\n`;
      md += `**Descrição do Serviço:** ${analise.descricao_nbs}\n\n`;
      md += `#### 📋 Códigos Correspondentes:\n`;
      md += `- **Código de Tributação Nacional (LC 116):** \`${e.codigo_tributacao_nacional_lc116}\` - *${e.descricao_item_lc116}*\n`;
      md += `- **Classificação Tributária (cClassTrib):** \`${e.cClassTrib}\` (*${e.nome_cClassTrib}*)\n`;
      md += `- **CST IBS/CBS:** \`${e.cst_ibs_cbs}\`\n`;
      md += `- **Regime de Alíquota:** ${e.tipo_aliquota} (${e.reducao_aliquota.ibs}% de redução)\n`;
      md += `- **Local de Incidência:** ${e.local_incidencia_ibs}\n`;
      md += `- **Fundamentação Legal:** ${e.fundamento_legal}\n\n`;
      md += `#### 💡 Instruções:\n`;
      analise.instrucoes_de_preenchimento.forEach(i => md += `- ${i}\n`);
      return md;
    }

    // Busca Semântica / Descrição Livre
    const rec = analise.recomendacao_principal;
    let md = `### 🎯 Orientação de Preenchimento Fiscal\n\n`;
    md += `Com base na sua descrição (*"${analise.consulta}"*), identifiquei o seguinte enquadramento técnico:\n\n`;
    md += `#### 📋 Dados para a Emissão da Nota Fiscal:\n`;
    md += `1. **Código de Tributação Nacional (LC 116):** \`${rec.codigo_tributacao_nacional_lc116}\`\n`;
    md += `   - *${rec.descricao_item_lc116}*\n`;
    md += `2. **Código NBS Recomendado:** \`${rec.codigo_nbs_sugerido}\`\n`;
    md += `   - *${rec.descricao_nbs}*\n`;
    md += `3. **Código de Classificação Tributária (cClassTrib):** \`${rec.cClassTrib}\`\n`;
    md += `   - *${rec.cClassTrib_nome}*\n`;
    md += `4. **CST IBS/CBS (LC 214/2025):** \`${rec.cst_ibs_cbs}\`\n`;
    md += `5. **Local de Incidência do Tributo:** ${rec.local_incidencia_reforma}\n`;
    if (rec.regras_beneficio_reforma.reducao_ibs > 0) {
      md += `6. **Benefício / Alíquota Reduzida:** Redução de **${rec.regras_beneficio_reforma.reducao_ibs}%** no IBS e CBS (${rec.regras_beneficio_reforma.fundamento_legal}).\n`;
    }
    md += `\n#### 🚀 Como Preencher no seu Sistema:\n`;
    analise.guia_de_preenchimento.forEach(g => md += `- ${g}\n`);

    if (analise.opcoes_alternativas.length > 0) {
      md += `\n*Caso o serviço tenha características específicas, você também pode avaliar estas NBSs alternativas:* \n`;
      analise.opcoes_alternativas.forEach(alt => {
        if (alt.nbs) md += `- \`${alt.nbs}\`: ${alt.descricao} (Item LC 116: \`${alt.item_lc116}\`)\n`;
      });
    }

    return md;
  }
}

module.exports = AgenteTributarioIA;
