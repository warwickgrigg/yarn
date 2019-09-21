import { h, html } from "./wuf-hyper.js";
import { leader } from "./leader.js";
import { lines } from "./lines.js";
import { products } from "./products.js";
import { getStarted } from "./get-started.js";
import { buy } from "./buy.js";
import { postPayment } from "./post-payment.js";

const body = (state, actions) => {
  const page = state.Router.base;
  return h(
    "div",
    { key: "body" },
    !state.products.lines
      ? html`
          <p>loading</p>
        `
      : !page
      ? [
          leader(
            "Online purchasing",
            `Tech support from telanova, the IT support team that feels like your own. 
            For organisations with 5 to 100+ seats.`
          ),
          lines(state, actions)
        ]
      : Object.keys(state.products.lines).includes(page)
      ? [
          leader(
            state.products.lines[page].name,
            state.products.lines[page].summary
          ),
          products(state, actions)
        ]
      : page === "buy"
      ? buy(state, actions)
      : page === "getStarted"
      ? getStarted(state, actions)
      : page === "Payment"
      ? postPayment(state, actions)
      : html`
          <p>${page} page</p>
        `
  );
};

export { body };
