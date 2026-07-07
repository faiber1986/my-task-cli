import { CommandContext } from '../context.js';
import { add } from '../../domain/taskCollection.js';
import { parsePriority } from '../../domain/task.js';
import { ValidationError } from '../../domain/errors.js';
import { jsonTask, formatTaskHuman } from '../../output/format.js';

export async function addCommand(ctx: CommandContext): Promise<void> {
  const title = ctx.positionals[0];
  if (title === undefined) {
    throw new ValidationError('Usage: task add <title> [--priority <p>] [--tag <t> ...] [--json]');
  }
  const priority = parsePriority(typeof ctx.values.priority === 'string' ? ctx.values.priority : null);
  const tags = Array.isArray(ctx.values.tag) ? ctx.values.tag : [];

  const task = await ctx.repo.mutate((data) => {
    const res = add(data, { title, priority, tags });
    return { data: res.set, result: res.task };
  });

  ctx.out(ctx.json ? `${jsonTask(task)}\n` : `Added task ${formatTaskHuman(task)}\n`);
}
