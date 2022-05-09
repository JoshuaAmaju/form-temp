import { useMachine } from "@xstate/react";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from "react";
import { createConfig, Ctx } from "./machine";
import { Submitter, Validator } from "./types";

export type FormState =
  | "idle"
  | "validating"
  | "error"
  | "submitting"
  | "submitted";

export type Values<T extends object = any> = Omit<
  Ctx<T>,
  "__validationMarker"
> & {
  state: FormState;
};

export type Actions<T extends Record<string, any> = any> = {
  submit: () => void;
  cancelSubmit: () => void;
  kill: (id: string) => void;
  clearError: (id?: string) => void;
  change: <N extends keyof T>(name: N, value: T[N]) => void;
  validate: <N extends keyof T>(name: N, value?: T[N]) => void;
  spawn: (id: string, value: unknown, validator: Validator) => void;
};

export type FormChild<T extends Record<string, any> = any> =
  | ReactNode
  | ((value: Actions<T> & Values<T>) => ReactNode);

export const Context = createContext<Values & Actions>(null);

export const useForm = () => useContext(Context);

export const Form = function Form<T extends Record<string, any>>({
  children,
  onSubmit,
  initialValues,
}: {
  initialValues?: T;
  onSubmit: Submitter<T>;
  children: FormChild<T>;
}) {
  const [state, send] = useMachine(createConfig<T>(initialValues, onSubmit));

  const {
    values,
    actors,
    error,
    errors,
    states,
    data,
    failureCount,
    errorUpdatedAt,
    dataUpdatedAt,
  } = state.context;

  const _state = state.value as FormState;

  const submit = useCallback<Actions["submit"]>(() => send("submit"), [send]);

  const clearError = useCallback<Actions["clearError"]>(
    (id) => send({ id, type: "clear_error" }),
    [send]
  );

  const cancelSubmit = useCallback<Actions["cancelSubmit"]>(
    () => send("cancel"),
    [send]
  );

  const kill = useCallback<Actions["kill"]>(
    (id) => send({ id, type: "kill" }),
    [send]
  );

  const spawn = useCallback<Actions["spawn"]>(
    (id, value, validator) => send({ id, value, validator, type: "spawn" }),
    [send]
  );

  const change = useCallback<Actions<T>["change"]>(
    (id, value) => send({ id: id as string, value, type: "change" }),
    [send]
  );

  const validate = useCallback<Actions<T>["validate"]>(
    (id, value) => send({ value, id: id as string, type: "validate" }),
    [send]
  );

  const value = {
    data,
    error,

    values,
    states,
    errors,

    failureCount,
    dataUpdatedAt,
    errorUpdatedAt,

    actors,

    kill,
    spawn,
    submit,
    change,
    validate,
    clearError,
    cancelSubmit,

    state: _state,
  };

  return (
    <Context.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </Context.Provider>
  );
};

export const createForm = function <T extends Record<string, any>>(
  context: React.Context<Values<T> & Actions<T>>
) {
  return ({
    children,
    onSubmit,
    initialValues,
  }: {
    initialValues?: T;
    onSubmit: Submitter<T>;
    children: FormChild<T>;
  }) => {
    const [state, send] = useMachine(createConfig<T>(initialValues, onSubmit));

    const {
      data,
      error,
      states,
      errors,
      actors,
      values,
      failureCount,
      dataUpdatedAt,
      errorUpdatedAt,
    } = state.context;

    const _state = state.value as FormState;

    const submit = useCallback<Actions["submit"]>(() => send("submit"), [send]);

    const clearError = useCallback<Actions["clearError"]>(
      (id) => send({ id, type: "clear_error" }),
      [send]
    );

    const cancelSubmit = useCallback<Actions["cancelSubmit"]>(
      () => send("cancel"),
      [send]
    );

    const kill = useCallback<Actions["kill"]>(
      (id) => send({ id, type: "kill" }),
      [send]
    );

    const spawn = useCallback<Actions["spawn"]>(
      (id, value, validator) => send({ id, value, validator, type: "spawn" }),
      [send]
    );

    const change = useCallback<Actions<T>["change"]>(
      (id, value) => send({ id: id as string, value, type: "change" }),
      [send]
    );

    const validate = useCallback<Actions<T>["validate"]>(
      (id, value) => send({ value, id: id as string, type: "validate" }),
      [send]
    );

    const value = {
      data,
      error,

      values,
      states,
      errors,

      failureCount,
      dataUpdatedAt,
      errorUpdatedAt,

      actors,

      kill,
      spawn,
      submit,
      change,
      validate,
      clearError,
      cancelSubmit,

      state: _state,
    };

    return (
      <context.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </context.Provider>
    );
  };
};
