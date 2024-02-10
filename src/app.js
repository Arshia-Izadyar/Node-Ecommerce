// init imports
require('express-async-errors');
require('dotenv').config()
const {sequelize} = require('./models/index');
const express = require('express'); 
const { getRedisClient } = require('./utils/redis');

//router imports
const authRouter = require('./routers/authRouter')
const categoryRouter = require('./routers/categoryRouter')
const productRouter = require('./routers/productRouter')
const providerRouter = require('./routers/providerRouter')
const reviewRouter = require('./routers/reviewRouters')

// middleware imports
const morgan = require('morgan');
const fileUpload = require('express-fileupload');  

const notFound = require('./middlewares/notFound')
const errHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT
const app = express();
const {rateLimit} = require("express-rate-limit");
const genResponse = require('./utils/genResponse');


// limiter

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 3, 
    message: genResponse(null, 'too many requests', false, null),
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	
})

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10,
    message: genResponse(null, 'too many requests', false, null),
	standardHeaders: 'draft-7',
	legacyHeaders: false,

})



// middlewares
app.use(express.json())
app.use(fileUpload())
app.use(express.urlencoded({extended: false}))
app.use(morgan('dev'))
app.use(cookieParser(process.env.COOKIE_SECRET))


// routes
app.use('/statics', limiter, express.static('./public'))
app.use('/api/v1/auth', [authLimiter, authRouter]);
app.use('/api/v1/category', [limiter, categoryRouter]);
app.use('/api/v1/product', [limiter, productRouter]);
app.use('/api/v1/provider', [limiter, providerRouter]);
app.use('/api/v1/review', [limiter, reviewRouter]);

app.use(notFound)
app.use(errHandler)

async function start() {
    await sequelize.sync({force: false})
    require('./models/index')
    app.listen(PORT, () => {console.log(`Node server started at port ${PORT} ...`)})
    await getRedisClient()
}


start()