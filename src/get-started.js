import { formField, ezField, Form } from "./form.js";
import { html, hp } from "./wuf-hyper.js";
import { recaptchaNode, recaptchaToken } from "./recaptcha.js";
import config from "./config.js";

const { isProduction } = { config };

const { div, h1, h2, h3, h4, p, ul, li, button } = hp;

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
          body: JSON.stringify({ isProduction, ...obj, action, recaptchaToken })
        }).then(() =>
          actions.Router.route([base, { ...options, submitted: true }])
        );
      });
    };

    if (state.Router.options.submitted) {
      return div([
        [
          h4("Enquiry confirmation"),
          p("Thank you for your enquiry. We will contact you shortly.")
        ]
      ]);
    } else if (formFields[key]) {
      return div([
        h4("Get started"),
        p(
          `So we can proceed with our '${name}' service from our '${line}' range, 
        please provide details below as appropriate`
        ),
        Form({
          fields: [...common, ...formFields[key]].map(ezField),
          onsubmit
        }),
        recaptchaNode
      ]);
    } else {
    }
  };

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

export { getStarted };
