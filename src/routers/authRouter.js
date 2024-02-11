const express = require('express')

const {
    register,
    login,
    verifyUser,
    requestVerification,
    logout,
    refresh,
    profile,
    updateProfile,
} = require('../controllers/authController')
const { authenticate, authorization } = require('../middlewares/index')

const router = express.Router()

router.route('/register').post(register)
router.route('/verify').post(verifyUser)
router.route('/login').post(login)
router.route('/logout').post(authenticate, logout)
router.route('/refresh').get(refresh)
router.route('/profile').get(authenticate, profile)
router.route('/profile/update').patch(authenticate, updateProfile)
router.route('/request-verify').post(requestVerification)

module.exports = router
