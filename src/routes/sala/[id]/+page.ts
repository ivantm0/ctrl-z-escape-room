import { error } from '@sveltejs/kit';
import { getRoom, rooms } from '$lib/rooms';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => rooms.filter((r) => r.ready).map((r) => ({ id: r.id }));

export const load: PageLoad = ({ params }) => {
  const room = getRoom(params.id);
  if (!room?.ready) error(404, 'Esta sala no existe (todavía)');
  return { id: room.id };
};
