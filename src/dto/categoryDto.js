const Joi = require('joi')

const categoryDTO = Joi.object({
    name: Joi.string().alphanum().min(3).max(100).required(),
    slug: Joi.string().min(10).required(),
})

module.exports = { categoryDTO }
