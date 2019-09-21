const config = require("./config.js");

var stripe = require("stripe")(config.stripeSKTest);
//stripe.setApiVersion("2019-05-16");

const handler = async (req, res) => {
  let [products, skus, plans] = await Promise.all([
    stripe.products.list({ active: true }).then(d => d.data),
    stripe.skus.list({ active: true }).then(d => d.data),
    stripe.plans.list({ active: true }).then(d => d.data)
  ]);
  //products = products.reduce((a, c) => ({ ...a, [c.id]: c }), {});
  //skus =  skus.map(sku => ( { sku, product: products[sku.product] } ) );
  res.end(JSON.stringify({ products, skus, plans }, null, 2));
  //return JSON.stringify({ products, skus }, null, 2);
};

module.exports = handler;
