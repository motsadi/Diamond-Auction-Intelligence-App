import { id, tx } from '@instantdb/react';
import { db } from '@/lib/instant';

export type ActivityMeta = Record<string, any>;

export type LogActivityParams = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: ActivityMeta;
};

export async function logActivity({ actorId, action, entityType, entityId, meta }: LogActivityParams) {
  if (!actorId) return;
  try {
    // InstantDB writes are synchronous-ish, but we keep this helper async so callsites can `void` it.
    db.transact(
      tx.audit_logs[id()].update({
        actorId,
        action,
        entityType,
        entityId,
        createdAt: Date.now(),
        meta: meta || {},
      })
    );
  } catch (e) {
    // Best-effort logging; never block UX
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Activity log failed', e);
    }
  }
}

