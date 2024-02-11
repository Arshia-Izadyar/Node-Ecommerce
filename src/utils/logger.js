const winston = require("winston");
const DailyRotateFile = require('winston-daily-rotate-file')
const { combine, timestamp, json, printf } = winston.format;
const timestampFormat = "MMM-DD-YYYY HH:mm:ss";

const httpLogger = winston.createLogger({
  format: combine(
    timestamp({ format: timestampFormat }),
    json(),
    printf(({ timestamp, level, message, ...data }) => {
      // const response = {
      //   level,
      //   timestamp,
      //   message,
      //   data,
      // };
      // return JSON.stringify(response);
      return `[${timestamp}] ${level} "${message}" => ${JSON.stringify(data)}`
    }),
  ),
  transports: [new winston.transports.Console(), new DailyRotateFile({
    filename: 'logs/app-logs-%DATE%.log',
    datePattern: 'DD-MMMM-YYYY',
    zippedArchive: false,
    maxFiles: '14d',
    maxSize: '20m'
  })],
});

const sequelizeLogger = (msg) => {
  httpLogger.info(msg)
}

const formatHTTPLoggerResponse = (req, res, responseBody, requestStartTime) => {
  if (requestStartTime){
    const endTime = Date.now() - requestStartTime;
    requestDuration = `${endTime / 1000}s`; // ms to s
  }
  return {
    request: {
      // headers: req.headers,
      host: req.headers.host,
      baseUrl: req.baseUrl,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req?.params,
      query: req?.query,
      requestDuration
    },
    response: {
      headers: res.getHeaders(),
      statusCode: res.statusCode,
      body: responseBody,
    },
  };
};


function responseInterceptor(req, res, next){
  const originalSend = res.json
  let responseSent = false
  const requestStartTime = Date.now();
  res.json = function(body){
    if (!responseSent){
      if (res.statusCode < 400){
        httpLogger.info(
          'lol',
          formatHTTPLoggerResponse(req, res, body, requestStartTime)
        )
      }else {
        httpLogger.error(
          body.error, 
          formatHTTPLoggerResponse(req, res, body, requestStartTime)
        )
      }
    }
    return originalSend.call(this, body)
  }
  next()

}

module.exports = { httpLogger, formatHTTPLoggerResponse, responseInterceptor, sequelizeLogger };
