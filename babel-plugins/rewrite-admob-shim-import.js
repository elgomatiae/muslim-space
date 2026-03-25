/**
 * On EAS / dev-client (EXPO_PUBLIC_USE_REAL_ADMOB=true), rewrite imports from the
 * local JS shim to the real react-native-google-mobile-ads package so native ads work.
 * Local Expo Go keeps imports pointing at the shim (no TurboModule).
 */
const SHIM_MARKERS = [
  "@/shims/react-native-google-mobile-ads.js",
  "@/shims/react-native-google-mobile-ads",
];

module.exports = function () {
  // Only swap to the real npm package on EAS builds. Local dev often sets
  // EXPO_PUBLIC_USE_REAL_ADMOB from .env — that must NOT load real native code in Expo Go.
  const isEasBuild =
    process.env.EAS_BUILD === "true" ||
    process.env.EAS_BUILD === "1";
  const useRealAdMob =
    process.env.EXPO_PUBLIC_USE_REAL_ADMOB === "true" && isEasBuild;
  if (!useRealAdMob) {
    return { visitor: {} };
  }

  function rewriteSource(value) {
    if (typeof value !== "string") return value;
    const hit = SHIM_MARKERS.find((m) => value === m || value.endsWith("/shims/react-native-google-mobile-ads.js"));
    return hit ? "react-native-google-mobile-ads" : value;
  }

  return {
    visitor: {
      ImportDeclaration(path) {
        const next = rewriteSource(path.node.source.value);
        if (next !== path.node.source.value) path.node.source.value = next;
      },
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          const next = rewriteSource(path.node.source.value);
          if (next !== path.node.source.value) path.node.source.value = next;
        }
      },
      ExportAllDeclaration(path) {
        const next = rewriteSource(path.node.source.value);
        if (next !== path.node.source.value) path.node.source.value = next;
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee?.type === "Import") {
          const arg0 = path.node.arguments[0];
          if (arg0?.type === "StringLiteral") {
            const next = rewriteSource(arg0.value);
            if (next !== arg0.value) arg0.value = next;
          }
        }
      },
    },
  };
};
