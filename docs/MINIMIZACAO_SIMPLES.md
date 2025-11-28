# Minimização de Dados - Versão Simplificada

**Sistema:** Cesta Control Hub  
**Princípio:** Coletar apenas o essencial  
**Atualizado em:** Janeiro 2025

---

## 🎯 O que é Minimização?

**Princípio LGPD (Art. 6º, III):** Coletar apenas dados **necessários** para a finalidade.

**Na prática:**
- ✅ Pergunte: "Realmente precisamos deste dado?"
- ✅ Se a resposta for "seria bom ter", **NÃO colete**
- ✅ Se a resposta for "essencial para funcionar", **pode coletar**

---

## 📋 Dados que Coletamos

### ✅ Dados OBRIGATÓRIOS (Essenciais)

**Famílias:**
- **Nome completo** - Para identificação
- **CPF** - Identificação única (evitar duplicidade)
- **Número de membros** - Calcular tamanho da cesta

**Instituições:**
- **Nome da instituição** - Identificação
- **Telefone** - Contato

**Usuários do Sistema:**
- **Email** - Login
- **Senha** - Autenticação
- **Nome** - Identificação no sistema

**Por que são obrigatórios?**
- Sistema não funciona sem eles
- LGPD permite (execução de política pública)

### ⚠️ Dados OPCIONAIS (Úteis, mas não essenciais)

**Famílias:**
- **Telefone** - Facilita contato (mas não essencial)
- **Endereço** - Útil para logística (mas não obrigatório)
- **Pessoa de contato** - Ajuda comunicação

**Instituições:**
- **Endereço** - Útil para relatórios

**Por que são opcionais?**
- Sistema funciona sem eles
- Coleta apenas se titular concordar
- Podem ser deixados em branco

### ❌ Dados que NÃO Coletamos

**Nunca coletamos:**
- ❌ RG (CPF já identifica)
- ❌ Estado civil
- ❌ Raça/cor
- ❌ Religião
- ❌ Orientação sexual
- ❌ Dados de saúde (doenças, etc)
- ❌ Dados bancários
- ❌ Renda familiar (a menos que exigido por lei)

**Por que não?**
- Não são necessários para distribuir cestas
- Alguns são dados sensíveis (LGPD Art. 5º, II)
- Aumentam risco sem benefício

---

## ✅ Checklist Antes de Adicionar Novo Campo

Antes de coletar um novo dado, pergunte:

1. **É realmente necessário?**
   - [ ] Sim, sem ele o sistema não funciona
   - [ ] Não, seria apenas "bom ter"

2. **Qual a finalidade específica?**
   - [ ] Tenho uma finalidade clara e documentada
   - [ ] "Para ter no banco de dados" NÃO é finalidade válida

3. **Há alternativa?**
   - [ ] Posso obter esse dado de outra forma?
   - [ ] Posso usar dado já coletado?

4. **Titular concorda?**
   - [ ] Será incluído no termo de consentimento
   - [ ] Titular pode recusar e ainda usar serviço

5. **Como proteger?**
   - [ ] Dado sensível (CPF) = criptografado
   - [ ] Acesso restrito via RLS
   - [ ] Prazo de retenção definido

**Se 3+ respostas forem NÃO/negativas:** Não adicione o campo!

---

## 🔄 Revisão Anual

**Todo início de ano, DPO deve:**

1. **Listar todos os campos coletados**
2. **Perguntar para cada um:** "Ainda precisamos?"
3. **Remover campos desnecessários**
4. **Tornar opcionais** os que não são essenciais

**Documentar revisão:**
- Data da revisão
- Campos analisados
- Decisão para cada campo
- Campos removidos (se houver)

---

## 📊 Exemplo Prático

### ❌ Antes (Coleta Excessiva)

```
Formulário de Cadastro:
- Nome completo ✅
- CPF ✅
- RG ❌ (desnecessário)
- Data de nascimento ❌ (desnecessário)
- Estado civil ❌ (desnecessário)
- Profissão ❌ (desnecessário)
- Renda mensal ❌ (sensível e desnecessário)
- Telefone ✅ (opcional)
- Email ❌ (desnecessário se já tem telefone)
- Endereço completo ✅ (opcional)
- Ponto de referência ❌ (desnecessário)
- Número de membros ✅
- Nome de todos os membros ❌ (desnecessário)
- Idade de cada membro ❌ (desnecessário)
```

### ✅ Depois (Minimização)

```
Formulário de Cadastro:
- Nome completo ✅ (obrigatório)
- CPF ✅ (obrigatório)
- Número de membros ✅ (obrigatório)
- Telefone ⚠️ (opcional)
- Endereço ⚠️ (opcional)
- Pessoa de contato ⚠️ (opcional)
```

**Resultado:**
- De 15 campos → 6 campos
- Menos dados = Menos risco
- Cadastro mais rápido
- Conformidade LGPD

---

## 💡 Benefícios da Minimização

**Para a ONG:**
- ✅ Menos dados para proteger
- ✅ Menor risco de vazamento
- ✅ Conformidade LGPD
- ✅ Processo mais rápido

**Para os Titulares:**
- ✅ Mais privacidade
- ✅ Menos exposição
- ✅ Cadastro mais ágil
- ✅ Confiança no sistema

**Para Desenvolvedores:**
- ✅ Menos campos para manter
- ✅ Banco de dados mais limpo
- ✅ Menos complexidade

---

## 📞 Dúvidas?

**Antes de adicionar novo campo, consulte:**
- DPO: dpo@cestacontrolhub.com.br
- Tel: (34) 99999-0000

---

## 📝 Resumo em 3 Pontos

1. **Colete apenas dados essenciais** para distribuir cestas
2. **Revise anualmente** se todos os campos ainda são necessários
3. **Na dúvida, NÃO colete** - pergunte ao DPO

---

**Documento elaborado em conformidade com:**
- Lei nº 13.709/2018 (LGPD) - Art. 6º, III (Necessidade)
- Princípio do Privacy by Design

