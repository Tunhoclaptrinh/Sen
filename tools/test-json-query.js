const db = require('../config/database');
const exhibitionService = require('../services/exhibition.service');

async function test() {
  console.log('Testing Exhibition FindAll with status: published');

  const options = {
    filter: {
      status: 'published'
    }
  };

  try {
    const result = await exhibitionService.findAll(options);
    console.log('Result Success:', result.success);
    console.log('Result Count:', result.data.length);
    if (result.data.length > 0) {
      console.log('Sample item status:', result.data[0].status);
    } else {
      console.log('No items found with status: published');

      // Debug: check all exhibitions and their status
      const all = await db.findAll('exhibitions');
      console.log('Total exhibitions in DB:', all.length);
      all.forEach(ex => {
        console.log(`ID: ${ex.id}, Status: "${ex.status}"`);
      });
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();
