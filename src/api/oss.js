import request from '@/utils/request'

export function uploadOssFile(file, dir = 'avatar') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('dir', dir)

  return request({
    url: '/oss/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}
