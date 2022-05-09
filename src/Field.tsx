import { useActor } from "@xstate/react";
import React, { useEffect, useContext } from "react";
import { useUnmount } from "react-use";
import { ActorRef, State } from "xstate";
import * as actor from "./actor";
import { useForm } from "./Form";
import { ActorState, Validator } from "./types";

// type Setters<T, E> = { name: "value"; value: T } | { name: "error"; value: E };

// type Setter<T, E> = <Setter extends Setters<T, E>, Name extends Setter["name"]>(
//   name: Name,
//   value: Extract<Setter, { name: Name }>["value"]
// ) => void;

export type Actions<T> = {
  change: (value: T) => void;
  validate: (value?: T) => void;
};

export type FieldChild<T = any, E = any> = (
  v: actor.Ctx<T, E> &
    Actions<T> & {
      //   set: Setter<T, E>;
      state: ActorState;
    }
) => JSX.Element;

export const Actor = function Actor<T, E>({
  actor,
  children,
}: {
  actor: ActorRef<actor.Events>;
  children: (
    v: State<actor.Ctx<T, E>, actor.Events, actor.States>
  ) => JSX.Element;
}) {
  const [state] = useActor(actor);
  return children(state);
};

export const Field = function Field<T, E = any>({
  name,
  value,
  children,
  validator = (v) => v,
}: {
  value?: T;
  name: string;
  children: FieldChild<T, E>;
  validator?: Validator<T>;
}) {
  const form = useForm();
  const actor = form.actors[name];

  useEffect(() => {
    if (!actor) form.spawn(name, value, validator);
  }, [name, actor, value, validator, form.spawn]);

  useUnmount(() => {
    actor && form.kill(name);
  });

  return actor ? (
    <Actor<T, E> actor={actor}>
      {(state) => {
        const { value, error } = state.context;

        const states = state.value as ActorState;

        const change: Actions<T>["change"] = (v) => {
          form.change(name, v);
        };

        const validate: Actions<T>["validate"] = (v) => {
          form.validate(name, v);
        };

        return children({ value, error, state: states, validate, change });
      }}
    </Actor>
  ) : null;
};

export const createField = function <T extends Record<string, any>, E = any>(
  context: React.Context<any>
) {
  return function <N extends keyof T, P = T[N]>({
    name,
    value,
    children,
    validator = (v) => v,
  }: {
    name: N;
    value?: P;
    children: FieldChild<P, E>;
    validator?: Validator<P, T>;
  }) {
    const form = useContext(context);
    const actor = form.actors[name];

    useEffect(() => {
      if (!actor) form.spawn(name, value, validator);
    }, [name, actor, value, validator, form.spawn]);

    useUnmount(() => {
      actor && form.kill(name);
    });

    return actor ? (
      <Actor<P, E> actor={actor}>
        {(state) => {
          const { value, error } = state.context;

          const states = state.value as ActorState;

          const change: Actions<P>["change"] = (v) => {
            form.change(name, v);
          };

          const validate: Actions<P>["validate"] = (v) => {
            form.validate(name, v);
          };

          return children({ value, error, state: states, validate, change });
        }}
      </Actor>
    ) : null;
  };
};
