/*global Stripe, window, sessionStorage */

import { html } from "./wuf-hyper.js";
import { toHash } from "./router.js";
import config from "./config.js";

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

export { checkout };
