# PJOS Database Change Plan: D-1 Identity & Access Domain

## 1. Overview
This document specifies the additive database changes introduced in **PJOS-01-DOMAIN (Decision D-1)** for server-side identity, person charting, and fine-grained access control.

The change is **100% additive**. No existing models (`AstrologyConsultation`, `AstrologyConsultant`, `AstrologyCustomerProfile`, `AstrologyFamilyMember`, etc.) or columns are altered, renamed, or dropped.

---

## 2. New Models & Enums

### 2.1 Enums

| Enum | Values | Purpose |
| :--- | :--- | :--- |
| `PjosAuthChannel` | `PHONE_OTP`, `EMAIL`, `GOOGLE` | Replaceable authentication transports; auth credentials never own charted persons. |
| `PjosSensitivity` | `ACCOUNT_PRIVATE`, `PERSONAL_ASTROLOGY`, `CONSULTATION_CONFIDENTIAL`, `PANDIT_INTERNAL` | 4-tier sensitivity ladder governing resource access. |
| `PjosRelationshipType` | `SELF`, `GUARDIAN_MANAGED`, `WITH_CONSENT`, `IMPORTED_FOR_PRIVATE_ANALYSIS`, `PANDIT_CLIENT` | Distinguishable relationship classes between an Account and a Person. |
| `PjosGrantScope` | `READ`, `WRITE`, `CONSULT`, `MANAGE` | Action capabilities granted to an account or practitioner. |
| `PjosConsentStatus` | `GRANTED`, `REVOKED`, `EXPIRED` | Append-only consent lifecycle states (latest-event-wins). |

---

### 2.2 Models

#### A. `PjosAccount`
Server-side account representing an authenticated principal.
```prisma
model PjosAccount {
  id          String   @id @default(uuid())
  projectId   String   @default("cosmic-tantra")
  authChannel PjosAuthChannel
  authSubject String // phone (E.164) / email / provider subject id
  displayName String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  relationships PjosPersonRelationship[]
  grantsGranted PjosAccessGrant[] @relation("GrantedBy")
  consents      PjosConsentRecord[]

  @@unique([authChannel, authSubject])
  @@index([projectId])
}
```

#### B. `PjosPerson`
The charted entity (Self, Child, Parent, Partner, Client). One account can manage multiple persons.
```prisma
model PjosPerson {
  id          String   @id @default(uuid())
  projectId   String   @default("cosmic-tantra")
  displayName String
  birthDate   DateTime?
  birthTime   String? // HH:mm — timeConfidence semantics live on the kundli record
  birthPlace  String?
  birthLat    Float?
  birthLon    Float?
  isMinor     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  relationships PjosPersonRelationship[]
  accessGrants  PjosAccessGrant[]
  consents      PjosConsentRecord[]

  @@index([projectId])
}
```

#### C. `PjosPersonRelationship`
Mapping between an Account and a Person with an explicit relation type.
```prisma
model PjosPersonRelationship {
  id           String               @id @default(uuid())
  accountId    String
  personId     String
  relationType PjosRelationshipType
  guardianRole String? // for GUARDIAN_MANAGED: FATHER / MOTHER / ...
  isActive     Boolean              @default(true)
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  account PjosAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  person  PjosPerson  @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([accountId, personId])
  @@index([personId])
}
```

#### D. `PjosAccessGrant`
Fine-grained scoped delegation to an Account or Practitioner.
```prisma
model PjosAccessGrant {
  id                    String          @id @default(uuid())
  personId              String
  granteeAccountId      String? // family/professional-account grantee
  granteePractitionerId String? // professional (practitioner) grantee
  scope                 PjosGrantScope
  sensitivity           PjosSensitivity
  grantedById           String? // account that created the grant
  grantedAt             DateTime        @default(now())
  expiresAt             DateTime?
  revokedAt             DateTime?

  person    PjosPerson   @relation(fields: [personId], references: [id], onDelete: Cascade)
  grantedBy PjosAccount? @relation("GrantedBy", fields: [grantedById], references: [id], onDelete: SetNull)

  @@index([personId])
  @@index([granteeAccountId])
  @@index([granteePractitionerId])
}
```

#### E. `PjosConsentRecord`
Append-only legal and DPDP consent trail.
```prisma
model PjosConsentRecord {
  id          String           @id @default(uuid())
  personId    String
  accountId   String? // null => consent given in a professional context
  sensitivity PjosSensitivity
  status      PjosConsentStatus @default(GRANTED)
  purpose     String
  version     String           @default("v1")
  grantedAt   DateTime         @default(now())
  revokedAt   DateTime?

  person    PjosPerson    @relation(fields: [personId], references: [id], onDelete: Cascade)
  givenBy   PjosAccount?  @relation(fields: [accountId], references: [id], onDelete: SetNull)

  @@index([personId, status])
  @@index([accountId])
}
```

---

## 3. Constraints & Indexes Analysis

| Model | Constraint / Index | Columns | Type | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `PjosAccount` | `@@unique` | `[authChannel, authSubject]` | Unique Index | Enforces one account per unique credential across auth channels. |
| `PjosAccount` | `@@index` | `[projectId]` | Single Index | Project-level scoping. |
| `PjosPerson` | `@@index` | `[projectId]` | Single Index | Project-level scoping. |
| `PjosPersonRelationship` | `@@unique` | `[accountId, personId]` | Unique Composite | Guarantees at most one active relationship record per Account-Person pair. |
| `PjosPersonRelationship` | `@@index` | `[personId]` | Single Index | Fast reverse lookup of all accounts managing a Person. |
| `PjosAccessGrant` | `@@index` | `[personId]` | Single Index | High-frequency ownership check for grants on a Person. |
| `PjosAccessGrant` | `@@index` | `[granteeAccountId]` | Single Index | Lookup grants delegated to a family account. |
| `PjosAccessGrant` | `@@index` | `[granteePractitionerId]` | Single Index | Lookup grants delegated to a practitioner. |
| `PjosConsentRecord` | `@@index` | `[personId, status]` | Composite Index | Fast evaluation of active consent records (`status = GRANTED`). |
| `PjosConsentRecord` | `@@index` | `[accountId]` | Single Index | Account-level consent audit trail. |

---

## 4. Production Deployment & Database Actions

### 4.1 Safe Execution Procedure
1. In development / CI:
   ```bash
   npx prisma format
   npx prisma validate
   npx prisma generate
   ```
2. In staging / production database:
   - Run `npx prisma db push` or apply standard additive SQL DDL.
   - **Zero downtime requirement**: All newly added tables are isolated; existing queries continue unhindered without table locks on existing tables.

### 4.2 Prohibited Actions
- `prisma db push --force-reset` is strictly forbidden.
- Do NOT alter existing `AstrologyConsultation` or `AstrologyCustomerProfile` columns until Phase 2 migration.

---

## 5. Rollback Considerations
Because all 5 tables and 5 enums are strictly additive with no incoming foreign keys from existing production tables:
- **Rollback via Code**: Simply deploy previous application build. Existing tables remain 100% operational.
- **Rollback via Database DDL**:
   ```sql
   DROP TABLE IF EXISTS "PjosConsentRecord" CASCADE;
   DROP TABLE IF EXISTS "PjosAccessGrant" CASCADE;
   DROP TABLE IF EXISTS "PjosPersonRelationship" CASCADE;
   DROP TABLE IF EXISTS "PjosPerson" CASCADE;
   DROP TABLE IF EXISTS "PjosAccount" CASCADE;
   DROP TYPE IF EXISTS "PjosConsentStatus";
   DROP TYPE IF EXISTS "PjosGrantScope";
   DROP TYPE IF EXISTS "PjosRelationshipType";
   DROP TYPE IF EXISTS "PjosSensitivity";
   DROP TYPE IF EXISTS "PjosAuthChannel";
   ```
- **Data Loss Risk**: Exactly **0%** for all mainline consultation and kundli data.
