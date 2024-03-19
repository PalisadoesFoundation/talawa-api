import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import clsBluebird from "cls-bluebird";
import i18n from "i18n";
import type { NextFunction, Request, Response } from "express";

export const requestContextNamespace = cls.createNamespace(
  "talawa-request-context",
);

clsBluebird(requestContextNamespace);

export const setRequestContextValue = <T>(key: string, value: T): T => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return requestContextNamespace.set<T>(key, value);
};

export const getRequestContextValue = <T>(key: string): T => {
  return requestContextNamespace.get(key);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setRequestContext = (obj: any): void => {
  setRequestContextValue("translate", obj.__);
  setRequestContextValue("translatePlural", obj.__n);
};

export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requestContextNamespace.bindEmitter(req);
    requestContextNamespace.bindEmitter(res);

    requestContextNamespace.run(() => {
      setRequestContext(req);
      next();
    });
  };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface InterfaceInitOptions<T> extends Record<any, any> {
  requestHandler?: () => T;
}

// Invalid code. Currently ignored by typescript. Needs fix.
export const init = <T>(options: InterfaceInitOptions<T> = {}): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {};
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  i18n.init(obj);

  if (
    !options.locale ||
    !["en", "fr", "hi", "zh", "sp", "fr"].includes(options.locale)
  ) {
    throw new Error("Invalid locale. Please provide a valid 'lang' option.");
  }
  obj.setLocale(options.locale);

  if (options.requestHandler == null) {
    throw new Error("Missing request handler during initialization");
  }

  return requestContextNamespace.runAndReturn<T>(() => {
    setRequestContext({
      __: obj.__,
      __n: obj.__n,
    });

    return options.requestHandler != null
      ? options.requestHandler()
      : ({} as T);
  });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const translate = (...args: any): any => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __ = getRequestContextValue("translate");
  if (typeof __ !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return __(...args);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const translatePlural = (...args: any): any => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __n = getRequestContextValue("translatePlural");
  if (typeof __n !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return __n(...args);
};
