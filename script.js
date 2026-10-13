/**
 * Simulador de Juros Compostos
 * Desenvolvido em JavaScript puro (Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do Formulário
  const form = document.getElementById('simulator-form');
  const inputValorInicial = document.getElementById('valor-inicial');
  const inputAporteMensal = document.getElementById('aporte-mensal');
  const inputTaxaJuros = document.getElementById('taxa-juros');
  const selectTipoTaxa = document.getElementById('tipo-taxa');
  const inputPeriodo = document.getElementById('periodo');
  const selectUnidadePeriodo = document.getElementById('unidade-periodo');
  const btnLimpar = document.getElementById('btn-limpar');

  // Elementos de Feedback de Erro
  const errorValorInicial = document.getElementById('error-valor-inicial');
  const errorAporteMensal = document.getElementById('error-aporte-mensal');
  const errorTaxaJuros = document.getElementById('error-taxa-juros');
  const errorPeriodo = document.getElementById('error-periodo');

  // Elementos de Resultado
  const resultsSection = document.getElementById('results-section');
  const rateSummaryBanner = document.getElementById('rate-summary-banner');
  const resTotalInvestido = document.getElementById('res-total-investido');
  const resTotalJuros = document.getElementById('res-total-juros');
  const resTotalFinal = document.getElementById('res-total-final');
  const resSubInvestido = document.getElementById('res-sub-investido');
  const resSubFinal = document.getElementById('res-sub-final');

  // Barra de Distribuição
  const barInvested = document.getElementById('bar-invested');
  const barInterest = document.getElementById('bar-interest');
  const distributionPercentages = document.getElementById('distribution-percentages');

  // Tabela e Exportação
  const tableSubtitle = document.getElementById('table-subtitle');
  const tableBody = document.getElementById('table-body');
  const btnExportarCsv = document.getElementById('btn-exportar-csv');

  // Cache para exportação CSV
  let dadosSimulacaoAtual = null;

  /* ==========================================================================
     Funções de Formatação e Conversão
     ========================================================================== */

  /**
   * Formata um valor numérico para o padrão de moeda brasileiro (BRL).
   * @param {number} valor 
   * @returns {string} Ex: "R$ 1.250,50"
   */
  function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Formata número percentual no padrão brasileiro.
   * @param {number} valor 
   * @param {number} decimais 
   * @returns {string} Ex: "10,50%"
   */
  function formatarPorcentagem(valor, decimais = 2) {
    return Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais
    }) + '%';
  }

  /**
   * Converte string formatada em moeda/número pt-BR para número de ponto flutuante.
   * Suporta formatos como "1.500,75", "1500.75" ou números inteiros.
   * @param {string} texto 
   * @returns {number}
   */
  function parseMoedaBR(texto) {
    if (!texto) return 0;
    // Remove símbolos e espaços
    let limpo = texto.replace(/[R$\s]/g, '').trim();
    // Se possui pontos e vírgulas, remove os pontos de milhar e substitui vírgula por ponto
    if (limpo.includes(',') && limpo.includes('.')) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else if (limpo.includes(',')) {
      limpo = limpo.replace(',', '.');
    }
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Aplica máscara monetária simples em tempo real para campos de moeda.
   */
  function aplicarMascaraMoeda(input) {
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (!v) {
        e.target.value = '';
        return;
      }
      v = (parseInt(v, 10) / 100).toFixed(2);
      v = v.replace('.', ',');
      v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      e.target.value = v;
    });
  }

  // Inicializa máscara nos campos de valores
  aplicarMascaraMoeda(inputValorInicial);
  aplicarMascaraMoeda(inputAporteMensal);

  // Permitir apenas dígitos e vírgula/ponto no campo de taxa
  inputTaxaJuros.addEventListener('input', (e) => {
    let v = e.target.value;
    // Substitui ponto por vírgula para manter padrão pt-BR
    v = v.replace('.', ',');
    // Permite apenas números e no máximo uma vírgula
    v = v.replace(/[^0-9,]/g, '');
    const partes = v.split(',');
    if (partes.length > 2) {
      v = partes[0] + ',' + partes.slice(1).join('');
    }
    e.target.value = v;
  });

  /* ==========================================================================
     Lógica Financeira e Matemática
     ========================================================================== */

  /**
   * Converte uma taxa de juros anual para sua taxa equivalente mensal composta.
   * Fórmula: i_m = (1 + i_a)^(1/12) - 1
   * @param {number} taxaAnualDecimal - Ex: 0.12 para 12% ao ano
   * @returns {number} Taxa mensal em valor decimal
   */
  function converterTaxaAnualParaMensal(taxaAnualDecimal) {
    return Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
  }

  /**
   * Realiza a simulação completa dos juros compostos mês a mês.
   * @param {Object} params
   * @returns {Object} Dados agregados e array mês a mês
   */
  function simularJurosCompostos({ valorInicial, aporteMensal, taxaJuros, tipoTaxa, periodo, unidadePeriodo }) {
    // 1. Determinar o total de meses
    const totalMeses = unidadePeriodo === 'anos' ? periodo * 12 : periodo;

    // 2. Determinar a taxa mensal efetiva em formato decimal
    let taxaMensalDecimal = 0;
    const taxaInformadaDecimal = taxaJuros / 100;

    if (tipoTaxa === 'anual') {
      taxaMensalDecimal = converterTaxaAnualParaMensal(taxaInformadaDecimal);
    } else {
      taxaMensalDecimal = taxaInformadaDecimal;
    }

    // 3. Simulação mês a mês
    let saldoAtual = valorInicial;
    let totalInvestido = valorInicial;
    let jurosAcumulados = 0;

    const evolucaoMeses = [];

    // Linha 0 (Mês Inicial de Abertura)
    evolucaoMeses.push({
      mes: 0,
      rotuloMes: 'Início',
      jurosDoMes: 0,
      totalInvestido: totalInvestido,
      jurosAcumulados: 0,
      valorAcumulado: saldoAtual
    });

    for (let mes = 1; mes <= totalMeses; mes++) {
      // Rendimento do mês incide sobre o saldo que estava investido
      const jurosDoMes = saldoAtual * taxaMensalDecimal;
      jurosAcumulados += jurosDoMes;

      // O aporte mensal é somado ao final do mês
      totalInvestido += aporteMensal;
      saldoAtual = saldoAtual + jurosDoMes + aporteMensal;

      evolucaoMeses.push({
        mes: mes,
        rotuloMes: `Mês ${mes}`,
        jurosDoMes: jurosDoMes,
        totalInvestido: totalInvestido,
        jurosAcumulados: jurosAcumulados,
        valorAcumulado: saldoAtual
      });
    }

    const valorTotalFinal = saldoAtual;
    const totalJuros = jurosAcumulados;

    return {
      valorInicial,
      aporteMensal,
      taxaInformadaPercentual: taxaJuros,
      tipoTaxa,
      taxaMensalEfetivaPercentual: taxaMensalDecimal * 100,
      periodoOriginal: periodo,
      unidadePeriodo,
      totalMeses,
      totalInvestido,
      totalJuros,
      valorTotalFinal,
      evolucaoMeses
    };
  }

  /* ==========================================================================
     Validação dos Campos
     ========================================================================== */

  function limparErros() {
    errorValorInicial.textContent = '';
    errorAporteMensal.textContent = '';
    errorTaxaJuros.textContent = '';
    errorPeriodo.textContent = '';

    document.querySelectorAll('.input-wrapper').forEach(el => el.classList.remove('has-error'));
  }

  function validarEntradas() {
    limparErros();
    let valido = true;

    const valorInicial = parseMoedaBR(inputValorInicial.value);
    const aporteMensal = parseMoedaBR(inputAporteMensal.value);
    const taxaJuros = parseMoedaBR(inputTaxaJuros.value);
    const periodo = parseInt(inputPeriodo.value, 10);

    if (isNaN(valorInicial) || valorInicial < 0) {
      errorValorInicial.textContent = 'Informe um valor inicial válido.';
      inputValorInicial.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    }

    if (isNaN(aporteMensal) || aporteMensal < 0) {
      errorAporteMensal.textContent = 'Informe um valor de aporte válido.';
      inputAporteMensal.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    }

    if (valorInicial === 0 && aporteMensal === 0) {
      errorValorInicial.textContent = 'Informe um valor inicial ou um aporte mensal maior que zero.';
      inputValorInicial.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    }

    if (isNaN(taxaJuros) || taxaJuros <= 0) {
      errorTaxaJuros.textContent = 'Informe uma taxa de juros maior que zero.';
      inputTaxaJuros.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    }

    if (isNaN(periodo) || periodo < 1) {
      errorPeriodo.textContent = 'Informe um período inteiro maior que zero.';
      inputPeriodo.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    } else if (selectUnidadePeriodo.value === 'anos' && periodo > 80) {
      errorPeriodo.textContent = 'O período máximo permitido é de 80 anos.';
      inputPeriodo.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    } else if (selectUnidadePeriodo.value === 'meses' && periodo > 960) {
      errorPeriodo.textContent = 'O período máximo permitido é de 960 meses (80 anos).';
      inputPeriodo.closest('.input-wrapper').classList.add('has-error');
      valido = false;
    }

    return {
      valido,
      dados: {
        valorInicial,
        aporteMensal,
        taxaJuros,
        tipoTaxa: selectTipoTaxa.value,
        periodo,
        unidadePeriodo: selectUnidadePeriodo.value
      }
    };
  }

  /* ==========================================================================
     Renderização dos Resultados na Interface
     ========================================================================== */

  function renderizarResultados(resultado) {
    dadosSimulacaoAtual = resultado;

    // 1. Banner explicativo da taxa equivalente
    if (resultado.tipoTaxa === 'anual') {
      rateSummaryBanner.innerHTML = `
        <span>ℹ️</span>
        <div>
          Taxa informada de <strong>${formatarPorcentagem(resultado.taxaInformadaPercentual, 2)} ao ano</strong> 
          equivale a aproximadamente <strong>${formatarPorcentagem(resultado.taxaMensalEfetivaPercentual, 4)} ao mês</strong> em juros compostos.
        </div>
      `;
      rateSummaryBanner.style.display = 'flex';
    } else {
      rateSummaryBanner.innerHTML = `
        <span>ℹ️</span>
        <div>
          Taxa aplicada diretamente de <strong>${formatarPorcentagem(resultado.taxaInformadaPercentual, 2)} ao mês</strong>.
        </div>
      `;
      rateSummaryBanner.style.display = 'flex';
    }

    // 2. Exibição dos Totais
    resTotalInvestido.textContent = formatarMoeda(resultado.totalInvestido);
    resTotalJuros.textContent = formatarMoeda(resultado.totalJuros);
    resTotalFinal.textContent = formatarMoeda(resultado.valorTotalFinal);

    resSubInvestido.textContent = `${formatarMoeda(resultado.valorInicial)} inicial + ${resultado.totalMeses}x de ${formatarMoeda(resultado.aporteMensal)}`;
    resSubFinal.textContent = `Em ${resultado.totalMeses} meses (${(resultado.totalMeses / 12).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos)`;

    // 3. Barra visual de proporção (Investido vs Juros)
    const pctInvestido = (resultado.totalInvestido / resultado.valorTotalFinal) * 100;
    const pctJuros = (resultado.totalJuros / resultado.valorTotalFinal) * 100;

    barInvested.style.width = `${pctInvestido.toFixed(2)}%`;
    barInterest.style.width = `${pctJuros.toFixed(2)}%`;

    distributionPercentages.textContent = `Investido: ${pctInvestido.toFixed(1)}% | Juros: ${pctJuros.toFixed(1)}%`;

    // 4. Subtítulo da tabela
    tableSubtitle.textContent = `Projeção completa ao longo de ${resultado.totalMeses} meses (${resultado.periodoOriginal} ${resultado.unidadePeriodo})`;

    // 5. Preenchimento Dinâmico da Tabela Mês a Mês
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    resultado.evolucaoMeses.forEach((item) => {
      const tr = document.createElement('tr');

      const tdMes = document.createElement('td');
      tdMes.className = 'text-center col-month';
      tdMes.textContent = item.rotuloMes;

      const tdJurosMes = document.createElement('td');
      tdJurosMes.className = 'text-right col-interest';
      tdJurosMes.textContent = formatarMoeda(item.jurosDoMes);

      const tdTotalInvestido = document.createElement('td');
      tdTotalInvestido.className = 'text-right';
      tdTotalInvestido.textContent = formatarMoeda(item.totalInvestido);

      const tdJurosAcc = document.createElement('td');
      tdJurosAcc.className = 'text-right';
      tdJurosAcc.textContent = formatarMoeda(item.jurosAcumulados);

      const tdValorAcc = document.createElement('td');
      tdValorAcc.className = 'text-right col-total-acc';
      tdValorAcc.textContent = formatarMoeda(item.valorAcumulado);

      tr.appendChild(tdMes);
      tr.appendChild(tdJurosMes);
      tr.appendChild(tdTotalInvestido);
      tr.appendChild(tdJurosAcc);
      tr.appendChild(tdValorAcc);

      fragment.appendChild(tr);
    });

    tableBody.appendChild(fragment);

    // Revela a seção de resultados e efetua rolagem suave até ela
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ==========================================================================
     Exportação para CSV
     ========================================================================== */

  function exportarCsv() {
    if (!dadosSimulacaoAtual || !dadosSimulacaoAtual.evolucaoMeses) return;

    // Cabeçalho compatível com Excel brasileiro (separador ';')
    let csvConteudo = '\uFEFF'; // Byte Order Mark (BOM) para acentuação correta
    csvConteudo += 'Mês;Juros do mês;Total investido;Juros acumulados;Valor acumulado\r\n';

    dadosSimulacaoAtual.evolucaoMeses.forEach(item => {
      const jurosMes = item.jurosDoMes.toFixed(2).replace('.', ',');
      const totInvest = item.totalInvestido.toFixed(2).replace('.', ',');
      const jurosAcc = item.jurosAcumulados.toFixed(2).replace('.', ',');
      const valAcc = item.valorAcumulado.toFixed(2).replace('.', ',');

      csvConteudo += `"${item.rotuloMes}";"${jurosMes}";"${totInvest}";"${jurosAcc}";"${valAcc}"\r\n`;
    });

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `simulacao_juros_compostos_${dadosSimulacaoAtual.totalMeses}_meses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  btnExportarCsv.addEventListener('click', exportarCsv);

  /* ==========================================================================
     Eventos do Formulário
     ========================================================================== */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { valido, dados } = validarEntradas();
    if (valido) {
      const resultado = simularJurosCompostos(dados);
      renderizarResultados(resultado);
    }
  });

  btnLimpar.addEventListener('click', () => {
    form.reset();
    limparErros();
    resultsSection.classList.add('hidden');
    dadosSimulacaoAtual = null;
    inputValorInicial.focus();
  });

  // Valores de exemplo iniciais para facilitar o teste imediato
  inputValorInicial.value = '5.000,00';
  inputAporteMensal.value = '500,00';
  inputTaxaJuros.value = '12,00';
  selectTipoTaxa.value = 'anual';
  inputPeriodo.value = '5';
  selectUnidadePeriodo.value = 'anos';

  // Realiza um primeiro cálculo automático para demonstração imediata
  const checkInitial = validarEntradas();
  if (checkInitial.valido) {
    const res = simularJurosCompostos(checkInitial.dados);
    renderizarResultados(res);
  }
});
