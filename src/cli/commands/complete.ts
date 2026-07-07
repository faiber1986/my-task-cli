import { CommandContext } from '../context.js';
import { complete } from '../../domain/taskCollection.js';
import { parseId } from '../args.js';
import { jsonTask } from '../../output/format.js';

export async function completeCommand(ctx: CommandContext): Promise<void> {
  const id = parseId(ctx.positionals[0]);

  const { task, noop } = await ctx.repo.mutate((data) => {
    const res = complete(data, id);
    return { data: res.set, result: { task: res.task, noop: res.noop } };
  });

  if (ctx.json) {
    ctx.out(`${jsonTask(task)}\n`);
  } else if (noop) {
    ctx.out(`Task #${task.id} was already completed.\n`);
  } else {
    ctx.out(`Completed task #${task.id}: "${task.title}"\n`);
  }
}
