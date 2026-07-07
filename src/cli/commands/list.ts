import { CommandContext } from '../context.js';
import { list, ListFilters } from '../../domain/taskCollection.js';
import { parseListFilters } from '../args.js';
import { jsonList, formatListHuman } from '../../output/format.js';

function emptyMessage(filters: ListFilters): string {
  const filtered =
    filters.state !== undefined ||
    filters.all === true ||
    filters.priority !== undefined ||
    (filters.tags !== undefined && filters.tags.length > 0);
  return filtered ? 'No matching tasks.' : 'No tasks.';
}

export async function listCommand(ctx: CommandContext): Promise<void> {
  const filters = parseListFilters(ctx.values);
  const data = await ctx.repo.load();
  const tasks = list(data, filters);
  ctx.out(ctx.json ? `${jsonList(tasks)}\n` : `${formatListHuman(tasks, emptyMessage(filters))}\n`);
}
