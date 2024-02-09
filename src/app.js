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

// middleware imports
const morgan = require('morgan');
const fileUpload = require('express-fileupload');  

const notFound = require('./middlewares/notFound')
const errHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT
const app = express();


// middlewares

app.use(express.json())
app.use(fileUpload())
app.use(express.urlencoded({extended: false}))
app.use(morgan('dev'))
app.use(cookieParser(process.env.COOKIE_SECRET))


// routes
app.use('/statics',express.static('./public'))
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/provider', providerRouter);
app.use(notFound)
app.use(errHandler)

async function start() {
    await sequelize.sync({force: false})
    require('./models/index')
    app.listen(PORT, () => {console.log(`Node server started at port ${PORT} ...`)})
    await getRedisClient()
}


start()