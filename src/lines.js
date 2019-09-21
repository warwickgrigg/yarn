import { html, h, app } from "./wuf-hyper.js";

const lines = (state, actions) => html`
  <ul class="list-unstyled">
    ${Object.entries(state.products.lines).map(
      ([key, { name, summary, image = "/100.png" }], i) => html`
    <li key="${name}" class="media ${i && "my-4"}">

      <img class="mr-3" src="${image}" 
        alt="${name}" onclick="${() => actions.Router.route(key)}">
      </img>

      <div class="media-body">
        <h5 class="mt-0 mb-1">${name}</h5>
        ${summary.join("\n")}
      </div>
    </li>
  `
    )}
  </ul>
`;

export { lines };
