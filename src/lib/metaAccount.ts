/** A signed-in account's Meta connection, as a ready Graph client (shared by the Meta and project routes). */
import { prisma } from "./prisma";
import { decryptSecret } from "./crypto";
import { META_ERRORS, graphClient, metaConfig, type GraphClient } from "./meta";

export type MetaConnectionResult =
  | { client: GraphClient; connection: { id: string; adAccountId: string | null; pageId: string | null } }
  | { error: string; status: number };

export async function connectionClient(userId: string): Promise<MetaConnectionResult> {
  const { config } = metaConfig();
  if (!config) return { error: META_ERRORS.notConfigured, status: 503 };
  const connection = await prisma.metaConnection.findUnique({ where: { userId } });
  if (!connection) return { error: META_ERRORS.notConnected, status: 409 };
  if (connection.expiresAt && connection.expiresAt.getTime() < Date.now()) return { error: META_ERRORS.reconnect, status: 401 };
  let token: string;
  try {
    token = decryptSecret(connection.accessToken);
  } catch {
    // the encryption key changed since the login: the stored token is unusable, a new login replaces it
    return { error: META_ERRORS.reconnect, status: 401 };
  }
  return { client: graphClient(config, token), connection };
}

/** Meta refused the token (expired or revoked): show the connection as expired so the user logs in again. */
export async function markMetaExpired(userId: string): Promise<void> {
  await prisma.metaConnection.updateMany({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } }).catch(() => null);
}
