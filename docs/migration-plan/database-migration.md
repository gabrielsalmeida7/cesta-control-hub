# Migração do Banco de Dados

## 🗄️ Estratégias de Migração PostgreSQL

Este documento detalha as estratégias para migrar o banco de dados do Supabase para uma instância PostgreSQL própria.

---

## 1. OPÇÕES DE DEPLOY DO POSTGRESQL

### 1.1 Opção A: Manter Supabase Database (apenas DB)

**Vantagens:**
- ✅ Database já configurado e populado
- ✅ Backups automáticos
- ✅ Menos trabalho de migração
- ✅ Interface web para administração

**Desvantagens:**
- ⚠️ Ainda depende do Supabase (só para DB)
- ⚠️ Limitações de customização
- ⚠️ Possível vendor lock-in futuro

**Custo:** Free tier até 500MB

**Configuração:**
```typescript
// .env
DB_HOST=db.eslfcjhnaojghzuswpgz.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_supabase
DB_NAME=postgres
```

### 1.2 Opção B: PostgreSQL Próprio (Recomendado)

**Vantagens:**
- ✅ Controle total
- ✅ Sem dependências externas
- ✅ Customização completa
- ✅ Deploy flexível

**Desvantagens:**
- ❌ Precisa configurar backups
- ❌ Responsabilidade de manutenção
- ❌ Setup inicial mais complexo

**Custo:** $5-15/mês (DigitalOcean, Railway, etc.)

**Opções de Hospedagem:**

#### Railway
- **Custo:** $5/mês (Starter) + $5/mês (PostgreSQL)
- **Setup:** Automático via GitHub
- **Backup:** Automático
- **URL:** `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

#### Render
- **Custo:** $7/mês (Starter) + $7/mês (PostgreSQL)
- **Setup:** Via dashboard
- **Backup:** Manual
- **URL:** `postgresql://user:password@dpg-xxx.oregon-postgres.render.com:5432/database`

#### DigitalOcean Managed Database
- **Custo:** $15/mês (Basic)
- **Setup:** Via dashboard
- **Backup:** Automático + Point-in-time recovery
- **URL:** `postgresql://doadmin:password@db-postgresql-xxx-do-user-xxx.db.ondigitalocean.com:25060/defaultdb`

#### Supabase (apenas DB)
- **Custo:** Free tier
- **Setup:** Já configurado
- **Backup:** Automático
- **URL:** `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`

---

## 2. ESTRATÉGIAS DE MIGRAÇÃO

### 2.1 Opção A: Export/Import SQL

**Passo 1: Exportar do Supabase**

```bash
# Via Supabase CLI
supabase db dump -f backup.sql --schema public

# Ou via pgAdmin/DBeaver
# 1. Conectar ao Supabase
# 2. Exportar schema + dados
# 3. Salvar como backup.sql
```

**Passo 2: Aplicar no Novo DB**

```bash
# Para Railway/Render
psql "postgresql://user:password@host:port/database" < backup.sql

# Para Docker local
docker exec -i postgres_container psql -U postgres -d cesta_control_hub < backup.sql
```

**Script de Migração:**

```bash
#!/bin/bash
# migrate-database.sh

echo "🔄 Iniciando migração do banco de dados..."

# 1. Exportar do Supabase
echo "📤 Exportando dados do Supabase..."
supabase db dump -f backup.sql --schema public

# 2. Aplicar no novo banco
echo "📥 Aplicando dados no novo banco..."
psql "$NEW_DATABASE_URL" < backup.sql

# 3. Verificar migração
echo "✅ Verificando migração..."
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM institutions;"
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM families;"
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM deliveries;"

echo "🎉 Migração concluída!"
```

### 2.2 Opção B: Script de Migração Programática

**Criar**: `scripts/migrate-data.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Configurações
const SUPABASE_URL = 'https://eslfcjhnaojghzuswpgz.supabase.co';
const SUPABASE_KEY = 'sua_anon_key';
const NEW_DB_URL = 'postgresql://user:password@host:port/database';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const newDb = new Client({ connectionString: NEW_DB_URL });

async function migrateData() {
  try {
    await newDb.connect();
    console.log('✅ Conectado ao novo banco');

    // 1. Migrar instituições
    console.log('📤 Migrando instituições...');
    const { data: institutions } = await supabase.from('institutions').select('*');
    for (const inst of institutions || []) {
      await newDb.query(
        'INSERT INTO institutions (id, name, address, phone, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
        [inst.id, inst.name, inst.address, inst.phone, inst.created_at, inst.updated_at]
      );
    }

    // 2. Migrar famílias
    console.log('📤 Migrando famílias...');
    const { data: families } = await supabase.from('families').select('*');
    for (const family of families || []) {
      await newDb.query(
        'INSERT INTO families (id, name, contact_person, phone, members_count, is_blocked, blocked_until, blocked_by_institution_id, block_reason, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING',
        [family.id, family.name, family.contact_person, family.phone, family.members_count, family.is_blocked, family.blocked_until, family.blocked_by_institution_id, family.block_reason, family.created_at, family.updated_at]
      );
    }

    // 3. Migrar usuários
    console.log('📤 Migrando usuários...');
    const { data: profiles } = await supabase.from('profiles').select('*');
    for (const profile of profiles || []) {
      await newDb.query(
        'INSERT INTO users (id, email, full_name, role, institution_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [profile.id, profile.email, profile.full_name, profile.role, profile.institution_id, profile.created_at, profile.updated_at]
      );
    }

    // 4. Migrar entregas
    console.log('📤 Migrando entregas...');
    const { data: deliveries } = await supabase.from('deliveries').select('*');
    for (const delivery of deliveries || []) {
      await newDb.query(
        'INSERT INTO deliveries (id, family_id, institution_id, blocking_period_days, notes, delivered_by_user_id, delivery_date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
        [delivery.id, delivery.family_id, delivery.institution_id, delivery.blocking_period_days, delivery.notes, delivery.delivered_by_user_id, delivery.delivery_date, delivery.created_at]
      );
    }

    // 5. Migrar associações
    console.log('📤 Migrando associações...');
    const { data: associations } = await supabase.from('institution_families').select('*');
    for (const assoc of associations || []) {
      await newDb.query(
        'INSERT INTO institution_families (institution_id, family_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (institution_id, family_id) DO NOTHING',
        [assoc.institution_id, assoc.family_id, assoc.created_at]
      );
    }

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await newDb.end();
  }
}

migrateData();
```

**Executar migração:**

```bash
# Instalar dependências
npm install pg @supabase/supabase-js

# Executar script
npx ts-node scripts/migrate-data.ts
```

---

## 3. CONFIGURAÇÃO DO NOVO BANCO

### 3.1 Schema Inicial

**Criar**: `database/schema.sql`

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'institution');

-- Tabela de instituições
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
);

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'institution',
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL
);

-- Tabela de famílias
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT,
    members_count INT DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    blocked_by_institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    block_reason TEXT
);

-- Tabela de entregas
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    delivery_date TIMESTAMPTZ DEFAULT now(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    blocking_period_days INT NOT NULL DEFAULT 30,
    notes TEXT,
    delivered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de associações família-instituição
CREATE TABLE institution_families (
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (institution_id, family_id)
);

-- Índices para performance
CREATE INDEX idx_institutions_name ON institutions(name);
CREATE INDEX idx_families_name ON families(name);
CREATE INDEX idx_families_blocked ON families(is_blocked, blocked_until);
CREATE INDEX idx_deliveries_family ON deliveries(family_id);
CREATE INDEX idx_deliveries_institution ON deliveries(institution_id);
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 3.2 Triggers e Funções

**Criar**: `database/triggers.sql`

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para bloquear família após entrega
CREATE OR REPLACE FUNCTION update_family_blocking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE families
    SET
        is_blocked = true,
        blocked_until = NEW.delivery_date + (NEW.blocking_period_days || ' days')::INTERVAL,
        blocked_by_institution_id = NEW.institution_id,
        block_reason = 'Recebeu cesta básica',
        updated_at = now()
    WHERE id = NEW.family_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para bloqueio automático
CREATE TRIGGER on_delivery_created
    AFTER INSERT ON deliveries
    FOR EACH ROW EXECUTE PROCEDURE update_family_blocking();
```

### 3.3 Seed Data

**Criar**: `database/seed.sql`

```sql
-- Inserir dados de teste
INSERT INTO institutions (name, address, phone) VALUES
('Centro Comunitário São José', 'Rua das Flores, 123', '(11) 9999-8888'),
('Associação Bem-Estar', 'Av. Principal, 456', '(11) 7777-6666'),
('Igreja Nossa Senhora', 'Praça Central, 789', '(11) 5555-4444');

INSERT INTO families (name, contact_person, phone, members_count) VALUES
('Silva', 'João Silva', '(11) 1111-1111', 4),
('Santos', 'Maria Santos', '(11) 2222-2222', 3),
('Oliveira', 'Pedro Oliveira', '(11) 3333-3333', 5);

-- Criar usuário admin (senha: admin123)
INSERT INTO users (email, password, full_name, role) VALUES
('admin@test.com', '$2b$10$hash...', 'Admin Teste', 'admin');

-- Criar usuário instituição (senha: inst123)
INSERT INTO users (email, password, full_name, role, institution_id) VALUES
('instituicao@test.com', '$2b$10$hash...', 'Instituição Teste', 'institution', 
 (SELECT id FROM institutions WHERE name = 'Centro Comunitário São José' LIMIT 1));

-- Vincular famílias a instituições
INSERT INTO institution_families (institution_id, family_id)
SELECT i.id, f.id
FROM institutions i, families f
WHERE i.name = 'Centro Comunitário São José' AND f.name IN ('Silva', 'Santos');

INSERT INTO institution_families (institution_id, family_id)
SELECT i.id, f.id
FROM institutions i, families f
WHERE i.name = 'Associação Bem-Estar' AND f.name = 'Oliveira';
```

---

## 4. CONFIGURAÇÃO TYPEORM

### 4.1 Entities

**Criar**: `src/database/entities/institution.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### 4.2 Migrations

**Criar**: `src/database/migrations/001-initial-schema.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum
    await queryRunner.query(`CREATE TYPE user_role AS ENUM ('admin', 'institution')`);
    
    // Criar tabelas
    await queryRunner.query(`
      CREATE TABLE institutions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT
      )
    `);
    
    // ... outras tabelas
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback
    await queryRunner.query(`DROP TABLE institutions`);
    await queryRunner.query(`DROP TYPE user_role`);
  }
}
```

---

## 5. BACKUP E RECOVERY

### 5.1 Backup Automático

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

# Manter apenas últimos 7 backups
cd backups
ls -t backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "🧹 Backups antigos removidos"
```

### 5.2 Restore

```bash
# Restaurar backup
gunzip -c backup_20250115_143000.sql.gz | psql "$DATABASE_URL"
```

---

## 6. MONITORAMENTO

### 6.1 Health Check

**Criar**: `src/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'disconnected', error: error.message };
    }
  }
}
```

### 6.2 Métricas

```typescript
// Adicionar métricas básicas
@Get('metrics')
async getMetrics() {
  const [institutions, families, deliveries, users] = await Promise.all([
    this.dataSource.query('SELECT COUNT(*) FROM institutions'),
    this.dataSource.query('SELECT COUNT(*) FROM families'),
    this.dataSource.query('SELECT COUNT(*) FROM deliveries'),
    this.dataSource.query('SELECT COUNT(*) FROM users'),
  ]);

  return {
    institutions: institutions[0].count,
    families: families[0].count,
    deliveries: deliveries[0].count,
    users: users[0].count,
  };
}
```

---

## 7. CHECKLIST DE MIGRAÇÃO

### Preparação
- [ ] Escolher provedor de PostgreSQL
- [ ] Configurar instância do banco
- [ ] Testar conectividade
- [ ] Configurar backups

### Migração
- [ ] Exportar dados do Supabase
- [ ] Aplicar schema no novo banco
- [ ] Migrar dados (SQL ou script)
- [ ] Verificar integridade dos dados
- [ ] Testar triggers e funções

### Configuração
- [ ] Configurar TypeORM entities
- [ ] Criar migrations
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexão da API

### Validação
- [ ] Testar CRUD operations
- [ ] Verificar autenticação
- [ ] Testar regras de negócio
- [ ] Validar performance

### Produção
- [ ] Configurar monitoramento
- [ ] Setup backup automático
- [ ] Configurar alertas
- [ ] Documentar procedimentos

---

**Próximo passo**: Consulte [deployment-guide.md](./deployment-guide.md) para opções de deploy e hospedagem.
