/**
 * CÉREBRO TRIBUTÁRIO - NBS ASSISTENTE
 * Motor de busca, indexação e correlação inteligente de regras tributárias.
 * Conecta CNAE -> Item LC 116 -> NBS -> cClassTrib -> CST IBS/CBS (LC 214/2025).
 */

const fs = require('fs');
const path = require('path');

class CerebroTributario {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.carregarDados();
  }

  carregarDados() {
    this.cnaeDb = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'cnae_lc116.json'), 'utf8'));
    this.lc116Db = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'lc116_nbs_reforma.json'), 'utf8'));
    this.cstDb = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'cst_cclasstrib.json'), 'utf8'));
    this.grafoCompleto = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'cerebro_tributario_completo.json'), 'utf8'));

    // Criar índice reverso de NBS para Item LC 116 e cClassTrib
    this.indiceNbs = {};
    for (const itemCode in this.lc116Db) {
      const item = this.lc116Db[itemCode];
      (item.nbs_associadas || []).forEach(nbs => {
        if (!this.indiceNbs[nbs.codigo_nbs]) {
          this.indiceNbs[nbs.codigo_nbs] = {
            codigo_nbs: nbs.codigo_nbs,
            descricao: nbs.descricao_nbs,
            ocorrencias: []
          };
        }
        this.indiceNbs[nbs.codigo_nbs].ocorrencias.push({
          item_lc116: item.item_lc116,
          item_descricao: item.descricao,
          ...nbs
        });
      });
    }

    // Criar índice de cClassTrib
    this.indiceCClassTrib = {};
    for (const cstCode in this.cstDb) {
      const cst = this.cstDb[cstCode];
      (cst.classificacoes || []).forEach(cc => {
        this.indiceCClassTrib[cc.cClassTrib] = {
          ...cc,
          cst: cst.cst,
          cst_descricao: cst.descricao
        };
      });
    }
  }

  normalizarTexto(txt) {
    if (!txt) return '';
    return txt
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Busca orientada por descrição do serviço ou palavras-chave
   */
  buscarServico(termoBusca) {
    const termoNorm = this.normalizarTexto(termoBusca);
    const palavras = termoNorm.split(' ').filter(p => p.length >= 3);
    const resultados = [];

    // 1. Procurar nas NBS
    for (const codigoNbs in this.indiceNbs) {
      const entry = this.indiceNbs[codigoNbs];
      const descNorm = this.normalizarTexto(entry.descricao);
      let score = 0;

      if (descNorm.includes(termoNorm)) score += 50;
      palavras.forEach(p => {
        if (descNorm.includes(p)) score += 10;
        if (codigoNbs.replace(/[^0-9]/g, '').includes(p)) score += 30;
      });

      if (score > 0) {
        entry.ocorrencias.forEach(oc => {
          const cClassInfo = this.indiceCClassTrib[oc.cClassTrib_padrao] || null;
          resultados.push({
            tipo: 'NBS',
            score: score,
            nbs: codigoNbs,
            nbs_descricao: entry.descricao,
            item_lc116: oc.item_lc116,
            item_lc116_descricao: oc.item_descricao,
            local_incidencia_ibs: oc.local_incidencia_ibs,
            indop: oc.indop,
            cClassTrib: oc.cClassTrib_padrao,
            cClassTrib_nome: oc.nome_cClassTrib,
            regras_reforma: cClassInfo
          });
        });
      }
    }

    // 2. Procurar nos CNAEs
    for (const cnaeCode in this.cnaeDb) {
      const cnae = this.cnaeDb[cnaeCode];
      const descNorm = this.normalizarTexto(cnae.descricao);
      let score = 0;

      if (descNorm.includes(termoNorm)) score += 40;
      palavras.forEach(p => {
        if (descNorm.includes(p)) score += 8;
        if (cnaeCode.replace(/[^0-9]/g, '').includes(p)) score += 30;
      });

      if (score > 0) {
        (cnae.itens_lc116 || []).forEach(it => {
          const lc116Info = this.lc116Db[it.item_lc116] || null;
          resultados.push({
            tipo: 'CNAE',
            score: score,
            cnae: cnaeCode,
            cnae_descricao: cnae.descricao,
            item_lc116: it.item_lc116,
            item_lc116_descricao: it.item_descricao,
            aliquota_iss: it.aliquota_iss,
            iss_devido_estabelecimento: it.iss_devido_estabelecimento_prestador,
            iss_devido_local_prestacao: it.iss_devido_local_prestacao,
            retencao_obrigatoria: it.retencao_obrigatoria,
            nbs_compativeis: lc116Info ? lc116Info.nbs_associadas : []
          });
        });
      }
    }

    // Ordenar por score decrescente
    return resultados.sort((a, b) => b.score - a.score);
  }

  /**
   * Consulta diagnóstica direta por Código CNAE
   */
  consultarPorCNAE(cnaeInput) {
    const clean = cnaeInput.replace(/[^0-9]/g, '');
    let matchedCnae = null;
    let cnaeKey = null;

    for (const code in this.cnaeDb) {
      if (code.replace(/[^0-9]/g, '') === clean) {
        matchedCnae = this.cnaeDb[code];
        cnaeKey = code;
        break;
      }
    }

    if (!matchedCnae) return null;

    const itensResolvidos = (matchedCnae.itens_lc116 || []).map(it => {
      const lc116Data = this.lc116Db[it.item_lc116] || { nbs_associadas: [] };
      const nbsEnriquecidas = (lc116Data.nbs_associadas || []).map(nbs => {
        const cClassInfo = this.indiceCClassTrib[nbs.cClassTrib_padrao] || null;
        return {
          ...nbs,
          tributacao_reforma: cClassInfo
        };
      });

      return {
        ...it,
        nbs_disponiveis: nbsEnriquecidas
      };
    });

    return {
      cnae: cnaeKey,
      descricao: matchedCnae.descricao,
      itens_lc116: itensResolvidos
    };
  }

  /**
   * Consulta diagnóstica direta por Código NBS
   */
  consultarPorNBS(nbsInput) {
    const clean = nbsInput.replace(/[^0-9]/g, '');
    for (const code in this.indiceNbs) {
      if (code.replace(/[^0-9]/g, '') === clean) {
        const entry = this.indiceNbs[code];
        return {
          codigo_nbs: code,
          descricao: entry.descricao,
          detalhes: entry.ocorrencias.map(oc => ({
            item_lc116: oc.item_lc116,
            item_descricao: oc.item_descricao,
            local_incidencia_ibs: oc.local_incidencia_ibs,
            indop: oc.indop,
            cClassTrib: oc.cClassTrib_padrao,
            nome_cClassTrib: oc.nome_cClassTrib,
            reforma_tributaria: this.indiceCClassTrib[oc.cClassTrib_padrao] || null
          }))
        };
      }
    }
    return null;
  }
}

module.exports = CerebroTributario;
