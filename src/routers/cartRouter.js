const express = require('express');

const { addToCart, getCart, removeFromCart } = require('../controllers/cartController')
const {optionalAuthenticate} = require('../middlewares/index')

const router = express.Router()

router.route('/').get(optionalAuthenticate, getCart)
router.route('/add').post(optionalAuthenticate, addToCart)
router.route('/remove').post(optionalAuthenticate, removeFromCart)



module.exports = router


