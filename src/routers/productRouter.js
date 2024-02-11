const express = require("express");
const {
  createProduct,
  getOneProduct,
  addProvider,
  removeProvider,
  deleteProduct,
  updateProduct,
  getAllProducts,
} = require("../controllers/productController");
const {
  createReview,
  deleteReview,
} = require("../controllers/reviewController");

const { authenticate, authorization } = require("../middlewares/index");

const router = express.Router();

router
  .route("/")
  .post(authenticate, authorization("admin", "staff"), createProduct)
  .get(getAllProducts);
router
  .route("/:slug")
  .patch(authenticate, authorization("admin", "staff"), updateProduct)
  .delete(authenticate, authorization("admin", "staff"), deleteProduct);
router
  .route("/:id/provider/add")
  .post(authenticate, authorization("admin", "staff"), addProvider);
router
  .route("/:id/provider/remove")
  .post(authenticate, authorization("admin", "staff"), removeProvider);
router
  .route("/:id/review")
  .post(authenticate, createReview)
  .delete(authenticate, deleteReview);
router.route("/:slug").get(getOneProduct);

module.exports = router;
