import React from "react";
import { render } from "react-dom";
import { Field } from "./src/Field";
import { Form } from "./src/Form";
import { create } from "./src";

type FormType = {
  a: number;
  b: number;

  friends: { name: string; age: number }[];
};

const isNumber = function (v: any) {
  if (typeof v !== "number" || isNaN(v)) throw new Error("Value is not number");
  return v;
};

type LoginForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const loginForm = create<LoginForm>({
  onSubmit: () => {},
  initialValues: {
    email: "",
    password: "",
    confirmPassword: "",
  },
});

const Login = () => {
  return (
    <loginForm.Form>
      {({ submit, change, values }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label htmlFor="email">Email</label>

            <input
              type="email"
              name="email"
              value={values.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>

            <input
              type="password"
              name="password"
              value={values.password}
              onChange={(e) => change("password", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>

            <loginForm.Field
              name="confirmPassword"
              validator={(v, vv) => {
                console.log(vv, v !== vv.confirmPassword);

                if (v !== vv.confirmPassword) {
                  throw new Error("Passwords do not match");
                }
                return v;
              }}
            >
              {({ error, value, change, validate }) => (
                <>
                  <input
                    value={value}
                    type="password"
                    name="confirmPassword"
                    // onBlur={() => validate()}
                    onChange={(e) => change(e.target.value)}
                  />

                  {error && <p>{error.message}</p>}
                </>
              )}
            </loginForm.Field>
          </div>

          <button type="submit">login</button>
        </form>
      )}
    </loginForm.Form>
  );
};

const App = () => {
  return (
    <Form<FormType>
      initialValues={{ a: 0, b: 0, friends: [{ name: "fkjd", age: 20 }] }}
      onSubmit={(v) => {
        return new Promise((resolve, reject) => {
          const result = v.a + v.b;

          setTimeout(() => {
            result % 2 > 0 ? reject("something went wrong") : resolve(result);
          }, 2000);
        });
      }}
    >
      {({ values, error, data, state, states, change, submit }) => {
        // console.log(states, state);

        return (
          <div>
            {/* <div>
              <label htmlFor="me">Remember Me</label>

              <input
                name="me"
                type="checkbox"
                checked={values.rememberMe}
                onChange={(e) => {
                  change("rememberMe", e.target.checked);
                }}
              />
            </div>

            {values.rememberMe && (
              <Field name="name" validator={(v) => v}>
                {() => (
                  <div>
                    <label htmlFor="me">Name</label>
                    <input
                      type="text"
                      name="name"
                      onChange={(e) => {
                        change("name", e.target.value);
                      }}
                    />
                  </div>
                )}
              </Field>
            )} */}

            <ul>
              {values.friends.map((friend, i) => {
                const id = `friends.${i}`;

                const age = `${id}.age`;
                const name = `${id}.name`;

                // console.log("here", friend);

                return (
                  <li key={id}>
                    <Field<string> name={name}>
                      {({ change, validate }) => (
                        <div>
                          <label htmlFor={name}>Name</label>
                          <input
                            type="text"
                            name={name}
                            value={friend.name}
                            onChange={(e) => change(e.target.value)}
                          />
                        </div>
                      )}
                    </Field>

                    <Field<number> name={age} validator={isNumber}>
                      {({ error, validate }) => (
                        <div>
                          <label htmlFor={age}>Age</label>
                          <input
                            name={age}
                            type="text"
                            value={friend.age}
                            // inputMode="numeric"
                            onChange={(e) => validate(+e.target.value)}
                          />

                          {error && <span>{error.message}</span>}
                        </div>
                      )}
                    </Field>

                    <button
                      onClick={() => {
                        // let a = [...values.friends];

                        // console.log(i, a);

                        // a.splice(i, 1);

                        // console.log(i, a);

                        values.friends.splice(i, 1);
                        change("friends", values.friends);
                      }}
                    >
                      remove
                    </button>
                  </li>
                );
              })}

              <button
                onClick={() => {
                  change("friends", [...values.friends, { name: "", age: 0 }]);
                }}
              >
                add
              </button>
            </ul>

            <Field<number, string> name="a" validator={(v) => v}>
              {({ value, change }) => {
                return (
                  <div>
                    <label htmlFor="name">a</label>

                    <input
                      type="number"
                      value={value}
                      onChange={(e) => change(+e.target.value)}
                    />
                  </div>
                );
              }}
            </Field>

            <span>+</span>

            <Field<number, string> name="b" validator={(v) => v}>
              {({ value, state, change, validate }) => {
                return (
                  <div>
                    <label htmlFor="name">b</label>

                    <input
                      type="number"
                      value={value}
                      onChange={(e) => change(+e.target.value)}
                    />

                    <span>=</span>
                  </div>
                );
              }}
            </Field>

            <button type="button" onClick={submit}>
              calculate
            </button>

            {(state === "validating" || state === "submitting") && (
              <span>calculating</span>
            )}

            {data && <span>{data}</span>}

            {error && <span style={{ color: "red" }}>{error}</span>}

            <code>
              <pre>{JSON.stringify(values)}</pre>
            </code>
          </div>
        );
      }}
    </Form>
  );
};

render(<Login />, document.getElementById("app"));
