const { StatusCodes }= require('http-status-codes')
const { Shipping } = require('../models/index')
const { Model } = require('sequelize')

const { getBasket } = require('./cartController')
const { generateOtpCode, genResponse } = require('../utils/index')


async function createShipping(req, res) {
    const user = req.user
    // TODO: fix address
    let basket = await getBasket(req)
    const {address, deliverTime} = req.body
    let deliveryCode = generateOtpCode()

    const shipping = await Shipping.create({
        userId: user.id,
        address: address,
        deliverTime: deliverTime,
        deliveryCode: deliveryCode,
        cartId: basket.id, 
        shippingFee: 100
    })
    return res.status(StatusCodes.CREATED).json(genResponse(shipping, null, true, null))
}

async function updateShippingStatus(req, res) {
    const { id: shippingId } = req.params
    const { status } = req.body
    let shipping = await Shipping.findOne({where: {id: shippingId}})
    shipping.status = status
    await shipping.save()
    return res.status(StatusCodes.ACCEPTED).json(genResponse(shipping, null, true, null))
}

async function deliverShipping(req, res) {
    const { id: shippingId } = req.params
    const { deriverCode } = req.body
    let shipping = await Shipping.findOne({where: {id: shippingId}})
    if (shipping.deliveryCode !== deriverCode) {
        return res.status(StatusCodes.BAD_REQUEST).json(genResponse(null, 'the delivery code is wrong', false, null))
    }
    shipping.status = 'userReceived'
    await shipping.save()
    return res.status(StatusCodes.ACCEPTED).json(genResponse(shipping, null, true, null))
}


async function updateShipping(req, res) {
    const { id: shippingId } = req.params
    const { address, deliverTime } = req.body
    let enteredDate = new Date(deliverTime) 
    if (enteredDate < new Date()) {
        return res.status(StatusCodes.BAD_REQUEST).json(genResponse(null, 'invalid date entered !!! ', false, null))
    }
    let shipping = await Shipping.findOne({where: {id: shippingId}})
    shipping.address = address || shipping.address
    shipping.deliverTime = deliverTime || shipping.deliverTime
    await shipping.save()
    return res.status(StatusCodes.ACCEPTED).json(genResponse(shipping, null, true, null))
}
async function getAllShippings(req, res) {
    const user = req.user
    let page = req.query.page || 1
    const shippings = await Shipping.findAll({
        where: {userId: user.id},
        limit: 10,
        offset: 10 * (page - 1)
    })
    let nex_page_url = ''
    if (shippings.length >= 10) {
        nex_page_url = `http://127.0.0.1:8000/api/v1/shipping?page=${++page}`
    }
    return res.status(StatusCodes.OK).json(genResponse(shippings, null, true, {next: nex_page_url}))
}


async function getShipping(req, res) {
    const { id: shippingId } = req.params
    const user = req.user
    let shipping = await Shipping.findOne({where: {id: shippingId}})
    if (shipping.userId !== user.id) {
        return res.status(StatusCodes.NOT_FOUND).json(genResponse(null, 'shipping not found', true, null))

    }
    return res.status(StatusCodes.OK).json(genResponse(shipping, null, true, null))
}



module.exports = {createShipping, updateShippingStatus, deliverShipping, updateShipping, getAllShippings, getShipping}