// Returns current server's domain on passing the context object.

export function requestUrl(context: any) {
  const { req } = context;
  const fullUrl: string = req.protocol + "://" + req.get("host") + "/";
  return fullUrl;
}
