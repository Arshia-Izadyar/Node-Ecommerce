const { StatusCodes } = require('http-status-codes')
const { Provider, Sequelize } = require('../models/index')

const { genResponse: response } = require('../utils/index')
const NotFoundError = require('../errors/notFoundError')

async function createProvider(req, res) {
    const { name, slug, description } = req.body
    const provider = await Provider.create({
        name: name,
        slug: slug,
        description: description,
    })
    return res
        .status(StatusCodes.CREATED)
        .json(response(provider, null, true, null))
}

async function getProvider(req, res) {
    let { slug: providerSlug } = req.params
    const provider = await Provider.findOne({
        where: { slug: providerSlug },
        include: ['products'],
    })
    if (!provider) {
        throw new NotFoundError(`provider with id (${providerSlug}) not found.`)
        // return res.send(StatusCodes.NOT_FOUND).json(response(null, 'provider not found', true, null))
    }
    return res.status(StatusCodes.OK).json(response(provider, null, true, null))
}

async function deleteProvider(req, res) {
    let { slug: providerSlug } = req.params
    const provider = await Provider.findOne({ where: { slug: providerSlug } })
    if (!provider) {
        throw new NotFoundError(`provider with id (${providerSlug}) not found.`)
    }
    await provider.destroy()
    return res.status(StatusCodes.NO_CONTENT).end()
}

async function updateProvider(req, res) {
    let { slug: providerSlug } = req.params
    let { description, name } = req.body
    const provider = await Provider.findOne({ where: { slug: providerSlug } })
    if (!provider) {
        throw new NotFoundError(`provider with id (${providerSlug}) not found.`)
    }
    provider.name = name || provider.name
    provider.description = description || provider.description

    await provider.save()
    return res
        .status(StatusCodes.ACCEPTED)
        .json(response(provider, null, true, null))
}

async function getAllProviders(req, res) {
    let { page, sort, q } = req.query
    page = page || 1

    let where = {}
    let order = []

    if (q) {
        where[Sequelize.Op.or] = [{ name: { [Sequelize.Op.like]: `%${q}%` } }]
    }

    if (sort) {
        order.push([
            'name',
            sort.toLocaleLowerCase() === 'desc' ? 'DESC' : 'ASC',
        ])
    }

    const providers = await Provider.findAll({
        where: where,
        order: order,
        limit: 10,
        offset: 10 * (page - 1),
    })
    let next_page_url = ''
    if (providers.length >= 10) {
        next_page_url = `http://127.0.0.1:8000/api/v1/provider?q=${q ? q : ''}&sort=${sort ? sort : ''}&page=${++page}`
    }
    return res
        .status(StatusCodes.OK)
        .json(response(providers, null, true, { next: next_page_url }))
}

module.exports = {
    getAllProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    getProvider,
}
