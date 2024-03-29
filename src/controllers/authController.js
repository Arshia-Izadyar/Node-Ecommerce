const { StatusCodes } = require('http-status-codes')
const { ValidationError, Model } = require('sequelize')
const jwt = require('jsonwebtoken')

const { User, Shipping, Payment } = require('../models/index')
const {
    genResponse: response,
    sendOtp,
    validatePassword,
    userPayload,
    setValueToRedis,
    getValueFromRedis,
} = require('../utils/index')

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               password_confirm:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       409:
 *         description: Conflict
 *       400:
 *         description: Bad request
 */
async function register(req, res) {
    const { username, full_name, phone_number, password, password_confirm } =
        req.body
    if (password !== password_confirm) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(response(null, 'passwords dont math', false, null))
    } else if (!validatePassword(password)) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(response(null, 'password is too weak', false, null))
    }
    try {
        let user = await User.create({
            username: username,
            full_name: full_name,
            phone_number: phone_number,
            password: password,
        })
        let otpCode = await sendOtp(user.phone_number)
        if (otpCode === -1) {
            return res
                .status(StatusCodes.TOO_MANY_REQUESTS)
                .json(response(null, 'otp already sent', false, null))
        } else if (otpCode === 0) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json(response(null, 'something went wrong', false, null))
        }
        console.log('\notp:', otpCode)
        return res
            .status(StatusCodes.CREATED)
            .json(response('otp sent', null, true, null))
    } catch (err) {
        if (err instanceof ValidationError) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json(response(null, err.errors[0].message, false, null))
        }
        console.log(err)
    }
}

/**
 * @openapi
 * /api/v1/auth/request-verify:
 *   post:
 *     tags:
 *       - User
 *     summary: set otp verify to a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: otp sent
 *       429:
 *         description: too many request
 *       500:
 *         description: something went wrong
 */
async function requestVerification(req, res) {
    const { phone_number } = req.body
    try {
        let user = await User.findOne({ where: { phone_number: phone_number } })
        if (!user) {
            return res
                .status(StatusCodes.CREATED)
                .json(response('otp sent', null, true, null))
        }
        let otpCode = await sendOtp(user.phone_number)
        if (otpCode === -1) {
            return res
                .status(StatusCodes.TOO_MANY_REQUESTS)
                .json(response(null, 'otp already sent', false, null))
        } else if (otpCode === 0) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json(response(null, 'something went wrong', false, null))
        }
        console.log('\notp:', otpCode)
        return res
            .status(StatusCodes.CREATED)
            .json(response('otp sent', null, true, null))
    } catch (err) {
        console.log(err)
    }
}

/**
 * @openapi
 * /api/v1/auth/verify:
 *   post:
 *     tags:
 *       - User
 *     summary: verify a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       202:
 *         description: verified
 *       404:
 *         description: user not found
 *       400:
 *         description: invalid otp
 */
async function verifyUser(req, res) {
    const { otp, phone_number } = req.body
    let otpKey = `otp_${phone_number}`
    let rdsOtp = await getValueFromRedis(otpKey)
    if (rdsOtp || rdsOtp === otp) {
        try {
            await setValueToRedis({ key: otpKey, value: '', duration: 0 })
            let user = await User.findOne({
                where: { phone_number: phone_number },
            })
            user.is_verified = true
            await user.save()
            return res
                .status(StatusCodes.ACCEPTED)
                .json(response('user verified', null, true, null))
        } catch (err) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json(response(null, 'user not found', false, null))
        }
    }
    return res
        .status(StatusCodes.BAD_REQUEST)
        .json(response(null, 'invalid otp', false, null))
}

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - User
 *     summary: login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: user not found or not active
 *       401:
 *         description: username or password is wrong /
 */
async function login(req, res) {
    const { username, password } = req.body
    const user = await User.findOne({ where: { username: username } })
    if (!user || !user.is_verified) {
        return res
            .status(StatusCodes.NOT_FOUND)
            .json(response(null, 'user not found or not active', false, null))
    }
    if (!(await user.isValidPassword(password))) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json(response(null, 'username or password is wrong', false, null))
    }
    jwtKey = `refresh_${user.username}`
    let payload = userPayload(user)
    const jwtDuration = parseInt(process.env.REFRESH_TOKEN_EXPIRE) * 24 * 60

    let storedRefreshToken = await getValueFromRedis(jwtKey)
    if (storedRefreshToken) {
        try {
            let storedRefreshTokenClaims = jwt.verify(
                storedRefreshToken,
                process.env.JWT_SECRET
            )
            let accessToken = jwt.sign(
                payload.accessToken,
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
                    algorithm: 'HS256',
                }
            )

            res.cookie('refreshToken', storedRefreshToken, {
                httpOnly: true,
                signed: true,
                maxAge: jwtDuration * 60 * 1000, // ms
            })

            return res.status(StatusCodes.OK).json(
                response(
                    {
                        accessToken: accessToken,
                        refreshToken: storedRefreshToken,
                    },
                    null,
                    true,
                    null
                )
            )
        } catch (err) {
            console.log(err)
            await setValueToRedis({ key: jwtKey, value: '', duration: 0 })
        }
    }

    let accessToken = jwt.sign(payload.accessToken, process.env.JWT_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
        algorithm: 'HS256',
    })
    let refreshToken = jwt.sign(payload.refreshToken, process.env.JWT_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        algorithm: 'HS256',
    })
    let ok = await setValueToRedis({
        key: jwtKey,
        value: refreshToken,
        duration: jwtDuration,
    })
    if (!ok) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(response(null, 'something went wrong', false, null))
    }
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        signed: true,
        maxAge: jwtDuration * 60 * 1000, // ms
    })

    return res.status(StatusCodes.OK).json(
        response(
            {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
            null,
            true,
            null
        )
    )
}

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: logout a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       204:
 *         description: Success
 *       404:
 *         description: user not found or not active
 *       401:
 *         description: provided token is invalid / expired
 *       403:
 *         you dont have permission to access this route
 */
async function logout(req, res) {
    let reqUser = req.user
    let localRefresh = req.signedCookies.refreshToken
    const user = await User.findOne({ where: { user_uuid: reqUser.userId } })

    jwtKey = `refresh_${user.username}`

    let storedRefreshToken = await getValueFromRedis(jwtKey)
    res.cookie('refreshToken', 'logout', {
        httpOnly: true,
        signed: true,
        expires: new Date(),
    })
    if (
        localRefresh &&
        storedRefreshToken &&
        localRefresh === storedRefreshToken
    ) {
        await setValueToRedis({ key: jwtKey, value: '', duration: 0 })
        return res.status(StatusCodes.NO_CONTENT).end()
    }
    if (storedRefreshToken) {
        await setValueToRedis({ key: jwtKey, value: '', duration: 0 })
        return res.status(StatusCodes.NO_CONTENT).end()
    }
    return res.status(StatusCodes.NO_CONTENT).end()
}

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   get:
 *     tags:
 *       - User
 *     summary: refresh a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: user not found or not active
 *       401:
 *         description: provided token is invalid / expired
 *       403:
 *         you don't have permission to access this route
 */
async function refresh(req, res) {
    let localRefresh = req.signedCookies.refreshToken
    try {
        const { type, userId, role } = jwt.verify(
            localRefresh,
            process.env.JWT_SECRET,
            { algorithms: 'HS256' }
        )

        const user = await User.findOne({ where: { user_uuid: userId } })
        let payload = userPayload(user)

        jwtKey = `refresh_${user.username}`
        console.log(jwtKey)

        let storedRefreshToken = await getValueFromRedis(jwtKey)
        console.log(storedRefreshToken)
        console.log(localRefresh)
        console.log(localRefresh === storedRefreshToken)
        if (
            localRefresh &&
            storedRefreshToken &&
            localRefresh === storedRefreshToken
        ) {
            await setValueToRedis({ key: jwtKey, value: '', duration: 0 })

            const jwtDuration =
                parseInt(process.env.REFRESH_TOKEN_EXPIRE) * 24 * 60
            let accessToken = jwt.sign(
                payload.accessToken,
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
                    algorithm: 'HS256',
                }
            )
            let refreshToken = jwt.sign(
                payload.refreshToken,
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
                    algorithm: 'HS256',
                }
            )
            let ok = await setValueToRedis({
                key: jwtKey,
                value: refreshToken,
                duration: jwtDuration,
            })
            if (!ok) {
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json(response(null, 'something went wrong', false, null))
            }

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                signed: true,
                maxAge: jwtDuration * 60 * 1000, // ms
            })

            return res.status(StatusCodes.OK).json(
                response(
                    {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    },
                    null,
                    true,
                    null
                )
            )
        }
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(
                response(
                    null,
                    'provided token is expired please login again',
                    false,
                    null
                )
            )
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json(
                    response(
                        null,
                        'provided token is expired please login again',
                        false,
                        null
                    )
                )
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json(
                    response(
                        null,
                        'provided token is invalid please login again',
                        false,
                        null
                    )
                )
        }
    }
}

/**
 * @openapi
 * /api/v1/auth/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: profile for a user
 *     responses:
 *       200:
 *         description: Success
 *       409:
 *         description: Conflict
 *       400:
 *         description: Bad request
 */
async function profile(req, res) {
    const usr = req.user
    console.log(req.user)
    const user = await User.findOne({
        where: { id: usr.id },
        include: [
            {
                model: Shipping,
                as: 'shippings',
            },
            {
                model: Payment,
                as: 'payments',
            },
        ],
    })
    return res.status(StatusCodes.OK).json(response(user, null, true, null))
}

/**
 * @openapi
 * /api/v1/auth/profile/update:
 *   patch:
 *     tags:
 *       - User
 *     summary: update profile for a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               address:
 *                  type: string
 *     responses:
 *       200:
 *         description: Success
 *       409:
 *         description: Conflict
 *       400:
 *         description: Bad request
 */
async function updateProfile(req, res) {
    const usr = req.user
    const { full_name, address } = req.body
    console.log(req.user)
    const user = await User.findOne({
        where: { id: usr.id },
    })
    user.full_name = full_name || user.full_name
    user.address = address || user.address
    user.save()

    return res.status(StatusCodes.OK).json(response(user, null, true, null))
}

module.exports = {
    register,
    verifyUser,
    requestVerification,
    login,
    logout,
    refresh,
    profile,
    updateProfile,
}
