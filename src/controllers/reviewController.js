const { StatusCodes } = require("http-status-codes")
const { Review } = require('../models/index')
const { Model } = require("sequelize")
const saveImages = require("../utils/saveImages")
const genResponse = require("../utils/genResponse")
const path = require('path');
const fs = require('fs').promises;

async function createReview(req, res) {
    let {id: productId} = req.params
    let {id: userId} = req.user
    let files = req.files
    let { rate, comment } = req.body
    let reviewImage = []
    try {

        if (files.image) {
            reviewImage = await saveImages(files.image.length ? files.image : [files.image])
        }
        console.log(reviewImage);

        const review = await Review.create({rate: rate, comment: comment, userId: userId, productId: productId,image: reviewImage })
        return res.status(StatusCodes.CREATED).json(genResponse(review, null, true, null))
    } catch (err) {
        if (reviewImage.length >= 1) {
            for (let i = 0; i < reviewImage.length; i++) {
                let splittedFilename = reviewImage[i].split('/')
                console.log(splittedFilename);
                await fs.unlink(path.resolve(__dirname, '../public/uploads/', splittedFilename[splittedFilename.length - 1]))
            }
        }
        throw err
    }
}
async function deleteReview(req, res) {
    let {id: productId} = req.params
    let {id: userId, role: userRole} = req.user

    const review = await Review.findOne({where: {userId: userId, productId: productId}})
    if (userRole === 'admin' || review.userId === userId) {
        await review.destroy()
        
        if (review.image.length >= 1) {
            for (let i = 0; i < review.image.length; i++) {
                let splittedFilename = review.image[i].split('/')
                console.log(splittedFilename);
                await fs.unlink(path.resolve(__dirname, '../public/uploads/', splittedFilename[splittedFilename.length - 1]))
            }
        }
        return res.status(StatusCodes.NO_CONTENT).end()
    }
    return res.status(StatusCodes.UNAUTHORIZED).json(genResponse(null, 'cant delete the comment that you don\'t own', false, null))
}
module.exports = {createReview, deleteReview}