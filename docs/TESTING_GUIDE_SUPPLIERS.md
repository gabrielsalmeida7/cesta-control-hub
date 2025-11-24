# Guia de Testes - Sistema de Fornecedores e Estoque

Este documento fornece um passo a passo detalhado para testar todas as funcionalidades do sistema de Fornecedores e Estoque, tanto para usuários **Admin** quanto para usuários **Instituição**.

## Pré-requisitos

1. **Executar as migrações SQL** na ordem:
   - `create_suppliers_table.sql`
   - `create_products_table.sql`
   - `create_inventory_table.sql`
   - `create_stock_movements_table.sql`
   - `create_receipts_table.sql`
   - `update_deliveries_for_receipts.sql`
   - `create_update_inventory_trigger.sql`

2. **Configurar Supabase Storage** (opcional, para recibos):
   - Criar bucket `receipts` no Supabase Storage
   - Configurar políticas de acesso adequadas

3. **Instalar dependência** (opcional, para geração de PDFs):
   ```bash
   npm install jspdf
   ```

---

## TESTES COM USUÁRIO INSTITUIÇÃO

### 1. Acesso à Aba Fornecedores

**Passo 1.1**: Fazer login como usuário de instituição

**Passo 1.2**: Verificar se o botão "Fornecedores" aparece na navegação

**Resultado Esperado**: 
- Botão "Fornecedores" visível na barra de navegação
- Ao clicar, redireciona para `/institution/suppliers`

**Passo 1.3**: Verificar se as 4 abas estão visíveis:
- Fornecedores
- Produtos
- Estoque
- Movimentações

---

### 2. Teste: Cadastro de Fornecedores

**Passo 2.1**: Acessar a aba "Fornecedores"

**Passo 2.2**: Clicar em "Novo Fornecedor"

**Passo 2.3**: Preencher formulário:
- **Nome**: "Mercado Central"
- **Tipo**: Selecionar "Pessoa Jurídica"
- **CPF/CNPJ**: Digitar "12345678000190" (deve formatar automaticamente para "12.345.678/0001-90")
- **Nome de Contato**: "João Silva"
- **Telefone**: "(11) 98765-4321"
- **Email**: "contato@mercadocentral.com"
- **Endereço**: "Rua das Flores, 123"
- **Observações**: "Fornecedor principal de alimentos"

**Passo 2.4**: Clicar em "Salvar"

**Resultado Esperado**:
- Toast de sucesso: "Fornecedor cadastrado com sucesso!"
- Fornecedor aparece na lista
- CNPJ formatado corretamente na tabela

**Passo 2.5**: Cadastrar um segundo fornecedor (Pessoa Física):
- **Nome**: "Maria Santos"
- **Tipo**: "Pessoa Física"
- **CPF/CNPJ**: "12345678901" (deve formatar para "123.456.789-01")
- Preencher outros campos opcionais

**Resultado Esperado**: Fornecedor PF cadastrado com CPF formatado

---

### 3. Teste: Edição de Fornecedor

**Passo 3.1**: Na lista de fornecedores, clicar no botão "Editar" (ícone de lápis)

**Passo 3.2**: Alterar o telefone para "(11) 99999-8888"

**Passo 3.3**: Clicar em "Salvar"

**Resultado Esperado**:
- Toast de sucesso
- Telefone atualizado na lista

---

### 4. Teste: Exclusão de Fornecedor

**Passo 4.1**: Clicar no botão "Excluir" (ícone de lixeira) de um fornecedor

**Passo 4.2**: Confirmar exclusão

**Resultado Esperado**:
- Toast de sucesso
- Fornecedor removido da lista

**Passo 4.3**: Tentar excluir um fornecedor que tem movimentações associadas

**Resultado Esperado**:
- Erro: "Não é possível excluir o fornecedor. Existem movimentações de estoque associadas a ele."

---

### 5. Teste: Cadastro de Produtos

**Passo 5.1**: Acessar a aba "Produtos"

**Passo 5.2**: Clicar em "Novo Produto"

**Passo 5.3**: Preencher:
- **Nome**: "Arroz"
- **Unidade**: "kg"
- **Descrição**: "Arroz tipo 1"

**Passo 5.4**: Clicar em "Salvar"

**Resultado Esperado**:
- Toast de sucesso
- Produto aparece na lista

**Passo 5.5**: Cadastrar mais produtos:
- "Feijão" (kg)
- "Óleo de Soja" (litros)
- "Açúcar" (kg)
- "Macarrão" (pacote)

**Resultado Esperado**: Todos os produtos aparecem na lista

**Passo 5.6**: Tentar cadastrar produto com nome duplicado

**Resultado Esperado**: Erro: "Já existe um produto cadastrado com este nome."

---

### 6. Teste: Edição e Desativação de Produto

**Passo 6.1**: Editar um produto (alterar descrição)

**Passo 6.2**: Desativar um produto (botão excluir)

**Resultado Esperado**:
- Produto desativado (não aparece mais na lista de produtos ativos)
- Produto ainda existe no banco (soft delete)

---

### 7. Teste: Registro de Entrada de Estoque

**Passo 7.1**: Acessar a aba "Movimentações"

**Passo 7.2**: Clicar em "Entrada"

**Passo 7.3**: Preencher formulário:
- **Fornecedor**: Selecionar "Mercado Central"
- **Produto**: Selecionar "Arroz"
- **Quantidade**: "50"
- **Observações**: "Entrada inicial de estoque"

**Passo 7.4**: Clicar em "Registrar Entrada"

**Resultado Esperado**:
- Toast de sucesso
- Movimentação aparece na lista (tipo ENTRADA)
- Estoque atualizado automaticamente

**Passo 7.5**: Registrar mais entradas:
- Feijão: 30 kg
- Óleo: 20 litros
- Açúcar: 25 kg

**Resultado Esperado**: Todas as entradas registradas e estoque atualizado

---

### 8. Teste: Visualização de Estoque

**Passo 8.1**: Acessar a aba "Estoque"

**Resultado Esperado**:
- Lista mostra todos os produtos com estoque
- Quantidade correta para cada produto
- Última movimentação exibida

**Passo 8.2**: Verificar se os produtos cadastrados aparecem com quantidade correta

**Resultado Esperado**:
- Arroz: 50 kg
- Feijão: 30 kg
- Óleo: 20 litros
- Açúcar: 25 kg

---

### 9. Teste: Registro de Saída de Estoque

**Passo 9.1**: Acessar a aba "Movimentações"

**Passo 9.2**: Clicar em "Saída"

**Passo 9.3**: Preencher:
- **Produto**: Selecionar "Arroz" (deve mostrar quantidade disponível: 50 kg)
- **Quantidade**: "10"
- **Observações**: "Saída para doação"

**Passo 9.4**: Clicar em "Registrar Saída"

**Resultado Esperado**:
- Toast de sucesso
- Movimentação aparece na lista (tipo SAIDA)
- Estoque de Arroz atualizado para 40 kg

**Passo 9.5**: Tentar registrar saída maior que o estoque disponível

**Resultado Esperado**: 
- Erro: "Estoque insuficiente. Quantidade disponível: X, quantidade solicitada: Y"
- Não permite salvar

---

### 10. Teste: Filtros de Movimentações

**Passo 10.1**: Na aba "Movimentações", usar filtros:
- **Data Inicial**: Selecionar data de ontem
- **Data Final**: Selecionar data de hoje
- **Tipo**: Selecionar "Entrada"

**Resultado Esperado**: Lista mostra apenas entradas no período

**Passo 10.2**: Alterar filtro para "Saída"

**Resultado Esperado**: Lista mostra apenas saídas

**Passo 10.3**: Clicar em "Limpar Filtros"

**Resultado Esperado**: Todos os filtros removidos, lista completa exibida

---

### 11. Teste: Integração com Entregas - Seleção de Itens do Estoque

**Passo 11.1**: Acessar a aba "Entregas"

**Passo 11.2**: Selecionar uma família

**Passo 11.3**: Na seção "Itens do Estoque", verificar produtos disponíveis

**Resultado Esperado**:
- Lista mostra produtos com estoque > 0
- Exibe quantidade disponível para cada produto

**Passo 11.4**: Clicar em "Adicionar" em um produto (ex: Arroz)

**Resultado Esperado**:
- Produto adicionado à entrega
- Campo de quantidade aparece (máximo = estoque disponível)

**Passo 11.5**: Ajustar quantidade (ex: 5 kg de Arroz)

**Passo 11.6**: Adicionar outro produto do estoque (ex: Feijão, 3 kg)

**Passo 11.7**: Adicionar um item manual (ex: "Cesta Básica", 1 unidade)

**Passo 11.8**: Preencher período de bloqueio e observações

**Passo 11.9**: Clicar em "Registrar Entrega"

**Resultado Esperado**:
- Entrega registrada com sucesso
- Saídas automáticas criadas para Arroz (5 kg) e Feijão (3 kg)
- Estoque atualizado:
  - Arroz: 40 - 5 = 35 kg
  - Feijão: 30 - 3 = 27 kg
- Item manual ("Cesta Básica") não gera saída de estoque

**Passo 11.10**: Verificar na aba "Movimentações"

**Resultado Esperado**:
- Duas novas saídas aparecem (Arroz e Feijão)
- Ambas vinculadas à entrega (campo "Fornecedor" mostra nome da família)
- Observações indicam "Saída automática para entrega à família [Nome]"

---

### 12. Teste: Validação de Estoque na Entrega

**Passo 12.1**: Tentar adicionar quantidade maior que o estoque disponível

**Resultado Esperado**: 
- Sistema impede ou mostra aviso
- Não permite salvar quantidade inválida

**Passo 12.2**: Registrar entrega com quantidade válida

**Resultado Esperado**: Entrega registrada normalmente

---

### 13. Teste: Histórico de Movimentações

**Passo 13.1**: Na aba "Movimentações", verificar histórico completo

**Resultado Esperado**:
- Todas as entradas e saídas listadas
- Ordenadas por data (mais recente primeiro)
- Informações completas: data, tipo, produto, quantidade, fornecedor/família

---

## TESTES COM USUÁRIO ADMIN

### 14. Acesso à Aba Fornecedores (Admin)

**Passo 14.1**: Fazer login como admin

**Passo 14.2**: Verificar acesso à rota `/suppliers`

**Resultado Esperado**: 
- Admin pode acessar a página de fornecedores
- Vê todas as funcionalidades (mesmas que instituição)

---

### 15. Teste: Visualização de Estoque (Admin)

**Passo 15.1**: Acessar a aba "Estoque"

**Resultado Esperado**:
- Dropdown "Selecione uma instituição" aparece no topo
- Opção "Todas as Instituições" disponível

**Passo 15.2**: Selecionar "Todas as Instituições"

**Resultado Esperado**: 
- Lista mostra estoque de todas as instituições
- Coluna "Instituição" exibida na tabela

**Passo 15.3**: Selecionar uma instituição específica

**Resultado Esperado**: 
- Lista mostra apenas estoque daquela instituição
- Filtro funciona corretamente

---

### 16. Teste: Visualização de Movimentações (Admin)

**Passo 16.1**: Acessar a aba "Movimentações"

**Resultado Esperado**:
- Admin vê movimentações de todas as instituições
- Coluna "Instituição" exibida (se aplicável)

**Passo 16.2**: Usar filtros de data e tipo

**Resultado Esperado**: Filtros funcionam normalmente

---

### 17. Teste: Admin e Movimentações

**Passo 17.1**: Verificar se botões "Entrada" e "Saída" estão visíveis

**Resultado Esperado**: 
- Botões podem estar visíveis, mas devem validar permissão
- OU admin não deve ver esses botões (dependendo da implementação)

**Nota**: Verificar comportamento esperado - admin pode ou não registrar movimentações?

---

## TESTES DE VALIDAÇÃO E ERROS

### 18. Teste: Validações de Formulários

**Passo 18.1**: Tentar salvar fornecedor sem nome

**Resultado Esperado**: Erro de validação

**Passo 18.2**: Tentar salvar produto sem nome

**Resultado Esperado**: Erro de validação

**Passo 18.3**: Tentar registrar entrada sem fornecedor

**Resultado Esperado**: Erro de validação

**Passo 18.4**: Tentar registrar entrada com quantidade zero ou negativa

**Resultado Esperado**: Erro de validação

---

### 19. Teste: Formatação de Documentos

**Passo 19.1**: Cadastrar fornecedor PF e digitar CPF sem formatação

**Resultado Esperado**: CPF formatado automaticamente (XXX.XXX.XXX-XX)

**Passo 19.2**: Cadastrar fornecedor PJ e digitar CNPJ sem formatação

**Resultado Esperado**: CNPJ formatado automaticamente (XX.XXX.XXX/XXXX-XX)

---

### 20. Teste: Atualização Automática de Estoque

**Passo 20.1**: Registrar entrada de 100 kg de Arroz

**Passo 20.2**: Verificar estoque imediatamente

**Resultado Esperado**: Estoque atualizado para 100 kg (ou valor anterior + 100)

**Passo 20.3**: Registrar saída de 20 kg

**Passo 20.4**: Verificar estoque novamente

**Resultado Esperado**: Estoque atualizado para 80 kg (ou valor anterior - 20)

---

### 21. Teste: Última Movimentação

**Passo 21.1**: Registrar várias movimentações do mesmo produto

**Passo 21.2**: Verificar coluna "Última Movimentação" na aba Estoque

**Resultado Esperado**: Data da última movimentação exibida corretamente

---

## TESTES DE INTEGRAÇÃO

### 22. Teste: Fluxo Completo - Do Fornecedor à Entrega

**Passo 22.1**: Cadastrar novo fornecedor "Supermercado ABC"

**Passo 22.2**: Cadastrar novo produto "Leite" (litros)

**Passo 22.3**: Registrar entrada de 50 litros de Leite do fornecedor "Supermercado ABC"

**Passo 22.4**: Verificar estoque (deve mostrar 50 litros)

**Passo 22.5**: Fazer uma entrega selecionando 10 litros de Leite do estoque

**Passo 22.6**: Verificar estoque novamente (deve mostrar 40 litros)

**Passo 22.7**: Verificar movimentações:
- 1 ENTRADA de 50 litros
- 1 SAIDA de 10 litros (vinculada à entrega)

**Resultado Esperado**: Fluxo completo funcionando corretamente

---

### 23. Teste: Múltiplas Instituições (se aplicável)

**Passo 23.1**: Fazer login como Instituição A

**Passo 23.2**: Registrar entrada de estoque

**Passo 23.3**: Fazer login como Instituição B

**Passo 23.4**: Verificar estoque

**Resultado Esperado**: 
- Instituição B não vê estoque da Instituição A
- Cada instituição tem seu próprio estoque isolado

**Passo 23.5**: Fazer login como Admin

**Passo 23.6**: Verificar estoque de ambas as instituições

**Resultado Esperado**: Admin vê estoque de todas as instituições

---

## CHECKLIST FINAL

### Funcionalidades Básicas
- [ ] Cadastro de fornecedores (PF e PJ)
- [ ] Edição de fornecedores
- [ ] Exclusão de fornecedores (com validação)
- [ ] Cadastro de produtos
- [ ] Edição de produtos
- [ ] Desativação de produtos
- [ ] Registro de entradas
- [ ] Registro de saídas
- [ ] Visualização de estoque
- [ ] Histórico de movimentações

### Validações
- [ ] Validação de campos obrigatórios
- [ ] Validação de estoque insuficiente
- [ ] Formatação automática de CPF/CNPJ
- [ ] Validação de produtos duplicados
- [ ] Validação de exclusão com movimentações

### Integrações
- [ ] Seleção de produtos do estoque na entrega
- [ ] Saída automática ao registrar entrega
- [ ] Atualização automática de estoque
- [ ] Vinculação de saída à entrega

### Permissões
- [ ] Instituição vê apenas seu estoque
- [ ] Instituição pode gerenciar fornecedores
- [ ] Admin vê estoque de todas as instituições
- [ ] Admin pode filtrar por instituição

### Interface
- [ ] Navegação funcionando
- [ ] Formulários responsivos
- [ ] Mensagens de erro claras
- [ ] Toasts de sucesso
- [ ] Loading states
- [ ] Empty states

---

## Problemas Conhecidos e Limitações

1. **Geração de Recibos**: Requer instalação de `jspdf` e configuração do Supabase Storage
2. **Produtos Compartilhados**: Produtos são compartilhados entre instituições, mas cada uma tem seu estoque
3. **Soft Delete**: Produtos são desativados, não deletados permanentemente

---

## Próximos Passos Após Testes

1. Corrigir bugs encontrados
2. Ajustar validações conforme necessário
3. Melhorar mensagens de erro
4. Adicionar funcionalidades adicionais se necessário
5. Configurar geração de recibos (se necessário)

---

## Notas Adicionais

- **Data/Hora**: Todas as datas são salvas e exibidas no fuso horário de Brasília (UTC-3)
- **Estoque Zero**: Produtos com estoque zero não aparecem na lista de seleção para saídas
- **Histórico**: Todas as movimentações são registradas permanentemente para auditoria
- **Performance**: Para grandes volumes de dados, considere implementar paginação nas listas

