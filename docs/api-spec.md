# BarberApp API — Especificação Técnica

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24 + TypeScript |
| Framework | NestJS |
| Banco de dados | PostgreSQL 15 (Docker) |
| ORM | TypeORM (`synchronize: true`) |
| Autenticação | JWT (access + refresh token) |
| Validação | class-validator / class-transformer |
| Documentação | Swagger (OpenAPI 3) — `/api` |
| Logging | nestjs-pino + pino-pretty |
| Push notifications | Expo Push API |

---

## Arquitetura de Módulos

```
AuthModule
UsersModule
BarbersModule       → depende de UsersModule
ServicesModule      → depende de BarbersModule
AppointmentsModule  → depende de NotificationsModule
NotificationsModule
```

Cada módulo segue a estrutura padrão do NestJS: `entity → dto → service → controller → module`.

---

## Modelo de Dados

### BaseEntity (herdada por todas as entidades)

| Campo | Tipo | Descrição |
|---|---|---|
| `ID` | UUID PK | Gerado automaticamente |
| `CRIADO_EM` | timestamp | Data de criação |
| `STATUS` | enum | `ATIVO` (padrão) |
| `ATUALIZADO_EM` | timestamp nullable | Última atualização |
| `EXCLUIDO_EM` | timestamp nullable | Soft-delete |

### User

| Campo | Tipo |
|---|---|
| `NAME` | varchar |
| `EMAIL` | varchar unique |
| `PASSWORD` | varchar (hash) |
| `TYPE` | enum `CLIENT \| BARBER` |
| `REFRESH_TOKEN` | varchar nullable |
| `PASSWORD_RESET_TOKEN` | varchar nullable |
| `PASSWORD_RESET_EXPIRES` | timestamp nullable |
| `PUSH_TOKEN` | varchar nullable |

### Barber

| Campo | Tipo |
|---|---|
| `SHOP_NAME` | varchar |
| `CNPJ` | varchar unique |
| `RATING` | float (default 0) |
| `STREET / NUMBER / COMPLEMENT` | varchar |
| `NEIGHBORHOOD / CITY / STATE` | varchar |
| `ZIP_CODE` | varchar (00000-000) |
| `USER` | OneToOne → User |
| `SERVICES` | OneToMany → Service |

### Service

| Campo | Tipo |
|---|---|
| `NAME` | varchar |
| `PRICE` | decimal (10, 2) |
| `DURATION_MINUTES` | int |
| `BARBER` | ManyToOne → Barber (CASCADE DELETE) |

### Appointment

| Campo | Tipo |
|---|---|
| `DATE` | varchar (YYYY-MM-DD) |
| `TIME` | varchar (HH:MM) |
| `APPOINTMENT_STATUS` | enum `PENDING \| CONFIRMED \| COMPLETED \| CANCELLED` |
| `BARBER` | ManyToOne → Barber |
| `CLIENT` | ManyToOne → User |
| `SERVICES` | ManyToMany → Service (JoinTable) |

---

## Endpoints

### Auth `/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/register` | — | Cria usuário CLIENT ou BARBER |
| POST | `/login` | — | Retorna `access_token` + `refresh_token` |
| POST | `/refresh` | Bearer (refresh) | Renova ambos os tokens |
| POST | `/logout` | — | Invalida refresh token pelo `id` |
| GET | `/me` | Bearer | Dados do usuário autenticado |
| POST | `/forgot-password` | — | Envia e-mail de recuperação |
| POST | `/reset-password` | — | Reseta senha com token de e-mail |

---

### Usuários `/users`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/me` | Bearer | Perfil do usuário autenticado |
| POST | `/push-token` | Bearer | Salva Expo push token do dispositivo |

**Body `POST /users/push-token`:**
```json
{ "TOKEN": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

---

### Barbearias `/barbers`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | — | Lista todas, ordenadas por rating DESC |
| GET | `/:id/services` | — | Serviços de uma barbearia |
| GET | `/:id/available-slots?date=` | — | Slots disponíveis (09:00–18:30, de 30 em 30 min) |
| PATCH | `/me` | Bearer BARBER | Atualiza perfil da barbearia |

**Response `GET /barbers` (por item):**
```json
{
  "id": "uuid",
  "shop_name": "Barbearia do João",
  "rating": 4.8,
  "street": "Rua das Flores",
  "city": "São Paulo",
  "state": "SP",
  "services": [
    { "id": "uuid", "name": "Corte", "price": 35.00, "duration_minutes": 30 }
  ]
}
```

**Lógica de slots:**
- Gera horários de 30 em 30 min entre 09:00 e 18:30
- Remove slots com agendamentos `PENDING` ou `CONFIRMED`
- Se `date === hoje`, remove horários que já passaram

---

### Serviços `/services`

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET | `/mine` | Bearer | BARBER | Serviços da barbearia autenticada |
| GET | `/?barberId=` | — | — | Serviços de uma barbearia por ID |
| POST | `/` | Bearer | BARBER | Cria serviço na barbearia |
| PATCH | `/:id` | Bearer | BARBER (dono) | Atualiza serviço |
| DELETE | `/:id` | Bearer | BARBER (dono) | Remove serviço |

---

### Agendamentos `/appointments`

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET | `/` | Bearer | BARBER | Agendamentos da barbearia (`?date=` `?status=`) |
| GET | `/mine` | Bearer | CLIENT | Histórico completo do cliente |
| GET | `/:id` | Bearer | — | Detalhe de um agendamento |
| POST | `/` | Bearer | CLIENT | Criar agendamento |
| PATCH | `/:id/status` | Bearer | — | Atualizar status |

**Body `POST /appointments`:**
```json
{
  "BARBER_ID": "uuid",
  "SERVICE_IDS": ["uuid", "uuid"],
  "DATE": "2026-06-15",
  "TIME": "09:30"
}
```

**Validações de criação:**
- `DATE` não pode ser no passado
- Slot não pode estar ocupado (conflito: mesmo barbeiro + data + hora com status PENDING/CONFIRMED)
- Todos os `SERVICE_IDS` devem pertencer ao barbeiro informado

---

## Máquina de Estados — Agendamento

```
         ┌──────────────┐
         │   PENDING    │
         └──────┬───────┘
        ┌───────┴────────┐
        ▼                ▼
  CONFIRMED          CANCELLED
   (terminal
    parcial)
        │
   ┌────┴─────┐
   ▼          ▼
COMPLETED  CANCELLED
```

Transições permitidas:

| De | Para |
|---|---|
| PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | COMPLETED, CANCELLED |
| COMPLETED | — (terminal) |
| CANCELLED | — (terminal) |

Qualquer transição fora das permitidas retorna `400 Bad Request`.

---

## Notificações Push (Expo)

O `NotificationsService` realiza chamadas **fire-and-forget** para `POST https://exp.host/--/api/v2/push/send`. Falhas são logadas mas nunca quebram a requisição.

| Evento | Destinatário | Mensagem |
|---|---|---|
| Agendamento criado | Barbeiro | "Novo agendamento para {data} às {hora}" |
| Status → CONFIRMED | Cliente | "Seu agendamento foi confirmado!" |
| Status → CANCELLED | Cliente | "Seu agendamento foi cancelado." |

**Pré-requisito:** o app mobile deve chamar `POST /users/push-token` após o login. O projeto Expo precisa ter `projectId` configurado em `app.json` (`eas init`).

---

## Segurança e Autenticação

- **Access token:** curta duração · enviado como `Authorization: Bearer <token>`
- **Refresh token:** longa duração · armazenado em hash no banco · invalidado no logout
- **Roles guard:** `@Roles(UserType.CLIENT | UserType.BARBER)` · retorna `403` se o tipo não corresponder
- **Recuperação de senha:** token com expiração (`PASSWORD_RESET_EXPIRES`) · uso único

---

## Decisões Técnicas

| Decisão | Motivo |
|---|---|
| `synchronize: true` | Adequado para MVP; em produção substituir por migrations |
| Slots calculados on-demand | Sem tabela de slots; evita dados stale; geração algorítmica por request |
| Soft-delete preparado | `BaseEntity` tem `EXCLUIDO_EM`; pronto para ativar `@DeleteDateColumn` |
| Multi-serviço por agendamento | Relação `ManyToMany` entre `Appointment` e `Service` |
| Notificação fire-and-forget | Push não pode bloquear a transação principal |

---

## Configuração Local

```bash
# 1. Subir banco de dados
npm run db:up

# 2. Variáveis de ambiente (.env)
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASS=postgres
DB_NAME=barberapp
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
NODE_ENV=development
PORT=3001

# 3. Iniciar em modo desenvolvimento
npm run start:dev

# Swagger disponível em:
# http://localhost:3001/api
```
