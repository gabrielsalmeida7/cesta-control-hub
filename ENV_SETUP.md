# Configuração de Variáveis de Ambiente

## Problema
O erro `Missing VITE_SUPABASE_ANON_KEY environment variable` ocorre porque as variáveis de ambiente do Supabase não estão configuradas.

## Solução

### 1. Criar arquivo `.env.local`

Crie um arquivo chamado `.env.local` na raiz do projeto `cestas/` com o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://eslfcjhnaojghzuswpgz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbGZjamhuYW9qZ2h6dXN3cGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODcyMzIsImV4cCI6MjA2NDQ2MzIzMn0.NdhfRgC8fvdQ-XxPiVSUkffQiayg0NZnwaixC12Ey5o

# Supabase Admin API Key (para criação de usuários de instituição)
# IMPORTANTE: Esta chave deve ser mantida em segredo e não deve ser commitada
# Obtenha em: https://supabase.com/dashboard/project/_/settings/api
# Role: service_role
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 2. Reiniciar o servidor de desenvolvimento

Após criar o arquivo `.env.local`, você precisa **reiniciar o servidor de desenvolvimento** para que as variáveis de ambiente sejam carregadas:

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente com `npm run dev` ou `npm start`

### 3. Verificar se funcionou

O erro deve desaparecer e a aplicação deve conectar ao Supabase corretamente.

## Nota Importante

- O arquivo `.env.local` está no `.gitignore` e **não será commitado** no repositório (isso é correto para proteger suas credenciais)
- Se você precisar usar credenciais diferentes, edite o arquivo `.env.local`
- Para obter novas credenciais, acesse: https://supabase.com/dashboard/project/_/settings/api

## Variável VITE_SUPABASE_SERVICE_ROLE_KEY

A variável `VITE_SUPABASE_SERVICE_ROLE_KEY` é necessária para criar usuários de instituição automaticamente. Esta chave tem permissões de administrador e deve ser mantida em segredo.

**⚠️ ATENÇÃO**: Em produção, esta funcionalidade deve ser movida para um backend seguro (Edge Function ou API separada) para não expor a service_role key no frontend.

Para obter a service_role key:
1. Acesse: https://supabase.com/dashboard/project/_/settings/api
2. Role até a seção "Project API keys"
3. Copie a chave "service_role" (secret)
4. Adicione no arquivo `.env.local` como `VITE_SUPABASE_SERVICE_ROLE_KEY`

