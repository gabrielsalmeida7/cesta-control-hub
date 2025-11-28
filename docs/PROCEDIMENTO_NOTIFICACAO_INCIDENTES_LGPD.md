# Procedimento de Notificação de Incidentes de Segurança - LGPD

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Base Legal:** Lei nº 13.709/2018 (LGPD) - Art. 48  

---

## 1. OBJETIVO

Este documento estabelece os procedimentos para identificação, tratamento e notificação de incidentes de segurança envolvendo dados pessoais, conforme exigido pela LGPD.

## 2. DEFINIÇÕES

### 2.1. Incidente de Segurança

Qualquer evento confirmado ou suspeito que resulte em:
- Acesso não autorizado a dados pessoais
- Vazamento, perda ou destruição de dados pessoais
- Alteração indevida de dados pessoais
- Indisponibilidade não planejada de sistemas com dados pessoais
- Comprometimento da confidencialidade, integridade ou disponibilidade de dados

### 2.2. Gravidade do Incidente

#### 🟢 BAIXA
- Impacto limitado
- Poucos titulares afetados (< 10)
- Dados não sensíveis
- Não há risco real aos direitos dos titulares

#### 🟡 MÉDIA
- Impacto moderado
- Número moderado de titulares (10-100)
- Possível risco aos direitos dos titulares
- Dados pessoais não sensíveis expostos

#### 🔴 ALTA
- Impacto significativo
- Grande número de titulares (> 100)
- Dados sensíveis expostos (CPF, endereço, histórico)
- Risco real e relevante aos direitos dos titulares
- Exposição pública de dados

#### 🚨 CRÍTICA
- Impacto severo
- Exposição massiva de dados
- Dados sensíveis de todos os titulares comprometidos
- Alto risco de danos aos titulares
- Possibilidade de uso malicioso

## 3. EQUIPE DE RESPOSTA

### 3.1. Responsáveis

| Função | Responsável | Contato | Responsabilidade |
|--------|------------|---------|------------------|
| **DPO** | [Nome] | dpo@cestacontrolhub.com.br | Coordenação geral |
| **TI/Segurança** | [Nome] | ti@cestacontrolhub.com.br | Contenção técnica |
| **Jurídico** | [Nome] | juridico@cestacontrolhub.com.br | Aspectos legais |
| **Comunicação** | [Nome] | comunicacao@cestacontrolhub.com.br | Notificações |

### 3.2. Contatos de Emergência

- **ANPD:** 0800-xxx-xxxx / anpd@gov.br
- **Advogado:** [Telefone/Email]
- **Suporte Técnico:** [Telefone/Email 24/7]

## 4. FLUXO DE RESPOSTA

### Fase 1: DETECÇÃO (0-1 hora)

#### Canais de Detecção
- Sistemas de monitoramento automatizado
- Alertas de segurança
- Relato de usuários/funcionários
- Auditoria de logs
- Comunicação de terceiros

#### Ações Imediatas
1. ✅ Registrar data/hora da descoberta
2. ✅ Documentar evidências iniciais
3. ✅ Acionar DPO imediatamente
4. ✅ Preservar logs e evidências
5. ✅ Iniciar registro de incidente

### Fase 2: AVALIAÇÃO (1-4 horas)

#### Perguntas-Chave
- ✓ Qual a natureza do incidente?
- ✓ Quais dados foram afetados?
- ✓ Quantos titulares foram impactados?
- ✓ Qual a gravidade estimada?
- ✓ Como ocorreu o incidente?
- ✓ O incidente está contido?

#### Ações
1. ✅ Classificar gravidade (Baixa/Média/Alta/Crítica)
2. ✅ Identificar dados/titulares afetados
3. ✅ Avaliar riscos aos direitos dos titulares
4. ✅ Determinar causa raiz (preliminar)
5. ✅ Definir necessidade de notificação ANPD/titulares

### Fase 3: CONTENÇÃO (Imediato - 24 horas)

#### Ações Técnicas
- 🔒 Isolar sistemas afetados
- 🔒 Revogar acessos comprometidos
- 🔒 Alterar credenciais
- 🔒 Aplicar patches de segurança
- 🔒 Bloquear vetores de ataque
- 🔒 Fazer backup de evidências

#### Ações Administrativas
- 📋 Reunir equipe de resposta
- 📋 Documentar todas as ações
- 📋 Preparar cronograma de resposta
- 📋 Iniciar análise forense (se necessário)

### Fase 4: NOTIFICAÇÃO

#### 4.1. Notificação à ANPD (Art. 48, §1º)

**Quando Notificar:**
- Incidentes de gravidade ALTA ou CRÍTICA
- Sempre que houver risco ou dano relevante aos titulares
- **Prazo:** Em prazo razoável (recomendado: até 72 horas)

**Como Notificar:**
- Portal: https://www.gov.br/anpd
- Email: anpd@gov.br
- Formulário oficial da ANPD

**Informações Obrigatórias:**
1. Descrição da natureza dos dados afetados
2. Informações sobre os titulares afetados
3. Indicação das medidas técnicas e de segurança
4. Riscos relacionados ao incidente
5. Motivos da demora (se houver)
6. Medidas adotadas para reverter ou mitigar

**Template de Notificação ANPD:**

```
NOTIFICAÇÃO DE INCIDENTE DE SEGURANÇA DE DADOS PESSOAIS

1. IDENTIFICAÇÃO DO CONTROLADOR
   Nome: Cesta Control Hub
   CNPJ: [CNPJ]
   Endereço: [Endereço]
   DPO: [Nome] - dpo@cestacontrolhub.com.br

2. DESCRIÇÃO DO INCIDENTE
   Data/Hora: [DD/MM/AAAA HH:MM]
   Tipo: [Acesso não autorizado/Vazamento/Perda/etc]
   Descrição: [Detalhamento do ocorrido]

3. DADOS AFETADOS
   Tipos de dados: CPF, Nome, Endereço, Telefone, Histórico de entregas
   Quantidade de titulares: [Número]
   Categorias: Famílias beneficiárias

4. MEDIDAS ADOTADAS
   - [Ação 1 - Data/Hora]
   - [Ação 2 - Data/Hora]
   - [Ação 3 - Data/Hora]

5. RISCOS AOS TITULARES
   [Avaliação de risco: uso indevido, fraude, discriminação, etc]

6. MEDIDAS DE MITIGAÇÃO
   [Ações para reduzir/eliminar riscos]

7. CRONOGRAMA
   - Detecção: [Data/Hora]
   - Contenção: [Data/Hora]
   - Notificação ANPD: [Data/Hora]
   - Notificação titulares: [Previsão]

8. CONTATO
   Nome: [DPO]
   Email: dpo@cestacontrolhub.com.br
   Telefone: (34) 99999-0000
```

#### 4.2. Notificação aos Titulares (Art. 48, §2º)

**Quando Notificar:**
- Sempre que houver risco ou dano relevante
- Conforme determinado pela ANPD

**Prazo:**
- Em prazo razoável (recomendado: até 72 horas após ANPD)

**Método de Comunicação:**
- Email (preferencialmente)
- SMS (se disponível)
- Carta registrada (se necessário)
- Publicação no site (último recurso)

**Template de Notificação ao Titular:**

```
Assunto: IMPORTANTE - Notificação de Incidente de Segurança

Prezado(a) [Nome do Titular],

Estamos entrando em contato para informá-lo(a) sobre um incidente de segurança que pode ter afetado seus dados pessoais cadastrados em nosso sistema.

O QUE ACONTECEU?
[Descrição clara e simples do incidente]

QUANDO ACONTECEU?
O incidente foi identificado em [data] e imediatamente contido.

QUAIS DADOS FORAM AFETADOS?
Os seguintes dados podem ter sido expostos:
- [Lista de tipos de dados]

O QUE ESTAMOS FAZENDO?
- Notificamos a Autoridade Nacional de Proteção de Dados (ANPD)
- Implementamos medidas de segurança adicionais
- [Outras ações específicas]

O QUE VOCÊ PODE FAZER?
- Fique atento a tentativas de fraude ou uso indevido de seus dados
- [Recomendações específicas baseadas no tipo de dado]
- Em caso de dúvida, entre em contato conosco

SEUS DIREITOS
Você tem o direito de:
- Solicitar informações adicionais sobre o incidente
- Requerer a eliminação de seus dados
- Revogar seu consentimento

CONTATO
Para mais informações ou exercer seus direitos:
- Email: dpo@cestacontrolhub.com.br
- Telefone: (34) 99999-0000
- Horário: Segunda a Sexta, 9h às 18h

Lamentamos o ocorrido e reafirmamos nosso compromisso com a proteção de seus dados pessoais.

Atenciosamente,
[Nome do DPO]
Encarregado de Proteção de Dados
Cesta Control Hub
```

### Fase 5: RECUPERAÇÃO (24-72 horas)

#### Ações
- 🔧 Restaurar sistemas afetados
- 🔧 Verificar integridade dos dados
- 🔧 Implementar correções permanentes
- 🔧 Reforçar controles de segurança
- 🔧 Testar medidas implementadas
- 🔧 Retomar operações normais

### Fase 6: PÓS-INCIDENTE (Após contenção)

#### Análise
- 📊 Investigação completa da causa raiz
- 📊 Análise de falhas de processo
- 📊 Avaliação da eficácia da resposta
- 📊 Identificação de lições aprendidas

#### Documentação
- 📝 Relatório completo do incidente
- 📝 Cronologia detalhada
- 📝 Ações tomadas e resultados
- 📝 Recomendações de melhorias

#### Melhorias
- ⚡ Atualizar procedimentos
- ⚡ Implementar controles adicionais
- ⚡ Treinar equipe
- ⚡ Revisar políticas de segurança

## 5. REGISTRO DE INCIDENTES

### 5.1. Informações a Registrar

| Campo | Descrição |
|-------|-----------|
| **ID** | Identificador único (INC-AAAA-MM-XXX) |
| **Data/Hora Detecção** | Quando foi identificado |
| **Data/Hora Ocorrência** | Quando ocorreu (estimada) |
| **Tipo** | Vazamento/Acesso/Perda/Alteração |
| **Gravidade** | Baixa/Média/Alta/Crítica |
| **Dados Afetados** | Tipos e quantidade |
| **Titulares Afetados** | Número e categoria |
| **Causa** | Técnica/Humana/Externa |
| **Notificação ANPD** | Sim/Não + Data |
| **Notificação Titulares** | Sim/Não + Data |
| **Status** | Aberto/Em tratamento/Resolvido |
| **Responsável** | Quem está tratando |

### 5.2. Arquivo de Incidentes

- Manter registro por no mínimo 5 anos
- Disponibilizar para ANPD quando solicitado
- Revisar periodicamente (trimestral)

## 6. PREVENÇÃO

### 6.1. Medidas Preventivas

- ✅ Monitoramento contínuo de segurança
- ✅ Atualizações regulares de sistema
- ✅ Treinamentos periódicos da equipe
- ✅ Testes de penetração anuais
- ✅ Auditorias de segurança semestrais
- ✅ Backup diário de dados
- ✅ Controle de acesso rigoroso
- ✅ Criptografia de dados sensíveis
- ✅ Logs de auditoria habilitados

### 6.2. Simulações

- Realizar simulações de incidente (anual)
- Testar procedimentos de notificação
- Avaliar tempo de resposta da equipe
- Atualizar procedimentos conforme necessário

## 7. RESPONSABILIDADES

| Função | Responsabilidade |
|--------|------------------|
| **DPO** | Coordenar resposta, comunicar ANPD e titulares |
| **TI** | Contenção técnica, análise forense |
| **Jurídico** | Avaliar aspectos legais, revisar comunicações |
| **Diretoria** | Aprovar comunicações oficiais |
| **Todos** | Reportar suspeitas imediatamente |

## 8. CANAIS DE REPORTE

### Interno
- Email: incidentes@cestacontrolhub.com.br
- Telefone: (34) 99999-0000 (24/7)
- Sistema: Portal interno de incidentes

### Externo (para titulares)
- Email: dpo@cestacontrolhub.com.br
- Telefone: (34) 99999-0000
- Formulário web: [link]

## 9. PENALIDADES (LGPD)

Não notificar a ANPD pode resultar em:
- Advertência
- Multa simples (até 2% do faturamento, limitado a R$ 50 milhões)
- Multa diária
- Publicização da infração
- Bloqueio ou eliminação dos dados

## 10. REVISÃO DESTE PROCEDIMENTO

- **Periodicidade:** Anual ou após cada incidente
- **Responsável:** DPO
- **Aprovação:** Diretoria

---

**IMPORTANTE:** Este documento deve ser conhecido por toda a equipe que tem acesso a dados pessoais.

**Última Revisão:** Janeiro 2025  
**Próxima Revisão:** Janeiro 2026  
**Responsável:** [Nome do DPO]

