var stripeIn = require("stripe")(process.env.STRIPE_SK_WJG_TEST);
//var stripeOut = require("stripe")(process.env.STRIPE_SK_TLA_TEST);
var stripeOut = require("stripe")(process.env.STRIPE_RK);

const preserveKeys = false;

const log = (...args) => {
  console.log(...args);
  return args[0];
};

const mapId = (state, type, rec, prop) => {
  let result;
  const pid = rec.product;
  if (prop === "product") {
    const i = state.source.products.findIndex(p => p.id === pid);
    result = i === -1 ? pid : state.created.products[i].id;
  }
  console.log("mapId ", pid, "result ", result);
  return result;
};

const copyProps = {
  products: [
    // "id"  is context dependent
    "name",
    "type",
    "active",
    "attributes",
    "metadata",
    "statement_descriptor",
    "unit_label"
  ],
  skus: [
    // "id"  is context dependent
    "currency",
    { inventory: { type: "infinite" } },
    "price",
    ["product", mapId],
    "active",
    "attributes",
    "metadata"
  ],
  plans: [
    // "id"  is context dependent
    "currency",
    "interval",
    ["product", mapId],
    "active",
    "amount",
    "billing_scheme",
    "interval_count",
    "metadata",
    "nickname",
    "usage_type"
  ]
};

(async () => {
  const getRecs = async stripeInstance => {
    const [products, skus, plans] = await Promise.all(
      ["products", "skus", "plans"].map(
        async type =>
          await stripeInstance[type]
            .list({ active: true })
            .then(d => log(d.data))
      )
    );
    return { products, skus, plans };
  };

  const createRecords = async (type, records) =>
    await Promise.all(
      records.map(async rec => {
        let props = preserveKeys ? ["id", ...copyProps[type]] : copyProps[type];
        // if (preExists[type].findIndex(r => r.id === rec.id) === -1) {
        const toCreate = props.reduce(
          (a, prop) =>
            Object.assign(
              a,
              //Reason: indented ternary results more readable
              //prettier-ignore
              Array.isArray(prop) ? 
                { [prop[0]]: prop[1](state, type, rec, prop[0]) }
              : typeof prop === "object" ? 
                prop
              : 
                { [prop]: rec[prop] }
            ),
          {}
        );
        const { id, product } = toCreate;
        console.log(
          "creating ",
          type,
          rec.name || rec.nickname || rec.price,
          JSON.stringify({ id, product })
        );
        const created = await stripeOut[type].create(toCreate).then(log);
        //console.log(JSON.stringify({ created }, null, 2));
        return created;
      })
    );

  //const preExists = getRecs(stripeIn);
  const source = await getRecs(stripeIn);
  let created = {};

  let state = { /*preExists,*/ source, created };
  //console.log(JSON.stringify(state, null, 2));
  await require("util").promisify(setTimeout)(5000); //await log

  created.products = await createRecords("products", source.products);
  await require("util").promisify(setTimeout)(5000); //await availability of created products

  const { products, ...rest } = source;
  created = Object.entries(rest).reduce(async (a, [type, records]) => {
    return { ...a, [type]: await createRecords(type, records) };
  }, created);

  //console.log(JSON.stringify(created, null, 2));
  //console.log(JSON.stringify(p, null, 2));

  //console.log(JSON.stringify(cProducts, null, 2));
  //console.log(JSON.stringify({ product: products[0] }, null, 2));
})();
