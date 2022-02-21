const cls = require('cls-hooked');
const clsBluebird = require('cls-bluebird');
const i18n = require('i18n');

const requestContextNamespace = cls.createNamespace('talawa-request-context');
clsBluebird(requestContextNamespace);

const setRequestContextValue = (key, value) => {
  return requestContextNamespace.set(key, value);
};

const getRequestContextValue = (key) => {
  return requestContextNamespace.get(key);
};

const setRequestContext = (obj) => {
  setRequestContextValue('translate', obj.__);
  setRequestContextValue('translatePlural', obj.__n);
};

const middleware = () => {
  return (req, res, next) => {
    requestContextNamespace.bindEmitter(req);
    requestContextNamespace.bindEmitter(res);

    requestContextNamespace.run(() => {
      setRequestContext(req);
      next();
    });
  };
};

const init = async (options = {}) => {
  const obj = {};
  i18n.init(obj);
  obj.setLocale(options.lang);
  return requestContextNamespace.runAndReturn(async () => {
    setRequestContext({
      __: obj.__,
      __n: obj.__n,
    });
    return options.requestHandler();
  });
};

const translate = (...args) => {
  const __ = getRequestContextValue('translate');
  if (typeof __ !== 'function') {
    throw new Error('i18n is not initialized, try app.use(i18n.init);');
  }
  return __(...args);
};

const translatePlural = (...args) => {
  const __n = getRequestContextValue('translatePlural');
  if (typeof __n !== 'function') {
    throw new Error('i18n is not initialized, try app.use(i18n.init);');
  }
  return __n(...args);
};

module.exports = {
  middleware,
  translate,
  translatePlural,
  init,
};
