import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

function normalizeUrlList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    const text = value.trim()

    if (!text) {
      return []
    }

    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }
    } catch (error) {
      // Ignore JSON parse errors and fall back to comma-separated text.
    }

    return text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

export function normalizeQualificationRecord(data = {}) {
  return {
    id: data.id ?? data.qualificationId ?? null,
    userId: data.userId ?? data.applicantId ?? null,
    applicantName: data.applicantName || data.nickname || data.displayName || data.username || '',
    contactPhone: data.contactPhone || data.phone || '',
    realName: data.realName || data.name || '',
    idCardNo: data.idCardNo || data.idNo || data.identityNo || '',
    qualificationType: data.qualificationType || data.certificateType || '',
    qualificationNo: data.qualificationNo || data.certificateNo || '',
    qualificationOrg: data.qualificationOrg || data.issuer || '',
    cityName: data.cityName || '',
    areaName: data.areaName || '',
    address: data.address || data.location || '',
    idCardFrontUrl: data.idCardFrontUrl || data.idCardFront || '',
    idCardBackUrl: data.idCardBackUrl || data.idCardBack || '',
    qualificationImageUrls: normalizeUrlList(
      data.qualificationImageUrls || data.proofImageUrls || data.certificateImageUrls
    ),
    description: data.description || data.remark || data.skillDescription || '',
    status: data.status || '',
    reviewRemark: data.reviewRemark || data.auditRemark || '',
    reviewerName: data.reviewerName || data.auditUserName || '',
    reviewTime: data.reviewTime || data.auditTime || '',
    createTime: data.createTime || '',
    updateTime: data.updateTime || '',
    hasApprovedRecord: !!data.hasApprovedRecord,
    approvedQualificationTypes: normalizeUrlList(data.approvedQualificationTypes)
  }
}

function normalizeQualificationPage(pageData = {}) {
  return {
    ...pageData,
    records: Array.isArray(pageData?.records)
      ? pageData.records.map(item => normalizeQualificationRecord(item))
      : []
  }
}

export function getQualificationPage(params, config = {}) {
  return request({
    ...config,
    url: '/qualification/page',
    method: 'get',
    params: normalizePageQuery(params)
  }).then(normalizeQualificationPage)
}

export function getQualificationDetail(id, config = {}) {
  return request({
    ...config,
    url: `/qualification/${id}`,
    method: 'get'
  }).then(data => normalizeQualificationRecord(data))
}

export function getCurrentQualification(config = {}) {
  return request({
    ...config,
    url: '/qualification/current',
    method: 'get'
  }).then(data => (data ? normalizeQualificationRecord(data) : null))
}

export function createQualification(data, config = {}) {
  return request({
    ...config,
    url: '/qualification',
    method: 'post',
    data
  })
}

export function updateQualification(id, data, config = {}) {
  return request({
    ...config,
    url: `/qualification/${id}`,
    method: 'put',
    data
  })
}

export function approveQualification(id, data = {}, config = {}) {
  return request({
    ...config,
    url: `/qualification/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectQualification(id, data = {}, config = {}) {
  return request({
    ...config,
    url: `/qualification/${id}/reject`,
    method: 'post',
    data
  })
}
