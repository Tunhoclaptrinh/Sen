/**
 * Schemas Index
 * Central export for all schemas
 */

module.exports = {
  user: require('./user.schema'),
  category: require('./category.schema'),
  promotion: require('./promotion.schema'),
  favorite: require('./favorite.schema'),
  notification: require('./notification.schema'),
  payment: require('./payment.schema')
};