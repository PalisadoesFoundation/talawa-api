const cls = require('cls-hooked');
const clsBluebird = require('cls-bluebird');
const { customAlphabet } = require('nanoid');

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

const requestTracingNamespace = cls.createNamespace('request-tracing');
clsBluebird(requestTracingNamespace);

const tracingIdHeaderName = 'X-Tracing-Id';
const tracingIdContextKeyName = 'tracingId';

const nanoid = customAlphabet(alphabet, 10);
const _newTraceId = () => nanoid(); // 10 character unique request ID

const setTracingId = (tracingId) => {
  return requestTracingNamespace.set(tracingIdContextKeyName, tracingId);
};

const getTracingId = () => {
  return requestTracingNamespace.get(tracingIdContextKeyName);
};

const middleware = () => {
  return (req, res, next) => {
    requestTracingNamespace.bindEmitter(req);
    requestTracingNamespace.bindEmitter(res);

    const tracingId = req.header(tracingIdHeaderName) || _newTraceId();
    // We need to set header to ensure API gateway which proxies request, forwards the header as well
    req.headers[tracingIdHeaderName] = tracingId;
    res.header(tracingIdHeaderName, tracingId); // Adding tracing ID to response headers

    requestTracingNamespace.run(() => {
      setTracingId(tracingId);
      next();
    });
  };
};

const trace = async (tracingId, method) => {
  await requestTracingNamespace.runAndReturn(async () => {
    setTracingId(tracingId || _newTraceId());
    return method();
  });
};

module.exports = {
  middleware,
  trace,
  getTracingId,
  tracingIdHeaderName,
};
