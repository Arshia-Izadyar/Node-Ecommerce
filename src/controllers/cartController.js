const { Model } = require("sequelize");

const { Cart, CartLines, Product } = require('../models/index');
const { StatusCodes } = require("http-status-codes");
const {genResponse} = require("../utils/index");

/*
    -----------------
    | auth | cookie |
       1   |   0
       0   |   0 
       1   |   1
       0   |   1 
    -----------------
    

*/

async function getBasket(req) {
    let user = req.user
    let {cart} = req.signedCookies
    let shoppingCart = null


    if (user) {
        shoppingCart = await Cart.findOne({where: {userId: user.id, inPayment: false}, include: [{
            model: CartLines,
            as: 'cartLines',
            attributes: ['id','productId','quantity'],
            include:[{ 
                model:Product,
                as: 'product',
                attributes: ['id','price', 'name']
                }]
            }]
        })
        
        if (shoppingCart && cart) {
            if (shoppingCart.uuid !== cart) {
                let cookieShoppingCart = await Cart.findOne({
                    where: { uuid: cart, inPayment: false },
                    include: [{
                        model: CartLines,
                        as: 'cartLines',
                    }]
                });
                if (cookieShoppingCart && cookieShoppingCart.cartLines) {
                    for (let cookieCartLine of cookieShoppingCart.cartLines) {
                        let existingCartLine = shoppingCart.cartLines.find(cartLine => cartLine.productId === cookieCartLine.productId);
                        if (existingCartLine) {
                            existingCartLine.quantity += cookieCartLine.quantity;
                            await existingCartLine.save();
                        } else {
                            cookieCartLine.cartId = shoppingCart.id;
                            await cookieCartLine.save();
                        }
                    }
                    await cookieShoppingCart.destroy()
                }
            }
        }
        if (!shoppingCart) {
            shoppingCart = await Cart.create({userId: user.id})
        }
    } else if (cart) {
        shoppingCart = await Cart.findOne({where: {uuid: cart, inPayment: false}, include:[{model: CartLines, as: 'cartLines'}]})
    }
    
    if (!shoppingCart) {
        shoppingCart = await Cart.create()
    }
    return shoppingCart
}


/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: get current a user
 *     responses:
 *       200:
 *         description: Success
 */
async function getCart(req, res) {
    let shoppingCart = await getBasket(req)
    let total = 0
    if (shoppingCart.cartLines){

        for (let i = 0; shoppingCart.cartLines.length > i; i++){
            console.log(shoppingCart.cartLines[i].product);
            total += shoppingCart.cartLines[i].product.price * shoppingCart.cartLines[i].quantity 
        }
    }

    res.cookie('cart', shoppingCart.uuid, { signed: true, maxAge: 72 * 60 * 60 * 1000 }); // 3 days in ms
    return res.status(StatusCodes.OK).json(genResponse(shoppingCart, null, true, {total: total}))
}


/**
 * @openapi
 * /api/v1/cart/add:
 *   post:
 *     tags:
 *       - Cart
 *     summary: add a product to cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: bad quantity error
 */
async function addToCart(req, res) {

    const { productId, quantity } = req.body
    let requestedProduct = await Product.findOne({where: {id: productId}})

    if (quantity > requestedProduct.quantity) {
        return res.status(StatusCodes.BAD_REQUEST).json(genResponse(null, `cant request ${quantity} from product ${requestedProduct.name} with quantity ${requestedProduct.quantity}`, false, null))    
    }
    requestedProduct.quantity -= quantity 
    await requestedProduct.save()
    
    let shoppingCart = await getBasket(req)
    res.cookie('cart', shoppingCart.uuid, { signed: true, maxAge: 72 * 60 * 60 * 1000 }); // 3 days in ms

    if(shoppingCart.cartLines){
        for (let i = 0; i < shoppingCart.cartLines.length; i++){
            if (shoppingCart.cartLines[i].productId === productId) {
                shoppingCart.cartLines[i].quantity += quantity
                await shoppingCart.cartLines[i].save()
                return res.status(StatusCodes.OK).json(genResponse(shoppingCart, null, true, null))    
            }
        }
    } 
    await CartLines.create({cartId: shoppingCart.id, productId: productId, quantity: quantity})
    return res.status(StatusCodes.OK).json(genResponse(shoppingCart, null, true, null))    
}

/**
 * @openapi
 * /api/v1/cart/remove:
 *   post:
 *     tags:
 *       - Cart
 *     summary: remove a product to cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: bad quantity error
 */
async function removeFromCart(req, res) {
    const {quantity, productId} = req.body
    let shoppingCart = await getBasket(req)
    let requestedProduct = await Product.findOne({where : {id: productId}, attributes:['id','quantity']})
    
    if (shoppingCart.cartLines) {
        for (let i = 0; shoppingCart.cartLines.length > i; i++) {
            console.log(shoppingCart.cartLines[i].productId);
            if (shoppingCart.cartLines[i].productId === productId){
                if (shoppingCart.cartLines[i].quantity > quantity){

                    shoppingCart.cartLines[i].quantity -= quantity
                    requestedProduct.quantity += quantity
                    await requestedProduct.save()
                    await shoppingCart.cartLines[i].save()
                    return res.status(StatusCodes.ACCEPTED).json(genResponse(shoppingCart, null, true, null))
                } else {
                    return res.status(StatusCodes.BAD_REQUEST).json(genResponse(null, `cant remove ${quantity} from ${shoppingCart.cartLines[i].quantity}`, true, null))
                }
            }
        }
    }
    return res.status(StatusCodes.BAD_REQUEST).json(genResponse(null, 'cart empty or requested product already removed', true, null))
}



module.exports = {addToCart, getCart, removeFromCart, getBasket}