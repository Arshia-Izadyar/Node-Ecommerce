const {StatusCodes} = require('http-status-codes');
const jwt = require('jsonwebtoken')

const genResponse = require('../utils/genResponse');
const { accessTokenKey, refreshTokenKey } = require("../constants/constants")


async function authenticate(req, res, next){
    let authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(StatusCodes.UNAUTHORIZED).json(genResponse(null, 'no token provided', false, null))
    }
    let token = authHeader.split(" ")[1]

    try{
        const {userId, type, role} = jwt.verify(token, process.env.JWT_SECRET, {algorithm:'HS256'})
        if (type !== accessTokenKey) {
            return res.status(StatusCodes.UNAUTHORIZED).json(genResponse(null, 'provided token is not a accessToken', false, null))
            
        }
        req.user = {userId: userId, role: role}
        console.log(req.user);
        return next();
        
    } catch(err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(StatusCodes.UNAUTHORIZED).json(genResponse(null, 'provided token is expired', false, null))
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(StatusCodes.UNAUTHORIZED).json(genResponse(null, 'provided token is invalid', false, null))
        }
    }
}


module.exports = authenticate