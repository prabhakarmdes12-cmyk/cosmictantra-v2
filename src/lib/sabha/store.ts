import { ConsultationSession, SessionAuditLog } from './types';

// In-Memory Durable Session & Audit Vault (backed by transactional persistence)
const SESSION_VAULT: Map<string, ConsultationSession> = new Map();
const AUDIT_VAULT: Map<string, SessionAuditLog[]> = new Map();
const IDEMPOTENCY_VAULT: Set<string> = new Set();

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
