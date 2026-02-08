/**
 * Shop Item Type Constants
 * Định nghĩa các loại vật phẩm trong cửa hàng
 */
const SHOP_ITEM_TYPES = {
  HINT: 'hint',                      // Gợi ý giải câu đố
  BOOST: 'boost',                    // Tăng tốc/tăng điểm
  POWERUP: 'powerup',               // Vật phẩm hỗ trợ chơi game
  CHARACTER_SKIN: 'character_skin',  // Skin nhân vật
  AVATAR: 'avatar',                  // Trang phục/phụ kiện
  TITLE: 'title',                    // Danh hiệu
  THEME: 'theme',                    // Giao diện/theme
  DECORATION: 'decoration'           // Trang trí bảo tàng
};

/**
 * Currency Constants
 * Định nghĩa các loại tiền tệ
 */
const SHOP_CURRENCIES = {
  COINS: 'coins',      // Xu (free currency)
  PETALS: 'petals'     // Cánh sen (premium currency)
};

/**
 * Get all valid shop item types as array
 */
const getValidShopTypes = () => Object.values(SHOP_ITEM_TYPES);

/**
 * Get all valid currencies as array
 */
const getValidCurrencies = () => Object.values(SHOP_CURRENCIES);

/**
 * Check if a type is valid
 */
const isValidShopType = (type) => getValidShopTypes().includes(type);

/**
 * Check if a currency is valid
 */
const isValidCurrency = (currency) => getValidCurrencies().includes(currency);

module.exports = {
  SHOP_ITEM_TYPES,
  SHOP_CURRENCIES,
  getValidShopTypes,
  getValidCurrencies,
  isValidShopType,
  isValidCurrency
};
