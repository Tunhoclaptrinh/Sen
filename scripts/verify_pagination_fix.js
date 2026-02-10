
const applyPagination = (items, page = 1, limit = 10) => {
  const total = items.length;
  const currentPage = Math.max(1, parseInt(page));

  // Handle limit -1 (all items) - THE FIX
  if (parseInt(limit) === -1) {
    return {
      data: items,
      page: 1,
      limit: total,
      total,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };
  }

  const itemsPerPage = Math.max(1, parseInt(limit));
  const totalPages = Math.ceil(total / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    data: items.slice(startIndex, endIndex),
    page: currentPage,
    limit: itemsPerPage,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

console.log('--- TEST 1: Limit 10 (Normal) ---');
const res1 = applyPagination(items, 1, 10);
console.log(`Result count: ${res1.data.length}, total: ${res1.total}, limit: ${res1.limit}`);
if (res1.data.length === 10) console.log('PASS'); else console.error('FAIL');

console.log('--- TEST 2: Limit -1 (Export All) ---');
const res2 = applyPagination(items, 1, -1);
console.log(`Result count: ${res2.data.length}, total: ${res2.total}, limit: ${res2.limit}`);
if (res2.data.length === 50) console.log('PASS'); else console.error('FAIL');

console.log('--- TEST 3: Limit -1 (Page 2 - should reset to 1) ---');
const res3 = applyPagination(items, 2, -1);
console.log(`Result count: ${res3.data.length}, page: ${res3.page}`);
if (res3.data.length === 50 && res3.page === 1) console.log('PASS'); else console.error('FAIL');
