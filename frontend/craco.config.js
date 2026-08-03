// craco.config.js
const path = require("path");
require("dotenv").config();

// Craco/CRA sets NODE_ENV=development for `start`, NODE_ENV=production for `build`.
const isProduction = process.env.NODE_ENV === "production";
const isDevServer = !isProduction;

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

function makeDevServerV5Compatible(devServerConfig) {
  const {
    https,
    onAfterSetupMiddleware,
    onBeforeSetupMiddleware,
    onListening,
    setupMiddlewares,
    ...compatibleConfig
  } = devServerConfig;

  compatibleConfig.server =
    typeof https === "object"
      ? { type: "https", options: https }
      : https
        ? "https"
        : "http";
  compatibleConfig.headers = {
    ...compatibleConfig.headers,
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (onBeforeSetupMiddleware || setupMiddlewares) {
    compatibleConfig.setupMiddlewares = (middlewares, devServer) => {
      if (onBeforeSetupMiddleware) {
        onBeforeSetupMiddleware(devServer);
      }

      return setupMiddlewares
        ? setupMiddlewares(middlewares, devServer)
        : middlewares;
    };
  }

  compatibleConfig.onListening = (devServer) => {
    devServer.close ??= (callback) => devServer.stopCallback(callback);

    if (onListening) {
      onListening(devServer);
    }
    if (onAfterSetupMiddleware) {
      onAfterSetupMiddleware(devServer);
    }
  };

  return compatibleConfig;
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      // -------------------------------------------------------------
      // Production safety: strip any react-refresh / HMR remnants.
      // CRA/react-scripts 5 already excludes these from production
      // builds, but we belt-and-braces it in case a transitive plugin
      // ever re-adds them. Without this the app can ship with the
      // "React Refresh runtime should not be included in the
      // production bundle" runtime error.
      // -------------------------------------------------------------
      if (isProduction) {
        // Remove HMR / react-refresh webpack plugins if any snuck in
        webpackConfig.plugins = (webpackConfig.plugins || []).filter((plugin) => {
          const name = plugin && plugin.constructor && plugin.constructor.name;
          return (
            name !== "ReactRefreshPlugin" &&
            name !== "ReactRefreshWebpackPlugin" &&
            name !== "HotModuleReplacementPlugin"
          );
        });

        // Strip react-refresh babel plugin from every JS/TS rule
        const stripRefreshFromLoader = (rule) => {
          if (!rule) return;
          if (Array.isArray(rule.use)) rule.use.forEach(stripRefreshFromLoader);
          if (rule.oneOf) rule.oneOf.forEach(stripRefreshFromLoader);
          if (rule.rules) rule.rules.forEach(stripRefreshFromLoader);
          const opts = rule.options;
          if (opts && Array.isArray(opts.plugins)) {
            opts.plugins = opts.plugins.filter((p) => {
              const id = Array.isArray(p) ? p[0] : p;
              return typeof id !== "string" || !id.includes("react-refresh");
            });
          }
        };
        (webpackConfig.module?.rules || []).forEach(stripRefreshFromLoader);

        // Ensure react-refresh runtime is never bundled — hard alias to false
        webpackConfig.resolve = webpackConfig.resolve || {};
        webpackConfig.resolve.alias = {
          ...(webpackConfig.resolve.alias || {}),
          "react-refresh/runtime": false,
          "react-refresh/babel": false,
        };
      }

      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Dev-server hook is a no-op in production builds — CRA never invokes it,
  // but we keep the function shape for craco's spec.
  if (isProduction) return devServerConfig;

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

// visual-edits dev-only plugin removed for vendor-independent deployment

const configureDevServer = webpackConfig.devServer;
webpackConfig.devServer = (devServerConfig) =>
  makeDevServerV5Compatible(configureDevServer(devServerConfig));

module.exports = webpackConfig;
