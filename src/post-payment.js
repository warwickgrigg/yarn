import { html, hp } from "./wuf-hyper.js";
import { formField, ezField, Form } from "./form.js";
import { recaptchaNode, recaptchaToken } from "./recaptcha.js";
import config from "./config.js";

const { isProduction } = config;

const { div, h1, h2, h3, h4, p, ul, li, button, label, input } = hp;

const postPayment = (state, actions) => {
  const { status } = state.Router.options;
  const { buyQuantity, key, type } = state.prevState;
  const { name } = state.products.items[key];

  const common = [
    { title: "Name of your business or organisation", required: true },
    { title: "Your name", required: true },
    { title: "Your email address", required: true },
    { title: "Your mobile or direct phone number", required: true }
  ];

  const onsubmit = obj => {
    const action = key; //name.replace(/[^A-Za-z0-9/]/g, "/");
    return recaptchaToken({ action }).then(recaptchaToken => {
      const { base, options } = state.Router;
      fetch("./api/enquiry", {
        method: "POST",
        body: JSON.stringify({ isProduction, ...obj, action, recaptchaToken })
      }).then(() =>
        actions.Router.route([base, { ...options, submitted: true }])
      );
    });
  };

  return div(
    status === "success"
      ? [
          h4("Success"),
          p(
            `Your transaction to ${type.toLowerCase()} a quantity of ${buyQuantity} units of ${name}  
      was successful.`
          )
        ]
      : !state.Router.options.submitted
      ? [
          h4("Sorry"),
          p(
            `Sorry, your transaction to ${type.toLowerCase()} a quantity of ${buyQuantity} units of ${name}  
      was unsuccessful.`
          ),
          p(
            "Please check your card details or complete your details for a call back"
          ),
          Form({ fields: common.map(ezField), onsubmit }),
          recaptchaNode
        ]
      : [
          h4("Enquiry confirmation"),
          p("Thank you for your enquiry. We will contact you shortly.")
        ]
  );
};
export { postPayment };
