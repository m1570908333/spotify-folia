Spicetify.ReactJSXRuntime = (() => {
  const React = Spicetify.React;
  const create = (type, props, key) => {
    const next = props ? { ...props } : {};
    if (key !== undefined) next.key = key;
    return React.createElement(type, next);
  };
  return { Fragment: React.Fragment, jsx: create, jsxs: create, jsxDEV: create };
})();
