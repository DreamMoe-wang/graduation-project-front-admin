export function createPaginationState(overrides = {}) {
  return {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    ...overrides
  }
}

export function applyPageResult(store, pageData, listKey = 'tableData') {
  store[listKey] = pageData?.records || []
  store.pagination.total = Number(pageData?.total || 0)
}

export function resetPagination(store, currentPage = 1) {
  store.pagination.currentPage = currentPage
}

export function updatePageSize(store, pageSize) {
  store.pagination.pageSize = pageSize
  store.pagination.currentPage = 1
}

export function updateCurrentPage(store, currentPage) {
  store.pagination.currentPage = currentPage
}
