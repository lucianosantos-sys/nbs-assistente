/**
 * Script de construção e compilação do Cérebro Tributário
 * Converte as tabelas e dados OCR da LC 116, CNAEs, NBS e Reforma Tributária (IBS/CBS - LC 214/2025)
 * em bases de dados JSON estruturadas, normalizadas e indexadas.
 */

const fs = require('fs');
const path = require('path');

// 1. CARREGAMENTO E PARSING DE CSV
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  function parseCSVLine(line) {
    const row = [];
    let insideQuotes = false;
    let field = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    return row;
  }

  const headers = parseCSVLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    records.push(obj);
  }
  return records;
}

// 2. DADOS DE CNAE x LC 116 (Extraídos das 13 páginas do PDF oficial)
const cnaeDataRaw = [
  // Página 1
  { cnae: "01.61-0-99", desc: "ATIVIDADES DE APOIO À AGRICULTURA NÃO ESPECIFICADAS ANTERIORMENTE", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "32.40-0-02", desc: "FABRICAÇÃO DE MESAS DE BILHAR, DE SINUCA E ACESSÓRIOS NÃO ASSOCIADA À LOCAÇÃO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "32.40-0-03", desc: "FABRICAÇÃO DE MESAS DE BILHAR, DE SINUCA E ACESSÓRIOS ASSOCIADA À LOCAÇÃO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.11-4-01", desc: "TRANSPORTE MARÍTIMO DE CABOTAGEM - CARGA", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.11-4-02", desc: "TRANSPORTE MARÍTIMO DE CABOTAGEM - PASSAGEIROS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.12-2-01", desc: "TRANSPORTE MARÍTIMO DE LONGO CURSO - CARGA", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.12-2-02", desc: "TRANSPORTE MARÍTIMO DE LONGO CURSO - PASSAGEIROS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.21-1-02", desc: "TRANSPORTE POR NAVEGAÇÃO INTERIOR DE CARGA, INTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL, EXCETO TRAVESSIA", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.22-0-02", desc: "TRANSPORTE POR NAVEGAÇÃO INTERIOR DE PASSAGEIROS EM LINHAS REGULARES, INTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL, EXCETO TRAVESSIA", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "50.91-2-02", desc: "TRANSPORTE POR NAVEGAÇÃO DE TRAVESSIA, INTERMUNICIPAL", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "51.12-9-01", desc: "SERVIÇO DE TÁXI AÉREO E LOCAÇÃO DE AERONAVES COM TRIPULAÇÃO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "51.12-9-02", desc: "SERVIÇO DE LOCAÇÃO DE AERONAVES COM TRIPULAÇÃO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "68.10-2-02", desc: "ALUGUEL DE IMÓVEIS PRÓPRIOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.11-0-00", desc: "LOCAÇÃO DE AUTOMÓVEIS SEM CONDUTOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.19-5-01", desc: "LOCAÇÃO DE EMBARCAÇÕES SEM TRIPULAÇÃO, EXCETO PARA FINS RECREATIVOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.19-5-02", desc: "LOCAÇÃO DE AERONAVES SEM TRIPULAÇÃO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.19-5-99", desc: "LOCAÇÃO DE OUTROS MEIOS DE TRANSPORTE NÃO ESPECIFICADOS ANTERIORMENTE, SEM CONDUTOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.21-7-00", desc: "ALUGUEL DE EQUIPAMENTOS RECREATIVOS E ESPORTIVOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.22-5-00", desc: "ALUGUEL DE FITAS DE VÍDEO, DVDS E SIMILARES", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.23-3-00", desc: "ALUGUEL DE OBJETOS DO VESTUÁRIO, JÓIAS E ACESSÓRIOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.29-2-01", desc: "ALUGUEL DE APARELHOS DE JOGOS ELETRÔNICOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.29-2-02", desc: "ALUGUEL DE MÓVEIS, UTENSÍLIOS E APARELHOS DE USO DOMÉSTICO E PESSOAL, INSTRUMENTOS MUSICAIS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.29-2-03", desc: "ALUGUEL DE MATERIAL MÉDICO", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.29-2-99", desc: "ALUGUEL DE OUTROS OBJETOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.31-4-00", desc: "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS AGRÍCOLAS SEM OPERADOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.32-2-01", desc: "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS PARA CONSTRUÇÃO SEM OPERADOR, EXCETO ANDAIMES", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.33-1-00", desc: "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS PARA ESCRITÓRIOS", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.39-0-01", desc: "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS PARA EXTRAÇÃO DE MINÉRIOS E PETRÓLEO, SEM OPERADOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.39-0-02", desc: "ALUGUEL DE EQUIPAMENTOS CIENTÍFICOS, MÉDICOS E HOSPITALARES, SEM OPERADOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  { cnae: "77.39-0-99", desc: "ALUGUEL DE OUTRAS MÁQUINAS E EQUIPAMENTOS COMERCIAIS E INDUSTRIAIS NÃO ESPECIFICADOS ANTERIORMENTE, SEM OPERADOR", item: "00.00", itemDesc: "Locação de bens móveis.", aliq: "0%", est: false, fora: false, ret: false, grupo: "Locação de bens móveis" },
  
  // Informática e Congêneres
  { cnae: "62.01-5-01", desc: "Desenvolvimento de programas de computador sob encomenda", item: "01.01", itemDesc: "Análise e desenvolvimento de sistemas.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.01-5-01", desc: "Desenvolvimento de programas de computador sob encomenda", item: "01.02", itemDesc: "Programação.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "18.30-0-03", desc: "Reproducao de software em qualquer suporte", item: "01.03", itemDesc: "Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "61.90-6-01", desc: "Provedores de acesso às redes de comunicações", item: "01.03", itemDesc: "Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "63.11-9-00", desc: "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet", item: "01.03", itemDesc: "Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.01-5-01", desc: "Desenvolvimento de programas de computador sob encomenda", item: "01.04", itemDesc: "Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.02-3-00", desc: "Desenvolvimento e licenciamento de programas de computador customizáveis", item: "01.04", itemDesc: "Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.03-1-00", desc: "Desenvolvimento e licenciamento de programas de computador nãocustomizáveis", item: "01.04", itemDesc: "Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.02-3-00", desc: "Desenvolvimento e licenciamento de programas de computador customizáveis", item: "01.05", itemDesc: "Licenciamento ou cessão de direito de uso de programas de computação.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.04-0-00", desc: "Consultoria em tecnologia da informação", item: "01.06", itemDesc: "Assessoria e consultaria em informática.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.09-1-00", desc: "Suporte técnico, manutenção e outros serviços em tecnologia da informação", item: "01.07", itemDesc: "Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.01-5-01", desc: "Desenvolvimento de programas de computador sob encomenda", item: "01.08", itemDesc: "Planejamento, confecção, manutenção e atualização de páginas eletrônicas.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "62.01-5-02", desc: "WEB DESIGN", item: "01.08", itemDesc: "Planejamento, confecção, manutenção e atualização de páginas eletrônicas.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "63.19-4-00", desc: "Portais, provedores de conteúdo e outros serviços de informação na internet", item: "01.08", itemDesc: "Planejamento, confecção, manutenção e atualização de páginas eletrônicas.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  { cnae: "63.19-4-00", desc: "Portais, provedores de conteúdo e outros serviços de informação na internet", item: "01.09", itemDesc: "Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de informática e congêneres." },
  
  // Pesquisa e Desenvolvimento
  { cnae: "72.10-0-00", desc: "Pesquisa e desenvolvimento experimental em ciências físicas e naturais", item: "02.01", itemDesc: "Serviços de pesquisas e desenvolvimento de qualquer natureza.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de pesquisas e desenvolvimento" },
  { cnae: "72.20-7-00", desc: "Pesquisa e desenvolvimento experimental em ciências sociais e humanas", item: "02.01", itemDesc: "Serviços de pesquisas e desenvolvimento de qualquer natureza.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de pesquisas e desenvolvimento" },
  
  // Locação, Cessão e Espaços
  { cnae: "77.40-3-00", desc: "Gestão de ativos intangíveis não-financeiros", item: "03.02", itemDesc: "Cessão de direito de uso de marcas e de sinais de propaganda.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "82.11-3-00", desc: "Serviços combinados de escritório e apoio administrativo", item: "03.03", itemDesc: "Exploração de salões de festas, centro de convenções, escritórios virtuais, stands...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "82.30-0-02", desc: "Casas de festas e eventos", item: "03.03", itemDesc: "Exploração de salões de festas, centro de convenções, escritórios virtuais, stands...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "90.03-5-00", desc: "Gestão de espaços para artes cênicas, espetáculos e outras atividades artísticas", item: "03.03", itemDesc: "Exploração de salões de festas, centro de convenções, escritórios virtuais, stands...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "93.11-5-00", desc: "Gestão de instalações de esportes", item: "03.03", itemDesc: "Exploração de salões de festas, centro de convenções, escritórios virtuais, stands...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "35.14-0-00", desc: "Distribuição de energia elétrica", item: "03.04", itemDesc: "Locação, sublocação, arrendamento, direito de passagem ou permissão de uso de ferrovia, rodovia, postes, cabos, dutos e condutos...", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "43.99-1-02", desc: "Montagem e desmontagem de andaimes e outras estruturas temporárias", item: "03.05", itemDesc: "Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário.", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  { cnae: "77.32-2-02", desc: "Aluguel de andaimes", item: "03.05", itemDesc: "Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário.", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços prestados mediante locação, cessão de direito de uso e congêneres." },
  
  // Saúde Humana
  { cnae: "86.30-5-02", desc: "Atividade médica ambulatorial com recursos para realização de exames complementares", item: "04.01", itemDesc: "Medicina e biomedicina.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.30-5-03", desc: "Atividade médica ambulatorial restrita a consultas", item: "04.01", itemDesc: "Medicina e biomedicina.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.40-2-01", desc: "Laboratórios de anatomia patológica e citológica", item: "04.02", itemDesc: "Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.40-2-02", desc: "Laboratórios clínicos", item: "04.02", itemDesc: "Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.10-1-01", desc: "Atividades de atendimento hospitalar, exceto pronto-socorro e unidades para atendimento a urgências", item: "04.03", itemDesc: "Hospitais, clínicas, laboratórios, sanatórios, manicômios, casas de saúde, prontos-socorros...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.50-0-04", desc: "Atividades de fisioterapia", item: "04.08", itemDesc: "Terapia ocupacional, fisioterapia e fonoaudiologia.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.50-0-06", desc: "Atividades de fonoaudiologia", item: "04.08", itemDesc: "Terapia ocupacional, fisioterapia e fonoaudiologia.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.30-5-04", desc: "Atividade odontológica", item: "04.12", itemDesc: "Odontologia.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "86.50-0-03", desc: "Atividades de psicologia e psicanálise", item: "04.16", itemDesc: "Psicologia", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  { cnae: "65.50-2-00", desc: "Planos de saúde", item: "04.22", itemDesc: "Planos de medicina de grupo ou individual e convênios...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de saúde, assistência médica e congêneres." },
  
  // Veterinária
  { cnae: "75.00-1-00", desc: "Atividades veterinárias", item: "05.01", itemDesc: "Medicina veterinária e zootecnia.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de medicina e assistência veterinária e congêneres." },
  { cnae: "75.00-1-00", desc: "Atividades veterinárias", item: "05.02", itemDesc: "Hospitais, clínicas, ambulatórios, prontos-socorros e congêneres, na área veterinária.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de medicina e assistência veterinária e congêneres." },
  { cnae: "96.09-2-08", desc: "Higiene e embelezamento de animais domésticos", item: "05.08", itemDesc: "Guarda, tratamento, amestramento, embelezamento, alojamento e congêneres.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de medicina e assistência veterinária e congêneres." },
  
  // Construção e Engenharia
  { cnae: "71.11-1-00", desc: "Serviços de arquitetura", item: "07.01", itemDesc: "Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "71.12-0-00", desc: "Serviços de engenharia", item: "07.01", itemDesc: "Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "41.20-4-00", desc: "Construção de edifícios", item: "07.02", itemDesc: "Execução, por administração, empreitada ou subempreitada, de obras de construção civil...", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "41.20-4-00", desc: "Construção de edifícios", item: "07.05", itemDesc: "Reparação, conservação e reforma de edifícios, estradas, pontes, portos e congêneres...", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "43.11-8-01", desc: "Demolição de edifícios e outras estruturas", item: "07.04", itemDesc: "Demolição.", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "38.11-4-00", desc: "Coleta de resíduos não-perigosos", item: "07.09", itemDesc: "Varrição, coleta, remoção, incineração, tratamento, reciclagem, separação e destinação final de lixo...", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  { cnae: "81.21-4-00", desc: "Limpeza em prédios e em domicílios", item: "07.10", itemDesc: "Limpeza, manutenção e conservação de vias e logradouros públicos, imóveis, chaminés, piscinas...", aliq: "5%", est: true, fora: true, ret: false, grupo: "Serviços relativos a engenharia, arquitetura, geologia, urbanismo, construção civil..." },
  
  // Educação
  { cnae: "85.13-9-00", desc: "Ensino fundamental", item: "08.01", itemDesc: "Ensino regular pré-escolar, fundamental, médio e superior.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  { cnae: "85.20-1-00", desc: "Ensino médio", item: "08.01", itemDesc: "Ensino regular pré-escolar, fundamental, médio e superior.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  { cnae: "85.31-7-00", desc: "Educação superior – graduação", item: "08.01", itemDesc: "Ensino regular pré-escolar, fundamental, médio e superior.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  { cnae: "85.93-7-00", desc: "Ensino de idiomas", item: "08.02", itemDesc: "Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  { cnae: "85.99-6-03", desc: "Treinamento em informática", item: "08.02", itemDesc: "Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  { cnae: "85.99-6-04", desc: "Treinamento em desenvolvimento profissional e gerencial", item: "08.02", itemDesc: "Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de educação, ensino, orientação pedagógica e educacional..." },
  
  // Turismo e Hospedagem
  { cnae: "55.10-8-01", desc: "Hotéis", item: "09.01", itemDesc: "Hospedagem de qualquer natureza em hotéis, apart-service condominiais, flat, apart-hotéis...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relativos a hospedagem, turismo, viagens e congêneres." },
  { cnae: "79.11-2-00", desc: "Agências de viagens", item: "09.02", itemDesc: "Agenciamento, organização, promoção, intermediação e execução de programas de turismo, passeios, viagens...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relativos a hospedagem, turismo, viagens e congêneres." },
  
  // Setor Financeiro
  { cnae: "64.21-2-00", desc: "Bancos comerciais", item: "15.01", itemDesc: "Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relacionados ao setor bancário ou financeiro" },
  { cnae: "66.13-4-00", desc: "Administração de cartões de crédito", item: "15.01", itemDesc: "Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relacionados ao setor bancário ou financeiro" },
  { cnae: "64.21-2-00", desc: "Bancos comerciais", item: "15.02", itemDesc: "Abertura de contas em geral, inclusive conta-corrente, conta de investimentos...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços relacionados ao setor bancário ou financeiro" },
  
  // Serviços de Apoio, Consultoria, Advocacia, Contabilidade
  { cnae: "70.20-4-00", desc: "Atividades de consultoria em gestão empresarial, exceto consultoria técnica específica", item: "17.01", itemDesc: "Assessoria ou consultoria de qualquer natureza...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de apoio técnico, administrativo, jurídico, contábil, comercial e congêneres." },
  { cnae: "73.11-4-00", desc: "Agências de publicidade", item: "17.06", itemDesc: "Propaganda e publicidade, inclusive promoção de vendas, planejamento de campanhas...", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de apoio técnico, administrativo, jurídico, contábil, comercial e congêneres." },
  { cnae: "69.11-7-01", desc: "Serviços advocatícios", item: "17.14", itemDesc: "Advocacia.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de apoio técnico, administrativo, jurídico, contábil, comercial e congêneres." },
  { cnae: "69.20-6-01", desc: "Atividades de contabilidade", item: "17.19", itemDesc: "Contabilidade, inclusive serviços técnicos e auxiliares.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de apoio técnico, administrativo, jurídico, contábil, comercial e congêneres." },
  { cnae: "69.20-6-02", desc: "Atividades de consultoria e auditoria contábil e tributária", item: "17.16", itemDesc: "Auditoria.", aliq: "5%", est: true, fora: false, ret: false, grupo: "Serviços de apoio técnico, administrativo, jurídico, contábil, comercial e congêneres." },
  
  // Cartórios
  { cnae: "69.12-5-00", desc: "Cartórios", item: "21.01", itemDesc: "Serviços de registros públicos, cartorários e notariais.", aliq: "2%", est: true, fora: false, ret: false, grupo: "Serviços de registros públicos, cartorários e notariais." }
];

console.log("Iniciando compilação do Cérebro Tributário...");

// Carregar CSVs brutos
const cstPath = path.join(__dirname, 'raw_cst.csv');
const lc116NbsPath = path.join(__dirname, 'raw_lc116_nbs.csv');

const cstRows = parseCSV(fs.readFileSync(cstPath, 'utf8'));
const lc116NbsRows = parseCSV(fs.readFileSync(lc116NbsPath, 'utf8'));

// 3. ESTRUTURAÇÃO 1: CST & cClassTrib (Reforma Tributária - LC 214/2025)
const cstMap = {};
const cClassTribList = [];

cstRows.forEach(row => {
  const cst = row['CST-IBS/CBS'];
  if (!cstMap[cst]) {
    cstMap[cst] = {
      cst: cst,
      descricao: row['Descrição CST-IBS/CBS'],
      classificacoes: []
    };
  }
  
  const cClass = {
    cClassTrib: row['cClassTrib'],
    nome: row['Nome cClassTrib'] || row['Descrição cClassTrib'],
    descricao_completa: row['Descrição cClassTrib'],
    artigo_lc214: row['LC 214/25'] || row['LC'],
    redacao_legal: row['LC Redação'],
    tipo_aliquota: row['Tipo de Alíquota'] || 'Padrão',
    reducao_percentual: {
      ibs: parseFloat(row['pRedIBS'] || '0') || 0,
      cbs: parseFloat(row['pRedCBS'] || '0') || 0
    },
    redutor_base_calculo: row['ind_RedutorBC'] === 'S',
    credito_para: row['Crédito para'] || null,
    documentos_habilitados: {
      nfe: row['indNFe'] === '1',
      nfce: row['indNFCe'] === '1',
      cte: row['indCTe'] === '1',
      nfse: row['indNFSe'] === '1',
      nfcom: row['indNFCom'] === '1',
      bpe: row['indBPe'] === '1'
    },
    link_legislacao: row['Link']
  };

  cstMap[cst].classificacoes.push(cClass);
  cClassTribList.push({
    ...cClass,
    cst: cst,
    cst_descricao: row['Descrição CST-IBS/CBS']
  });
});

// 4. ESTRUTURAÇÃO 2: LC 116 x NBS
const lc116Map = {};
const nbsList = [];

lc116NbsRows.forEach(row => {
  const item = row['Item LC 116'];
  const nbsCode = row['NBS'];

  if (!lc116Map[item]) {
    lc116Map[item] = {
      item_lc116: item,
      descricao: row['Descrição Item'],
      nbs_associadas: []
    };
  }

  const nbsEntry = {
    codigo_nbs: nbsCode,
    descricao_nbs: row['DESCRIÇÃO NBS'],
    prestacao_onerosa: row['PS ONEROSA? (S/N)'] === 'S',
    adquirente_exterior: row['ADQ EXTERIOR? (S/N)'] === 'S',
    indop: row['INDOP'],
    local_incidencia_ibs: row['Local incidência IBS'],
    cClassTrib_padrao: row['cClassTrib'],
    nome_cClassTrib: row['nome cClassTrib']
  };

  lc116Map[item].nbs_associadas.push(nbsEntry);
  nbsList.push({
    ...nbsEntry,
    item_lc116: item,
    item_lc116_descricao: row['Descrição Item']
  });
});

// 5. ESTRUTURAÇÃO 3: CNAE x LC 116
const cnaeMap = {};
cnaeDataRaw.forEach(c => {
  if (!cnaeMap[c.cnae]) {
    cnaeMap[c.cnae] = {
      cnae: c.cnae,
      descricao: c.desc,
      itens_lc116: []
    };
  }
  cnaeMap[c.cnae].itens_lc116.push({
    item_lc116: c.item,
    item_descricao: c.itemDesc,
    aliquota_iss: c.aliq,
    iss_devido_estabelecimento_prestador: c.est,
    iss_devido_local_prestacao: c.fora,
    retencao_obrigatoria: c.ret,
    grupo_atividade: c.grupo
  });
});

// 6. ESTRUTURAÇÃO 4: O "CÉREBRO TRIBUTÁRIO COMPLETO" (Grafo Unificado)
// Permite consulta direta CNAE -> LC 116 -> NBS -> cClassTrib -> CST IBS/CBS -> Alíquotas e Regras
const grafoCerebro = {
  metadados: {
    projeto: "NBS Assistente - Motor de Inteligência Fiscal",
    versao: "1.0.0",
    data_geracao: new Date().toISOString(),
    legislacao_base: [
      "Lei Complementar nº 116/2003 (ISSQN)",
      "Lei Complementar nº 214/2025 (Reforma Tributária - IBS/CBS)",
      "Nomenclatura Brasileira de Serviços (NBS)",
      "Classificação Nacional de Atividades Econômicas (CNAE 2.3)"
    ]
  },
  indices: {
    total_cnaes: Object.keys(cnaeMap).length,
    total_itens_lc116: Object.keys(lc116Map).length,
    total_nbs: nbsList.length,
    total_cclasstrib: cClassTribList.length,
    total_cst: Object.keys(cstMap).length
  },
  tabelas: {
    cnae: cnaeMap,
    lc116: lc116Map,
    cst: cstMap,
    cclasstrib: cClassTribList,
    nbs: nbsList
  }
};

// Gravar arquivos JSON na pasta data
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'cnae_lc116.json'), JSON.stringify(cnaeMap, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'lc116_nbs_reforma.json'), JSON.stringify(lc116Map, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'cst_cclasstrib.json'), JSON.stringify(cstMap, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'cerebro_tributario_completo.json'), JSON.stringify(grafoCerebro, null, 2), 'utf8');

console.log(" Sucesso! 4 bases JSON geradas em " + dataDir);
console.log("  - cnae_lc116.json (" + Object.keys(cnaeMap).length + " CNAEs indexados)");
console.log("  - lc116_nbs_reforma.json (" + Object.keys(lc116Map).length + " Itens LC 116 correlacionados)");
console.log("  - cst_cclasstrib.json (" + Object.keys(cstMap).length + " CSTs e " + cClassTribList.length + " cClassTribs)");
console.log("  - cerebro_tributario_completo.json (Grafo Unificado Completo)");
