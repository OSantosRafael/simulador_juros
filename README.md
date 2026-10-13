# Simulador de Juros Compostos

Simulador financeiro de juros compostos desenvolvido em **HTML5**, **CSS3** e **JavaScript puro (Vanilla JS)**, focado em alta usabilidade, precisão matemática e design responsivo.

---

## 📌 Pesquisa e Fundamentação Matemática

Antes do desenvolvimento, foram consolidadas as regras do mercado financeiro e da matemática financeira:

### 1. Tratamento da Taxa Anual vs. Mensal
Em juros compostos, a taxa anual não é simplesmente dividida por 12 (isso seria juro simples). Utiliza-se a **taxa equivalente efetiva composta**:
$$i_m = (1 + i_a)^{\frac{1}{12}} - 1$$
*Exemplo:* Uma taxa de $12\%$ ao ano equivale a:
$$(1 + 0{,}12)^{1/12} - 1 \approx 0{,}9489\%\text{ ao mês}$$

Se o usuário selecionar taxa mensal, a taxa informada é aplicada diretamente ($i_m = i / 100$).

### 2. Aplicação Mês a Mês e Aportes Mensais
O cálculo segue o modelo de aportes regulares postecipados (ao final do mês):
- **Mês 0 (Início):**
  - Saldo acumulado = $\text{Valor Inicial}$
  - Total investido = $\text{Valor Inicial}$
  - Juros acumulados = $R\$\ 0{,}00$
- **Para cada Mês $k$ ($1 \le k \le n$):**
  - $\text{Juros do Mês } k = \text{Saldo ao final do Mês }(k-1) \times i_m$
  - $\text{Juros Acumulados } k = \text{Juros Acumulados }(k-1) + \text{Juros do Mês } k$
  - $\text{Total Investido } k = \text{Valor Inicial} + (\text{Aporte Mensal} \times k)$
  - $\text{Valor Acumulado } k = \text{Saldo anterior} + \text{Juros do Mês } k + \text{Aporte Mensal}$

### 3. Total Investido e Total em Juros
- $\text{Valor Total Investido} = \text{Valor Inicial} + (\text{Aporte Mensal} \times n)$
- $\text{Total em Juros} = \text{Valor Total Final} - \text{Valor Total Investido} = \sum_{k=1}^n \text{Juros do Mês } k$

---

## 🚀 Como Executar

Por estar na pasta `c:\xampp\htdocs\simulador_juros`:
1. Inicie o Apache no **XAMPP Control Panel**.
2. Abra o navegador e acesse:
   ```text
   http://localhost/simulador_juros/
   ```
   *(Ou abra diretamente o arquivo `index.html` em qualquer navegador moderno).*

---

## 🛠️ Tecnologias e Recursos
- **HTML5 Semântico:** formulário acessível com labels, inputs com `inputmode` e atributos aria.
- **CSS3 Moderno:** Flexbox, CSS Grid, variáveis CSS, sombras e layout clean.
- **JavaScript Puro:**
  - `Intl.NumberFormat` / `.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` para formatação em Real brasileiro.
  - Renderização dinâmica com `DocumentFragment`.
  - Exportação da simulação completa para planilha **CSV** (compatível com Excel brasileiro e UTF-8 BOM).
