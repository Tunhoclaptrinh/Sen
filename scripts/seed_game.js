
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');

// --- NEW DATA ---

const newChapters = [
    {
        "id": 1,
        "name": "Sen Hồng - Cội Nguồn",
        "description": "Những câu chuyện khởi nguồn của văn hóa Bắc Bộ.",
        "layer_index": 1,
        "petal_state": "blooming",
        "required_petals": 0,
        "is_active": true,
        "theme": "Văn Hóa Bắc Bộ",
        "order": 1,
        "color": "#D35400",
        "image": "https://suckhoedoisong.qltns.mediacdn.vn/Images/nguyenkhanh/2017/11/26/tinh_hoa_vinh_bac_bo.jpg",
        "petal_image_closed": "https://example.com/c1_closed.png",
        "petal_image_bloom": "https://example.com/c1_bloom.png",
        "petal_image_full": "https://example.com/c1_full.png"
    },
    {
        "id": 2,
        "name": "Sen Vàng - Giao Thoa",
        "description": "Sự giao thoa văn hóa thế kỷ 18-19.",
        "layer_index": 2,
        "petal_state": "locked",
        "required_petals": 0,
        "is_active": true,
        "theme": "Giao Thoa Văn Hóa",
        "order": 2,
        "color": "#F1C40F",
        "image": "https://images.unsplash.com/photo-1555169062-013468b47731?w=600",
        "petal_image_closed": "https://example.com/c2_closed.png",
        "petal_image_bloom": "https://example.com/c2_bloom.png",
        "petal_image_full": "https://example.com/c2_full.png"
    },
    {
        "id": 3,
        "name": "Sen Trắng - Di Sản",
        "description": "Thời kỳ phồn vinh của các triều đại phong kiến.",
        "layer_index": 3,
        "petal_state": "locked",
        "required_petals": 0,
        "is_active": true,
        "theme": "Di Sản Phong Kiến",
        "order": 3,
        "color": "#ECF0F1",
        "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
        "petal_image_closed": "https://example.com/c3_closed.png",
        "petal_image_bloom": "https://example.com/c3_bloom.png",
        "petal_image_full": "https://example.com/c3_full.png"
    }
];

const newCharacters = [
    {
        "id": 1,
        "name": "Chú Tễu",
        "description": "Nhân vật rối nước vui tính, thông minh",
        "persona": "Bạn là Chú Tễu. Ở trạng thái mất trí nhớ, bạn ngơ ngác và hay hỏi lại. Khi hồi phục, bạn vui vẻ, hay cười 'hi hi' và kể chuyện tiếu lâm.",
        "speaking_style": "Vui vẻ, dân dã, dùng từ địa phương Bắc Bộ",
        "avatar": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Teu",
        "avatar_uncolored": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Teu&backgroundColor=b6b6b6",
        "rarity": "rare",
        "origin": "Múa rối nước",
        "is_collectible": true,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "name": "Thị Kính",
        "description": "Quan Âm Thị Kính - Biểu tượng của sự nhẫn nhịn",
        "persona": "Bạn là Thị Kính. Bạn nhẹ nhàng, từ tốn và luôn khuyên răn người khác làm việc thiện.",
        "speaking_style": "Nhẹ nhàng, từ bi, bác học",
        "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Kinh",
        "rarity": "epic",
        "origin": "Truyền thuyết dân gian",
        "is_collectible": true,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 3,
        "name": "Thánh Gióng",
        "description": "Vị thánh chống giặc ngoại xâm",
        "persona": "Bạn là Thánh Gióng. Bạn ít nói, hành động dứt khoát, giọng nói vang rền như sấm.",
        "speaking_style": "Mạnh mẽ, ngắn gọn, uy lực",
        "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Giong",
        "rarity": "legendary",
        "origin": "Truyền thuyết Thánh Gióng",
        "is_collectible": true,
        "created_at": "2024-01-01T00:00:00Z"
    }
];

const newLevels = [
    // --- CHAPTER 1: Cội Nguồn (Origins) ---
    {
        "id": 1,
        "chapter_id": 1,
        "name": "Huyền thoại Rồng Tiên",
        "description": "Câu chuyện về cội nguồn dân tộc Việt Nam qua truyền thuyết Lạc Long Quân và Âu Cơ.",
        "type": "story",
        "difficulty": "easy",
        "order": 1,
        "required_level": null,
        "is_locked": false,
        "thumbnail": "https://quantri.longbien.shieldixcloud.com/uploadfoldernew/sgdlongbien/image/mntuoihoa/2022_5_image/tai-xuong-7_09052022.jpg",
        "passing_score": 0, // Story only requires completion
        "time_limit": 300,
        "screens": [
            {
                "id": "intro_d1",
                "type": "DIALOGUE",
                "background_image": "https://bcp.cdnchinhphu.vn/Uploaded/nguyenthikimlien/2017_11_06/phh-con-rong-chau-tien-14-1509867509529.jpg",
                "content": [
                    { "speaker": "AI", "text": "Chào bạn! Mình là Chú Tễu. Hôm nay mình sẽ kể cho bạn nghe về nguồn gốc con Rồng cháu Tiên nhé!", "avatar": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Teu" },
                    { "speaker": "USER", "text": "Mình rất sẵn lòng! Hãy bắt đầu thôi." },
                    { "speaker": "AI", "text": "Ngày xưa, Lạc Long Quân thuộc nòi Rồng, kết duyên cùng Âu Cơ thuộc dòng dõi Tiên...", "avatar": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Teu", "emotion": "happy" }
                ]
            },
            {
                "id": "story_video",
                "type": "VIDEO",
                "content": {
                    "title": "Truyền thuyết Con Rồng Cháu Tiên",
                    "description": "Xem đoạn phim ngắn về sự tích bọc trăm trứng.",
                    "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"
                }
            },
            {
                "id": "intro_q1",
                "type": "QUIZ",
                "question": "Lạc Long Quân và Âu Cơ sinh ra bao nhiêu người con?",
                "options": [
                    { "text": "50 người con", "is_correct": false, "explanation": "Chưa chính xác. 50 người con theo cha xuống biển, 50 theo mẹ lên non." },
                    { "text": "100 người con", "is_correct": true, "explanation": "Chính xác! Bọc trăm trứng nở trăm con." },
                    { "text": "10 người con", "is_correct": false, "explanation": "Sai rồi." }
                ],
                "points": 100
            }
        ],
        "rewards": { "coins": 100, "petals": 1 }
    },
    {
        "id": 2,
        "chapter_id": 1,
        "name": "Âm vang Trống Đồng",
        "description": "Khám phá các họa tiết bí ẩn trên mặt trống đồng Đông Sơn.",
        "type": "hidden_object",
        "difficulty": "medium",
        "order": 2,
        "required_level": 1,
        "is_locked": false,
        "passing_score": 60, // Require collecting all items
        "time_limit": 120,
        "thumbnail": "https://luocsutocviet.com/wp-content/uploads/2021/12/vszvdsvds.png?w=768&h=351&crop=1",
        "screens": [
            {
                "id": "ho_intro",
                "type": "DIALOGUE",
                "content": [{ "speaker": "AI", "text": "Hãy tìm 3 biểu tượng quan trọng trên mặt trống đồng nhé!" }]
            },
            {
                "id": "ho_1",
                "type": "HIDDEN_OBJECT",
                "background_image": "https://luocsutocviet.com/wp-content/uploads/2021/12/vszvdsvds.png?w=768&h=351&crop=1",
                "guide_text": "Tìm: Ngôi Sao, Chim Lạc, Nhà Sàn",
                "items": [
                    { "id": "star", "name": "Ngôi sao trung tâm", "x": 50, "y": 50, "points": 20, "fact_popup": "Tượng trưng cho Mặt Trời, nguồn sống của cư dân lúa nước." },
                    { "id": "bird", "name": "Chim Lạc", "x": 20, "y": 30, "points": 20, "fact_popup": "Vật tổ của người Việt cổ, bay ngược chiều kim đồng hồ." },
                    { "id": "house", "name": "Nhà sàn", "x": 75, "y": 60, "points": 20, "fact_popup": "Kiến trúc nhà ở truyền thống tránh thú dữ và ngập lụt." }
                ],
                "required_items": 3
            },
            {
                "id": "quiz_drum",
                "type": "QUIZ",
                "question": "Trống đồng Đông Sơn được làm từ chất liệu gì?",
                "options": [
                    { "text": "Sắt", "is_correct": false },
                    { "text": "Đồng", "is_correct": true },
                    { "text": "Gốm", "is_correct": false }
                ],
                "points": 40
            }
        ],
        "rewards": { "coins": 150, "petals": 2 }
    },
    {
        "id": 3,
        "chapter_id": 1,
        "name": "Lịch Sử Dựng Nước",
        "description": "Sắp xếp các sự kiện lịch sử theo đúng trình tự thời gian.",
        "type": "timeline",
        "difficulty": "medium",
        "order": 3,
        "required_level": 2,
        "is_locked": false,
        "passing_score": 50,
        "thumbnail": "https://images.unsplash.com/photo-1599525281489-0824b223c285?w=600",
        "screens": [
            {
                "id": "tl_1",
                "type": "TIMELINE",
                "description": "Hãy sắp xếp các triều đại sau theo thứ tự xuất hiện:",
                "events": [
                    { "id": "e1", "year": 1010, "title": "Nhà Lý", "description": "Lý Thái Tổ dời đô về Thăng Long" },
                    { "id": "e2", "year": 1225, "title": "Nhà Trần", "description": "Ba lần đánh thắng quân Nguyên Mông" },
                    { "id": "e3", "year": 1428, "title": "Nhà Hậu Lê", "description": "Lê Lợi khởi nghĩa Lam Sơn" }
                ],
                "correct_order": ["e1", "e2", "e3"],
                "points": 100
            }
        ],
        "rewards": { "coins": 120, "petals": 1 }
    },
    {
        "id": 4,
        "chapter_id": 1,
        "name": "Văn Hóa Làng Xã",
        "description": "Kiểm tra kiến thức về văn hóa làng xã Bắc Bộ.",
        "type": "quiz",
        "difficulty": "hard",
        "order": 4,
        "required_level": 3,
        "is_locked": false,
        "passing_score": 40, // 2/3 correct required (20*2 = 40)
        "thumbnail": "https://dulichbacgiang.gov.vn/uploads/dulichbacgiang/Bai-viet/292/1.jpg",
        "screens": [
            {
                "id": "vid_1",
                "type": "VIDEO",
                "content": {
                    "title": "Cây Đa Bến Nước",
                    "description": "Biểu tượng của làng quê Việt Nam.",
                    "video_url": "https://www.youtube.com/embed/CD8sKixEDsI" // Placeholder
                }
            },
            {
                "id": "q_ha",
                "type": "QUIZ",
                "question": "Di sản Phố cổ Hội An nằm ở tỉnh nào?",
                "options": [
                    { "text": "Thừa Thiên Huế", "is_correct": false },
                    { "text": "Quảng Nam", "is_correct": true },
                    { "text": "Đà Nẵng", "is_correct": false }
                ],
                "points": 20
            },
            {
                "id": "q_quanho",
                "type": "QUIZ",
                "question": "Dân ca Quan họ là di sản văn hóa của vùng nào?",
                "options": [
                    { "text": "Kinh Bắc (Bắc Ninh, Bắc Giang)", "is_correct": true },
                    { "text": "Xứ Đoài (Sơn Tây)", "is_correct": false },
                    { "text": "Phố Hiến (Hưng Yên)", "is_correct": false }
                ],
                "points": 20
            }
        ],
        "rewards": { "coins": 200, "petals": 3 }
    },

    // --- CHAPTER 2: Giao Thoa (Intersection) ---
    {
        "id": 7,
        "chapter_id": 2,
        "name": "Phố Cổ Hội An",
        "description": "Nơi hội tụ văn hóa Nhật - Hoa - Việt.",
        "type": "hidden_object",
        "difficulty": "medium",
        "order": 1,
        "required_level": null,
        "is_locked": false,
        "thumbnail": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400",
        "screens": [
            {
                "id": "s7_1",
                "type": "HIDDEN_OBJECT",
                "items": [{ "id": "lantern", "name": "Đèn lồng", "x": 10, "y": 20 }],
                "required_items": 1
            }
        ],
        "rewards": { "coins": 100, "petals": 1 }
    },
    {
        "id": 8,
        "chapter_id": 2,
        "name": "Nhã nhạc Cung đình Huế",
        "description": "Âm nhạc bác học của triều Nguyễn.",
        "type": "story",
        "difficulty": "medium",
        "order": 2,
        "required_level": 7,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Nha_nhac.jpg/600px-Nha_nhac.jpg",
        "screens": [
            { "id": "s8_1", "type": "DIALOGUE", "content": [{ "speaker": "AI", "text": "Nhã nhạc là di sản phi vật thể đó!" }] }
        ],
        "rewards": { "coins": 100, "petals": 1 }
    },
    {
        "id": 9,
        "chapter_id": 2,
        "name": "Nghệ thuật Chăm Pa",
        "description": "Vẻ đẹp huyền bí của tháp Chàm.",
        "type": "image_viewer",
        "difficulty": "medium",
        "order": 3,
        "required_level": 8,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/My_Son_Sanctuary.jpg/600px-My_Son_Sanctuary.jpg",
        "screens": [
            { "id": "s9_1", "type": "IMAGE_VIEWER", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/My_Son_Sanctuary.jpg/800px-My_Son_Sanctuary.jpg", "caption": "Mỹ Sơn" }
        ],
        "rewards": { "coins": 100, "petals": 2 }
    },
    {
        "id": 10,
        "chapter_id": 2,
        "name": "Áo Dài Năm Thân",
        "description": "Tiền thân của tà áo dài hiện đại.",
        "type": "quiz",
        "difficulty": "easy",
        "order": 4,
        "required_level": 9,
        "is_locked": false,
        "thumbnail": "https://images.unsplash.com/photo-1617379893213-912dc34dfb7c?w=400",
        "screens": [
            {
                "id": "s10_1",
                "type": "QUIZ",
                "question": "Áo ngũ thân tượng trưng cho điều gì?",
                "options": [
                    { "text": "Tứ thân phụ mẫu và bản thân", "is_correct": true },
                    { "text": "Năm châu bốn biển", "is_correct": false }
                ],
                "points": 100
            }
        ],
        "rewards": { "coins": 150, "petals": 2 }
    },
    {
        "id": 11,
        "chapter_id": 2,
        "name": "Kiến trúc thuộc địa",
        "description": "Dấu ấn Pháp giữa lòng Hà Nội.",
        "type": "image_viewer",
        "difficulty": "medium",
        "order": 5,
        "required_level": 10,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hanoi_Opera_House.jpg/600px-Hanoi_Opera_House.jpg",
        "screens": [
            { "id": "s11_1", "type": "IMAGE_VIEWER", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hanoi_Opera_House.jpg/800px-Hanoi_Opera_House.jpg", "caption": "Nhà Hát Lớn" }
        ],
        "rewards": { "coins": 150, "petals": 2 }
    },
    {
        "id": 12,
        "chapter_id": 2,
        "name": "Sự ra đời chữ Quốc Ngữ",
        "description": "Bước ngoặt văn hóa lớn của Việt Nam.",
        "type": "timeline",
        "difficulty": "hard",
        "order": 6,
        "required_level": 11,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Alexandre_de_Rhodes_dictionary.jpg/400px-Alexandre_de_Rhodes_dictionary.jpg",
        "screens": [
            {
                "id": "s12_1",
                "type": "TIMELINE",
                "events": [
                    { "id": "e1", "year": 1651, "title": "Từ điển Việt-Bồ-La" },
                    { "id": "e2", "year": 1865, "title": "Gia Định Báo" },
                    { "id": "e3", "year": 1945, "title": "Chữ Quốc Ngữ phổ cập" }
                ],
                "correct_order": ["e1", "e2", "e3"]
            }
        ],
        "rewards": { "coins": 300, "petals": 10, "badge": "chapter_2_master" }
    },

    // --- CHAPTER 3: Di Sản (Heritage) ---
    {
        "id": 13,
        "chapter_id": 3,
        "name": "Kinh thành Huế",
        "description": "Vẻ đẹp uy nghi của kinh đô cuối cùng.",
        "type": "image_viewer",
        "difficulty": "medium",
        "order": 1,
        "required_level": null,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Hue_Citadel.jpg/600px-Hue_Citadel.jpg",
        "screens": [
            { "id": "s13_1", "type": "IMAGE_VIEWER", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Hue_Citadel.jpg/800px-Hue_Citadel.jpg", "caption": "Ngọ Môn" }
        ],
        "rewards": { "coins": 200, "petals": 2 }
    },
    {
        "id": 14,
        "chapter_id": 3,
        "name": "Văn Miếu - Quốc Tử Giám",
        "description": "Trường đại học đầu tiên của Việt Nam.",
        "type": "quiz",
        "difficulty": "medium",
        "order": 2,
        "required_level": 13,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Khue_Van_Cac.jpg/400px-Khue_Van_Cac.jpg",
        "screens": [
            {
                "id": "s14_1",
                "type": "QUIZ",
                "question": "Bia tiến sĩ tại Văn Miếu dùng để làm gì?",
                "options": [
                    { "text": "Vinh danh người đỗ đạt", "is_correct": true },
                    { "text": "Ghi chép lịch sử", "is_correct": false }
                ],
                "points": 100
            }
        ],
        "rewards": { "coins": 200, "petals": 2 }
    },
    {
        "id": 15,
        "chapter_id": 3,
        "name": "Vịnh Hạ Long",
        "description": "Kỳ quan thiên nhiên thế giới.",
        "type": "hidden_object",
        "difficulty": "easy",
        "order": 3,
        "required_level": 14,
        "is_locked": false,
        "thumbnail": "https://images.unsplash.com/photo-1554625299-47050307ee06?w=400",
        "screens": [
            { "id": "s15_1", "type": "HIDDEN_OBJECT", "items": [{ "id": "sail", "name": "Cánh Buồm", "x": 60, "y": 40 }], "required_items": 1 }
        ],
        "rewards": { "coins": 150, "petals": 2 }
    },
    {
        "id": 16,
        "chapter_id": 3,
        "name": "Thánh địa Mỹ Sơn",
        "description": "Di sản văn hóa Chăm Pa độc đáo.",
        "type": "story",
        "difficulty": "hard",
        "order": 4,
        "required_level": 15,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/My_Son_Sanctuary.jpg/600px-My_Son_Sanctuary.jpg",
        "screens": [
            { "id": "s16_1", "type": "DIALOGUE", "content": [{ "speaker": "AI", "text": "Đây là nơi thờ thần Shiva." }] }
        ],
        "rewards": { "coins": 200, "petals": 3 }
    },
    {
        "id": 17,
        "chapter_id": 3,
        "name": "Mộc bản triều Nguyễn",
        "description": "Di sản tư liệu thế giới đầu tiên của Việt Nam.",
        "type": "quiz",
        "difficulty": "hard",
        "order": 5,
        "required_level": 16,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Moc_ban.jpg/400px-Moc_ban.jpg",
        "screens": [
            {
                "id": "s17_1",
                "type": "QUIZ",
                "question": "Mộc bản là gì?",
                "options": [
                    { "text": "Bản khắc gỗ in sách", "is_correct": true },
                    { "text": "Tranh khắc gỗ", "is_correct": false }
                ],
                "points": 100
            }
        ],
        "rewards": { "coins": 250, "petals": 3 }
    },
    {
        "id": 18,
        "chapter_id": 3,
        "name": "Truyện Kiều - Nguyễn Du",
        "description": "Kiệt tác văn học vĩ đại.",
        "type": "mixed",
        "difficulty": "hard",
        "order": 6,
        "required_level": 17,
        "is_locked": false,
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Truyen_Kieu_cover.jpg/400px-Truyen_Kieu_cover.jpg",
        "screens": [
            {
                "id": "s18_1",
                "type": "DIALOGUE",
                "content": [{ "speaker": "AI", "text": "Trăm năm trong cõi người ta..." }]
            }
        ],
        "rewards": { "coins": 500, "petals": 20, "badge": "master_of_heritage" }
    }
];

// --- MAIN LOGIC ---

try {
    console.log('Reading database...');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    console.log('Updating Game Data...');
    data.game_chapters = newChapters;
    data.game_characters = newCharacters;
    data.game_levels = newLevels;

    console.log('Writing database...');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');

    console.log('✅ Success! Game data populated with 18 levels.');
} catch (error) {
    console.error('❌ Error seeding data:', error);
}
