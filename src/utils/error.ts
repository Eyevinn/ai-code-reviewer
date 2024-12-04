export function errorHandler(err: unknown) {
  if (
    err instanceof Error ||
    err instanceof InvalidInputError ||
    err instanceof InvalidServerState
  ) {
    console.error(err.message);
    return err;
  } else {
    console.error(err);
    throw new Error('Unhandled exception');
  }
}

export class NotFoundError extends Error {
  constructor({ id }: { id: string }) {
    super(`Resource with id '${id}' not found`);
  }
}

export class InvalidInputError extends Error {
  constructor({ reason }: { reason: string }) {
    super(reason);
  }
}

export class InvalidServerState extends Error {
  constructor({ reason }: { reason: string }) {
    super(reason);
  }
}
