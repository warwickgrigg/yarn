import { h, app } from "hyperapp";
import htm from "htm";
import domz from "domz";

const html = htm.bind(h);
const hp = domz(h);

/*
function vnode(name) {
  return function (attributes, children) {
    return typeof attributes === "object" && !Array.isArray(attributes)
      ? h(name, attributes, children)
      : h(name, {}, attributes)
  }
}

const hp = new Proxy({}, {
  get: function(_, tagName) {
    return function (attributes, children) {
      return vnode(tagName)(attributes, children)
    }
  }
})
*/
export { html, hp, h, app };