# User-Profile Module Overview

## Purpose
The user-profile module owns a user-facing profile domain:
- username
- bio
- avatar key
- profile QR code payload

It is implemented in a clean-layer style:
- presentation: HTTP controller
- application: use-cases, DTOs, ports
- domain: aggregate, value objects, domain events, domain errors
- infrastructure: Prisma repository, storage adapter, QR code adapter
- di: module tokens and bindings

## Folder Layout
Current module structure:
- profile.module.ts
- presentation/profile.controller.ts
- application/use-cases/*.ts
- application/dtos/**
- application/ports/**
- application/mappers/**
- domain/entities/**
- domain/value-objects/**
- domain/events/**
- domain/errors/**
- domain/repositories/**
- infrastructure/repositories/**
- infrastructure/persistence/**
- di/profile.token.ts

## Public HTTP API
Controller base route: /profiles

Exposed endpoints:
- GET /profiles/me
- GET /profiles/:username
- PATCH /profiles/me
- PATCH /profiles/me/avatar
- GET /profiles/me/qrcode

All endpoints currently:
- use response builder from shared/http/builder/response.factory.ts
- require Role.USER or Role.ADMIN via Role decorator
- enforce role checks inside controller based on decorator metadata

## Use-Case Responsibilities
- GetProfileUseCase
  - fetches by userId or username
  - validates at least one lookup key is provided
  - maps domain aggregate to output DTO

- UpdateProfileUseCase
  - loads profile by userId
  - checks username uniqueness if changed
  - updates profile aggregate
  - persists and returns mapped DTO

- ChangeAvatarUseCase
  - loads profile by userId
  - changes avatar key (or removes it)
  - persists and returns mapped DTO

- GenerateProfileQrCodeUseCase
  - loads profile by userId
  - creates deep link buddyshot://profile/<username>
  - delegates QR generation to IQrCodePort

## Domain Model Notes
Aggregate root: Profile

Important value objects:
- Username
- Bio
- AvatarKey

Domain events emitted by Profile aggregate:
- ProfileUpdatedEvent
- AvatarChangedEvent

Typical intent:
- domain event publication should occur through IEventBus after successful persistence

## Dependency Injection
Module registration file: profile.module.ts

Bindings:
- Ports
  - PROFILE_KEY.PORT.STORAGE -> R2StorageAdapter
  - PROFILE_KEY.PORT.QR_CODE -> QrCodeAdapter

- Repository
  - PROFILE_KEY.REPOSITORY -> PrismaProfileRepository (dynamic, uses PRISMA_CLIENT and EVENT_BUS)

- Use-cases
  - PROFILE_KEY.USE_CASE.GET_PROFILE -> GetProfileUseCase
  - PROFILE_KEY.USE_CASE.UPDATE_PROFILE -> UpdateProfileUseCase
  - PROFILE_KEY.USE_CASE.CHANGE_AVATAR -> ChangeAvatarUseCase
  - PROFILE_KEY.USE_CASE.GENERATE_QR_CODE -> GenerateProfileQrCodeUseCase

## Data and Integration Points
Storage:
- abstraction: IStoragePort
- default implementation: R2StorageAdapter

QR code:
- abstraction: IQrCodePort
- default implementation: QrCodeAdapter (qrcode package)

Persistence:
- abstraction: IProfileRepository
- default implementation: PrismaProfileRepository
- source of truth table: users (profile fields co-located with identity user record)

## Request Flow
1. HTTP request reaches ProfileController
2. Controller performs role check and extracts user context
3. Controller calls use-case
4. Use-case loads and mutates domain aggregate if needed
5. Repository persists through Prisma
6. Controller returns standardized response via ok(...)

## Current Constraints and Gaps
- Authentication middleware population of req.user is assumed by controller and should be guaranteed globally before profile routes.
- Identity-access module is present but not yet wired into main app container in app.ts.
- EVENT_BUS currently defaults to a no-op implementation in shared.module.ts.
- Event-driven side effects (for example old avatar object cleanup) are modeled but not fully orchestrated with a real event bus yet.

## Recommended Next Steps
- Register identity module in app.ts once auth controller and bindings are ready.
- Add request payload validation for update and avatar endpoints.
- Replace no-op EVENT_BUS with concrete implementation.
- Add integration tests for profile endpoints and RBAC behavior.
