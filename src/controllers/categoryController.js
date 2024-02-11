const { StatusCodes } = require("http-status-codes");
const { ProductCategory, Sequelize } = require("../models/index");
const { Model, ValidationError } = require("sequelize");

const response = require("../utils/genResponse");
const NotFoundError = require("../errors/notFoundError");

const { categoryDTO } = require("../dto/categoryDto");

/**
 * @openapi
 * /api/v1/category:
 *   post:
 *     tags:
 *       - Category
 *     summary: create a category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success
 *       409:
 *         description: Conflict
 *       400:
 *         description: Bad request
 *       401:
 *         description: token expired/invalid
 *       403:
 *         description: you don't have permission to access this route
 */
async function createCategory(req, res) {
  let { value, error } = categoryDTO.validate(req.body);
  const category = await ProductCategory.create({
    name: value.name,
    slug: value.slug,
  });
  return res
    .status(StatusCodes.CREATED)
    .json(response(category, null, true, null));
}

/**
 * @openapi
 * /api/v1/category/{categorySlug}:
 *   get:
 *     tags:
 *       - Category
 *     summary: get a category
 *     parameters:
 *        - name: categorySlug
 *          in: path
 *          description: The slog of the category
 *          required: true
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: token expired/invalid
 *       403:
 *         description: you don't have permission to access this route
 */
async function getCategory(req, res) {
  const { slug: categorySlug } = req.params;
  const category = await ProductCategory.findOne({
    where: { slug: categorySlug },
    include: ["products"],
  });

  if (!category) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "category notfound", true, null));
  }
  return res.status(StatusCodes.OK).json(response(category, null, true, null));
}

/**
 * @openapi
 * /api/v1/category/{categorySlug}:
 *   delete:
 *     tags:
 *       - Category
 *     summary: delete a category
 *     parameters:
 *        - name: categorySlug
 *          in: path
 *          description: The slog of the category
 *          required: true
 *     responses:
 *       204:
 *         description: Success
 *       401:
 *         description: token expired/invalid
 *       403:
 *         description: you don't have permission to access this route
 */
async function deleteCategory(req, res) {
  const { slug: categorySlug } = req.body;
  const category = await ProductCategory.findOne({
    where: { slug: categorySlug },
  });
  if (!category) {
    throw new NotFoundError("category not found");
  }
  await category.destroy();
  return res.status(StatusCodes.NO_CONTENT).end();
}

/**
 * @openapi
 * /api/v1/category/{categorySlug}:
 *   patch:
 *     tags:
 *       - Category
 *     summary: update a category
 *     parameters:
 *        - name: categorySlug
 *          in: path
 *          description: The slog of the category
 *          required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       204:
 *         description: Success
 *       401:
 *         description: token expired/invalid
 *       403:
 *         description: you don't have permission to access this route
 */
async function updateCategory(req, res) {
  const { name } = req.body;
  const { slug: categorySlug } = req.body;
  const category = await ProductCategory.findOne({
    where: { slug: categorySlug },
  });
  if (!category) {
    throw new NotFoundError("category not found");
  }
  category.name = name || category.name;
  await category.save();
  return res
    .status(StatusCodes.ACCEPTED)
    .json(response(category, null, true, null));
}

/**
 * @openapi
 * /api/v1/category:
 *   get:
 *     tags:
 *       - Category
 *     summary: Get a list of categories
 *     description: Fetches a list of categories based on the query parameters provided.
 *     parameters:
 *        - in: query
 *          name: q
 *          description: Query for filtering category names.
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: sort
 *          description: Sort order for categories ('asc' or 'desc').
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: page
 *          description: Page number for pagination.
 *          required: false
 *          schema:
 *            type: integer
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/models/ProductCategory'
 *                 next:
 *                   type: string
 *                   description: URL to the next page of categories.
 *       401:
 *         description: Token expired or invalid.
 *       403:
 *         description: You don't have permission to access this route.
 */

async function getAllCategories(req, res) {
  let { page, sort, q } = req.query;
  page = page || 1;
  let order = [];
  console.log(sort);
  if (sort) {
    order.push(["name", sort.toLowerCase() === "desc" ? "DESC" : "ASC"]);
  }

  let where = {};
  if (q) {
    where[Sequelize.Op.or] = [{ name: { [Sequelize.Op.like]: `%${q}%` } }];
  }

  const categories = await ProductCategory.findAll({
    where: where,
    order: order,
    limit: 10,
    offset: 10 * (page - 1),
  });
  let next_page_url = "";
  if (categories.length >= 10) {
    next_page_url = `http://127.0.0.1:8000/api/v1/category?q=${q ? q : ""}&sort=${sort ? sort : ""}&page=${++page}`;
  }
  return res
    .status(StatusCodes.OK)
    .json(response(categories, null, true, { next: next_page_url }));
}

module.exports = {
  getCategory,
  createCategory,
  deleteCategory,
  updateCategory,
  getAllCategories,
};
