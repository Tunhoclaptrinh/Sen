const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');

try {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Helper to get next ID
  const getNextId = (arr) => {
    return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1;
  }

  // --- ENRICH HERITAGE SITES ---
  const newHeritageSites = [
    {
      name: "Chùa Một Cột",
      type: "historic_building",
      region: "Bắc",
      address: "Ba Đình, Hà Nội",
      image: "https://images.unsplash.com/photo-1599525281489-0824b223c285?w=800",
      description: "<p>Chùa Một Cột có kiến trúc độc đáo, tựa như một đóa sen nở trên mặt nước. Đây là biểu tượng văn hóa tâm linh của thủ đô Hà Nội.</p>",
      short_description: "Biểu tượng văn hóa tâm linh độc đáo của thủ đô Hà Nội.",
      status: "pending",
      created_by: 2, // Researcher Tuan
      unesco_listed: false,
      rating: 4.8,
      gallery: [],
      related_artifact_ids: [],
      related_history_ids: []
    },
    {
      name: "Hang Sơn Đoòng",
      type: "natural_heritage",
      region: "Trung",
      address: "Bố Trạch, Quảng Bình",
      image: "https://images.unsplash.com/photo-1565118531796-766e508eb674?w=800",
      description: "<p>Hang động lớn nhất thế giới với hệ sinh thái riêng biệt. Nơi đây chứa đựng vẻ đẹp kỳ vĩ của thiên nhiên Việt Nam.</p>",
      short_description: "Hang động tự nhiên lớn nhất thế giới tại Quảng Bình.",
      status: "published",
      created_by: 1, // Admin
      unesco_listed: true,
      rating: 5.0,
      gallery: [],
      related_artifact_ids: [],
      related_history_ids: []
    },
    {
      name: "Dinh Độc Lập",
      type: "historic_building",
      region: "Nam",
      address: "Quận 1, TP. Hồ Chí Minh",
      image: "https://images.unsplash.com/photo-1565060169194-13a89a07973c?w=800",
      description: "<p>Di tích lịch sử minh chứng cho sự thống nhất đất nước. Công trình mang đậm dấu ấn kiến trúc thập niên 60.</p>",
      short_description: "Biểu tượng của chiến thắng và thống nhất đất nước.",
      status: "rejected", // Test rejected status
      rejection_reason: "Cần bổ sung thêm hình ảnh chi tiết các phòng họp.",
      created_by: 2, // Researcher Tuan
      unesco_listed: false,
      rating: 4.6,
      gallery: [],
      related_artifact_ids: [],
      related_history_ids: []
    },
    {
      name: "Vịnh Hạ Long",
      type: "natural_heritage",
      region: "Bắc",
      address: "Quảng Ninh",
      image: "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800",
      description: "<p>Kỳ quan thiên nhiên thế giới với hàng nghìn đảo đá vôi lớn nhỏ. Cảnh sắc như tranh thủy mặc.</p>",
      short_description: "Kỳ quan thiên nhiên thế giới được UNESCO công nhận.",
      status: "draft", // Test draft
      created_by: 2, // Researcher Tuan
      unesco_listed: true,
      rating: 4.9,
      gallery: [],
      related_artifact_ids: [],
      related_history_ids: []
    }
  ];

  newHeritageSites.forEach(site => {
    site.id = getNextId(data.heritage_sites);
    site.createdAt = new Date().toISOString();
    site.updatedAt = new Date().toISOString();
    if (!site.status) site.status = 'published'; // Default fallback
    data.heritage_sites.push(site);
  });

  // --- ENRICH ARTIFACTS ---
  const newArtifacts = [
    {
      name: "Ấn vàng Hoàng đế chi bảo",
      description: "<p>Chiếc ấn vàng quan trọng nhất của triều Nguyễn, biểu tượng của quyền lực hoàng gia.</p>",
      artifact_type: "sculpture",
      condition: "good",
      image: "https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?w=800", // Gold texture placeholder
      is_on_display: true,
      status: "pending",
      created_by: 2,
      heritage_site_id: 2,
      related_heritage_ids: [2]
    },
    {
      name: "Súng thần công",
      description: "<p>Vũ khí phòng thủ cổ xưa, được đúc bằng đồng với kỹ thuật cao.</p>",
      artifact_type: "weapon",
      condition: "fair",
      image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=800", // Cannon placeholder
      is_on_display: true,
      status: "published",
      created_by: 1,
      heritage_site_id: 2
    },
    {
      name: "Bình gốm Chu Đậu",
      description: "<p>Tinh hoa gốm sứ Việt Nam thời Lê sơ, nổi tiếng thế giới.</p>",
      artifact_type: "pottery",
      condition: "excellent",
      image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800", // Pottery placeholder
      is_on_display: false,
      status: "draft",
      created_by: 2,
      heritage_site_id: null
    }
  ];

  newArtifacts.forEach(item => {
    item.id = getNextId(data.artifacts);
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.artifacts.push(item);
  });

  // --- ENRICH LEARNING MODULES ---
  if (!data.learning_modules) data.learning_modules = [];

  const newLearn = [
    {
      title: "Lịch sử Triều Lý",
      description: "Tìm hiểu về sự hưng thịnh của Phật giáo và nền giáo dục Đại Việt.",
      status: "published",
      created_by: 1,
      thumbnail: "https://images.unsplash.com/photo-1583253683884-6e6962c6ad2e?w=800"
    },
    {
      title: "Nghệ thuật Múa Rối Nước",
      description: "Khám phá môn nghệ thuật độc đáo của nền văn minh lúa nước.",
      status: "pending",
      created_by: 2,
      thumbnail: "https://images.unsplash.com/photo-1516104278479-7dd2bb5dc643?w=800"
    },
    {
      title: "Kiến trúc Cổ Hội An",
      description: "Phân tích nét giao thoa văn hóa trong kiến trúc Hội An.",
      status: "draft",
      created_by: 2,
      thumbnail: "https://images.unsplash.com/photo-1569302685084-387034c4f347?w=800"
    }
  ];

  newLearn.forEach(item => {
    item.id = getNextId(data.learning_modules);
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.learning_modules.push(item);
  });

  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Database enriched successfully!');

} catch (err) {
  console.error('Error enriching database:', err);
}
