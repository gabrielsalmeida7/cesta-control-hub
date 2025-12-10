# 🚀 Guia de Deploy na Vercel

Este guia fornece instruções passo a passo para fazer deploy do sistema de Cestas Básicas na Vercel.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com) (gratuita)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Credenciais do Supabase configuradas
- Node.js 18+ instalado localmente (para testes)

## 🔧 Passo 1: Preparar o Repositório

1. Certifique-se de que todas as alterações estão commitadas:
   ```bash
   git add .
   git commit -m "Preparação para deploy Vercel"
   git push
   ```

2. Verifique se o arquivo `.gitignore` está atualizado e não está commitando arquivos sensíveis:
   - `.env.local` não deve estar no repositório
   - `node_modules` não deve estar no repositório
   - `dist` não deve estar no repositório

## 🌐 Passo 2: Conectar Projeto na Vercel

### Opção A: Via Dashboard da Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"** ou **"Import Project"**
3. Conecte seu repositório Git (GitHub, GitLab ou Bitbucket)
4. Selecione o repositório do projeto `cestas`
5. A Vercel detectará automaticamente que é um projeto Vite

### Opção B: Via CLI da Vercel

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# No diretório do projeto
cd cestas

# Fazer login na Vercel
vercel login

# Fazer deploy
vercel

# Para produção
vercel --prod
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### No Dashboard da Vercel:

1. Vá para **Project Settings** > **Environment Variables**
2. Adicione as seguintes variáveis:

   | Nome da Variável | Valor | Ambiente |
   |-----------------|-------|----------|
   | `VITE_SUPABASE_URL` | Sua URL do Supabase | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | Sua anon key do Supabase | Production, Preview, Development |
   | `VITE_SUPABASE_SERVICE_ROLE_KEY` | Sua service_role key (opcional) | Production, Preview, Development |

3. Para cada variável:
   - Clique em **"Add"**
   - Cole o nome da variável
   - Cole o valor correspondente
   - Selecione os ambientes (Production, Preview, Development)
   - Clique em **"Save"**

### Onde Obter as Credenciais do Supabase:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `VITE_SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantenha em segredo)

## 🏗️ Passo 4: Configurar Build Settings

A Vercel deve detectar automaticamente as configurações do Vite, mas verifique:

1. Vá para **Project Settings** > **General**
2. Verifique se está configurado:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

Se não estiver correto, ajuste manualmente ou o arquivo `vercel.json` já configurado deve aplicar essas configurações.

## 🚀 Passo 5: Fazer o Deploy

1. Após configurar as variáveis de ambiente, a Vercel iniciará automaticamente um novo deploy
2. Ou clique em **"Redeploy"** no dashboard
3. Aguarde o build completar (geralmente 1-3 minutos)
4. Quando concluído, você receberá um link do tipo: `https://seu-projeto.vercel.app`

## 🌍 Passo 6: Configurar Domínio Customizado (Opcional)

### Adicionar Domínio:

1. Vá para **Project Settings** > **Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `cestas.seudominio.com.br`)
4. Siga as instruções para configurar DNS:

   **Para domínio raiz (ex: seudominio.com.br)**:
   ```
   Tipo: A
   Nome: @
   Valor: 76.76.21.21
   ```

   **Para subdomínio (ex: cestas.seudominio.com.br)**:
   ```
   Tipo: CNAME
   Nome: cestas
   Valor: cname.vercel-dns.com
   ```

5. Aguarde a propagação DNS (pode levar até 24 horas, geralmente alguns minutos)
6. A Vercel verificará automaticamente e ativará o SSL/HTTPS

### Configurar SSL:

- A Vercel fornece SSL automático via Let's Encrypt
- Não é necessário configurar manualmente
- O certificado é renovado automaticamente

## 🔍 Passo 7: Verificar o Deploy

Após o deploy, teste:

1. ✅ Acesse a URL fornecida pela Vercel
2. ✅ Verifique se a página carrega corretamente
3. ✅ Teste o login com credenciais válidas
4. ✅ Verifique se as funcionalidades principais estão funcionando
5. ✅ Abra o Console do navegador (F12) e verifique se não há erros relacionados a variáveis de ambiente

## 🐛 Troubleshooting

### Erro: "Missing VITE_SUPABASE_URL environment variable"

**Solução**:
- Verifique se as variáveis de ambiente estão configuradas no dashboard da Vercel
- Certifique-se de que selecionou os ambientes corretos (Production, Preview, Development)
- Faça um novo deploy após adicionar as variáveis

### Erro: "404 Not Found" ao navegar entre páginas

**Solução**:
- Verifique se o arquivo `vercel.json` está presente na raiz do projeto
- Confirme que a configuração de `rewrites` está correta no `vercel.json`
- O arquivo já deve estar configurado corretamente

### Build falha

**Solução**:
- Verifique os logs de build na Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js version está compatível (18+)
- Tente fazer build localmente: `npm run build`

### Variáveis de ambiente não funcionam

**Solução**:
- Variáveis de ambiente são injetadas durante o build
- Após adicionar/alterar variáveis, é necessário fazer um novo deploy
- Verifique se os nomes das variáveis estão exatamente como esperado (case-sensitive)
- Verifique se não há espaços extras nos nomes ou valores

### Problemas com CORS no Supabase

**Solução**:
1. Acesse o Supabase Dashboard
2. Vá em **Settings** > **API**
3. Em **CORS**, adicione seu domínio da Vercel:
   - `https://seu-projeto.vercel.app`
   - `https://seu-dominio-customizado.com`
   - Para desenvolvimento local: `http://localhost:8080`

## 📝 Comandos Úteis

### Deploy via CLI:

```bash
# Deploy para preview
vercel

# Deploy para produção
vercel --prod

# Ver logs em tempo real
vercel logs

# Listar projetos
vercel ls
```

### Verificar configuração local:

```bash
# Testar build localmente
npm run build

# Preview do build
npm run preview

# Verificar variáveis de ambiente (não funciona no build, apenas no dev)
npm run dev
```

## 🔐 Segurança

### Boas Práticas:

1. ✅ **NUNCA** commite arquivos `.env.local` com valores reais
2. ✅ Use variáveis de ambiente apenas no dashboard da Vercel
3. ✅ Revise periodicamente quem tem acesso ao projeto na Vercel
4. ✅ Considere mover operações sensíveis (service_role key) para Edge Functions
5. ✅ Configure CORS corretamente no Supabase
6. ✅ Use HTTPS sempre (Vercel fornece automaticamente)

### ⚠️ Atenção Especial:

A variável `VITE_SUPABASE_SERVICE_ROLE_KEY` está sendo usada no frontend, o que não é ideal para produção. Considere:

- Criar uma Edge Function na Vercel para operações que requerem service_role
- Ou criar uma API separada para essas operações
- Isso evita expor a chave de administrador no código do cliente

## 📚 Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Guia de Deploy Vite na Vercel](https://vercel.com/guides/deploying-vite-to-vercel)
- [Documentação do Supabase](https://supabase.com/docs)
- [Configuração de Domínios na Vercel](https://vercel.com/docs/concepts/projects/domains)

## ✅ Checklist de Deploy

Antes de considerar o deploy completo, verifique:

- [ ] Repositório conectado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Build executando com sucesso
- [ ] Aplicação acessível via URL da Vercel
- [ ] Login funcionando corretamente
- [ ] Funcionalidades principais testadas
- [ ] CORS configurado no Supabase
- [ ] Domínio customizado configurado (se aplicável)
- [ ] SSL/HTTPS ativo
- [ ] Logs de erro verificados

## 🎉 Pronto!

Seu sistema está deployado e funcionando na Vercel! 🚀

Para atualizações futuras, basta fazer push para o repositório Git e a Vercel fará deploy automático.

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0

