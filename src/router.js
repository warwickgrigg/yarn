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

export { Router, toHash, fromHash };
