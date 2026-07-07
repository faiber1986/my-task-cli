import { CommandContext } from '../context.js';
import { reopen } from '../../domain/taskCollection.js';
import { parseId } from '../args.js';
import { jsonTask } from '../../output/format.js';

export async function reopenCommand(ctx: CommandContext): Promise<void> {
  const id = parseId(ctx.positionals[0]);

  const { task, noop } = await ctx.repo.mutate((data) => {
    const res = reopen(data, id);
    return { data: res.set, result: { task: res.task, noop: res.noop } };
  });

  if (ctx.json) {
    ctx.out(`${jsonTask(task)}\n`);
  } else if (noop) {
    ctx.out(`Task #${task.id} was already pending.\n`);
  } else {
    ctx.out(`Re-opened task #${task.id}: "${task.title}"\n`);
  }
}
