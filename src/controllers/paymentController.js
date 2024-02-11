const { StatusCodes } = require('http-status-codes')
const { Model } = require('sequelize')
const { Payment, Cart } = require('../models/index')
const { getBasket } = require('./cartController')
const {genResponse} = require('../utils/index')



async function createPayment(req, res) {
    const user = req.user
    const { shippingType } = req.body

    let shoppingCart = await getBasket(req)
    let totalPrice = 0
    shippingType === 'express' ? totalPrice += 100 : totalPrice += 50
    for (let i = 0; i < shoppingCart.cartLines.length; i++) {
        totalPrice += shoppingCart.cartLines[i].product.price * shoppingCart.cartLines[i].quantity 
    }
    let payment = await Payment.create({cartId:shoppingCart.id, amount: totalPrice, userId: user.id}) 
    return res.status(StatusCodes.CREATED).json(genResponse(payment, null, true, {token: payment.uuid}))

}
async function verifyPayment(req, res) {
    const { token } = req.params
    // api call
    // call -> response() 
    let payment = await Payment.findOne({where: {uuid: token}})
    payment.status = 'paid'
    let cart = await Cart.findOne({where: {id: payment.cartId}})
    cart.inPayment = true
    
    cart.save()
    payment.save()

    return res.status(StatusCodes.OK).json(genResponse(payment, null, true, null))
}


module.exports = {createPayment, verifyPayment}