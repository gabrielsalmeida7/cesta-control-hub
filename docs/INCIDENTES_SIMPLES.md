# Procedimento de Notificação de Incidentes - Versão Simplificada

**Sistema:** Cesta Control Hub  
**Aplicável a:** Todos os colaboradores  
**Atualizado em:** Janeiro 2025

---

## 🚨 O que é um Incidente de Segurança?

Um incidente ocorre quando dados pessoais são expostos, acessados indevidamente ou perdidos.

### Exemplos de Incidentes:

**Alta Gravidade (notificar ANPD):**
- ❌ Lista de CPFs vazou para pessoas não autorizadas
- ❌ Banco de dados foi hackeado
- ❌ Pendrive com dados foi perdido ou roubado
- ❌ Email com planilha de famílias enviado para pessoa errada
- ❌ Sistema ficou acessível sem senha

**Média Gravidade (resolver internamente):**
- ⚠️ Colaborador acessou dados sem necessidade
- ⚠️ Senha compartilhada entre usuários
- ⚠️ Impressão com dados deixada em local público

**Não é Incidente:**
- ✅ Sistema ficou lento (sem vazamento)
- ✅ Erro ao salvar dados (sem exposição)
- ✅ Esqueci minha senha (sem acesso indevido)

---

## 📋 O que Fazer se Descobrir um Incidente?

### Passo 1: AVISAR DPO IMEDIATAMENTE

**Não tente resolver sozinho!**

**Contato do DPO:**
- 📧 Email: dpo@cestacontrolhub.com.br
- 📱 Telefone: (34) 99999-0000
- ⏰ Horário: Segunda a Sexta, 9h às 18h

**Se for fora do horário e for grave:**
- Ligue diretamente no celular do DPO
- Envie WhatsApp explicando a situação

### Passo 2: PRESERVAR EVIDÊNCIAS

**Faça:**
- ✅ Tire prints da tela (se possível)
- ✅ Anote data, hora e o que aconteceu
- ✅ Guarde emails relacionados
- ✅ Não apague logs do sistema

**Não Faça:**
- ❌ Não apague nada
- ❌ Não tente "consertar"
- ❌ Não avise titulares (DPO fará isso)
- ❌ Não divulgue nas redes sociais

### Passo 3: AGUARDAR INSTRUÇÕES DO DPO

O DPO avaliará a gravidade e tomará as ações necessárias.

---

## 🔍 Avaliação pelo DPO

### DPO Avalia Gravidade

**Incidente GRAVE:**
- Afeta muitos titulares (>10 famílias)
- CPF ou dados sensíveis expostos
- Acesso não autorizado ao banco de dados

**Ação:** Notificar ANPD em até 72 horas + notificar titulares

**Incidente LEVE:**
- Afeta poucos titulares (<10 famílias)
- Dados não sensíveis (telefone, endereço)
- Acesso interno indevido

**Ação:** Resolver internamente, documentar, treinar equipe

---

## 📝 Notificação à ANPD (se necessário)

### Quando Notificar a ANPD?

Notifique a ANPD se o incidente:
- ✅ Pode causar dano aos titulares (CPF exposto, risco de fraude)
- ✅ Afeta dados sensíveis (CPF, dados de saúde)
- ✅ Volume significativo de pessoas afetadas

### Como Notificar?

**Canal:** Portal da ANPD  
https://www.gov.br/anpd

**Prazo:** Até 72 horas após descoberta

**Informações a incluir:**
1. Data e hora do incidente
2. Quantas pessoas afetadas
3. Quais dados foram expostos
4. Como aconteceu
5. O que foi feito para conter
6. Como evitaremos no futuro

### Template de Notificação:

```
Assunto: Notificação de Incidente - [Nome da Organização]

À ANPD,

Venho por meio desta notificar incidente de segurança:

1. DATA/HORA: [DD/MM/AAAA às HH:MM]
2. DESCRIÇÃO: [Ex: planilha com CPFs enviada por email errado]
3. DADOS AFETADOS: [Ex: nome, CPF, telefone de 25 famílias]
4. PESSOAS AFETADAS: [Ex: 25 famílias beneficiárias]
5. AÇÕES TOMADAS: [Ex: email recuperado, destinatário confirmou exclusão, famílias notificadas]
6. PREVENÇÃO: [Ex: implementar dupla verificação em envios de email]

DPO: [Nome]
Email: dpo@[dominio]
Telefone: [telefone]

[Assinatura]
```

---

## 📢 Notificação aos Titulares

### Quando Notificar os Titulares?

Se o incidente pode causar dano relevante (risco de fraude, uso indevido).

### Como Notificar?

**Canais:**
- Email (se tiver)
- Telefone (ligar ou WhatsApp)
- Presencialmente (na próxima visita)

**Prazo:** Imediatamente após avaliar gravidade

### Template de Comunicação aos Titulares:

```
Prezado(a) [Nome],

Informamos que em [data] ocorreu um incidente envolvendo seus dados cadastrais.

O que aconteceu: [explicação simples]

Dados afetados: [nome, CPF, telefone - especificar]

O que fizemos: [ações de contenção]

Riscos: [explicar possíveis riscos, se houver]

O que você deve fazer:
- Fique atento a ligações suspeitas
- Não forneça dados pessoais por telefone
- Em caso de dúvida, nos contate

Estamos à disposição para esclarecimentos.

DPO: [Nome]
Telefone: [telefone]
Email: dpo@[dominio]
```

---

## 📊 Registro de Incidentes

### Documentação Obrigatória

Todo incidente deve ser registrado, mesmo que leve.

**Criar arquivo físico ou digital com:**

| Data | Descrição | Gravidade | Pessoas Afetadas | Ações Tomadas | Responsável |
|------|-----------|-----------|------------------|---------------|-------------|
| 10/01/25 | Email errado | Alta | 15 famílias | ANPD notificada, titulares avisados | DPO |
| 15/02/25 | Senha compartilhada | Baixa | 0 | Senha alterada, treinamento | Admin |

---

## ⏱️ Cronograma de Resposta

### Linha do Tempo do Incidente:

**Hora 0 - Descoberta**
- Colaborador descobre incidente
- Avisa DPO imediatamente

**Hora 1 - Avaliação**
- DPO avalia gravidade
- Decide se notifica ANPD

**Hora 4 - Contenção**
- Bloquear acessos indevidos
- Recuperar dados se possível
- Prevenir novos acessos

**Até 72h - Notificação ANPD**
- Se grave, notificar ANPD
- Preparar documentação completa

**Até 7 dias - Notificação Titulares**
- Comunicar todos os afetados
- Orientar sobre riscos e cuidados

**Até 30 dias - Pós-Incidente**
- Revisar procedimentos
- Treinar equipe
- Implementar melhorias

---

## 🛡️ Prevenção de Incidentes

### Boas Práticas Diárias:

**Todos devem:**
- ✅ Usar senhas fortes e únicas
- ✅ Nunca compartilhar senhas
- ✅ Fazer logout ao sair
- ✅ Não tirar fotos de telas com dados
- ✅ Verificar destinatário antes de enviar email
- ✅ Não imprimir dados sem necessidade
- ✅ Trancar computador ao se ausentar

**Admin/TI deve:**
- ✅ Manter backups atualizados
- ✅ Atualizar sistema regularmente
- ✅ Revisar permissões de acesso
- ✅ Monitorar logs de acesso

---

## 📞 Contatos de Emergência

**DPO (Encarregado):**
- Email: dpo@cestacontrolhub.com.br
- Telefone: (34) 99999-0000

**ANPD (Autoridade Nacional):**
- Site: https://www.gov.br/anpd
- Email: anpd@gov.br
- Tel: (61) 3366-8370

**Suporte Técnico Supabase:**
- https://supabase.com/support
- (se incidente for no banco de dados)

---

## ✅ Checklist Rápido

Se descobrir incidente:

- [ ] Avisar DPO imediatamente
- [ ] Anotar data, hora, o que aconteceu
- [ ] Preservar evidências (prints, emails)
- [ ] Não apagar nada
- [ ] Não tentar resolver sozinho
- [ ] Não avisar titulares (DPO fará)
- [ ] Aguardar instruções do DPO

---

**Lembre-se:** Comunicar um incidente rapidamente é MELHOR do que tentar esconder. A LGPD valoriza transparência e resposta rápida.

---

**Documento elaborado em conformidade com:**
- Lei nº 13.709/2018 (LGPD) - Art. 48
- Resolução CD/ANPD nº 1/2021 (Comunicação de Incidentes)

