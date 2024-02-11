const winston = require("winston");

const { combine, timestamp, json, printf } = winston.format;
const timestampFormat = "MMM-DD-YYYY HH:mm:ss";

const httpLogger = winston.createLogger({
  format: combine(
    timestamp({ format: timestampFormat }),
    json(),
    printf(({ timestamp, level, message, ...data }) => {
      const response = {
        level,
        timestamp,
        message,
        data,
      };
      return JSON.stringify(response);
    }),
  ),
  transports: [new winston.transports.Console()],
});

const formatHTTPLoggerResponse = (req, res, responseBody) => {
  return {
    request: {
      headers: req.headers,
      host: req.headers.host,
      baseUrl: req.baseUrl,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req?.params,
      query: req?.query,
    },
    response: {
      headers: res.getHeaders(),
      statusCode: res.statusCode,
      body: responseBody,
    },
  };
};

module.exports = { httpLogger, formatHTTPLoggerResponse };
