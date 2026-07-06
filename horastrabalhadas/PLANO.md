# Plano de Desenvolvimento — Sistema de Horas Trabalhadas

## 1. Visão Geral

Aplicação web client-side (HTML/CSS/JS puro) para registro e cálculo de horas trabalhadas
por um funcionário ao longo dos meses. O usuário seleciona um mês/ano, preenche horários de
entrada/saída de cada dia, e o sistema calcula automaticamente:
- Horas trabalhadas por dia (manhã + tarde, descontando intervalo de almoço)
- Saldo diário (positivo/negativo em relação à carga horária padrão)
- Total do mês e saldo mensal
- Totalizador acumulado de todos os meses salvos
- Importação/exportação dos dados em arquivo .txt

## 2. Requisitos Funcionais

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| F1 | Seleção de mês/ano | Dropdown ou datepicker para escolher o mês de referência |
| F2 | Navegação entre meses | Botões "mês anterior" / "próximo mês" |
| F3 | Grid de dias | Exibe dinamicamente todos os dias do mês (28 a 31 dias) |
| F4 | Entrada/Saída | 4 campos de horário por dia: Entrada, Saída Almoço, Retorno Almoço, Saída |
| F5 | Cálculo diário | Horas = (saídaAlmoço − entrada) + (saída − retornoAlmoço) |
| F6 | Saldo diário | Horas do dia − carga horária padrão do dia da semana (seg-sex: 8h, sáb: 4h, dom: 0h) |
| F7 | Totais do mês | Soma de horas e saldo do mês corrente |
| F8 | Totalizador geral | Soma acumulada dos saldos de todos os meses salvos |
| F9 | Persistência | Salvar/recuperar dados via localStorage |
| F10 | Configurações | Carga horária por dia da semana e dias úteis — configuração por mês |
| F11 | Marcação visual | Destaque para sábados/domingos, saldo positivo (verde) e negativo (vermelho) |
| F12 | Lista de meses salvos | Painel lateral com resumo de cada mês armazenado |
| F13 | Exportar dados (.txt) | Gerar arquivo .txt com todas as horas registradas, em formato tabular legível |
| F14 | Importar dados (.txt) | Carregar arquivo .txt previamente exportado, sobrescrevendo os dados atuais no localStorage |
| F15 | Status do dia | Select por dia: Normal, Abonado, Falta, Férias. Controla como o saldo do dia é calculado |
| F16 | Marcar falta | Opção "Falta" no select (horas = 0, saldo = −carga padrão) |
| F17 | Carga horária do dia | Campo "Carga" por dia para definir carga horária especial (ex: 4h para meio período) |
| F18 | Relatório consolidado | Gera relatório HTML com resumo por mês, totais e saldo acumulado. Abre em nova aba, pronto para imprimir |
| F19 | Marcar férias | Opção "Férias" no select (saldo = 0, mesmo comportamento do Abonado para cálculo) |

## 3. Modelo de Dados (localStorage)

Chave: `horasTrabalhadas`

```json
{
  "months": {
    "2026-01": {
      "config": {
        "standardHoursPerDay": 8,
        "saturdayHours": 4,
        "sundayHours": 0,
        "workingDays": [1, 2, 3, 4, 5]
      },
      "days": {
        "1": { "entry": "08:00", "lunchOut": "12:00", "lunchReturn": "13:00", "exit": "17:00", "excused": false, "absent": false },
        "2": { "entry": "08:15", "lunchOut": "12:00", "lunchReturn": "13:00", "exit": "17:45", "excused": false, "absent": false }
      }
    },
    "2026-02": { ... }
  },
  "defaultConfig": {
    "standardHoursPerDay": 8,
    "saturdayHours": 4,
    "sundayHours": 0,
    "workingDays": [1, 2, 3, 4, 5]
  },
  "employeeName": "João Silva"
}
```

- `workingDays`: 0=Domingo, 1=Segunda, ... 6=Sábado
- Meses sem dados no objeto `months` são considerados "não preenchidos"

### 3.1 Formato do Arquivo .txt (Exportação/Importação)

O arquivo `.txt` segue um formato tabular com delimitador pipe (`|`), legível tanto
para máquina quanto para humanos abrirem no Excel/Bloco de Notas.

```
# SISTEMA DE HORAS TRABALHADAS - EXPORTAÇÃO
# Data: 05/07/2026 14:30
# FUNCIONARIO: João Silva
# ================================================
# MES | DIA | DIA_SEMANA | ENTRADA | SAIDA_ALMOCO | RETORNO_ALMOCO | SAIDA | ABONADO | FALTA | FERIAS | CARGA | HORAS | SALDO
2026-01|1|Seg|08:00|12:00|13:00|17:00|||||8,0|0,0
2026-01|2|Ter|08:15|12:00|13:00|18:30|||||9,2|1,2
2026-01|3|Qua|08:00|12:00|13:00|17:00|||||8,0|0,0
...
# TOTAIS DO MÊS 2026-01: 176,0h | Saldo: +8,0h
# ================================================
2026-02|1|Qui|08:00|||17:00|||||8,0|0,0
...
# TOTAIS DO MÊS 2026-02: 160,0h | Saldo: 0,0h
# ================================================
# TOTALIZADOR GERAL: +32,0h
```

**Regras do formato:**
- Linhas iniciadas com `#` são comentários/metadados (ignoradas na importação)
- `# FUNCIONARIO:` armazena o nome do funcionário e é restaurado na importação (modo substituir)
- Cada linha de dados tem 13 campos: `MES|DIA|DIA_SEMANA|ENTRADA|SAIDA_ALMOCO|RETORNO_ALMOCO|SAIDA|ABONADO|FALTA|FERIAS|CARGA|HORAS|SALDO`
- `ABONADO`, `FALTA` e `FERIAS` são preenchidos com "Sim" quando ativos, vazios caso contrário
- `CARGA` armazena a carga horária personalizada do dia (vazio se não definida)
- `HORAS` e `SALDO` são armazenados com vírgula como decimal (padrão pt-BR)
- `DIA_SEMANA` é informativo na exportação e ignorado na importação (recalculado)
- `SAIDA_ALMOCO` e `RETORNO_ALMOCO` podem estar vazios (sem intervalo)
- Blocos de mês são separados por uma linha com `# ======...`
- O totalizador geral vai na última linha de comentário

**Processo de importação:**
1. Usuário seleciona arquivo `.txt` via `<input type="file">`
2. Sistema faz parse linha a linha, ignorando comentários
3. Reconstrói o objeto `months` agrupando por `YYYY-MM`
4. Pergunta ao usuário: "Deseja substituir todos os dados ou mesclar com os existentes?"
5. Se mesclar: dados existentes têm prioridade (não sobrescreve dia já preenchido)
6. Se substituir: limpa localStorage e importa tudo
7. Configurações do arquivo (carga horária) são importadas apenas se substituir
8. Após importação, recalcula totalizador e renderiza

## 4. Regras de Cálculo

```
minutosManha   = max(0, saidaAlmoco − entrada)
minutosTarde   = max(0, saida − retornoAlmoco)
minutosTrab    = minutosManha + minutosTarde

horasDiarias(dia)   = minutosTrab / 60
cargaPadrao(dia)    = getStandardHoursForDay(diaDaSemana, config)
saldoDiario(dia)    = horasDiarias − cargaPadrao(dia)

// Se o dia for abonado (feriado/folga):
//   horasDiarias = cargaPadrao(dia), saldoDiario = 0

// Se o dia for falta:
//   horasDiarias = 0, saldoDiario = −cargaPadrao(dia)

totalMes     = Σ horasDiarias de todos os dias preenchidos
saldoMes     = Σ saldoDiario de todos os dias preenchidos
totalizador  = Σ saldoMes de todos os meses salvos
```

Tratamento de casos especiais:
- **Virar madrugada**: se saída < entrada, adiciona 24h ao cálculo
- **Dia incompleto**: se falta entrada ou saída, horas = 0 (não conta)
- **Fim de semana**: exibido em cinza; opcionalmente carga horária = 0

## 5. Estrutura de Arquivos

```
horastrabalhadas/
├── index.html          — estrutura da página
├── css/
│   └── style.css       — estilos (responsivo, tema claro)
├── js/
│   ├── app.js          — inicialização e orquestração
│   ├── storage.js      — leitura/escrita no localStorage
│   ├── calculator.js   — lógica de cálculo de horas
│   ├── renderer.js     — renderização da tabela e totais
│   ├── config.js       — painel de configurações
│   ├── io.js           — importação/exportação de arquivos .txt
│   └── report.js       — geração de relatório HTML consolidado
└── PLANO.md            — este arquivo
```

## 6. Layout da Interface

```
┌──────────────────────────────────────────────────────┐
│  🕐  SISTEMA DE HORAS TRABALHADAS                    │
├──────────────────────────────────────────────────────┤
│  [◀] [Mês/Ano ▼] [▶]  [Importar] [Exportar] [Relatório] [Limpar Mês] [Config]  │
├──────────────────────────────────────────────────────┤
│  Dia │ Dia Sem.│Entrada│S. Alm│R. Alm│ Saída │Status│Carga│Horas│Saldo │
│  ────┼─────────┼───────┼──────┼──────┼───────┼──────┼─────┼─────┼──────│
│  1   │ Seg     │ 08:00 │12:00 │13:00 │ 17:00 │  —   │     │8,0h │ 0,0h │
│  2   │ Ter     │ 08:15 │12:00 │13:00 │ 18:30 │  —   │     │9,2h │+1,2h │
│  15  │ Qua     │  —    │  —   │  —   │  —    │Abon. │     │8,0h │ 0,0h │
│  20  │ Qui     │  —    │  —   │  —   │  —    │Falta │     │0,0h │−8,0h │
│  25  │ Ter     │  —    │  —   │  —   │  —    │Férias│     │8,0h │ 0,0h │
│  ────┼─────────┼───────┼──────┼──────┼───────┼──────┼─────┼──────│
│  1   │ Seg     │ 08:00 │12:00 │13:00 │ 17:00 │      │      │8,0h │ 0,0h │
│  2   │ Ter     │ 08:15 │12:00 │13:00 │ 18:30 │      │      │9,2h │+1,2h │
│  15  │ Qua     │  —    │  —   │  —   │  —    │  ✓   │      │8,0h │ 0,0h │ (abonado)
│  20  │ Qui     │  —    │  —   │  —   │  —    │      │  ✓   │0,0h │−8,0h │ (falta)
│  30  │ Sáb (cinza)              Fim de semana              │
├──────────────────────────────────────────────────────┤
│  TOTAL DO MÊS: 176,0h trabalhadas                    │
│  SALDO DO MÊS:  +8,0h    (verde)                    │
├──────────────────────────────────────────────────────┤
│  TOTALIZADOR GERAL:  +32,0h  (verde)                │
├──────────────────────────────────────────────────────┤
│  📋 Meses salvos:                                    │
│  2026-01  Saldo: +8h   2026-02  Saldo: +5h          │
└──────────────────────────────────────────────────────┘
```

## 7. Plano de Implementação (Etapas)

### Etapa 1 — Estrutura base ✅
- [x] Criar `index.html` com esqueleto da página
- [x] Criar `css/style.css` com variáveis CSS, layout responsivo
- [x] Criar `js/app.js` com estrutura de módulos (IIFE + namespace `App`)

### Etapa 2 — Armazenamento ✅
- [x] Implementar `storage.js`: funções `load()`, `save()`, `getMonthData()`, `setMonthDay()`, `getConfig()`, `setConfig()`, `getAllMonths()`, `replaceAllData()`, `mergeData()`
- [x] Inicializar dados padrão na primeira execução

### Etapa 3 — Cálculos ✅
- [x] Implementar `calculator.js`:
  - [x] `calcDay(entry, lunchOut, lunchReturn, exit)` → { minutes, hours, hoursDecimal }
  - [x] `calcMonthTotals(monthKey, monthData, config)` → { totalMinutes, totalHours, totalHoursDecimal, balanceMinutes, balanceDecimal }
  - [x] `calcGlobalTotal(allMonthsData, config)` → totalizador (decimal)
  - [x] `getStandardHoursForDay(dayOfWeek, config)` → carga horária por dia da semana
  - [x] Funções auxiliares: `timeToMinutes`, `minutesToTime`, `formatBalance`, `formatHours`, `getDayName`, `getDaysInMonth`

### Etapa 4 — Renderização ✅
- [x] Implementar `renderer.js`:
  - [x] `renderMonthGrid(monthKey, monthData, config)` → tabela de dias
  - [x] `renderMonthSummary(monthData, config)` → totais do mês
  - [x] `renderGlobalTotalizer(total)` → totalizador geral
  - [x] `renderSavedMonthsList(allMonths, config)` → badges dos meses salvos

### Etapa 5 — Interatividade ✅
- [x] Conectar eventos: change no seletor de mês, blur nos inputs de horário, clique nos botões de navegação
- [x] Auto-salvar ao alterar qualquer horário (save imediato no change)
- [x] Atualizar totais em tempo real

### Etapa 6 — Configurações ✅
- [x] Painel modal com:
  - [x] Carga horária diária padrão (default 8h)
  - [x] Carga horária sábado (default 4h)
  - [x] Carga horária domingo (default 0h)
  - [x] Checkboxes para dias úteis (seg-sex padrão)
- [x] Ao alterar config, recalcular totais de todos os meses

### Etapa 7 — Polimento ✅
- [x] Validação de input (input[type="time"] nativo)
- [x] Indicadores visuais de saldo (verde positivo / vermelho negativo)
- [x] Tratamento de fim de semana com estilo diferenciado (cinza, sem inputs)
- [x] Responsividade para mobile (media query 640px)
- [x] Animações no modal (fadeIn + scale)

### Etapa 8 — Importação/Exportação (.txt) ✅
- [x] Implementar `io.js`:
  - [x] `exportToTxt(allMonths, config, employeeName)` → gera string formatada com todos os meses e nome do funcionário
  - [x] `parseTxt(content)` → extrai dados do arquivo .txt, retorna `{ months, config, errors, employeeName }`
  - [x] `downloadTxt(content, filename)` → dispara download via `Blob` + link temporário
  - [x] `importFile(file, mergeMode)` → lê arquivo via `FileReader`, faz parse e mescla/substitui
- [x] Botão "Exportar" na barra de ferramentas → gera e baixa `horas_primeironome_ultimonome.txt` (ou `horas.txt` se nome vazio)
- [x] Botão "Importar" → abre seletor de arquivo nativo (`<input type="file" accept=".txt">`)
- [x] Modal de confirmação ao importar: "Substituir tudo" ou "Mesclar (manter dados existentes)"
- [x] Nome do funcionário é incluído no arquivo exportado e restaurado na importação (modo substituir)

## 8. Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Framework | Nenhum (vanilla JS) | Zero dependências, simples de rodar |
| Persistência | localStorage | Dados locais, sem backend |
| Módulos JS | IIFE + namespace global | Compatível sem bundler |
| Estilização | CSS puro com variáveis | Sem pré-processador necessário |
| Horários | Input type="time" | Validação nativa do browser |
| Formato data | ISO 8601 (YYYY-MM) | Padrão internacional, ordenável |

## 9. Casos de Borda

- Mês sem nenhum dia preenchido → totais zerados, saldo = 0
- Entrada preenchida mas saída vazia → não calcula horas para esse dia
- Horário de saída menor que entrada → assume virada de madrugada (+24h)
- localStorage cheio ou indisponível → aviso ao usuário, funciona em memória
- Navegador sem suporte a input[type=time] → fallback para input text com máscara
- Mudança de mês sem salvar → auto-save antes de trocar
- Fevereiro em ano bissexto → Date API trata automaticamente
- Importar arquivo com formato inválido → exibir erro com número da linha problemática
- Importar arquivo com mês/ano inválido (ex: 2026-13) → pular linha com aviso
- Importar arquivo com encoding diferente de UTF-8 → tentar detectar e converter
- Exportar sem dados → gerar arquivo apenas com cabeçalho e totalizador zerado
- Arquivo de exportação corrompido/manipulado manualmente → validar cada campo na importação
- Conflito de merge: dia já preenchido localmente → manter dado local, logar aviso
- Dia abonado sem horários preenchidos → assume carga horária padrão do dia, saldo = 0
- Dia abonado com horários preenchidos → inputs são ignorados, prevalece a carga padrão
- Marcar dia como abonado → desabilita os inputs de horário automaticamente
