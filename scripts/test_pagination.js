const db = {
  applyPagination(items, page = 1, limit = 10) {
    const total = items.length;
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: items.slice(startIndex, endIndex),
      page: currentPage,
      limit: itemsPerPage,
      total,
      startIndex,
      endIndex
    };
  }
};

const items = Array.from({ length: 50 }, (_, i) => i);

console.log('Test 1: Normal', db.applyPagination(items, 1, 10)); // Expect 10 items
console.log('Test 2: Page 2', db.applyPagination(items, 2, 10)); // Expect 10 items
console.log('Test 3: Page 100', db.applyPagination(items, 100, 10)); // Expect empty
console.log('Test 4: NaN page', db.applyPagination(items, NaN, 10)); // Expect ???
console.log('Test 5: String page', db.applyPagination(items, "1", 10)); // Expect 10 items
