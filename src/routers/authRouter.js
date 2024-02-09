const express = require('express');

const {register,login, verifyUser, requestVerification, logout, refresh} = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')

const router = express.Router()

router.route('/register').post(register)
router.route('/verify').post(verifyUser)
router.route('/login').post(login)
router.route('/logout').post(auth, logout)
router.route('/refresh').get(refresh)
router.route('/request-verify').post(requestVerification)



module.exports = router


