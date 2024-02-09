const { StatusCodes } = require('http-status-codes')
const { ProductCategory, Sequelize } = require('../models/index')
const { Model, ValidationError } = require('sequelize')

const response = require('../utils/genResponse')
const NotFoundError = require('../errors/notFoundError')

async function createCategory(req, res){
    const { name, slug } = req.body
    const category = await ProductCategory.create({name: name, slug: slug})
    return res.status(StatusCodes.CREATED).json(response(category, null, true, null))
  
}

async function getCategory(req, res){
    const { slug: categorySlug } = req.params
        const category = await ProductCategory.findOne({where:{slug: categorySlug}})
   
    if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json(response(null, 'category notfound', true, null))
    }
    return res.status(StatusCodes.OK).json(response(category, null, true, null))
}

async function deleteCategory(req, res) {
    const {slug: categorySlug} = req.body
    const category = await ProductCategory.findOne({where:{slug: categorySlug}})
    if (!category) {
        throw new NotFoundError('category not found')
    }
    await category.destroy()
    return res.status(StatusCodes.NO_CONTENT).end()
}

async function updateCategory(req, res) {
    const {name} = req.body
    const {slug: categorySlug} = req.body
    const category = await ProductCategory.findOne({where:{slug: categorySlug}})
    if (!category) {
        throw new NotFoundError('category not found')
    }
    category.name = name || category.name
    await category.save()
    return res.status(StatusCodes.ACCEPTED).json(response(category, null, true, null))

}


async function getAllCategories(req, res) {
    let {page, sort, q} = req.query
    page = page || 1
    let order = []
    console.log(sort);
    if (sort) {
        
        order.push(['name' ,sort.toLowerCase() === 'desc'? 'DESC' : 'ASC'])
        
    }
    
    let where = {}
    if (q){
        where[Sequelize.Op.or] = [
            {'name' : {[Sequelize.Op.like]: `%${q}%`}}
        ]
    }


    const categories = await ProductCategory.findAll({
        where: where,
        order: order,
        limit: 10,
        offset: 10 * (page - 1)
    })
    let next_page_url = ''
    if (categories.length >= 10) {
        next_page_url = `http://127.0.0.1:8000/api/v1/category?q=${q ? q : ""}&sort=${sort ? sort : ''}&page=${++page}`
    }
    return res.status(StatusCodes.OK).json(response(categories, null, true, {next: next_page_url}))
}




module.exports = {getCategory, createCategory, deleteCategory, updateCategory, getAllCategories}