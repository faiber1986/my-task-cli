import os from 'node:os';
import path from 'node:path';

/** OS-appropriate user config directory. */
function configDir(env: NodeJS.ProcessEnv): string {
  if (process.platform === 'win32') {
    return env.APPDATA && env.APPDATA.trim() !== ''
      ? env.APPDATA
      : path.join(os.homedir(), 'AppData', 'Roaming');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support');
  }
  return env.XDG_CONFIG_HOME && env.XDG_CONFIG_HOME.trim() !== ''
    ? env.XDG_CONFIG_HOME
    : path.join(os.homedir(), '.config');
}

/**
 * Resolve the task store path. A non-empty `MY_TASK_CLI_STORE` overrides the
 * default per-user location (used by tests and power users).
 */
export function resolveStorePath(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.MY_TASK_CLI_STORE;
  if (override && override.trim() !== '') return override;
  return path.join(configDir(env), 'my-task-cli', 'tasks.json');
}
