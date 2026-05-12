<template>
  <el-dialog
    :model-value="modelValue"
    title="地图选点"
    width="880px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <div class="picker-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索小区、学校、路名后回车"
        clearable
        @keyup.enter="handleSearch"
      />
      <el-button :loading="searching" @click="handleSearch">搜索</el-button>
      <el-button type="primary" plain :loading="locating" @click="handleLocateCurrent">定位当前</el-button>
    </div>

    <div class="picker-layout">
      <div ref="mapRef" class="picker-map" />
      <div class="picker-side">
        <div class="picker-tip">点击地图可手动确认位置，确认后会自动回填地址。</div>
        <div class="picker-field">
          <span class="picker-label">当前地址</span>
          <span class="picker-value">{{ selectedLocation.address || '未选择' }}</span>
        </div>
        <div class="picker-field">
          <span class="picker-label">城市 / 区域</span>
          <span class="picker-value">
            {{ [selectedLocation.cityName, selectedLocation.areaName].filter(Boolean).join(' / ') || '未选择' }}
          </span>
        </div>
        <div class="picker-field">
          <span class="picker-label">经纬度</span>
          <span class="picker-value">
            {{
              selectedLocation.longitude != null && selectedLocation.latitude != null
                ? `${selectedLocation.longitude.toFixed(6)}, ${selectedLocation.latitude.toFixed(6)}`
                : '未选择'
            }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!selectedLocation.address" @click="handleConfirm">确认位置</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getLocationConfig, locateByIp, reverseGeocodeLocation } from '@/api/location'

let baiduMapLoader = null

function createEmptyLocation() {
  return {
    longitude: null,
    latitude: null,
    cityName: '',
    areaName: '',
    address: ''
  }
}

function shouldSkipIpLocate() {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function loadBaiduMapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('当前环境不支持地图加载'))
  }

  if (window.BMap) {
    return Promise.resolve(window.BMap)
  }

  if (baiduMapLoader) {
    return baiduMapLoader
  }

  baiduMapLoader = getLocationConfig({ silent: true }).then(payload => {
    const ak = payload?.ak
    if (!ak) {
      throw new Error('后端未返回百度地图 AK')
    }

    return new Promise((resolve, reject) => {
      const callbackName = `onBaiduMapLoaded_${Date.now()}`
      window[callbackName] = () => {
        resolve(window.BMap)
        delete window[callbackName]
      }

      const script = document.createElement('script')
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${encodeURIComponent(ak)}&callback=${callbackName}`
      script.onerror = () => {
        reject(new Error('百度地图脚本加载失败'))
        delete window[callbackName]
      }
      document.body.appendChild(script)
    })
  })

  return baiduMapLoader
}

export default {
  name: 'BaiduLocationPicker',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    initialLocation: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'confirm'],
  data() {
    return {
      keyword: '',
      searching: false,
      locating: false,
      map: null,
      marker: null,
      localSearch: null,
      selectedLocation: createEmptyLocation()
    }
  },
  methods: {
    async handleOpened() {
      await nextTick()
      try {
        await this.initMap()
      } catch (error) {
        ElMessage.error(error?.message || '地图初始化失败')
        this.$emit('update:modelValue', false)
      }
    },
    handleClosed() {
      this.keyword = ''
      this.map = null
      this.marker = null
      this.localSearch = null
    },
    async initMap() {
      const BMap = await loadBaiduMapScript()
      if (!this.$refs.mapRef) return

      this.map = new BMap.Map(this.$refs.mapRef)
      this.map.enableScrollWheelZoom(true)

      const initial = this.initialLocation || {}
      const longitude = Number(initial.longitude)
      const latitude = Number(initial.latitude)
      const hasPoint = !Number.isNaN(longitude) && !Number.isNaN(latitude)

      let centerPoint = hasPoint
        ? new BMap.Point(longitude, latitude)
        : new BMap.Point(113.625368, 34.7466)

      this.map.centerAndZoom(centerPoint, hasPoint ? 15 : 12)
      this.map.addEventListener('click', this.handleMapClick)

      this.selectedLocation = {
        ...createEmptyLocation(),
        ...initial,
        longitude: hasPoint ? longitude : null,
        latitude: hasPoint ? latitude : null
      }

      if (hasPoint) {
        this.updateMarker(centerPoint)
        return
      }

      try {
        const position = await this.getBrowserPosition()
        centerPoint = new BMap.Point(position.longitude, position.latitude)
        this.map.centerAndZoom(centerPoint, 15)
      } catch (error) {
        if (!shouldSkipIpLocate()) {
          try {
            const location = await locateByIp({ silent: true })
            const fallbackLongitude = Number(location?.longitude)
            const fallbackLatitude = Number(location?.latitude)
            if (!Number.isNaN(fallbackLongitude) && !Number.isNaN(fallbackLatitude)) {
              centerPoint = new BMap.Point(fallbackLongitude, fallbackLatitude)
              this.map.centerAndZoom(centerPoint, 13)
            }
          } catch (fallbackError) {
            // keep default center point
          }
        }
      }
    },
    updateMarker(point) {
      if (!this.map) return

      const BMap = window.BMap
      if (!this.marker) {
        this.marker = new BMap.Marker(point)
        this.map.addOverlay(this.marker)
      } else {
        this.marker.setPosition(point)
      }
      this.map.panTo(point)
    },
    async resolvePoint(point) {
      this.updateMarker(point)

      try {
        const location = await reverseGeocodeLocation({
          latitude: point.lat,
          longitude: point.lng
        }, { silent: true })

        this.selectedLocation = {
          longitude: point.lng,
          latitude: point.lat,
          cityName: location?.cityName || '',
          areaName: location?.areaName || '',
          address: location?.address || ''
        }
      } catch (error) {
        ElMessage.error(error?.message || '地址解析失败')
      }
    },
    handleMapClick(event) {
      const point = event?.point
      if (!point) return
      this.resolvePoint(point)
    },
    handleSearch() {
      if (!this.keyword.trim() || !this.map) return

      this.searching = true
      const BMap = window.BMap
      this.localSearch = new BMap.LocalSearch(this.map, {
        onSearchComplete: results => {
          this.searching = false
          if (!results || results.getCurrentNumPois() <= 0) {
            ElMessage.warning('未搜索到相关位置')
            return
          }

          const poi = results.getPoi(0)
          if (poi?.point) {
            this.resolvePoint(poi.point)
          }
        }
      })
      this.localSearch.search(this.keyword.trim())
    },
    async getBrowserPosition() {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error('当前浏览器不支持定位')
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          error => {
            const errorMap = {
              1: '未授予定位权限，请允许浏览器定位',
              2: '定位结果不可用，请稍后重试',
              3: '定位超时，请检查网络后重试'
            }
            reject(new Error(errorMap[error?.code] || '浏览器定位失败，请稍后重试'))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })
    },
    async handleLocateCurrent() {
      this.locating = true

      try {
        const BMap = window.BMap
        const position = await this.getBrowserPosition()
        const point = new BMap.Point(position.longitude, position.latitude)
        await this.resolvePoint(point)
      } catch (error) {
        if (shouldSkipIpLocate()) {
          ElMessage.error(error?.message || '定位失败，请稍后重试')
        } else {
          try {
            const BMap = window.BMap
            const location = await locateByIp({ silent: true })
            const longitude = Number(location?.longitude)
            const latitude = Number(location?.latitude)
            if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
              throw new Error('IP 定位结果无效')
            }
            const point = new BMap.Point(longitude, latitude)
            await this.resolvePoint(point)
          } catch (fallbackError) {
            ElMessage.error(error?.message || fallbackError?.message || '定位失败，请稍后重试')
          }
        }
      } finally {
        this.locating = false
      }
    },
    handleConfirm() {
      this.$emit('confirm', {
        ...this.selectedLocation
      })
      this.$emit('update:modelValue', false)
    }
  }
}
</script>

<style scoped>
.picker-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.picker-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
}

.picker-map {
  height: 460px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--app-border);
}

.picker-side {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 16px;
  background: var(--app-surface-soft);
}

.picker-tip {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 16px;
}

.picker-field + .picker-field {
  margin-top: 14px;
}

.picker-label {
  display: block;
  color: var(--app-text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
}

.picker-value {
  color: var(--app-text);
  line-height: 1.6;
  word-break: break-word;
}

@media (max-width: 900px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }
}
</style>
