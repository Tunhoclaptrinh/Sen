const seedData = {
  users: [
    {
      id: 1,
      name: "Admin CultureVault",
      email: "admin@culturevault.com",
      password: hashedPassword,
      phone: "0912345678",
      role: "admin",
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      name: "Phạm Văn Tuấn",
      email: "tuanpham@culturevault.com",
      password: hashedPassword,
      phone: "0987654321",
      role: "researcher",
      isActive: true,
      createdAt: "2024-02-20T14:20:00Z"
    },
    {
      id: 3,
      name: "Đỗ Thị Hương",
      email: "huong.do@culturevault.com",
      password: hashedPassword,
      phone: "0901234567",
      role: "customer",
      isActive: true,
      createdAt: "2024-03-10T09:15:00Z"
    }
  ],

  cultural_categories: [
    {
      id: 1,
      name: "Kiến trúc cổ",
      icon: "🏯",
      description: "Công trình kiến trúc lịch sử"
    },
    {
      id: 2,
      name: "Mỹ thuật",
      icon: "🎨",
      description: "Tranh vẽ, điêu khắc, tác phẩm mỹ thuật"
    },
    {
      id: 3,
      name: "Tư liệu lịch sử",
      icon: "📚",
      description: "Tài liệu, sách vở, bản thảo"
    },
    {
      id: 4,
      name: "Gốm sứ",
      icon: "🏺",
      description: "Gốm cổ, sứ, đồ gốm mỹ nghệ"
    },
    {
      id: 5,
      name: "Vàng bạc đá quý",
      icon: "💎",
      description: "Trang sức, đồ trang trí bằng vàng bạc"
    },
    {
      id: 6,
      name: "Dệt may truyền thống",
      icon: "🧵",
      description: "Lụa, vải thêu, trang phục truyền thống"
    },
    {
      id: 7,
      name: "Di sản phi vật thể",
      icon: "🎭",
      description: "Âm nhạc, múa, phong tục truyền thống"
    }
  ],

  heritage_sites: [
    {
      id: 1,
      name: "Thành Phố Hội An",
      type: "historic_building",
      cultural_period: "Triều Nguyễn - Pháp thuộc",
      region: "Quảng Nam",
      latitude: 15.8801,
      longitude: 108.3288,
      address: "Thành phố Hội An, Quảng Nam",
      year_established: 1624,
      year_restored: 1999,
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600",
      rating: 4.9,
      total_reviews: 523,
      visit_hours: "8:00 - 17:00",
      entrance_fee: 120000,
      is_active: true,
      unesco_listed: true,
      significance: "international"
    },
    {
      id: 2,
      name: "Tháp Cầu Golden Gate Hànộ",
      type: "monument",
      cultural_period: "Triều Lý",
      region: "Hà Nội",
      latitude: 20.8268,
      longitude: 106.2674,
      address: "Khu phố cổ Hànội, Hà Nội",
      year_established: 1010,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
      rating: 4.7,
      total_reviews: 892,
      visit_hours: "7:00 - 18:00",
      entrance_fee: 80000,
      is_active: true,
      unesco_listed: true,
      significance: "international"
    },
    {
      id: 3,
      name: "Bảo tàng Thành phố Hồ Chí Minh",
      type: "museum",
      cultural_period: "Hiện đại",
      region: "TP. Hồ Chí Minh",
      latitude: 10.7929,
      longitude: 106.6955,
      address: "65 Lý Tự Trọng, Q. 1, TP. Hồ Chí Minh",
      year_established: 1956,
      image: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600",
      rating: 4.5,
      total_reviews: 234,
      visit_hours: "8:00 - 17:00",
      entrance_fee: 50000,
      is_active: true,
      unesco_listed: false,
      significance: "national"
    },
    {
      id: 4,
      name: "Khu khảo cổ Óc Eo",
      type: "archaeological_site",
      cultural_period: "Thời kỳ Óc Eo",
      region: "An Giang",
      latitude: 10.1333,
      longitude: 104.7667,
      address: "Xã Tân Trung, huyện Tịnh Biên, An Giang",
      year_established: 150,
      year_restored: 2000,
      image: "https://images.unsplash.com/photo-1553484771-ee0bdc25ef14?w=600",
      rating: 4.3,
      total_reviews: 145,
      visit_hours: "8:00 - 16:30",
      entrance_fee: 30000,
      is_active: true,
      unesco_listed: false,
      significance: "national"
    }
  ],

  artifacts: [
    {
      id: 1,
      name: "Bức tranh sơn dầu 'Phố cổ Hội An'",
      description: "Tranh sơn dầu thế kỷ 20 mô tả quang cảnh phố cổ Hội An",
      heritage_site_id: 1,
      category_id: 2,
      artifact_type: "painting",
      year_created: 1985,
      creator: "Nguyễn Tường",
      material: "Sơn dầu trên vải",
      dimensions: "100 x 80 cm",
      weight: 5,
      condition: "excellent",
      image: "https://images.unsplash.com/photo-1578321272176-b7899d21b5d5?w=600",
      is_on_display: true,
      location_in_site: "Phòng tranh 1, Tầng 1"
    },
    {
      id: 2,
      name: "Bộ đồ gốm Thương Tín",
      description: "Bộ gốm sứ thương mại từ thế kỷ 15-16 thời kỳ Hội An",
      heritage_site_id: 1,
      category_id: 4,
      artifact_type: "pottery",
      year_created: 1500,
      material: "Gốm sứ xanh",
      dimensions: "Cao 30cm",
      condition: "good",
      image: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600",
      is_on_display: true,
      location_in_site: "Phòng gốm, Tầng 2"
    }
  ],

  timelines: [
    {
      id: 1,
      title: "Thành lập Hội An",
      description: "Hội An được thành lập như một cảng thương mại quan trọng",
      year: 1624,
      heritage_site_id: 1,
      category: "founded",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600"
    },
    {
      id: 2,
      title: "Tu bổ Phố cổ",
      description: "Bắt đầu công trình tu bổ toàn diện phố cổ Hội An",
      year: 1999,
      heritage_site_id: 1,
      category: "restored",
      image: "https://images.unsplash.com/photo-1578107982254-eb158fc3a0e7?w=600"
    },
    {
      id: 3,
      title: "UNESCO công nhận",
      description: "Phố cổ Hội An được UNESCO công nhận là Di sản Thế giới",
      year: 1999,
      heritage_site_id: 1,
      category: "recognition",
      image: "https://images.unsplash.com/photo-1579722821273-8a36ae95db51?w=600"
    }
  ],

  exhibitions: [
    {
      id: 1,
      name: "Hành trình Hội An qua 400 năm",
      description: "Triển lãm lịch sử toàn diện về Hội An từ thế kỷ 17 đến nay",
      heritage_site_id: 1,
      theme: "Lịch sử & Văn hóa Hội An",
      start_date: "2024-01-01T00:00:00Z",
      end_date: "2024-12-31T23:59:59Z",
      curator: "ThS. Trần Văn An",
      image: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600",
      artifact_ids: [1, 2],
      is_active: true
    }
  ],

  favorites: [
    {
      id: 1,
      userId: 2,
      type: "heritage_site",
      referenceId: 1,
      createdAt: "2024-10-15T10:00:00Z"
    },
    {
      id: 2,
      userId: 3,
      type: "artifact",
      referenceId: 1,
      createdAt: "2024-10-22T11:45:00Z"
    }
  ],

  reviews: [
    {
      id: 1,
      userId: 2,
      type: "heritage_site",
      heritage_site_id: 1,
      rating: 5,
      comment: "Hội An thật tuyệt vời! Di sản văn hóa được bảo tồn rất tốt. Rất đáng ghé thăm!",
      createdAt: "2024-10-20T14:00:00Z"
    },
    {
      id: 2,
      userId: 3,
      type: "artifact",
      heritage_site_id: 1,
      rating: 4,
      comment: "Những tư liệu gốm rất quý hiếm và được trưng bày cẩn thận.",
      createdAt: "2024-10-22T16:30:00Z"
    }
  ]
};