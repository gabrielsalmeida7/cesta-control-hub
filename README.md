# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/224e6028-1a06-4a49-a55a-fff1f0150988

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/224e6028-1a06-4a49-a55a-fff1f0150988) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- React Query (TanStack Query)

## Funcionalidades Principais

### Sistema de Gestão de Cestas Básicas

- **Gestão de Instituições**: Cadastro e gerenciamento de instituições de caridade
- **Gestão de Famílias**: Cadastro de famílias assistidas com CPF, endereço e informações de contato
- **Registro de Entregas**: Sistema de registro de entregas com bloqueio automático e validações
- **Relatórios e Dashboard**: Visualização de estatísticas, gráficos e alertas
- **Sistema de Fornecedores e Estoque**: Gestão completa de fornecedores, produtos, estoque e movimentações
  - Cadastro de fornecedores (PF/PJ)
  - Cadastro de produtos
  - Controle de estoque por instituição
  - Registro de entradas e saídas
  - Integração com entregas (saída automática de estoque)
  - Geração de recibos em PDF

### Controle de Acesso

- **Admin**: Acesso total ao sistema, visualização de todas as instituições e famílias
- **Instituição**: Acesso restrito aos próprios dados, pode gerenciar suas famílias e entregas

### Documentação Adicional

Para mais detalhes sobre o sistema de Fornecedores, consulte [docs/SUPPLIERS_GUIDE.md](docs/SUPPLIERS_GUIDE.md).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/224e6028-1a06-4a49-a55a-fff1f0150988) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
