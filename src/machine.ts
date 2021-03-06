import { send, assign, spawn, ActorRef, createMachine, actions } from "xstate";
import * as actor from "./actor";
import { get, set, del } from "object-path";
import { ActorState, Submitter, Validator } from "./types";
import { pure, choose } from "xstate/lib/actions";

export type Ctx<T extends object = any, E = any> = {
  values: T;
  data?: any;
  failureCount: number;
  error?: unknown | null;
  dataUpdatedAt?: number;
  errorUpdatedAt?: number;
  errors: Record<string, unknown>;
  __validationMarker: Set<string>;
  states: Record<string, ActorState>;
  actors: Record<string, ActorRef<actor.Events>>;
};

export type Events =
  | { type: "change"; id: string; value: unknown }
  | { type: "spawn"; id: string; value: unknown; validator: Validator }
  | { type: "kill"; id: string }
  | { type: "validate"; id: string; value?: any }
  | { type: "clear_error"; id?: string }
  | { type: "submit" | "cancel" }

  // actor events
  | { id: string; type: "actor_validating" }
  | { id: string; type: "actor_error"; error: unknown }
  | { id: string; type: "actor_success"; value: unknown };

export type States = {
  value: "idle" | "validating" | "error" | "submitting" | "submitted";
  context: Ctx;
};

export type SetType<T extends object, E> =
  | { name: "data"; value: Ctx<T, E>["data"] }
  | { name: "error"; value: Ctx<T, E>["error"] };
//   | { name: "values"; value: Required<Ctx<T, E>["values"]> };
//   | { name: "errors"; value: Required<Ctx<T, E>["errors"]> }

const setState = (state: ActorState) => {
  return assign<Ctx, Events>({
    states: ({ states }, { id }: any) => {
      set(states, id, state);
      return states;
    },
  });
};

export const createConfig = <T extends object>(
  initialValues: T,
  onSubmit: Submitter<T>
) => {
  return createMachine<Ctx<T>, Events, States>(
    {
      initial: "idle",

      context: {
        actors: {},
        errors: {},
        states: {},
        failureCount: 0,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        __validationMarker: new Set(),
        values: initialValues ?? ({} as any),
      },

      on: {
        submit: "validating",

        clear_error: [
          {
            cond: (_, { id }) => !!id,
            actions: [
              "removeActorError",
              send((_) => ({ type: "set", name: "error", value: null }), {
                to: (_, { id }) => id,
              }),
            ],
          },
          {
            target: "idle",
            actions: "clearError",
          },
        ],

        change: {
          actions: [
            "setValue",
            "setInitialState",
            "removeActorError",
            choose([
              {
                cond: "has_actor",
                actions: send((_, { value }) => ({ type: "change", value }), {
                  to: (_, { id }) => id,
                }),
              },
            ]),
          ],
        },

        validate: {
          cond: "has_actor",
          actions: [
            "removeActorError",
            send(
              ({ values }, { value }) => ({ type: "validate", value, values }),
              { to: (_, { id }) => id }
            ),
          ],
        },

        spawn: {
          actions: ["spawnActor", "setInitialState"],
        },

        kill: {
          cond: "has_actor",
          actions: ["killActor", "removeState"],
        },

        actor_success: {
          actions: ["setValue", "setSuccessState"],
        },

        actor_error: {
          actions: ["setActorError", "setErrorState"],
        },

        actor_validating: {
          actions: "setValidatingState",
        },
      },

      states: {
        idle: {},

        validating: {
          exit: assign({
            __validationMarker: (_) => new Set(),
          }),

          entry: pure(({ actors, values }: any) => {
            return Object.keys(actors).map((to) => {
              return send({ values, type: "validate" }, { to });
            });
          }),

          always: [
            {
              target: "idle",
              cond: (c) => {
                return (
                  Object.values(c.errors).length > 0 &&
                  c.__validationMarker.size >= Object.keys(c.actors).length
                );
              },
            },
            {
              target: "submitting",
              cond: (c) => {
                return (
                  c.__validationMarker.size >= Object.keys(c.actors).length
                );
              },
            },
          ],

          on: {
            cancel: "idle",

            actor_error: {
              actions: ["setActorError", "mark", "setErrorState"],
            },

            actor_success: {
              actions: [
                "setValue",
                "removeActorError",
                "mark",
                "setSuccessState",
              ],
            },
          },
        },

        submitting: {
          on: {
            cancel: "idle",

            "*": undefined,
          },

          entry: [
            "clearError",
            assign({
              data: (_) => null,
              error: (_) => null,
            }),
          ],

          invoke: {
            src: "submit",

            onError: {
              target: "error",
              actions: assign({
                error: (_, { data }) => data,
                errorUpdatedAt: (_) => Date.now(),
              }),
            },

            onDone: {
              target: "submitted",
              actions: assign({
                data: (_, { data }) => data,
                dataUpdatedAt: (_) => Date.now(),
              }),
            },
          },
        },

        submitted: {
          entry: assign({
            failureCount: (_) => 0,
          }),
        },

        error: {
          entry: assign({
            failureCount: (ctx) => ctx.failureCount + 1,
          }),

          exit: "clearError",
        },
      },
    },
    {
      guards: {
        has_actor: ({ actors }, { id }: any) => id in actors,
      },
      actions: {
        clearError: assign({ error: (_) => null }),

        setValue: assign({
          values: ({ values }, { id, value }: any) => {
            set(values, id, value);
            return values;
          },
        }),

        setActorError: assign({
          errors: ({ errors }, { id, error }: any) => {
            set(errors, id, error);
            return errors;
          },
        }),

        removeActorError: assign({
          errors: ({ errors }, { id }: any) => del(errors, id),
        }),

        mark: assign({
          __validationMarker: ({ __validationMarker }, { id }: any) => {
            return __validationMarker.add(id);
          },
        }),

        setError: assign({
          error: (_, { data }: any) => data,
        }),

        setInitialState: setState("idle"),

        setSuccessState: setState("success"),

        setErrorState: setState("error"),

        setValidatingState: setState("validating"),

        removeState: assign({
          states: ({ states }, { id }: any) => del(states, id),
        }),

        spawnActor: assign({
          values: ({ values }, { id, value }: any) => {
            set(values, id, value ?? get(initialValues, id));
            return values;
          },
          actors: ({ actors }, { id, value, validator }: any) => {
            const v = value ?? get(initialValues, id);
            const spawned = spawn(actor.createConfig(id, v, validator), id);
            return { ...actors, [id]: spawned };
          },
        }),

        killActor: assign({
          actors: ({ actors }, { id }: any) => {
            actors[id].stop();
            delete actors[id];
            return actors;
          },
        }),
      },
      services: {
        submit: async ({ values }) => {
          const res = onSubmit(values);
          return res instanceof Promise ? await res : res;
        },
      },
    }
  );
};
