import { createContext } from "react";
import { Actions, createForm, FormChild, Values, Context } from "./Form";
import { Submitter } from "./types";
import { createField } from "./Field";

export const Form = createForm(Context);

export const create = function Form<T extends Record<string, any>>({
  onSubmit,
  initialValues,
}: {
  initialValues?: T;
  onSubmit: Submitter<T>;
}) {
  const Context = createContext<Values & Actions>(null);

  const Form = createForm(Context);

  return {
    Field: createField<T>(Context),
    Form: ({ children }: { children: FormChild<T> }) => (
      <Form initialValues={initialValues} onSubmit={onSubmit}>
        {children}
      </Form>
    ),
  };
};
