// A place can be edited by its primary owner (Place.userId) OR any invited
// teammate (a PlaceMember row) — see prisma/schema.prisma. Every route that
// used to look a place up by `{ userId }` alone needs this instead, via
// `findFirst` (ownership is no longer a single unique key).
export function placeAccessWhere(userId: string) {
  return { OR: [{ userId }, { members: { some: { userId } } }] };
}

/** Page admins a place can have besides its main Page Admin. */
export const MAX_OTHER_PAGE_ADMINS = 3;

export const PAGE_ADMIN_LIMIT_MESSAGE = `A page can have up to ${MAX_OTHER_PAGE_ADMINS} other page admins. Remove one first, or write to us if you need more.`;
