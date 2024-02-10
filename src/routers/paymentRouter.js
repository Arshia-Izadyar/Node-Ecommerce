const express = require('express'); 

const { createPayment, verifyPayment } = require('../controllers/paymentController')
const { authenticate, authorization } = require('../middlewares/authMiddleware')


const router = express.Router()


router.route('/').post(authenticate, createPayment)
router.route('/:token').get(verifyPayment)




module.exports = router