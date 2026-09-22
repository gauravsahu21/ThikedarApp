// In-memory data store (dev only). Swap for a real database in production.

/** phone (10-digit string) -> { id, phone, name, createdAt } */
export const users = new Map();

/** phone (10-digit string) -> { code, expiresAt, attempts, lastSentAt } */
export const otps = new Map();

export function findOrCreateUser(phone) {
  let user = users.get(phone);
  if (!user) {
    user = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phone,
      name: null,
      createdAt: new Date().toISOString(),
    };
    users.set(phone, user);
  }
  return user;
}
