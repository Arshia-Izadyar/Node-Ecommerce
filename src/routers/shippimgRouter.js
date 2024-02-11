const express = require('express'); 

const { createShipping, updateShippingStatus, deliverShipping, updateShipping, getAllShippings, getShipping } = require('../controllers/shippingController')

const { authenticate, authorization } = require('../middlewares/index')


const router = express.Router()


router.route('/').post(authenticate, createShipping).get(authenticate, getAllShippings)
router.route('/:id/status').patch(authenticate, authorization('admin', 'staff', 'user'), updateShippingStatus)
router.route('/:id/deliver').patch(authenticate, authorization('staff', 'user'), deliverShipping)
router.route('/:id').patch(authenticate, authorization('admin', 'user'), updateShipping).get(authenticate, getShipping)


module.exports = router