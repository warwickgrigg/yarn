import { html, hp } from "./wuf-hyper.js";

const { div, h1, h2, h3, h4, p, ul, li, button, a, small } = hp;

const Button = ({ item, actions }) => {
  const { key, id, available, minQuantity = 1 } = item;

  const { page = "buy", text, link, style = "btn-primary" } = !available
    ? {
        text: "Information",
        style: "btn-outline-primary"
      }
    : id.slice(0, 3) === "sku"
    ? { text: "Buy" }
    : id.slice(0, 4) === "plan"
    ? { text: "Subscribe", link: "Subscribe to" }
    : { page: "getStarted", text: "Get started" };

  const route = () => {
    actions.setBuyQuantity(minQuantity);
    actions.setBuyQuantityOrigin(minQuantity);
    actions.Router.route([page, { key, type: link || text }]);
  };

  return button(
    {
      type: "button",
      class: `btn btn-lg btn-block ${style}`,
      onclick: route
    },
    text
  );
};

const products = (state, actions) =>
  div(
    { class: "container-fluid" },
    div(
      { class: "card-deck mb-3 text-center" },
      state.products.lines[state.Router.base].products
        .map(i => state.products.items[i])
        .filter(({ id }) => id)
        .map(item => {
          const { name, priceText, unitPrice, unit, features, url } = item;
          //console.log(JSON.stringify(item));
          return div({ key: name, class: "card mb-4 shadow-sm" }, [
            div(
              { class: "card-header" },
              h4({ class: "my-0 font-weight-normal" }, name)
            ),
            div({ class: "card-body" }, [
              h1({ class: "card-title pricing-card-title" }, [
                priceText || `£${(unitPrice / 100).toFixed(2)} + VAT`,
                small({ class: "text-muted" }, ` / ${unit}`)
              ]),
              ul({ class: "list-unstyled mt-3 mb-4" }, [
                ...features.map((f, key) => li({ key }, f)),
                !!url &&
                  li(
                    { key: "url" },
                    a({ href: url, target: "_blank" }, "Spec sheet")
                  )
              ]),
              Button({ item, actions })
            ])
          ]);
        })
    )
  );
export { products };
