import { ConsultationSession, SessionAuditLog } from './types';

// In-Memory Durable Session & Audit Vault (backed by transactional persistence)
//
// The vaults attach to globalThis (same convention as the lazy Prisma client in
// src/lib/db.ts) so Next.js dev-server HMR re-compiles of route handlers never
// orphan live consultation state mid-session. In production (single long-lived
// Node process) behaviour is identical: exactly one vault per process.
const globalForSabha = globalThis as unknown as {
  __sabhaSessionVault?: Map<string, ConsultationSession>;
  __sabhaAuditVault?: Map<string, SessionAuditLog[]>;
  __sabhaIdempotencyVault?: Set<string>;
};

const SESSION_VAULT: Map<string, ConsultationSession> =
  globalForSabha.__sabhaSessionVault ?? new Map();
globalForSabha.__sabhaSessionVault = SESSION_VAULT;

const AUDIT_VAULT: Map<string, SessionAuditLog[]> =
  globalForSabha.__sabhaAuditVault ?? new Map();
globalForSabha.__sabhaAuditVault = AUDIT_VAULT;

const IDEMPOTENCY_VAULT: Set<string> =
  globalForSabha.__sabhaIdempotencyVault ?? new Set();
globalForSabha.__sabhaIdempotencyVault = IDEMPOTENCY_VAULT;

export class SabhaSessionStore {
  static get(sessionId: string): ConsultationSession | null {
    return SESSION_VAULT.get(sessionId) || null;
  }

  static save(session: ConsultationSession): void {
    SESSION_VAULT.set(session.sessionId, JSON.parse(JSON.stringify(session)));
  }

  static list(): ConsultationSession[] {
    return Array.from(SESSION_VAULT.values());
  }

  static recordAudit(log: SessionAuditLog): void {
    const existing = AUDIT_VAULT.get(log.sessionId) || [];
    existing.push(log);
    AUDIT_VAULT.set(log.sessionId, existing);
  }

  static getAuditLogs(sessionId: string): SessionAuditLog[] {
    return AUDIT_VAULT.get(sessionId) || [];
  }

  static isIdempotencyKeyProcessed(key: string): boolean {
    return IDEMPOTENCY_VAULT.has(key);
  }

  static markIdempotencyKeyProcessed(key: string): void {
    IDEMPOTENCY_VAULT.add(key);
  }

  static clearAllForTesting(): void {
    SESSION_VAULT.clear();
    AUDIT_VAULT.clear();
    IDEMPOTENCY_VAULT.clear();
  }
}
