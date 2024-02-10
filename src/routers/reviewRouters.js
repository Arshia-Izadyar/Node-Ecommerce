const express = require('express');
const {createReview} = require('../controllers/reviewController')
const { authenticate, authorization } = require('../middlewares/authMiddleware')


const router = express.Router()


router.route('/:id').post(authenticate, createReview)



module.exports = router