# 🛒 CestaJusta - Sistema de Gestão de Cestas Básicas

Sistema web completo para gestão e coordenação de distribuição de cestas básicas em instituições de caridade. O CestaJusta resolve o problema crítico de duplicação de benefícios, permitindo que múltiplas instituições coordenem suas ações e garantam uma distribuição mais eficiente e justa dos recursos disponíveis.

## 🎯 Problema que Resolve

Quando múltiplas instituições de caridade operam na mesma região sem coordenação, ocorrem problemas como:
- **Duplicação de benefícios**: A mesma família recebe cestas de várias instituições simultaneamente
- **Desperdício de recursos**: Recursos limitados sendo distribuídos de forma ineficiente
- **Falta de transparência**: Histórico fragmentado e dificuldade em gerar relatórios consolidados
- **Distribuição desigual**: Dificuldade em identificar e priorizar famílias mais vulneráveis

O CestaJusta centraliza o controle e coordena a distribuição, garantindo que os recursos alcancem o maior número possível de famílias necessitadas.

## ✨ Funcionalidades Principais

### Sistema de Gestão de Cestas Básicas

- **Gestão de Instituições**: Cadastro e gerenciamento completo de instituições de caridade parceiras
- **Gestão de Famílias**: Cadastro detalhado de famílias assistidas com CPF, endereço, informações de contato e perfil socioeconômico
- **Registro de Entregas**: Sistema inteligente de registro com bloqueio automático para prevenir duplicação
- **Relatórios e Dashboard**: Visualização de estatísticas, gráficos, métricas e alertas em tempo real
- **Sistema de Fornecedores e Estoque**: Gestão completa do ciclo de suprimentos
  - Cadastro de fornecedores (Pessoa Física ou Jurídica)
  - Cadastro de produtos e categorias
  - Controle de estoque por instituição
  - Registro de entradas e saídas
  - Integração automática com entregas (saída de estoque)
  - Geração de recibos em PDF

### Controle de Acesso e Segurança

- **Perfil Administrador**: Acesso total ao sistema, visualização de todas as instituições e famílias, capacidade de desbloquear famílias manualmente
- **Perfil Instituição**: Acesso restrito aos próprios dados, gestão de suas famílias vinculadas e registro de entregas
- **Sistema de Bloqueio Automático**: Previne que famílias recebam múltiplas cestas no mesmo período
- **Conformidade LGPD**: Sistema preparado para conformidade com a Lei Geral de Proteção de Dados

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Estado**: React Query (TanStack Query)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **PDF**: jsPDF

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn
- Conta no Supabase (para configuração do backend)

### Passos para Instalação

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd cestas
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

**Onde encontrar essas informações:**
- Acesse o [Dashboard do Supabase](https://app.supabase.com)
- Vá em Settings > API
- Copie a URL do projeto e a chave `anon` `public`

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Acesse a aplicação**

Abra seu navegador em `http://localhost:5173` (ou a porta indicada no terminal)

## 📁 Estrutura do Projeto

```
cestas/
├── src/
│   ├── components/      # Componentes React reutilizáveis
│   │   ├── ui/         # Componentes de UI (shadcn/ui)
│   │   ├── admin/      # Componentes específicos do admin
│   │   └── suppliers/  # Componentes de fornecedores
│   ├── pages/          # Páginas principais da aplicação
│   ├── hooks/          # Custom hooks (React Query, etc)
│   ├── integrations/   # Integrações (Supabase)
│   ├── lib/            # Utilitários e helpers
│   └── utils/          # Funções utilitárias
├── public/             # Arquivos estáticos
├── supabase/          # Configurações e migrations do Supabase
└── package.json       # Dependências do projeto
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm run build:dev    # Cria build de desenvolvimento

# Qualidade de código
npm run lint         # Executa o linter

# Preview
npm run preview      # Preview do build de produção
```

## 📝 Licença

Este projeto é privado e confidencial.

## 🤝 Contribuindo

Este é um projeto privado. Para contribuições ou dúvidas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para ajudar instituições de caridade a fazerem a diferença**
