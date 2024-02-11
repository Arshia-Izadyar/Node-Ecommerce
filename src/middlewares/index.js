const { authenticate, authorization } = require('./authMiddleware')
const errorHandler = require('./errorHandler')
const notFound = require('./notFound')
const { optionalAuthenticate } = require('./optionalAuth')

module.exports = {
    authenticate,
    authorization,
    errorHandler,
    notFound,
    optionalAuthenticate,
}
