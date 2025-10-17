# Guia de Implementação: API Customizada

## 🚀 Passo a Passo Completo

Este guia fornece instruções detalhadas para implementar a API customizada com NestJS, substituindo o Supabase.

---

## 1. SETUP INICIAL DO BACKEND

### 1.1 Criar Projeto NestJS

```bash
# Criar projeto NestJS
npx @nestjs/cli new cesta-control-hub-backend
cd cesta-control-hub-backend

# Instalar dependências principais
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt bcrypt
npm install class-validator class-transformer
npm install @nestjs/config
npm install @nestjs/throttler

# Dev dependencies
npm install -D @types/passport-jwt @types/bcrypt
```

### 1.2 Configurar TypeORM

**Criar**: `src/database/database.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST"),
        port: configService.get("DB_PORT"),
        username: configService.get("DB_USERNAME"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_NAME"),
        entities: [__dirname + "/../**/*.entity{.ts,.js}"],
        synchronize: false, // usar migrations
        logging: true
      })
    })
  ]
})
export class DatabaseModule {}
```

### 1.3 Configurar Variáveis de Ambiente

**Criar**: `.env.example`

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cesta_control_hub

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

**Criar**: `src/config/configuration.ts`

```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  }
});
```

---

## 2. MÓDULO DE AUTENTICAÇÃO

### 2.1 Criar Entities

**Criar**: `src/users/user.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { Exclude } from "class-transformer";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  full_name: string;

  @Column({
    type: "enum",
    enum: ["admin", "institution"],
    default: "institution"
  })
  role: "admin" | "institution";

  @Column({ nullable: true })
  institution_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### 2.2 Auth Service

**Criar**: `src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        institution_id: user.institution_id
      }
    };
  }
}
```

### 2.3 Auth Controller

**Criar**: `src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.authService.login(user);
  }
}
```

### 2.4 Guards e Strategies

**Criar**: `src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

**Criar**: `src/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
```

**Criar**: `src/auth/strategies/jwt.strategy.ts`

```typescript
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwt.secret")
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      institution_id: payload.institution_id
    };
  }
}
```

---

## 3. MÓDULOS CRUD

### 3.1 Módulo de Instituições

**Criar**: `src/institutions/institution.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

@Entity("institutions")
export class Institution {
  @PrimaryGeneratedColumn("uuid")
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

**Criar**: `src/institutions/dto/create-institution.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

**Criar**: `src/institutions/institutions.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Institution } from "./institution.entity";
import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private institutionsRepository: Repository<Institution>
  ) {}

  async create(
    createInstitutionDto: CreateInstitutionDto
  ): Promise<Institution> {
    const institution =
      this.institutionsRepository.create(createInstitutionDto);
    return this.institutionsRepository.save(institution);
  }

  async findAll(): Promise<Institution[]> {
    return this.institutionsRepository.find({
      order: { name: "ASC" }
    });
  }

  async findOne(id: string): Promise<Institution> {
    return this.institutionsRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateInstitutionDto: UpdateInstitutionDto
  ): Promise<Institution> {
    await this.institutionsRepository.update(id, updateInstitutionDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.institutionsRepository.delete(id);
  }
}
```

**Criar**: `src/institutions/institutions.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from "@nestjs/common";
import { InstitutionsService } from "./institutions.service";
import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("institutions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles("admin")
  create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @Get()
  @Roles("admin", "institution")
  findAll() {
    return this.institutionsService.findAll();
  }

  @Get(":id")
  @Roles("admin", "institution")
  findOne(@Param("id") id: string) {
    return this.institutionsService.findOne(id);
  }

  @Patch(":id")
  @Roles("admin")
  update(
    @Param("id") id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto
  ) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  @Delete(":id")
  @Roles("admin")
  remove(@Param("id") id: string) {
    return this.institutionsService.remove(id);
  }
}
```

### 3.2 Módulo de Famílias

**Criar**: `src/families/family.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable
} from "typeorm";
import { Institution } from "../institutions/institution.entity";

@Entity("families")
export class Family {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  contact_person: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 1 })
  members_count: number;

  @Column({ default: false })
  is_blocked: boolean;

  @Column({ nullable: true })
  blocked_until: Date;

  @Column({ nullable: true })
  blocked_by_institution_id: string;

  @Column({ nullable: true })
  block_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Institution, { nullable: true })
  @JoinColumn({ name: "blocked_by_institution_id" })
  blocked_by_institution: Institution;

  @ManyToMany(() => Institution)
  @JoinTable({
    name: "institution_families",
    joinColumn: { name: "family_id" },
    inverseJoinColumn: { name: "institution_id" }
  })
  institutions: Institution[];
}
```

### 3.3 Módulo de Entregas

**Criar**: `src/deliveries/delivery.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Family } from "../families/family.entity";
import { Institution } from "../institutions/institution.entity";
import { User } from "../users/user.entity";

@Entity("deliveries")
export class Delivery {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  family_id: string;

  @Column()
  institution_id: string;

  @Column({ default: 30 })
  blocking_period_days: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  delivered_by_user_id: string;

  @CreateDateColumn()
  delivery_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Family)
  @JoinColumn({ name: "family_id" })
  family: Family;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: "institution_id" })
  institution: Institution;

  @ManyToOne(() => User)
  @JoinColumn({ name: "delivered_by_user_id" })
  delivered_by_user: User;
}
```

**Criar**: `src/deliveries/deliveries.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Delivery } from "./delivery.entity";
import { CreateDeliveryDto } from "./dto/create-delivery.dto";
import { FamiliesService } from "../families/families.service";
import { addDays } from "date-fns";

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    private familiesService: FamiliesService
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const delivery = this.deliveriesRepository.create(createDeliveryDto);
    const savedDelivery = await this.deliveriesRepository.save(delivery);

    // Bloquear família automaticamente
    await this.familiesService.update(createDeliveryDto.family_id, {
      is_blocked: true,
      blocked_until: addDays(
        new Date(),
        createDeliveryDto.blocking_period_days
      ),
      blocked_by_institution_id: createDeliveryDto.institution_id,
      block_reason: "Recebeu cesta básica"
    });

    return savedDelivery;
  }

  async findAll(institutionId?: string): Promise<Delivery[]> {
    const query = this.deliveriesRepository
      .createQueryBuilder("delivery")
      .leftJoinAndSelect("delivery.family", "family")
      .leftJoinAndSelect("delivery.institution", "institution")
      .leftJoinAndSelect("delivery.delivered_by_user", "delivered_by_user")
      .orderBy("delivery.delivery_date", "DESC");

    if (institutionId) {
      query.where("delivery.institution_id = :institutionId", {
        institutionId
      });
    }

    return query.getMany();
  }
}
```

---

## 4. CONFIGURAÇÃO DO APP

### 4.1 App Module

**Criar**: `src/app.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { InstitutionsModule } from "./institutions/institutions.module";
import { FamiliesModule } from "./families/families.module";
import { DeliveriesModule } from "./deliveries/deliveries.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10
      }
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    FamiliesModule,
    DeliveriesModule
  ]
})
export class AppModule {}
```

### 4.2 Main.ts

**Criar**: `src/main.ts`

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

---

## 5. DOCKER SETUP

### 5.1 Dockerfile

**Criar**: `Dockerfile`

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

### 5.2 Docker Compose

**Criar**: `docker-compose.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cesta_control_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_NAME: cesta_control_hub
      JWT_SECRET: your-secret-key-change-in-production
      NODE_ENV: development
    depends_on:
      - postgres
    volumes:
      - ./src:/app/src

volumes:
  postgres_data:
```

---

## 6. MIGRAÇÃO DE DADOS

### 6.1 Exportar do Supabase

```bash
# Via Supabase CLI
supabase db dump -f schema.sql --schema public

# Ou via pgAdmin/DBeaver
# Exportar: Tables, Functions, Triggers
```

### 6.2 Aplicar no Novo DB

```bash
# Iniciar containers
docker-compose up -d

# Aplicar schema
docker exec -i cesta-control-hub-backend_postgres_1 psql -U postgres -d cesta_control_hub < schema.sql
```

### 6.3 Seed Data

**Criar**: `src/database/seeds/initial-seed.sql`

```sql
-- Inserir dados de teste
INSERT INTO institutions (name, address, phone) VALUES
('Centro Comunitário São José', 'Rua das Flores, 123', '(11) 9999-8888'),
('Associação Bem-Estar', 'Av. Principal, 456', '(11) 7777-6666');

INSERT INTO families (name, contact_person, phone, members_count) VALUES
('Silva', 'João Silva', '(11) 1111-1111', 4),
('Santos', 'Maria Santos', '(11) 2222-2222', 3);

-- Criar usuário admin
INSERT INTO users (email, password, full_name, role) VALUES
('admin@test.com', '$2b$10$hash...', 'Admin Teste', 'admin');
```

---

## 7. COMANDOS ÚTEIS

### Desenvolvimento

```bash
# Iniciar em desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:e2e

# Docker
docker-compose up -d
docker-compose down
```

### Produção

```bash
# Build para produção
npm run build

# Iniciar produção
npm run start:prod

# Docker produção
docker build -t cesta-control-hub-api .
docker run -p 3000:3000 cesta-control-hub-api
```

---

**Próximo passo**: Consulte [frontend-refactoring.md](./frontend-refactoring.md) para refatorar o frontend.
