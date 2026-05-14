import { getCurrentQualification } from '@/api/qualification'

export function maskIdCardNo(value = '') {
  const text = String(value || '').trim()

  if (text.length <= 8) {
    return text
  }

  return `${text.slice(0, 4)} ******** ${text.slice(-4)}`
}

export function buildQualificationLocation(record = {}) {
  return [record.cityName, record.areaName, record.address].filter(Boolean).join(' / ')
}

export function resolveQualificationRedirectPath(record) {
  return '/qualification/create'
}

export async function fetchCurrentQualificationSafe() {
  try {
    const record = await getCurrentQualification({ silent: true })

    return {
      record,
      approved: record?.status === 'approved'
    }
  } catch (error) {
    return {
      record: null,
      approved: false,
      error
    }
  }
}
