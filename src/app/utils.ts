type ErrorMessage = string;
export type ActionResponse<T> = Promise<[T] | [undefined, ErrorMessage]>;
