import { html, h, app } from "./wuf-hyper.js";

const leader = (title, text) => html`
  <div class="pricing-header py-3 mx-auto text-center">
    <h3 class="display-4">${title}</h3>
    <p class="lead">${text}</p>
  </div>
`;

export { leader };
