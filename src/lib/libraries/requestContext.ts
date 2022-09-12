import cls from 'cls-hooked';
// No type defintions available for package 'cls-bluebird'
// @ts-ignore
import clsBluebird from 'cls-bluebird';
import i18n from 'i18n';
import { NextFunction, Request, Response } from 'express';

const requestContextNamespace = cls.createNamespace('talawa-request-context');

clsBluebird(requestContextNamespace);

const setRequestContextValue = <T>(key: string, value: T) => {
  return requestContextNamespace.set<T>(key, value);
};

const getRequestContextValue = (key: string) => {
  return requestContextNamespace.get(key);
};

const setRequestContext = (obj: any) => {
  setRequestContextValue('translate', obj.__);
  setRequestContextValue('translatePlural', obj.__n);
};

export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    requestContextNamespace.bindEmitter(req);
    requestContextNamespace.bindEmitter(res);

    requestContextNamespace.run(() => {
      setRequestContext(req);
      next();
    });
  };
};

interface Interface_InitOptions<T> extends Record<any, any> {
  requestHandler?: () => T;
}

// Invalid code. Currently ignored by typescript. Needs fix.
export const init = async <T>(options: Interface_InitOptions<T> = {}) => {
  const obj: any = {};
  // @ts-ignore
  i18n.init(obj);
  // @ts-ignore
  obj.setLocale(options.lang);
  return requestContextNamespace.runAndReturn<T>(() => {
    setRequestContext({
      __: obj.__,
      __n: obj.__n,
    });
    // @ts-ignore
    return options.requestHandler();
  });
};

export const translate = (...args: any) => {
  const __ = getRequestContextValue('translate');
  if (typeof __ !== 'function') {
    throw new Error('i18n is not initialized, try app.use(i18n.init);');
  }
  return __(...args);
};

export const translatePlural = (...args: any) => {
  const __n = getRequestContextValue('translatePlural');
  if (typeof __n !== 'function') {
    throw new Error('i18n is not initialized, try app.use(i18n.init);');
  }
  return __n(...args);
};

export default {
  middleware,
  translate,
  translatePlural,
  init,
};
