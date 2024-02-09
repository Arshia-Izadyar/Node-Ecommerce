const express = require('express'); 

const { getCategory, createCategory, deleteCategory, updateCategory, getAllCategories } = require('../controllers/categoryController')

const { authenticate, authorization } = require('../middlewares/authMiddleware')


const router = express.Router()


router.route('/').post(authenticate, authorization('admin', 'staff'), createCategory).get(getAllCategories)
router.route('/:slug').get(getCategory).delete(authenticate, authorization('admin', 'staff'), deleteCategory).patch(authenticate, authorization('admin', 'staff'), updateCategory)





module.exports = router