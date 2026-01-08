const mongoose = require('mongoose');

/**
 * Validation Utilities
 * Helper functions for validating and sanitizing inputs
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId string to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Convert string to MongoDB ObjectId
 * @param {string} id - ObjectId string
 * @returns {mongoose.Types.ObjectId|null} - ObjectId or null if invalid
 */
const toObjectId = (id) => {
  if (!isValidObjectId(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

/**
 * Validate array of ObjectIds
 * @param {Array} ids - Array of ObjectId strings
 * @returns {Array} - Array of valid ObjectIds
 */
const validateObjectIdArray = (ids) => {
  if (!Array.isArray(ids)) {
    return [];
  }
  
  return ids
    .filter(id => isValidObjectId(id))
    .map(id => toObjectId(id));
};

/**
 * Validate enum value
 * @param {string} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} - True if value is in allowed values
 */
const isValidEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

module.exports = {
  isValidObjectId,
  toObjectId,
  validateObjectIdArray,
  isValidEnum
};

