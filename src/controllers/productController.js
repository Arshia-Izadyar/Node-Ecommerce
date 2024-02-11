const { StatusCodes } = require("http-status-codes");
const {
  Product,
  ProductCategory,
  Provider,
  sequelize,
  Sequelize,
  Review,
} = require("../models/index");
const path = require("path");
const fs = require("fs").promises;

const {
  genResponse: response,
  saveImages: saveImages,
  httpLogger, formatHTTPLoggerResponse
} = require("../utils/index");
const NotFoundError = require("../errors/notFoundError");


async function createProduct(req, res) {
  const files = req.files;
  let imageList = files.images;
  let productImages = null;
  const product = await Product.create(req.body);
  productImages = await saveImages(imageList.length ? imageList : [imageList]);
  if (productImages) {
    product.image = productImages;
    await product.save();
  }
  return res
    .status(StatusCodes.CREATED)
    .json(response(product, null, true, null));
}

async function getOneProduct(req, res) {
  let { slug } = req.params;
  const product = await Product.findOne({
    where: { slug: slug },
    attributes: [
      "name",
      "slug",
      "price",
      "description",
      "image",
      "available",
      "quantity",
      "off_percent",
      [Sequelize.fn("AVG", Sequelize.col("reviews.rate")), "rating"],
    ],
    include: [
      {
        model: ProductCategory,
        as: "category",
        attributes: ["name", "slug"],
        require: false,
        duplicating: false,
      },
      {
        model: Provider,
        as: "providers",
        attributes: ["name", "slug", "description"],
      },
      {
        model: Review,
        as: "reviews",
        attributes: ["comment", "rate"],
      },
    ],
    group: [
      "Product.id",
      "category.id",
      "providers.id",
      "reviews.id",
      "providers->ProductProvider.productId",
      "providers->ProductProvider.providerId",
    ],
  });
  // httpLogger.info('product', formatHTTPLoggerResponse(req, res, product))
  if (!product) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "product not found", false, null));
  }
  return res.status(StatusCodes.OK).json(response(product, null, true, null));
}

async function addProvider(req, res) {
  const { id: prodId } = req.params;
  const { providerIds } = req.body;
  const product = await Product.findByPk(prodId);
  if (!product) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "product not found", false, null));
  }
  const providers = await Provider.findAll({
    where: { id: providerIds },
  });
  if (!providers.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "providers not found", false, null));
  }
  await product.addProviders(providers);
  const productWithProviders = await Product.findByPk(prodId, {
    include: [
      {
        model: Provider,
        as: "providers",
        attributes: ["name", "slug", "description"],
      },
    ],
  });
  res.status(200).json(productWithProviders);
}

async function removeProvider(req, res) {
  const { id: prodId } = req.params;
  const { providerIds } = req.body;
  const product = await Product.findByPk(prodId);
  if (!product) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "product not found", false, null));
  }
  const providers = await Provider.findAll({
    where: { id: providerIds },
  });
  if (!providers.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response(null, "providers not found", false, null));
  }
  await product.removeProviders(providers);
  const productWithProviders = await Product.findByPk(prodId, {
    include: [
      {
        model: Provider,
        as: "providers",
        attributes: ["name", "slug", "description"],
      },
    ],
  });

  res.status(200).json(productWithProviders);
}

async function deleteProduct(req, res) {
  const { slug: productSlug } = req.params;
  const product = await Product.findOne({ where: { slug: productSlug } });
  if (!product) {
    throw new NotFoundError(`can't find product with slug (${productSlug})`);
  }

  const images = product.image;

  if (images.length >= 1) {
    for (let i = 0; i < images.length; i++) {
      let imageFilePath = images[i].split("/");
      let file = path.resolve(
        __dirname,
        "../public/uploads",
        imageFilePath[imageFilePath.length - 1],
      );
      await fs.unlink(file);
    }
  }
  await product.destroy();
  return res.status(StatusCodes.NO_CONTENT).end();
}

async function updateProduct(req, res) {
  const { slug: productSlug } = req.params;
  let files = req.files?.images;

  let newImages = null;
  if (files) {
    newImages = await saveImages(files.length ? files : [files]);
  }

  const product = await Product.findOne({ where: { slug: productSlug } });
  if (!product) {
    throw new NotFoundError(`can't find product with slug (${productSlug})`);
  }
  const allowedUpdates = [
    "name",
    "price",
    "description",
    "off_percent",
    "available",
    "quantity",
  ];

  const updateData = Object.keys(req.body)
    .filter(
      (key) => allowedUpdates.includes(key) && req.body[key] !== undefined,
    )
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (newImages) {
    updateData.image = [...product.image, ...newImages];
  }
  await product.update(updateData);
  return res
    .status(StatusCodes.ACCEPTED)
    .json(response(product, null, false, null));
}

async function getAllProducts(req, res) {
  let { page, price, name, q, provider, category } = req.query;
  page = page || 1;
  let where = {};
  let order = [];
  if (name) {
    order.push(["name", name.toLocaleLowerCase() === "desc" ? "DESC" : "ASC"]);
  } else if (price) {
    order.push([
      "price",
      price.toLocaleLowerCase() === "desc" ? "DESC" : "ASC",
    ]);
  }
  if (q) {
    where[Sequelize.Op.or] = [
      { name: { [Sequelize.Op.like]: `%${q}%` } },
      { "$category.name$": { [Sequelize.Op.like]: `%${q}%` } },
    ];
  }
  if (category) {
    where["$category.slug$"] = category;
  }
  if (provider) {
    where["$provider.slug$"] = provider;
  }
  console.log(where);
  const products = await Product.findAll({
    limit: 10,
    offset: 10 * (page - 1),
    include: [
      {
        model: Provider,
        as: "providers",
        attributes: ["name", "slug"],
        duplicating: false,
        // required: true
      },
      {
        model: ProductCategory,
        as: "category",
        attributes: ["name", "slug"],
        duplicating: false,
        // required: true
      },
    ],
    where: where,
    order: order,
  });
  let next_page_url = "";
  if (products.length >= 10) {
    next_page_url = `http://127.0.0.1:8000/api/v1/product?price=${price ? price : ""}&name=${name ? name : ""}&q=${q ? q : ""}&provider=${provider ? provider : ""}&category=${category ? category : ""}&page=${++page}`;
  }
  return res
    .status(StatusCodes.OK)
    .json(response(products, null, true, { next: next_page_url }));
}

module.exports = {
  createProduct,
  getOneProduct,
  addProvider,
  removeProvider,
  deleteProduct,
  updateProduct,
  getAllProducts,
};
