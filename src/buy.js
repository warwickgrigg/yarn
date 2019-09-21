import { html, hp } from "./wuf-hyper.js";
import { checkout } from "./checkout.js";

const { a, div, h1, h2, h3, h4, p, ul, li, button, label, input } = hp;

const buy = (state, actions) => {
  const { key, type } = state.Router.options;
  const {
    id,
    name,
    line,
    features,
    unit,
    unitPrice,
    multiples,
    available = 1,
    minQuantity = 1
  } = state.products.items[key];
  const stripeItem = { [type === "Buy" ? "sku" : "plan"]: id };
  const { information = [], products } = state.products.lines[line];
  //
  const buyButtonText = !multiples
    ? type
    : `${type} ${state.buyQuantity} unit${state.buyQuantity > 1 ? "s" : ""}`;

  const buyButton = () => html`
    <button
      type="button"
      class="btn btn-lg btn block btn-primary"
      onclick=${() =>
        checkout({
          items: [
            Object.assign({}, stripeItem, { quantity: state.buyQuantity })
          ]
        })(state, actions)}
    >
      ${buyButtonText}
    </button>
  `;

  const integers = n => Array.from(Array(n)).map((v, i) => i);

  const max = (a, b) => (a > b ? a : b);

  const toolbarWidth = 5;

  const qtyToolBar = () => [
    "<",
    ...integers(toolbarWidth).map(i => i + state.buyQuantityOrigin),
    ">"
  ];

  const per = multiples ? `unit of ${unit}` : unit;

  const availableBody = () =>
    div([
      h4("Your selected product"),
      p(
        `You are about to purchase the '${name}' product from the '${line}' line`
      ),
      information.length && h4("Key information, terms and and conditions"),
      ...information.map((x, key) => p(x.join("\n"), { key })),
      a(
        {
          href: "./TLA - Brochure - Terms and Conditions.pdf",
          target: "_blank"
        },
        p("telanova's Terms and conditions (opens in new browser tab)")
      ),
      h4("Key features and schedule"),
      ul({ class: "list-unstyled mt-3 mb-4" }, [
        ...features.map((f, key) => li(f, { key })),
        `Priced at £${(unitPrice / 100).toFixed(2)} + VAT = £${(
          (unitPrice * 3) /
          250
        ).toFixed(2)} inc VAT, per ${per}`
      ]),
      !!multiples &&
        div(
          {
            class: "btn-group",
            key: "bBar",
            role: "group",
            "aria-label": "Choose quantity"
          },
          qtyToolBar().map((v, i) =>
            button(
              {
                class: "btn btn-primary active",
                key: "o" + i,
                onclick: () => {
                  if (i === 0)
                    actions.setBuyQuantityOrigin(
                      max(state.buyQuantityOrigin - toolbarWidth, minQuantity)
                    );
                  else if (i === toolbarWidth + 1)
                    actions.setBuyQuantityOrigin(
                      state.buyQuantityOrigin + toolbarWidth
                    );
                  else actions.setBuyQuantity(v);
                }
              },
              v
            )
          )
        ),
      p({ key: "spacer1" }),
      buyButton(),
      p({ key: "spacer2" }),
      p(
        { key: "toStripe" },
        "This button takes you to Stripe, our payment provider"
      )
    ]);
  //
  const unavailableBody = () => {
    const availables = products
      .filter(i => state.products.items[i].available)
      .join(", ");
    return div([
      h4("Your selected product"),
      p(
        `I'm sorry your selected product, the 
        '${name}' product from the '${line}' line,
        is not currently available.`
      ),
      !!availables && p(`These similar products are available: ${availables}`)
    ]);
  };

  return available ? availableBody() : unavailableBody();
};

export { buy };
