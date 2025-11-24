# Guia do Sistema de Fornecedores e Estoque

## Visão Geral

O sistema de Fornecedores e Estoque permite que instituições gerenciem seus fornecedores, produtos, estoque e movimentações de alimentos/materiais. O sistema também integra com o processo de entregas, permitindo que itens do estoque sejam automaticamente registrados como saídas quando uma entrega é realizada.

## Funcionalidades

### 1. Fornecedores

A aba **Fornecedores** permite cadastrar e gerenciar fornecedores de alimentos e materiais.

#### Campos do Fornecedor

- **Nome** (obrigatório): Nome do fornecedor
- **Tipo** (obrigatório): Pessoa Física (PF) ou Pessoa Jurídica (PJ)
- **CPF/CNPJ** (opcional): Documento do fornecedor (formatado automaticamente)
- **Nome de Contato**: Pessoa responsável pelo contato
- **Telefone**: Telefone de contato
- **Email**: Email de contato
- **Endereço**: Endereço completo
- **Observações**: Notas adicionais sobre o fornecedor

#### Operações

- **Criar**: Cadastrar novo fornecedor
- **Editar**: Atualizar dados do fornecedor
- **Excluir**: Remover fornecedor (apenas se não houver movimentações associadas)

### 2. Produtos

A aba **Produtos** permite cadastrar produtos/alimentos que podem ser estocados e entregues.

#### Campos do Produto

- **Nome** (obrigatório): Nome do produto (único no sistema)
- **Unidade de Medida** (obrigatório): Unidade (kg, litros, unidades, etc.)
- **Descrição** (opcional): Descrição detalhada do produto

#### Operações

- **Criar**: Cadastrar novo produto
- **Editar**: Atualizar dados do produto
- **Desativar**: Desativar produto (soft delete - não remove, apenas marca como inativo)

### 3. Estoque

A aba **Estoque** exibe o estoque atual de produtos por instituição.

#### Visualização

- **Instituições**: Podem ver apenas seu próprio estoque
- **Admin**: Pode ver estoque de todas as instituições (com filtro)

#### Informações Exibidas

- **Produto**: Nome do produto
- **Quantidade**: Quantidade disponível
- **Unidade**: Unidade de medida
- **Última Movimentação**: Data da última entrada ou saída

### 4. Movimentações

A aba **Movimentações** exibe o histórico de todas as entradas e saídas de estoque.

#### Tipos de Movimentação

- **ENTRADA**: Registro de entrada de alimentos/materiais no estoque
- **SAIDA**: Registro de saída de alimentos/materiais do estoque

#### Filtros Disponíveis

- **Data Inicial**: Filtrar por data inicial
- **Data Final**: Filtrar por data final
- **Tipo**: Filtrar por tipo (ENTRADA, SAIDA ou Todos)

#### Registrar Entrada

Ao registrar uma entrada, é necessário informar:

- **Fornecedor** (obrigatório): Fornecedor que forneceu os itens
- **Produto** (obrigatório): Produto que está entrando
- **Quantidade** (obrigatório): Quantidade que está entrando
- **Observações** (opcional): Notas sobre a entrada

#### Registrar Saída

Ao registrar uma saída, é necessário informar:

- **Produto** (obrigatório): Produto que está saindo (apenas produtos com estoque disponível)
- **Quantidade** (obrigatório): Quantidade que está saindo (não pode exceder o estoque disponível)
- **Observações** (opcional): Notas sobre a saída

O sistema valida automaticamente se há estoque suficiente antes de permitir a saída.

## Integração com Entregas

### Seleção de Itens do Estoque

Na página de **Entregas**, há uma nova seção "Itens do Estoque" que permite:

1. Visualizar todos os produtos disponíveis no estoque da instituição
2. Adicionar produtos do estoque à entrega
3. Ajustar a quantidade de cada item (respeitando o estoque disponível)

### Saída Automática

Quando uma entrega é registrada com itens do estoque:

1. A entrega é criada normalmente
2. Para cada item do estoque selecionado, uma saída automática é registrada em `stock_movements`
3. O estoque é atualizado automaticamente (via trigger SQL)
4. A saída é vinculada à entrega através do campo `delivery_id`

### Itens Manuais vs Itens do Estoque

- **Itens do Estoque**: Produtos cadastrados no sistema que têm estoque controlado
- **Itens Manuais**: Itens adicionais que não estão no estoque (ex: doações específicas, itens não cadastrados)

## Recibos

O sistema permite gerar recibos em PDF para:

- **Entradas de Estoque**: Recibo de entrada de alimentos/materiais
- **Saídas de Estoque**: Recibo de saída de alimentos/materiais
- **Entregas**: Recibo de entrega para famílias

### Geração de Recibos

Os recibos podem ser gerados:

1. **Automaticamente**: Após registrar uma movimentação ou entrega (opcional)
2. **Manualmente**: Através do botão "Gerar Recibo" na lista de movimentações

Os recibos são salvos no Supabase Storage e uma referência é criada na tabela `receipts`.

## Permissões e Acesso

### Instituições

- Acesso total à aba Fornecedores
- Podem cadastrar e gerenciar seus próprios fornecedores
- Podem cadastrar produtos (compartilhados entre todas as instituições)
- Podem registrar entradas e saídas de estoque
- Podem gerar recibos
- Veem apenas seu próprio estoque e movimentações

### Admin

- Visualiza estoque de todas as instituições (com filtro)
- Visualiza movimentações de todas as instituições
- Não realiza movimentações diretamente (apenas visualiza)

## Fluxo de Trabalho Recomendado

1. **Cadastrar Fornecedores**: Cadastre os fornecedores de alimentos/materiais
2. **Cadastrar Produtos**: Cadastre os produtos que serão estocados
3. **Registrar Entradas**: Quando receber alimentos/materiais, registre a entrada informando o fornecedor
4. **Registrar Entregas**: Ao fazer uma entrega, selecione itens do estoque (se disponíveis) ou adicione itens manuais
5. **Acompanhar Estoque**: Monitore o estoque através da aba Estoque
6. **Gerar Recibos**: Gere recibos conforme necessário para documentação

## Estrutura do Banco de Dados

### Tabelas Principais

- **suppliers**: Fornecedores
- **products**: Produtos cadastrados
- **inventory**: Estoque atual por instituição
- **stock_movements**: Histórico de movimentações
- **receipts**: Recibos gerados

### Relacionamentos

- `inventory` → `institutions` (estoque por instituição)
- `inventory` → `products` (produto no estoque)
- `stock_movements` → `institutions` (movimentação da instituição)
- `stock_movements` → `products` (produto movimentado)
- `stock_movements` → `suppliers` (fornecedor, apenas para ENTRADA)
- `stock_movements` → `deliveries` (entrega relacionada, apenas para SAIDA)
- `receipts` → `institutions` (recibo da instituição)

## Observações Importantes

1. **Estoque Automático**: O estoque é atualizado automaticamente via trigger SQL quando há movimentações
2. **Validação de Estoque**: O sistema impede saídas que excedam o estoque disponível
3. **Produtos Compartilhados**: Produtos são compartilhados entre todas as instituições, mas cada instituição tem seu próprio estoque
4. **Soft Delete**: Produtos são desativados (não deletados) para preservar histórico
5. **Recibos**: A geração de recibos requer a biblioteca `jspdf` (instalar com `npm install jspdf`)

