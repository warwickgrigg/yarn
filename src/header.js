import { html, h, app } from "./wuf-hyper.js";
import config from "./config.js";

const { isProduction } = config;

const menuItems = [["About", "https://www.telanova.com"]];

const Menu = menuItems => html`
  <nav class="mr-md-3">
    ${menuItems.map(
      ([text, link]) => html`
        <a class="nav-link" href="${link}">${text}</a>
      `
    )}
  </nav>
`;

const header = () => html`
  <div
    id="header"
    key="header"
    class="d-flex flex-row align-items-center p-2 my-2 bg-white border-bottom shadow-sm"
  >
    ${isProduction
      ? html`
          <a href="#" class="pb-2 mr-auto">
            <img src="./telalogo-sm.png" class="img-fluid" alt="telanova" />
          </a>
        `
      : html`
          <a href="#" class="pb-2 mr-auto">
            <h3 class="my-0 mr-auto font-weight-normal">TESTING</h3>
          </a>
        `}
    ${Menu(menuItems)}
  </div>
`;
//
export { header };
