const response = require('../utils/genResponse')
const { StatusCodes } = require('http-status-codes')
const {
    UniqueConstraintError,
    ValidationError,
    ForeignKeyConstraintError,
    Model,
} = require('sequelize')

async function errorHandler(err, req, res, next) {
    console.log(err)
    if (err instanceof ForeignKeyConstraintError) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(response(null, err.message, false, null))
    } else if (err instanceof UniqueConstraintError) {
        return res
            .status(StatusCodes.CONFLICT)
            .json(response(null, err.errors[0].message, false, null))
    } else if (err instanceof ValidationError) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(response(null, err.errors[0].message, false, null))
    }
    let status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    let message = err.message || 'something went wrong'
    console.error(err)
    return res.status(status).json(response(null, message, false, null))
}

module.exports = errorHandler
