const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const heritageService = require('./services/heritage_site.service');

async function testCreate() {
  const dummyPayload = {
    name: "Test Cloudinary Auto",
    shortDescription: "This is a test description for cloudinary image rendering.",
    description: "Long description blah blah blah blah blah blah",
    address: "123 Test St",
    image: "https://res.cloudinary.com/dmqb5l6bw/image/upload/v12345/sen_web/general/dummy.jpg",
    status: "published"
  };

  try {
    const result = await heritageService.create(dummyPayload, { user: { id: 1, role: 'admin' } });
    console.log("Create Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error creating:", err);
  }
}

testCreate();
