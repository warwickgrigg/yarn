import { html, h, app } from "./wuf-hyper.js";

const footer = footerList => (state, actions) => html`
  <footer class="pt-4 my-md-5 pt-md-5 border-top">
    <div class="row">
      <div key="Copyright" class="col-12 col-md">
        <small class="d-block mb-3 text-muted">© Copyright 2017-2019</small>
      </div>
      ${!!state.uiLevel &&
        Object.entries(footerList).map(
          ([title, tuples]) =>
            //FooterList(title, tuples))
            html`
              <div key="${title}" class="col-6 col-md">
                <h5>${title}</h5>
                <ul class="list-unstyled text-small">
                  ${tuples.map(
                    ([text, href]) => html`
                      <li><a class="text-muted" href="${href}">${text}</a></li>
                    `
                  )}
                </ul>
              </div>
            `
        )}
    </div>
  </footer>
`;

export { footer };
