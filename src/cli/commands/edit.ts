import { CommandContext } from '../context.js';
import { edit, EditChanges } from '../../domain/taskCollection.js';
import { parseId } from '../args.js';
import { parsePriority } from '../../domain/task.js';
import { ValidationError } from '../../domain/errors.js';
import { jsonTask, formatTaskHuman } from '../../output/format.js';

export async function editCommand(ctx: CommandContext): Promise<void> {
  const id = parseId(ctx.positionals[0]);
  const { values } = ctx;

  const changes: EditChanges = {};
  if (typeof values.title === 'string') changes.title = values.title;

  const clearPriority = values['clear-priority'] === true;
  const hasPriority = typeof values.priority === 'string';
  if (clearPriority && hasPriority) {
    throw new ValidationError('Use either --priority or --clear-priority, not both.');
  }
  if (clearPriority) changes.priority = { value: null };
  else if (hasPriority) changes.priority = { value: parsePriority(values.priority as string) };

  const clearTags = values['clear-tags'] === true;
  const hasTags = Array.isArray(values.tag) && values.tag.length > 0;
  if (clearTags && hasTags) {
    throw new ValidationError('Use either --tag or --clear-tags, not both.');
  }
  if (clearTags) changes.tags = [];
  else if (hasTags) changes.tags = values.tag as string[];

  const task = await ctx.repo.mutate((data) => {
    const res = edit(data, id, changes);
    return { data: res.set, result: res.task };
  });

  ctx.out(ctx.json ? `${jsonTask(task)}\n` : `Updated task ${formatTaskHuman(task)}\n`);
}
