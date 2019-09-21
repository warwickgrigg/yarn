import { html, hp } from "./wuf-hyper.js";

const {
  div,
  h1,
  h2,
  h3,
  h4,
  p,
  ul,
  li,
  button,
  label,
  input,
  form,
  textarea
} = hp;
const formField = ({
  title = "",
  label: labl,
  name,
  id,
  placeholder,
  type,
  required,
  value,
  options
}) => {
  labl = labl || title;
  placeholder = placeholder || title;
  name = name || title.replace(/ /g, "_").toLowerCase();
  id = id || name;
  type =
    type ||
    (name.includes("number") && "number") ||
    (name.includes("email") && "email") ||
    "text";
  const c = "form-control";
  return div(
    { class: "form-group" },
    ["checkbox", "radio"].includes(type)
      ? [
          label(labl),
          div(
            options.map((v, i) =>
              div(
                {
                  class: `custom-control custom-${type} custom-control-inline`
                },
                [
                  input({
                    type,
                    id: `${id}_${i}`,
                    name: id,
                    class: "custom-control-input",
                    value: v
                  }),
                  label({ for: `${id}_${i}`, class: "custom-control-label" }, v)
                ]
              )
            )
          )
        ]
      : [
          labl && label({ for: id }, labl),
          type === "textarea"
            ? textarea({ id, name, class: c }, value)
            : input(
                { id, name, key: id, placeholder, type, class: c, required },
                value
              )
        ]
  );
};

const ezField = f =>
  Array.isArray(f)
    ? formField({ title: f[0], type: "checkbox", options: f[1] })
    : typeof f === "object"
    ? formField(f)
    : formField({ title: f });

const parseFormInputs = form =>
  Array.from(form.elements)
    .filter(
      input => (
        false &&
          console.log(input.type, input.name, input.checked, input.value),
        input.type !== "submit"
      )
    )
    .reduce(
      (a, { type, name, checked, value }) =>
        Object.assign(a, {
          [name]:
            type === "checkbox"
              ? [...(a[name] || []), ...(checked ? [value] : [])]
              : value
        }),
      {}
    );

const Form = ({ fields, onsubmit }) => {
  const onsubmitProp = !onsubmit
    ? {}
    : {
        onsubmit: e => {
          e.preventDefault();
          const formInputs = parseFormInputs(e.target);
          onsubmit(formInputs);
        }
      };

  return form(onsubmitProp, [
    ...fields,
    div(
      { class: "form-group" },
      button(
        { name: "submit", type: "submit", class: "btn btn-primary" },
        "Submit"
      )
    )
  ]);
};

export { formField, ezField, Form };
