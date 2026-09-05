/**
 * Metro configuration.
 *
 * ── Why this file exists ─────────────────────────────────────────────────
 * `pdf-lib` ships two builds:
 *   • `main`  → `cjs/index.js`  (CommonJS — used by Node, works everywhere)
 *   • `module`→ `es/index.js`   (ESM — its `export * from "./form"`-style
 *     directory re-exports can make Metro throw
 *     "Unable to resolve module ./form from node_modules/pdf-lib/es/api/index.js")
 *
 * This resolver pins `pdf-lib` to the CommonJS build so Metro never touches
 * the `es/` tree. See https://github.com/Hopding/pdf-lib/issues/1207.
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'pdf-lib') {
    return context.resolveRequest(
      {
        ...context,
        // Avoid infinite recursion through this custom resolver.
        resolveRequest: undefined,
      },
      'pdf-lib/cjs/index.js',
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
