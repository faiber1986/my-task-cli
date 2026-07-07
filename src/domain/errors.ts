export type ErrorCode = 'validation' | 'not_found' | 'internal';

/** Base class for all user-facing CLI errors. Maps an error code to an exit code. */
export class CliError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CliError';
  }

  /** 1 for user errors (validation, not found); 2 for internal errors. */
  get exitCode(): number {
    return this.code === 'internal' ? 2 : 1;
  }
}

export class ValidationError extends CliError {
  constructor(message: string) {
    super('validation', message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends CliError {
  constructor(id: number) {
    super('not_found', `Task #${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class StorageError extends CliError {
  constructor(message: string) {
    super('internal', message);
    this.name = 'StorageError';
  }
}
