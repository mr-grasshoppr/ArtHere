// A place can be edited by its primary owner (Place.userId) OR any invited
// teammate (a PlaceMember row) — see prisma/schema.prisma. Every route that
// used to look a place up by `{ userId }` alone needs this instead, via
// `findFirst` (ownership is no longer a single unique key).
export function placeAccessWhere(userId: string) {
  return { OR: [{ userId }, { members: { some: { userId } } }] };
}
