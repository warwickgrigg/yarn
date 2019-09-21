(function () {
  'use strict';

  function h(name, attributes) {
    var rest = [];
    var children = [];
    var length = arguments.length;

    while (length-- > 2) rest.push(arguments[length]);

    while (rest.length) {
      var node = rest.pop();
      if (node && node.pop) {
        for (length = node.length; length--; ) {
          rest.push(node[length]);
        }
      } else if (node != null && node !== true && node !== false) {
        children.push(node);
      }
    }

    return typeof name === "function"
      ? name(attributes || {}, children)
      : {
          nodeName: name,
          attributes: attributes || {},
          children: children,
          key: attributes && attributes.key
        }
  }

  function app(state, actions, view, container) {
    var map = [].map;
    var rootElement = (container && container.children[0]) || null;
    var oldNode = rootElement && recycleElement(rootElement);
    var lifecycle = [];
    var skipRender;
    var isRecycling = true;
    var globalState = clone(state);
    var wiredActions = wireStateToActions([], globalState, clone(actions));

    scheduleRender();

    return wiredActions

    function recycleElement(element) {
      return {
        nodeName: element.nodeName.toLowerCase(),
        attributes: {},
        children: map.call(element.childNodes, function(element) {
          return element.nodeType === 3 // Node.TEXT_NODE
            ? element.nodeValue
            : recycleElement(element)
        })
      }
    }

    function resolveNode(node) {
      return typeof node === "function"
        ? resolveNode(node(globalState, wiredActions))
        : node != null
          ? node
          : ""
    }

    function render() {
      skipRender = !skipRender;

      var node = resolveNode(view);

      if (container && !skipRender) {
        rootElement = patch(container, rootElement, oldNode, (oldNode = node));
      }

      isRecycling = false;

      while (lifecycle.length) lifecycle.pop()();
    }

    function scheduleRender() {
      if (!skipRender) {
        skipRender = true;
        setTimeout(render);
      }
    }

    function clone(target, source) {
      var out = {};

      for (var i in target) out[i] = target[i];
      for (var i in source) out[i] = source[i];

      return out
    }

    function setPartialState(path, value, source) {
      var target = {};
      if (path.length) {
        target[path[0]] =
          path.length > 1
            ? setPartialState(path.slice(1), value, source[path[0]])
            : value;
        return clone(source, target)
      }
      return value
    }

    function getPartialState(path, source) {
      var i = 0;
      while (i < path.length) {
        source = source[path[i++]];
      }
      return source
    }

    function wireStateToActions(path, state, actions) {
      for (var key in actions) {
        typeof actions[key] === "function"
          ? (function(key, action) {
              actions[key] = function(data) {
                var result = action(data);

                if (typeof result === "function") {
                  result = result(getPartialState(path, globalState), actions);
                }

                if (
                  result &&
                  result !== (state = getPartialState(path, globalState)) &&
                  !result.then // !isPromise
                ) {
                  scheduleRender(
                    (globalState = setPartialState(
                      path,
                      clone(state, result),
                      globalState
                    ))
                  );
                }

                return result
              };
            })(key, actions[key])
          : wireStateToActions(
              path.concat(key),
              (state[key] = clone(state[key])),
              (actions[key] = clone(actions[key]))
            );
      }

      return actions
    }

    function getKey(node) {
      return node ? node.key : null
    }

    function eventListener(event) {
      return event.currentTarget.events[event.type](event)
    }

    function updateAttribute(element, name, value, oldValue, isSvg) {
      if (name === "key") ; else if (name === "style") {
        if (typeof value === "string") {
          element.style.cssText = value;
        } else {
          if (typeof oldValue === "string") oldValue = element.style.cssText = "";
          for (var i in clone(oldValue, value)) {
            var style = value == null || value[i] == null ? "" : value[i];
            if (i[0] === "-") {
              element.style.setProperty(i, style);
            } else {
              element.style[i] = style;
            }
          }
        }
      } else {
        if (name[0] === "o" && name[1] === "n") {
          name = name.slice(2);

          if (element.events) {
            if (!oldValue) oldValue = element.events[name];
          } else {
            element.events = {};
          }

          element.events[name] = value;

          if (value) {
            if (!oldValue) {
              element.addEventListener(name, eventListener);
            }
          } else {
            element.removeEventListener(name, eventListener);
          }
        } else if (
          name in element &&
          name !== "list" &&
          name !== "type" &&
          name !== "draggable" &&
          name !== "spellcheck" &&
          name !== "translate" &&
          !isSvg
        ) {
          element[name] = value == null ? "" : value;
        } else if (value != null && value !== false) {
          element.setAttribute(name, value);
        }

        if (value == null || value === false) {
          element.removeAttribute(name);
        }
      }
    }

    function createElement(node, isSvg) {
      var element =
        typeof node === "string" || typeof node === "number"
          ? document.createTextNode(node)
          : (isSvg = isSvg || node.nodeName === "svg")
            ? document.createElementNS(
                "http://www.w3.org/2000/svg",
                node.nodeName
              )
            : document.createElement(node.nodeName);

      var attributes = node.attributes;
      if (attributes) {
        if (attributes.oncreate) {
          lifecycle.push(function() {
            attributes.oncreate(element);
          });
        }

        for (var i = 0; i < node.children.length; i++) {
          element.appendChild(
            createElement(
              (node.children[i] = resolveNode(node.children[i])),
              isSvg
            )
          );
        }

        for (var name in attributes) {
          updateAttribute(element, name, attributes[name], null, isSvg);
        }
      }

      return element
    }

    function updateElement(element, oldAttributes, attributes, isSvg) {
      for (var name in clone(oldAttributes, attributes)) {
        if (
          attributes[name] !==
          (name === "value" || name === "checked"
            ? element[name]
            : oldAttributes[name])
        ) {
          updateAttribute(
            element,
            name,
            attributes[name],
            oldAttributes[name],
            isSvg
          );
        }
      }

      var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
      if (cb) {
        lifecycle.push(function() {
          cb(element, oldAttributes);
        });
      }
    }

    function removeChildren(element, node) {
      var attributes = node.attributes;
      if (attributes) {
        for (var i = 0; i < node.children.length; i++) {
          removeChildren(element.childNodes[i], node.children[i]);
        }

        if (attributes.ondestroy) {
          attributes.ondestroy(element);
        }
      }
      return element
    }

    function removeElement(parent, element, node) {
      function done() {
        parent.removeChild(removeChildren(element, node));
      }

      var cb = node.attributes && node.attributes.onremove;
      if (cb) {
        cb(element, done);
      } else {
        done();
      }
    }

    function patch(parent, element, oldNode, node, isSvg) {
      if (node === oldNode) ; else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
        var newElement = createElement(node, isSvg);
        parent.insertBefore(newElement, element);

        if (oldNode != null) {
          removeElement(parent, element, oldNode);
        }

        element = newElement;
      } else if (oldNode.nodeName == null) {
        element.nodeValue = node;
      } else {
        updateElement(
          element,
          oldNode.attributes,
          node.attributes,
          (isSvg = isSvg || node.nodeName === "svg")
        );

        var oldKeyed = {};
        var newKeyed = {};
        var oldElements = [];
        var oldChildren = oldNode.children;
        var children = node.children;

        for (var i = 0; i < oldChildren.length; i++) {
          oldElements[i] = element.childNodes[i];

          var oldKey = getKey(oldChildren[i]);
          if (oldKey != null) {
            oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
          }
        }

        var i = 0;
        var k = 0;

        while (k < children.length) {
          var oldKey = getKey(oldChildren[i]);
          var newKey = getKey((children[k] = resolveNode(children[k])));

          if (newKeyed[oldKey]) {
            i++;
            continue
          }

          if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
            if (oldKey == null) {
              removeElement(element, oldElements[i], oldChildren[i]);
            }
            i++;
            continue
          }

          if (newKey == null || isRecycling) {
            if (oldKey == null) {
              patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
              k++;
            }
            i++;
          } else {
            var keyedNode = oldKeyed[newKey] || [];

            if (oldKey === newKey) {
              patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
              i++;
            } else if (keyedNode[0]) {
              patch(
                element,
                element.insertBefore(keyedNode[0], oldElements[i]),
                keyedNode[1],
                children[k],
                isSvg
              );
            } else {
              patch(element, oldElements[i], null, children[k], isSvg);
            }

            newKeyed[newKey] = children[k];
            k++;
          }
        }

        while (i < oldChildren.length) {
          if (getKey(oldChildren[i]) == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }
          i++;
        }

        for (var i in oldKeyed) {
          if (!newKeyed[i]) {
            removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
          }
        }
      }
      return element
    }
  }

  var n=function(t,r,u,e){for(var p=1;p<r.length;p++){var s=r[p],h="number"==typeof s?u[s]:s,a=r[++p];1===a?e[0]=h:3===a?e[1]=Object.assign(e[1]||{},h):5===a?(e[1]=e[1]||{})[r[++p]]=h:6===a?e[1][r[++p]]+=h+"":e.push(a?t.apply(null,n(t,h,u,["",null])):h);}return e},t=function(n){for(var t,r,u=1,e="",p="",s=[0],h=function(n){1===u&&(n||(e=e.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?s.push(n||e,0):3===u&&(n||e)?(s.push(n||e,1),u=2):2===u&&"..."===e&&n?s.push(n,3):2===u&&e&&!n?s.push(!0,5,e):u>=5&&((e||!n&&5===u)&&(s.push(e,u,r),u=6),n&&(s.push(n,u,r),u=6)),e="";},a=0;a<n.length;a++){a&&(1===u&&h(),h(a));for(var f=0;f<n[a].length;f++)t=n[a][f],1===u?"<"===t?(h(),s=[s],u=3):e+=t:4===u?"--"===e&&">"===t?(u=1,e=""):e=t+e[0]:p?t===p?p="":e+=t:'"'===t||"'"===t?p=t:">"===t?(h(),u=1):u&&("="===t?(u=5,r=e,e=""):"/"===t&&(u<5||">"===n[a][f+1])?(h(),3===u&&(s=s[0]),u=s,(s=s[0]).push(u,2),u=0):" "===t||"\t"===t||"\n"===t||"\r"===t?(h(),u=2):e+=t),3===u&&"!--"===e&&(u=4,s=s[0]);}return h(),s},r="function"==typeof Map,u=r?new Map:{},e=r?function(n){var r=u.get(n);return r||u.set(n,r=t(n)),r}:function(n){for(var r="",e=0;e<n.length;e++)r+=n[e].length+"-"+n[e];return u[r]||(u[r]=t(n))};function htm(t){var r=n(this,e(t),arguments,[]);return r.length>1?r:r[0]}

  const cache = {};
  var domz = h =>
    new Proxy(
      {},
      {
        get: (target, name) => cache[name] || (cache[name] = (...args) =>
          args[0] && typeof args[0] === "object" && !Array.isArray(args[0])
            ? h(name, ...args)
            : h(name, {}, ...args))
      }
    );

  const html = htm.bind(h);
  const hp = domz(h);

  Object.fromEntries ||
    (Object.fromEntries = a =>
      a.reduce((a, [k, v]) => Object.assign(a, { [k]: v }), {})); // Edge Polyfill

  const decode = options =>
    options
      .slice(1)
      .split("&")
      .reduce(
        (a, o) => Object.assign(a, o && Object.fromEntries([o.split("=")])),
        {}
      );

  const encode = obj =>
    Object.entries(obj)
      .reduce((a, [k, v]) => (k === null ? a : a + k + "=" + v + "&"), "?")
      .slice(0, -1);

  const toHash = (base, options = {}) => "#" + base + encode(options);

  const fromHash = hash => {
    hash = decodeURIComponent(hash);
    const q = hash.indexOf("?");
    return {
      base: hash.slice(1, q === -1 ? hash.length : q),
      options: q === -1 ? {} : decode(hash.slice(q))
    };
  };

  const Router = {
    init: () => state => {
      // console.log("got route", { hash: window.location.hash });
      const route = fromHash(window.location.hash);
      if (route.base !== state.base || route.options !== state.options)
        return route;
    },
    route: dest => state => {
      let base = dest,
        options = {};
      typeof dest !== "string" && ([dest, options = {}] = dest);
      // console.log("change route", JSON.stringify({ dest, options }));
      const location = toHash(dest, options);
      window.location.hash = location;
      return { base, options };
    }
  };

  const isProduction = window.location.hostname === "buy.telanova.com";

  var config = {
    productionHostName: "buy.telanova.com",
    isProduction: isProduction,
    stripePublicKeyLive: "pk_live_UeqWO1qhfSPkdMUTiY055NND",
    stripePublicKeyTest: "pk_test_agCcaweM7eCVNAHVU3DPTF1O",
    recaptchaSiteKey: "6LeAd7cUAAAAAMUty4TeJA9o7CicsgMq89D7bsp0"
  };

  const { isProduction: isProduction$1 } = config;

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
    ${isProduction$1
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

  const leader = (title, text) => html`
  <div class="pricing-header py-3 mx-auto text-center">
    <h3 class="display-4">${title}</h3>
    <p class="lead">${text}</p>
  </div>
`;

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

  const {
    div: div$1,
    h1: h1$1,
    h2: h2$1,
    h3: h3$1,
    h4: h4$1,
    p: p$1,
    ul: ul$1,
    li: li$1,
    button: button$1,
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
    return div$1(
      { class: "form-group" },
      ["checkbox", "radio"].includes(type)
        ? [
            label(labl),
            div$1(
              options.map((v, i) =>
                div$1(
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
      div$1(
        { class: "form-group" },
        button$1(
          { name: "submit", type: "submit", class: "btn btn-primary" },
          "Submit"
        )
      )
    ]);
  };

  const recaptchaNode = html`
  <small>This site is protected by reCAPTCHA and the Google 
  <a href="https://policies.google.com/privacy"> Privacy Policy</a> and 
  <a href="https://policies.google.com/terms"> Terms of Service</a> apply
</small>`;

  const recaptchaToken = (options, callback) => new Promise((resolve, reject) =>
    window.grecaptcha.ready(function() {
      resolve(window.grecaptcha.execute('6LeAd7cUAAAAAMUty4TeJA9o7CicsgMq89D7bsp0', options));
    })
  );

  const { isProduction: isProduction$2 } = { config };

  const { div: div$2, h1: h1$2, h2: h2$2, h3: h3$2, h4: h4$2, p: p$2, ul: ul$2, li: li$2, button: button$2 } = hp;

  const getStarted = (state, actions) => {
    const { key } = state.Router.options;
    const { name, line, available } = state.products.items[key];
    const { products } = state.products.lines[line];

    const availableBody = () => {
      const common = [
        { title: "Name of your business or organisation", required: true },
        { title: "Your name", required: true },
        { title: "Your email address", required: true },
        { title: "Your mobile or direct phone number", required: true }
      ];
      const formFields = {
        ProactiveCore: [
          "Total number of PCs, Macs and Laptops",
          "Number of servers"
        ],
        ProactiveEnterprise: [
          "Total number of PCs, Macs and Laptops",
          "Number of servers"
        ],
        SpecificProject: [
          "Number of people who will be using the system",
          "The purpose of the project or the desired outcome",
          [
            "What you require from telanova",
            ["Quotation", "Proposal", "Information", "Advice", "Consultancy"]
          ],
          { placeholder: ".. further information" },
          [
            "Matters you have already nailed down",
            ["Requirements", "Budget", "Timescale", "Decision process"]
          ]
        ],
        AdviceAndConsultancy: [
          "Number of people in your organisation",
          [
            "Type of advice or consultancy you are considering",
            [
              "Ongoing ad hoc advice",
              "For a specific project",
              "Virtual CIO or CTO role"
            ]
          ],
          { placeholder: ".. further information", name: "further_information" }
        ]
      };

      const onsubmit = obj => {
        const action = key; //name.replace(/[^A-Za-z0-9/]/g, "/");
        return recaptchaToken({ action }).then(recaptchaToken => {
          const { base, options } = state.Router;
          fetch("./api/enquiry", {
            method: "POST",
            body: JSON.stringify({ isProduction: isProduction$2, ...obj, action, recaptchaToken })
          }).then(() =>
            actions.Router.route([base, { ...options, submitted: true }])
          );
        });
      };

      if (state.Router.options.submitted) {
        return div$2([
          [
            h4$2("Enquiry confirmation"),
            p$2("Thank you for your enquiry. We will contact you shortly.")
          ]
        ]);
      } else if (formFields[key]) {
        return div$2([
          h4$2("Get started"),
          p$2(
            `So we can proceed with our '${name}' service from our '${line}' range, 
        please provide details below as appropriate`
          ),
          Form({
            fields: [...common, ...formFields[key]].map(ezField),
            onsubmit
          }),
          recaptchaNode
        ]);
      }
    };

    const unavailableBody = () => {
      const availables = products
        .filter(i => state.products.items[i].available)
        .join(", ");
      return div$2([
        h4$2("Your selected product"),
        p$2(
          `I'm sorry your selected product, the 
        '${name}' product from the '${line}' line,
        is not currently available.`
        ),
        !!availables && p$2(`These similar products are available: ${availables}`)
      ]);
    };

    return available ? availableBody() : unavailableBody();
  };

  /*global Stripe, window, sessionStorage */

  var stripe = Stripe(
    config.isProduction ? config.stripePublicKeyLive : config.stripePublicKeyTest
  );
  //const billingAddressCollection = "required";

  const redirectUrl = (status, nonce) => {
    const url = new URL(window.location);
    return (
      url.origin +
      url.pathname +
      url.search +
      toHash("Payment", { status, nonce })
    );
  };

  const checkout = ({ items, successUrl, cancelUrl }) => (state, actions) => {
    if (!successUrl || !cancelUrl) {
      //save app state with nonce guard
      var nonce = Math.floor(Math.random() * 0x1000000000).toString(32);
      const {
        buyQuantity,
        Router: {
          options: { key, type }
        }
      } = state;
      sessionStorage.setItem(
        "savedState",
        JSON.stringify({
          nonce,
          state: { buyQuantity, key, type }
        })
      );
    }
    successUrl = successUrl || redirectUrl("success", nonce);
    cancelUrl = cancelUrl || redirectUrl("cancelled", nonce);
    //console.log({successUrl, cancelUrl});
    stripe
      .redirectToCheckout({
        items,
        successUrl,
        cancelUrl
        //billingAddressCollection
      })
      .then(function(result) {
        if (result.error) {
          var displayError = document.getElementById("error-message");
          displayError.textContent = result.error.message;
        }
      });
  };

  const { a: a$1, div: div$3, h1: h1$3, h2: h2$3, h3: h3$3, h4: h4$3, p: p$3, ul: ul$3, li: li$3, button: button$3, label: label$1, input: input$1 } = hp;

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
      div$3([
        h4$3("Your selected product"),
        p$3(
          `You are about to purchase the '${name}' product from the '${line}' line`
        ),
        information.length && h4$3("Key information, terms and and conditions"),
        ...information.map((x, key) => p$3(x.join("\n"), { key })),
        a$1(
          {
            href: "./TLA - Brochure - Terms and Conditions.pdf",
            target: "_blank"
          },
          p$3("telanova's Terms and conditions (opens in new browser tab)")
        ),
        h4$3("Key features and schedule"),
        ul$3({ class: "list-unstyled mt-3 mb-4" }, [
          ...features.map((f, key) => li$3(f, { key })),
          `Priced at £${(unitPrice / 100).toFixed(2)} + VAT = £${(
          (unitPrice * 3) /
          250
        ).toFixed(2)} inc VAT, per ${per}`
        ]),
        !!multiples &&
          div$3(
            {
              class: "btn-group",
              key: "bBar",
              role: "group",
              "aria-label": "Choose quantity"
            },
            qtyToolBar().map((v, i) =>
              button$3(
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
        p$3({ key: "spacer1" }),
        buyButton(),
        p$3({ key: "spacer2" }),
        p$3(
          { key: "toStripe" },
          "This button takes you to Stripe, our payment provider"
        )
      ]);
    //
    const unavailableBody = () => {
      const availables = products
        .filter(i => state.products.items[i].available)
        .join(", ");
      return div$3([
        h4$3("Your selected product"),
        p$3(
          `I'm sorry your selected product, the 
        '${name}' product from the '${line}' line,
        is not currently available.`
        ),
        !!availables && p$3(`These similar products are available: ${availables}`)
      ]);
    };

    return available ? availableBody() : unavailableBody();
  };

  const { isProduction: isProduction$3 } = config;

  const { div: div$4, h1: h1$4, h2: h2$4, h3: h3$4, h4: h4$4, p: p$4, ul: ul$4, li: li$4, button: button$4, label: label$2, input: input$2 } = hp;

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
          body: JSON.stringify({ isProduction: isProduction$3, ...obj, action, recaptchaToken })
        }).then(() =>
          actions.Router.route([base, { ...options, submitted: true }])
        );
      });
    };

    return div$4(
      status === "success"
        ? [
            h4$4("Success"),
            p$4(
              `Your transaction to ${type.toLowerCase()} a quantity of ${buyQuantity} units of ${name}  
      was successful.`
            )
          ]
        : !state.Router.options.submitted
        ? [
            h4$4("Sorry"),
            p$4(
              `Sorry, your transaction to ${type.toLowerCase()} a quantity of ${buyQuantity} units of ${name}  
      was unsuccessful.`
            ),
            p$4(
              "Please check your card details or complete your details for a call back"
            ),
            Form({ fields: common.map(ezField), onsubmit }),
            recaptchaNode
          ]
        : [
            h4$4("Enquiry confirmation"),
            p$4("Thank you for your enquiry. We will contact you shortly.")
          ]
    );
  };

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

  const footerList = {
    Features: [
      ["Cool stuff", "#"],
      ["Random feature", "#"],
      ["Team feature", "#"],
      ["Another one", "#"],
      ["Last one", "#"]
    ],
    Resources: [
      ["Resource", "#"],
      ["Resource name", "#"],
      ["Another resource", "#"],
      ["Final resource", "#"]
    ],
    About: [["Team", "#"], ["Locations", "#"], ["Privacy", "#"], ["Terms", "#"]]
  };

  const { isProduction: isProduction$4 } = config;

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
    debug: !isProduction$4,
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
      if (!isProduction$4) {
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

}());
//# sourceMappingURL=bundle.js.map
