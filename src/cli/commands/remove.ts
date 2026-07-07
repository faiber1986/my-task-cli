import { CommandContext } from '../context.js';
import { remove } from '../../domain/taskCollection.js';
import { parseId } from '../args.js';
import { jsonRemoved } from '../../output/format.js';

export async function removeCommand(ctx: CommandContext): Promise<void> {
  const id = parseId(ctx.positionals[0]);

  const task = await ctx.repo.mutate((data) => {
    const res = remove(data, id);
    return { data: res.set, result: res.task };
  });

  ctx.out(ctx.json ? `${jsonRemoved(task.id)}\n` : `Removed task #${task.id}: "${task.title}"\n`);
}
