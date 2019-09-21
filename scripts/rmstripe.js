var stripe = require("stripe")(process.env.STRIPE_RK);
//var stripe = require("stripe")(process.env.STRIPE_SK_WJG_TEST);
//var stripeOut = require("stripe")(process.env.STRIPE_SK_TLA_TEST);
//var stripeOut = require("stripe")(process.env.STRIPE_RK);

const log = (...args) => {
  console.log(...args);
  return args[0];
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

  const rm = async (type, records) =>
    await Promise.all(
      records.map(async ({ id }) => await stripe[type].del(id).then(log))
    );

  const source = await getRecs(stripe);

  //console.log(JSON.stringify(source, null, 2));
  await require("util").promisify(setTimeout)(5000); //await log

  await rm("products", source.products);
})();
