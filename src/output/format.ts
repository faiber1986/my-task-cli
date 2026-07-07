import { Task } from '../domain/task.js';
import { ErrorCode } from '../domain/errors.js';

/** The stable JSON representation of a task (see contracts/cli.md). */
export function taskToJson(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    state: task.state,
    priority: task.priority,
    tags: task.tags,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  };
}

export function jsonTask(task: Task): string {
  return JSON.stringify(taskToJson(task));
}

export function jsonList(tasks: Task[]): string {
  return JSON.stringify(tasks.map(taskToJson));
}

export function jsonRemoved(id: number): string {
  return JSON.stringify({ removed: true, id });
}

export function jsonError(code: ErrorCode, message: string): string {
  return JSON.stringify({ error: { code, message } });
}

/** One-line human summary of a task. */
export function formatTaskHuman(task: Task): string {
  const priority = task.priority ?? 'none';
  const tags = task.tags.length ? task.tags.join(', ') : '-';
  return `#${task.id} [${task.state}] (${priority}) ${task.title}  {${tags}}`;
}

/** Aligned, human-readable table of tasks (or an empty-result message). */
export function formatListHuman(tasks: Task[], emptyMessage = 'No tasks.'): string {
  if (tasks.length === 0) return emptyMessage;
  const rows = tasks.map((t) => ({
    id: `#${t.id}`,
    state: t.state,
    priority: t.priority ?? 'none',
    tags: t.tags.length ? t.tags.join(',') : '-',
    title: t.title,
  }));
  const width = (key: keyof (typeof rows)[number]) =>
    Math.max(key.length, ...rows.map((r) => r[key].length));
  const w = {
    id: width('id'),
    state: width('state'),
    priority: width('priority'),
    tags: width('tags'),
  };
  const pad = (s: string, n: number) => s.padEnd(n);
  const header = `${pad('ID', w.id)}  ${pad('STATE', w.state)}  ${pad('PRIORITY', w.priority)}  ${pad('TAGS', w.tags)}  TITLE`;
  const lines = rows.map(
    (r) =>
      `${pad(r.id, w.id)}  ${pad(r.state, w.state)}  ${pad(r.priority, w.priority)}  ${pad(r.tags, w.tags)}  ${r.title}`,
  );
  return [header, ...lines].join('\n');
}
