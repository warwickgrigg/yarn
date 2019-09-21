import { html, h, app } from "./wuf-hyper.js";
import { Router, fromHash, toHash } from "./router.js";
import { header } from "./header.js";
import { body } from "./body.js";
import { footer } from "./footer.js";
import { footerList } from "./data.js";
import config from "./config.js";

const { isProduction } = config;

const state = {
  Router: {
    // base: "Payment",
    options: {}
  },
  products: {},
  clicked: 0,
  buyQuantity: 1,
  buyQuantityOrigin: 1,
  uiLevel: 0,
  debug: !isProduction,
  prevState: {
    buyQuantity: 999,
    name: "Time Bank",
    type: "Buy"
  }
};

if (!state.Router.base) state.prevState = undefined;

const actions = {
  Router,
  click: v => (s, a) => ({ clicked: s.clicked + v || v }),
  setProducts: products => s => ({ products }),
  setBuyQuantity: buyQuantity => ({ buyQuantity }),
  setBuyQuantityOrigin: buyQuantityOrigin => ({ buyQuantityOrigin })
};

const route = fromHash(window.location.hash);
if (route.base === "Payment" && route.options.nonce) {
  const { nonce, state: prevState } =
    JSON.parse(sessionStorage.getItem("savedState")) || {};
  if (route.options.nonce === nonce) {
    state.prevState = prevState;
    sessionStorage.removeItem("savedState");
    //window.location.hash = toHash(route.base, { status: route.options.status });
  }
}

const view = (state, actions) => {
  //console.log("render");
  return h("div", { class: "container-fluid" }, [
    header(),
    state.debug &&
      h(
        "pre",
        { class: "debug", key: "state", onclick: e => actions.click(1) },
        "debug info: " +
          JSON.stringify(
            Object.assign({}, state, { products: undefined }),
            null,
            2
          )
      ),
    body(state, actions),
    footer(footerList)(state, actions)
  ]);
};

const main = app(state, actions, view, document.getElementById("app"));

fetch("products.json")
  .then(response => response.json())
  .then(products => {
    if (!isProduction) {
      for (const key in products.items) {
        let item = products.items[key];
        // mutate products
        item.id = item.testId;
        item.testId = undefined;
      }
    }
    return main.setProducts(products);
  })
  .catch(e => console.log(e));

!state.Router.base && main.Router.init();

window.addEventListener("popstate", main.Router.init);
window.addEventListener("hashchange", main.Router.init);
