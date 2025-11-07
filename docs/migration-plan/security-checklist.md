# Checklist de Segurança

## 🔒 Boas Práticas de Segurança para API Customizada

Este documento detalha todas as medidas de segurança necessárias para proteger a API customizada em produção.

---

## 1. AUTENTICAÇÃO E AUTORIZAÇÃO

### 1.1 JWT Security

**✅ Implementado:**

- [ ] JWT com secret forte (mínimo 256 bits)
- [ ] Expiration time configurado (7 dias máximo)
- [ ] Refresh token implementado (opcional)
- [ ] Blacklist de tokens (logout)

**Configuração:**

```typescript
// JWT Config
JWT_SECRET=your-super-secret-jwt-key-minimum-256-bits
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Implementação:**

```typescript
// src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwt.secret")
    });
  }
}
```

### 1.2 Password Security

**✅ Implementado:**

- [ ] Senhas hasheadas com bcrypt (salt rounds >= 10)
- [ ] Validação de força da senha
- [ ] Não armazenar senhas em texto plano
- [ ] Rate limiting no login

**Implementação:**

```typescript
// src/auth/auth.service.ts
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
```

**Validação de senha:**

```typescript
// src/auth/dto/register.dto.ts
import { IsString, MinLength, Matches } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Senha deve conter pelo menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 símbolo"
  })
  password: string;
}
```

### 1.3 Role-Based Access Control

**✅ Implementado:**

- [ ] Guards para verificar roles
- [ ] Decorators para definir permissões
- [ ] Middleware de autorização
- [ ] Validação de permissões em endpoints

**Implementação:**

```typescript
// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}

// src/auth/decorators/roles.decorator.ts
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

---

## 2. VALIDAÇÃO E SANITIZAÇÃO

### 2.1 Input Validation

**✅ Implementado:**

- [ ] DTOs com class-validator
- [ ] Validação de tipos
- [ ] Validação de formato
- [ ] Sanitização de inputs

**Implementação:**

```typescript
// src/institutions/dto/create-institution.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches
} from "class-validator";

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  @Length(10, 200)
  address?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: "Telefone deve estar no formato (11) 99999-9999"
  })
  phone?: string;
}
```

### 2.2 SQL Injection Prevention

**✅ Implementado:**

- [ ] TypeORM com parameterized queries
- [ ] Validação de inputs
- [ ] Escape de caracteres especiais
- [ ] Não usar concatenação de strings em queries

**Implementação:**

```typescript
// ✅ Correto - TypeORM sanitiza automaticamente
const user = await this.userRepository.findOne({
  where: { email: userEmail }
});

// ❌ Incorreto - nunca fazer isso
const user = await this.userRepository.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### 2.3 XSS Prevention

**✅ Implementado:**

- [ ] Sanitização de HTML
- [ ] Headers de segurança
- [ ] Content Security Policy
- [ ] Escape de caracteres especiais

**Implementação:**

```typescript
// src/main.ts
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});
```

---

## 3. RATE LIMITING E DDoS PROTECTION

### 3.1 Rate Limiting

**✅ Implementado:**

- [ ] Rate limiting global
- [ ] Rate limiting por endpoint
- [ ] Rate limiting por IP
- [ ] Rate limiting por usuário

**Implementação:**

```typescript
// src/main.ts
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100 // 100 requests por minuto
      }
    ])
  ]
})
export class AppModule {}

// src/auth/auth.controller.ts
@Controller("auth")
@Throttle(5, 60) // 5 tentativas por minuto
export class AuthController {
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

### 3.2 DDoS Protection

**✅ Implementado:**

- [ ] Rate limiting agressivo
- [ ] Timeout de conexão
- [ ] Limite de payload
- [ ] Monitoramento de tráfego

**Implementação:**

```typescript
// src/main.ts
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 segundos
  res.setTimeout(30000);
  next();
});
```

---

## 4. CORS E HEADERS DE SEGURANÇA

### 4.1 CORS Configuration

**✅ Implementado:**

- [ ] CORS configurado corretamente
- [ ] Origins específicos
- [ ] Credentials controlados
- [ ] Methods permitidos

**Implementação:**

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
});
```

### 4.2 Security Headers

**✅ Implementado:**

- [ ] X-Content-Type-Options
- [ ] X-Frame-Options
- [ ] X-XSS-Protection
- [ ] Content-Security-Policy
- [ ] Strict-Transport-Security

**Implementação:**

```typescript
// src/main.ts
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
```

---

## 5. LOGGING E MONITORAMENTO

### 5.1 Security Logging

**✅ Implementado:**

- [ ] Log de tentativas de login
- [ ] Log de ações sensíveis
- [ ] Log de erros de autenticação
- [ ] Log de violações de segurança

**Implementação:**

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private logger: Logger) {}

  async login(email: string, password: string) {
    try {
      const user = await this.validateUser(email, password);
      if (!user) {
        this.logger.warn(`Failed login attempt for email: ${email}`);
        throw new UnauthorizedException("Invalid credentials");
      }

      this.logger.log(`Successful login for user: ${user.id}`);
      return this.generateTokens(user);
    } catch (error) {
      this.logger.error(`Login error for email: ${email}`, error.stack);
      throw error;
    }
  }
}
```

### 5.2 Audit Trail

**✅ Implementado:**

- [ ] Log de criação de registros
- [ ] Log de atualizações
- [ ] Log de exclusões
- [ ] Log de acessos sensíveis

**Implementação:**

```typescript
// src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    this.logger.log(`User ${user?.id} performed ${method} ${url}`);

    return next.handle();
  }
}
```

---

## 6. ENCRYPTION E DADOS SENSÍVEIS

### 6.1 Data Encryption

**✅ Implementado:**

- [ ] Senhas hasheadas
- [ ] Dados sensíveis criptografados
- [ ] Chaves de API seguras
- [ ] Tokens seguros

**Implementação:**

```typescript
// src/common/services/encryption.service.ts
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY,
    "salt",
    32
  );

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from("additional data"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from("additional data"));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

### 6.2 Environment Variables

**✅ Implementado:**

- [ ] Variáveis sensíveis em .env
- [ ] .env não versionado
- [ ] Secrets em produção
- [ ] Rotação de chaves

**Configuração:**

```bash
# .env (não versionar)
JWT_SECRET=your-super-secret-jwt-key-minimum-256-bits
ENCRYPTION_KEY=your-encryption-key-32-bytes
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## 7. BACKUP E RECOVERY

### 7.1 Data Backup

**✅ Implementado:**

- [ ] Backup automático diário
- [ ] Backup antes de deploys
- [ ] Backup criptografado
- [ ] Teste de restore

**Implementação:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Backup com criptografia
pg_dump "$DATABASE_URL" | gzip | openssl enc -aes-256-cbc -salt -out "backups/${BACKUP_FILE}.gz.enc" -pass pass:"$BACKUP_PASSWORD"

# Upload para storage seguro
aws s3 cp "backups/${BACKUP_FILE}.gz.enc" s3://seu-bucket/backups/

echo "✅ Backup criptografado criado: ${BACKUP_FILE}.gz.enc"
```

### 7.2 Disaster Recovery

**✅ Implementado:**

- [ ] Plano de recuperação
- [ ] RTO definido (Recovery Time Objective)
- [ ] RPO definido (Recovery Point Objective)
- [ ] Teste de disaster recovery

---

## 8. COMPLIANCE E PRIVACY

### 8.1 LGPD Compliance

**✅ Implementado:**

- [ ] Consentimento de dados
- [ ] Direito ao esquecimento
- [ ] Portabilidade de dados
- [ ] Notificação de vazamentos

**Implementação:**

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  async deleteUser(id: string): Promise<void> {
    // Soft delete para compliance
    await this.userRepository.update(id, {
      deleted_at: new Date(),
      email: `deleted_${Date.now()}@deleted.com`
    });
  }

  async exportUserData(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    const deliveries = await this.deliveryRepository.find({
      where: { delivered_by_user_id: id }
    });

    return {
      user,
      deliveries,
      exported_at: new Date()
    };
  }
}
```

### 8.2 Data Privacy

**✅ Implementado:**

- [ ] Minimização de dados
- [ ] Anonimização
- [ ] Pseudonimização
- [ ] Controle de acesso

---

## 9. CHECKLIST DE SEGURANÇA

### Autenticação

- [ ] JWT com secret forte
- [ ] Senhas hasheadas (bcrypt)
- [ ] Rate limiting no login
- [ ] Validação de força da senha
- [ ] Logout seguro

### Autorização

- [ ] Role-based access control
- [ ] Guards implementados
- [ ] Validação de permissões
- [ ] Princípio do menor privilégio

### Validação

- [ ] DTOs com validação
- [ ] Sanitização de inputs
- [ ] Prevenção de SQL injection
- [ ] Prevenção de XSS

### Headers e CORS

- [ ] CORS configurado
- [ ] Security headers
- [ ] Content Security Policy
- [ ] HTTPS obrigatório

### Logging

- [ ] Log de segurança
- [ ] Audit trail
- [ ] Monitoramento
- [ ] Alertas de segurança

### Backup

- [ ] Backup automático
- [ ] Backup criptografado
- [ ] Teste de restore
- [ ] Disaster recovery

### Compliance

- [ ] LGPD compliance
- [ ] Privacy by design
- [ ] Data minimization
- [ ] Right to be forgotten

---

## 10. FERRAMENTAS DE SEGURANÇA

### 10.1 Dependências

```bash
# Instalar ferramentas de segurança
npm install helmet
npm install express-rate-limit
npm install express-validator
npm install bcrypt
npm install jsonwebtoken
npm install @nestjs/throttler
```

### 10.2 Middleware de Segurança

```typescript
// src/main.ts
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  })
);
```

### 10.3 Monitoramento

```typescript
// src/common/middleware/security.middleware.ts
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log de tentativas suspeitas
    if (req.headers["user-agent"]?.includes("bot")) {
      console.warn(`Bot detected: ${req.ip}`);
    }

    // Rate limiting por IP
    // ... implementação

    next();
  }
}
```

---

**Próximo passo**: Consulte [testing-strategy.md](./testing-strategy.md) para estratégia de testes e validação.
