# Backend Architecture Overview

## Scope

This document describes the current architecture of apps/server, including runtime composition, module boundaries, dependency injection, and data access strategy.

## Runtime Composition

Entrypoints:

- src/server.ts
- src/app.ts

Boot process:

1. server.ts calls createApp()
2. app.ts builds a single Inversify container
3. app.ts loads container modules:
   - sharedModule
   - healthModule
   - profileModule
4. InversifyExpressServer builds Express app under API root prefix
5. Global middleware and error middleware are attached

API root prefix:

- /api/v1 (from shared/constants.ts)

## Architectural Style

Primary style:

- modular monolith
- dependency injection with Inversify
- layered module design (presentation, application, domain, infrastructure)

Common cross-cutting concerns in shared:

- error model and global error middleware
- response factory and API response contracts
- domain primitives (Entity, AggregateRoot, ValueObject, DomainEvent)
- database and transaction infrastructure
- security helpers (role metadata, role guard contract)

## Module Map

Active in app container:

- health
- user-profile

Present but currently not loaded in app.ts:

- identity-access

### Health Module

Responsibility:

- liveness/readiness style health checks

Key components:

- HealthController
- HealthCheckUseCase
- HealthIndicator interface
- PostgreHealthIndicator

### User-Profile Module

Responsibility:

- profile retrieval and mutation
- avatar key update
- profile QR payload generation

Key components:

- ProfileController
- profile use-cases
- Profile aggregate and value objects
- PrismaProfileRepository
- R2StorageAdapter
- QrCodeAdapter

### Shared Module

Responsibility:

- bootstrap infrastructure bindings consumed by feature modules

Key bindings:

- PRISMA_CLIENT -> singleton PrismaClient
- UNIT_OF_WORK -> PrismaUnitOfWork
- REPOSITORY_REGISTRY -> RepositoryRegistry
- EVENT_BUS -> current no-op IEventBus implementation

## DI and Token Strategy

Token file:

- src/shared/shared-di.tokens.ts

Pattern:

- shared layer exposes global tokens (database, unit of work, event bus)
- each feature module has local token map (for repository, ports, use-cases)
- controllers depend on explicit use-case bindings

Benefits:

- no hidden singleton imports
- easy replacement of adapters in tests or environments
- explicit module dependency graph

## Request/Response Standardization

Shared response builder:

- src/shared/http/builder/response.factory.ts

Usage pattern:

- success responses via ok(...)
- error responses via fail(...)
- middleware maps domain/app errors to standardized error payload

## Data Access and Persistence

ORM:

- Prisma with PostgreSQL

Schema location:

- prisma/schema.prisma
- prisma/models/\*.prisma

Migrations:

- prisma/migrations/\*

Repository pattern:

- feature repositories hide Prisma details from use-cases
- domain objects are mapped using dedicated mappers

Transaction support:

- PrismaUnitOfWork and transactional abstractions exist in shared
- event dispatch hooks are modeled inside unit-of-work flow

## Security and RBAC

Current building blocks:

- req.user typing in shared/types/express.d.ts
- Role decorator metadata
- role guard utility

Current status:

- profile controller performs metadata-based role checks per endpoint
- authentication middleware pipeline should populate req.user before protected routes

## Configuration

Environment loader:

- shared/config/env.config.ts

Covers:

- app runtime config
- JWT values
- database and pool settings
- Cloudflare R2 credentials and bucket/public URL base

## Operational Notes

Commands in apps/server/package.json:

- dev, build, start
- prisma:generate, prisma:migrate, prisma:format

Docker support:

- docker-compose.yml contains local postgres and pgadmin

## Current State Summary

Implemented and wired:

- shared infrastructure
- health module
- user-profile module

Not yet fully wired:

- identity-access module container registration in app.ts
- concrete event bus implementation (currently no-op)

## Recommended Evolution Path

1. Wire identity-access module into app.ts once bindings/controllers are ready.
2. Replace no-op event bus with concrete adapter.
3. Add global auth middleware before route handling for protected modules.
4. Add end-to-end tests for controller + use-case + repository integration.
5. Add observability layer (request IDs, structured logs, latency metrics).
