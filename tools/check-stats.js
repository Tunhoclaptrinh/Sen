const exhibitionService = require('../services/exhibition.service');

async function checkStats() {
  try {
    const result = await exhibitionService.getStats();
    console.log('Stats Result:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Stats Error:', error);
  }
}

checkStats();
