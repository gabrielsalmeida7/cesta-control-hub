# Guia de Deploy e Hospedagem

## 🚀 Opções de Deploy para API Customizada

Este documento detalha as opções de deploy e hospedagem para a API customizada, incluindo configurações, custos e procedimentos.

---

## 1. OPÇÕES DE HOSPEDAGEM

### 1.1 Railway (Recomendado para MVP)

**Vantagens:**

- ✅ Deploy automático do GitHub
- ✅ PostgreSQL incluso
- ✅ SSL automático
- ✅ Domínio personalizado
- ✅ Logs integrados
- ✅ Escalabilidade automática

**Desvantagens:**

- ❌ Custo pode aumentar com uso
- ❌ Menos controle sobre infraestrutura

**Custo:**

- Free tier: $5 crédito/mês
- Starter: $5/mês + uso
- Pro: $20/mês + uso
- PostgreSQL: $5/mês

**Setup:**

1. **Criar conta no Railway**

   - Acesse: https://railway.app
   - Conecte com GitHub

2. **Deploy da API**

   ```bash
   # Instalar Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Deploy
   railway up
   ```

3. **Configurar PostgreSQL**

   - Adicionar serviço PostgreSQL
   - Copiar variáveis de ambiente

4. **Configurar variáveis**
   ```bash
   railway variables set JWT_SECRET=your-secret-key
   railway variables set NODE_ENV=production
   ```

**Dockerfile para Railway:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

### 1.2 Render

**Vantagens:**

- ✅ Free tier disponível
- ✅ Deploy automático
- ✅ SSL automático
- ✅ PostgreSQL gerenciado
- ✅ Interface simples

**Desvantagens:**

- ❌ Free tier com limitações
- ❌ Cold starts no free tier
- ❌ Menos flexibilidade

**Custo:**

- Free tier: Limitado
- Starter: $7/mês
- PostgreSQL: $7/mês

**Setup:**

1. **Criar conta no Render**

   - Acesse: https://render.com
   - Conecte com GitHub

2. **Deploy da API**

   - New → Web Service
   - Conectar repositório
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`

3. **Configurar PostgreSQL**

   - New → PostgreSQL
   - Copiar connection string

4. **Variáveis de ambiente**
   ```
   JWT_SECRET=your-secret-key
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   ```

### 1.3 DigitalOcean App Platform

**Vantagens:**

- ✅ Controle total
- ✅ Docker nativo
- ✅ Escalabilidade
- ✅ Integração com outros serviços DO

**Desvantagens:**

- ❌ Mais complexo
- ❌ Custo mais alto
- ❌ Precisa configurar mais coisas

**Custo:**

- Basic: $5/mês
- Professional: $12/mês
- Managed Database: $15/mês

**Setup:**

1. **Criar App**

   - Acesse: https://cloud.digitalocean.com/apps
   - Create App → GitHub

2. **Configurar Build**
   ```yaml
   # .do/app.yaml
   name: cesta-control-hub-api
   services:
     - name: api
       source_dir: /
       github:
         repo: seu-usuario/cesta-control-hub
         branch: main
       run_command: npm run start:prod
       build_command: npm run build
       environment_slug: node-js
       instance_count: 1
       instance_size_slug: basic-xxs
       envs:
         - key: JWT_SECRET
           value: your-secret-key
         - key: DATABASE_URL
           value: ${db.DATABASE_URL}
   databases:
     - name: db
       engine: PG
       version: "13"
   ```

### 1.4 VPS Manual (AWS EC2, Linode, Vultr)

**Vantagens:**

- ✅ Controle total
- ✅ Custo previsível
- ✅ Flexibilidade máxima
- ✅ Aprendizado

**Desvantagens:**

- ❌ Mais trabalho de setup
- ❌ Responsabilidade de manutenção
- ❌ Precisa configurar tudo

**Custo:**

- VPS: $5-10/mês
- Managed DB: $15/mês (opcional)

**Setup:**

1. **Criar VPS**

   ```bash
   # Ubuntu 22.04
   sudo apt update
   sudo apt install docker.io docker-compose nginx
   ```

2. **Configurar Docker**

   ```bash
   # Clonar repositório
   git clone https://github.com/seu-usuario/cesta-control-hub.git
   cd cesta-control-hub

   # Configurar .env
   cp .env.example .env
   # Editar variáveis

   # Deploy
   docker-compose up -d
   ```

3. **Configurar Nginx**
   ```nginx
   # /etc/nginx/sites-available/cesta-control-hub
   server {
       listen 80;
       server_name api.seudominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 2. CI/CD COM GITHUB ACTIONS

### 2.1 Railway Deploy

**Criar**: `.github/workflows/railway-deploy.yml`

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

### 2.2 Render Deploy

**Criar**: `.github/workflows/render-deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

### 2.3 DigitalOcean Deploy

**Criar**: `.github/workflows/digitalocean-deploy.yml`

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to DigitalOcean
        uses: digitalocean/app_action@v1
        with:
          app_id: ${{ secrets.DIGITALOCEAN_APP_ID }}
          token: ${{ secrets.DIGITALOCEAN_TOKEN }}
```

---

## 3. CONFIGURAÇÃO DE PRODUÇÃO

### 3.1 Variáveis de Ambiente

**Criar**: `.env.production`

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL=https://seudominio.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### 3.2 Dockerfile Otimizado

**Criar**: `Dockerfile.production`

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

### 3.3 Docker Compose Produção

**Criar**: `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 4. MONITORAMENTO E LOGS

### 4.1 Health Checks

**Criar**: `src/health/health.controller.ts`

```typescript
import { Controller, Get } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  async check() {
    const checks = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "unknown",
      memory: process.memoryUsage()
    };

    try {
      await this.dataSource.query("SELECT 1");
      checks.database = "connected";
    } catch (error) {
      checks.database = "disconnected";
      checks.status = "error";
    }

    return checks;
  }

  @Get("ready")
  async ready() {
    try {
      await this.dataSource.query("SELECT 1");
      return { status: "ready" };
    } catch (error) {
      return { status: "not ready", error: error.message };
    }
  }
}
```

### 4.2 Logging

**Criar**: `src/common/logger.service.ts`

```typescript
import { Injectable, LoggerService } from "@nestjs/common";

@Injectable()
export class AppLoggerService implements LoggerService {
  log(message: string, context?: string) {
    console.log(
      `[${new Date().toISOString()}] [${context || "App"}] ${message}`
    );
  }

  error(message: string, trace?: string, context?: string) {
    console.error(
      `[${new Date().toISOString()}] [${context || "App"}] ERROR: ${message}`
    );
    if (trace) console.error(trace);
  }

  warn(message: string, context?: string) {
    console.warn(
      `[${new Date().toISOString()}] [${context || "App"}] WARN: ${message}`
    );
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[${new Date().toISOString()}] [${context || "App"}] DEBUG: ${message}`
      );
    }
  }
}
```

### 4.3 Métricas

**Criar**: `src/metrics/metrics.controller.ts`

```typescript
import { Controller, Get } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("metrics")
export class MetricsController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  async getMetrics() {
    const [institutions, families, deliveries, users] = await Promise.all([
      this.dataSource.query("SELECT COUNT(*) as count FROM institutions"),
      this.dataSource.query("SELECT COUNT(*) as count FROM families"),
      this.dataSource.query("SELECT COUNT(*) as count FROM deliveries"),
      this.dataSource.query("SELECT COUNT(*) as count FROM users")
    ]);

    return {
      timestamp: new Date().toISOString(),
      data: {
        institutions: parseInt(institutions[0].count),
        families: parseInt(families[0].count),
        deliveries: parseInt(deliveries[0].count),
        users: parseInt(users[0].count)
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };
  }
}
```

---

## 5. SEGURANÇA EM PRODUÇÃO

### 5.1 Rate Limiting

**Configurar**: `src/main.ts`

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rate limiting
  app.useGlobalGuards(new ThrottlerGuard());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  });

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

### 5.2 SSL/HTTPS

**Para Railway/Render:** Automático

**Para VPS:** Configurar com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.seudominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 6. BACKUP E RECOVERY

### 6.1 Backup Automático

**Criar**: `scripts/backup.sh`

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

echo "🔄 Iniciando backup..."

# Backup completo
pg_dump "$DATABASE_URL" > "backups/$BACKUP_FILE"

# Comprimir
gzip "backups/$BACKUP_FILE"

echo "✅ Backup criado: backups/${BACKUP_FILE}.gz"

# Upload para S3 (opcional)
# aws s3 cp "backups/${BACKUP_FILE}.gz" s3://seu-bucket/backups/

# Manter apenas últimos 7 backups
cd backups
ls -t backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "🧹 Backups antigos removidos"
```

### 6.2 GitHub Actions Backup

**Criar**: `.github/workflows/backup.yml`

```yaml
name: Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          pg_dump "${{ secrets.DATABASE_URL }}" > "backup_${DATE}.sql"
          gzip "backup_${DATE}.sql"

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Upload Backup
        run: |
          aws s3 cp "backup_${DATE}.sql.gz" s3://seu-bucket/backups/
```

---

## 7. CHECKLIST DE DEPLOY

### Preparação

- [ ] Escolher provedor de hospedagem
- [ ] Configurar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Testar build local

### Deploy

- [ ] Configurar CI/CD
- [ ] Deploy inicial
- [ ] Configurar domínio
- [ ] Configurar SSL

### Configuração

- [ ] Configurar banco de dados
- [ ] Migrar dados
- [ ] Configurar monitoramento
- [ ] Configurar logs

### Segurança

- [ ] Configurar rate limiting
- [ ] Configurar CORS
- [ ] Configurar headers de segurança
- [ ] Configurar SSL/HTTPS

### Monitoramento

- [ ] Configurar health checks
- [ ] Configurar métricas
- [ ] Configurar alertas
- [ ] Configurar backup automático

### Validação

- [ ] Testar endpoints
- [ ] Testar autenticação
- [ ] Testar performance
- [ ] Testar backup/restore

---

## 8. CUSTOS COMPARATIVOS

| Provedor         | API | Database | Total/Mês | Observações          |
| ---------------- | --- | -------- | --------- | -------------------- |
| **Railway**      | $5  | $5       | $10       | Recomendado para MVP |
| **Render**       | $7  | $7       | $14       | Free tier limitado   |
| **DigitalOcean** | $5  | $15      | $20       | Mais controle        |
| **VPS Manual**   | $5  | $15      | $20       | Máximo controle      |
| **Supabase**     | $0  | $0       | $0        | Apenas DB, limitado  |

---

**Próximo passo**: Consulte [security-checklist.md](./security-checklist.md) para boas práticas de segurança.
