import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;
const altBuild = process.env.ALT_BUILD;
console.log({ production, altBuild });

export default {
  input: "src/index.js",
  output: {
    file: altBuild ? "public/alt.js" : "public/bundle.js", // workaround sometimes for codesandbox
    format: "iife", // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true
  },
  plugins: [
    replace({
      ENVIRONMENT: JSON.stringify("production"),
      STRIPE_PK_TEST: process.env.STRIPE_PK_TLA_TEST,
      STRIPE_PK_LIVE: process.env.STRIPE_PK_TLA_LIVE,
      PROD_HOSTNAME: "buy.telanova.com"
    }),
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    production && terser() // minify, but only in production
  ]
};
