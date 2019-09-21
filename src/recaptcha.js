import { html, hp } from "./wuf-hyper.js";

const recaptchaNode = html`
  <small>This site is protected by reCAPTCHA and the Google 
  <a href="https://policies.google.com/privacy"> Privacy Policy</a> and 
  <a href="https://policies.google.com/terms"> Terms of Service</a> apply
</small>`

const recaptchaToken = (options, callback) => new Promise((resolve, reject) =>
  window.grecaptcha.ready(function() {
    resolve(window.grecaptcha.execute('6LeAd7cUAAAAAMUty4TeJA9o7CicsgMq89D7bsp0', options))
  })
)

export {recaptchaNode, recaptchaToken}