// init imports
require('express-async-errors')
require('dotenv').config()
const { sequelize } = require('./models/index')
const express = require('express')

// swagger
const swaggerDocs = require('./utils/swagger')

//router imports
const {
    authRouter,
    categoryRouter,
    productRouter,
    providerRouter,
    reviewRouter,
    cartRouter,
    paymentRouter,
    shippingRouter,
} = require('./routers/index')

// middleware imports
const morgan = require('morgan')
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const { rateLimit } = require('express-rate-limit')
const { errorHandler, notFound } = require('./middlewares/index')

const {
    genResponse,
    getRedisClient,
    responseInterceptor,
} = require('./utils/index')
const PORT = process.env.PORT
const app = express()

// limiter

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300,
    message: genResponse(null, 'too many requests', false, null),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 100,
    message: genResponse(null, 'too many requests', false, null),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})

// middlewares
app.use(express.json())
app.use(fileUpload())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))
app.use(cookieParser(process.env.COOKIE_SECRET))

// routes
app.use(responseInterceptor)
app.use('/statics', limiter, express.static('./public'))
app.use('/api/v1/auth', [authLimiter, authRouter])
app.use('/api/v1/category', [limiter, categoryRouter])
app.use('/api/v1/product', [limiter, productRouter])
app.use('/api/v1/provider', [limiter, providerRouter])
app.use('/api/v1/review', [limiter, reviewRouter])
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/payment', paymentRouter)
app.use('/api/v1/shipping', shippingRouter)

// app.use(notFound)

app.use(errorHandler)

async function start() {
    await sequelize.sync({ force: false })
    require('./models/index')
    app.listen(PORT, () => {
        console.log(`Node server started at port ${PORT} ...`)
    })
    await getRedisClient()
    swaggerDocs(app, PORT)
}

start()
