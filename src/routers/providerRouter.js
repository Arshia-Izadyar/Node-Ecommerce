const express = require('express')
const {
    getAllProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    getProvider,
} = require('../controllers/providerController')

const { authenticate, authorization } = require('../middlewares/index')

const router = express.Router()

router
    .route('/')
    .post([authenticate, authorization('admin', 'staff')], createProvider)
    .get(getAllProviders)
router
    .route('/:slug')
    .get(getProvider)
    .patch([authenticate, authorization('admin', 'staff')], updateProvider)
    .delete([authenticate, authorization('admin', 'staff')], deleteProvider)

module.exports = router
