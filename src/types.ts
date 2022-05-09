export type SyncValidator<Value = any, Values = any> = (
  value: Value,
  values: Values
) => Value;

export type AsyncValidator<Value = any, Values = any> = (
  value: Value,
  values: Values
) => Promise<Value>;

export type Validator<Value = any, Values = any> =
  | SyncValidator<Value, Values>
  | AsyncValidator<Value, Values>;

export type SyncSubmitter<T = any> = (values: T) => unknown;
export type AsyncSubmitter<T = any> = (values: T) => Promise<unknown>;
export type Submitter<T = any> = SyncSubmitter<T> | AsyncSubmitter<T>;

export type ActorState = "idle" | "validating" | "error" | "success";
