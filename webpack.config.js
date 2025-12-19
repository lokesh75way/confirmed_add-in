const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const urlDev = "localhost:3000";
const urlProd = "confirmedoutlookaddin.z20.web.core.windows.net/";

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      vendor: ["react", "react-dom", "core-js"],
      taskpane: ["./src/taskpane/index.js", "./src/taskpane/taskpane.html"],
      commands: "./src/commands/commands.js",
      popup: "./src/taskpane/popup.js",
      callback: "./src/taskpane/callback.js",
    },
    output: {
      // path: `${__dirname}/src/taskpane`,
      // filename: 'popupRedirect.js',
      // publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: [".html", ".js"],
      alias: {
        process: "process/browser",
        stream: "stream-browserify",
        zlib: "browserify-zlib",
        querystring: "querystring-es3",
        timers: "timers-browserify",
      },
      fallback: {
        "process/browser": require.resolve("process/browser"),
        "buffer": require.resolve("buffer/"),
        "util": require.resolve("util/"),
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.html$/,
          use: ["html-loader"],
        },
      ],
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "package.json",
            to: "package.json",
          },
          {
            from: dev ? "manifest.local.xml" : "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["taskpane", "vendor", "polyfills"],
      }),
      new HtmlWebpackPlugin({
        filename: "popup.html",
        template: "./src/taskpane/popup.html",
        chunks: ["polyfills", "popup"],
      }),
      new HtmlWebpackPlugin({
        filename: "callback.html",
        template: "./src/taskpane/callback.html",
        chunks: ["polyfills", "callback"],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["commands"],
      }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
