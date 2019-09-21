const isProduction = window.location.hostname === "PROD_HOSTNAME";

export default {
  productionHostName: "PROD_HOSTNAME",
  isProduction: isProduction,
  stripePublicKeyLive: "STRIPE_PK_LIVE",
  stripePublicKeyTest: "STRIPE_PK_TEST",
  recaptchaSiteKey: "6LeAd7cUAAAAAMUty4TeJA9o7CicsgMq89D7bsp0"
}