module.exports = {
  // Auth & User
  users: require('./user.schema'),

  // Heritage & Culture
  heritage_sites: require('./heritage_site.schema'),
  artifacts: require('./artifact.schema'),
  cultural_categories: require('./cultural_category.schema'),
  exhibitions: require('./exhibition.schema'),
  timelines: require('./timeline.schema'),

  // User Content
  collections: require('./collection.schema'),
  favorites: require('./favorite.schema'),
  reviews: require('./review.schema'),
  notifications: require('./notification.schema'),

  // Game System
  game_chapters: require('./game_chapter.schema'),
  game_levels: require('./game_level.schema'),
  game_characters: require('./game_character.schema'),
  game_progress: require('./game_progress.schema'),
  scan_objects: require('./scan_object.schema'),
  shop_items: require('./shop_item.schema'),
  history_articles: require('./history_article.schema')
};