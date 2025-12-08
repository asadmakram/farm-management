const Joi = require('joi');

const milkSessionSchema = Joi.object({
  liters: Joi.number().positive().required(),
  fat: Joi.number().min(0),
  snf: Joi.number().min(0)
});

const milkEntrySchema = Joi.object({
  farmId: Joi.string().required(),
  animalId: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  sessions: Joi.object({
    morning: milkSessionSchema,
    evening: milkSessionSchema,
    custom: Joi.object().pattern(Joi.string(), milkSessionSchema)
  }).required().min(1),
  notes: Joi.string().allow('').optional()
});

const validateMilkEntry = (data) => {
  return milkEntrySchema.validate(data);
};

module.exports = { validateMilkEntry };
