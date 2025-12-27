import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface InvitationData {
  groom: { name: string; fatherName: string; motherName: string }
  bride: { name: string; fatherName: string; motherName: string }
  wedding: { hallName: string; address: string; date: string; time: string }
  extraMessage: string
  additionalRequest: string
  tone: string | null
  frame: string | null
  assets: {
    styleImages: File[]
    userImages: File[]
  }
  design: {
    result2dImageUrls: string[]
  }
  threeD: {
    status: string
    invitationId: string | null
    assets: any
    result2dImageUrls: string[]
    error: string | null
    startedAt: number | null
    mainImages: File[]
    referenceImages: File[]
  }
}

const initialInvitationData: InvitationData = {
  groom: { name: '', fatherName: '', motherName: '' },
  bride: { name: '', fatherName: '', motherName: '' },
  wedding: { hallName: '', address: '', date: '', time: '' },
  extraMessage: '',
  additionalRequest: '',
  tone: null,
  frame: null,
  assets: {
    styleImages: [],
    userImages: [],
  },
  design: {
    result2dImageUrls: [],
  },
  threeD: {
    status: 'IDLE',
    invitationId: null,
    assets: null,
    result2dImageUrls: [],
    error: null,
    startedAt: null,
    mainImages: [],
    referenceImages: [],
  },
}

export const useInvitationStore = defineStore('invitation', () => {
  const data = ref<InvitationData>(initialInvitationData)

  function updateField(path: string, value: any) {
    const keys = path.split('.')
    let current: any = data.value
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = Array.isArray(current[key]) ? [] : {}
      }
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
  }

  function setStyleImages(files: File[]) {
    data.value.assets.styleImages = files
  }

  function setUserImages(files: File[]) {
    data.value.assets.userImages = files
  }

  function setDesignResultImages(urls: string[]) {
    data.value.design.result2dImageUrls = urls
  }

  function setThreeDMainImage(file: File | null) {
    data.value.threeD.mainImages = file ? [file] : []
  }

  function setThreeDReferenceImages(files: File[]) {
    data.value.threeD.referenceImages = files.filter(Boolean).slice(0, 2)
  }

  function resetDesignStage() {
    data.value.assets.styleImages = []
    data.value.design = {
      result2dImageUrls: [],
    }
  }

  function reset() {
    data.value = { ...initialInvitationData }
  }

  return {
    data,
    updateField,
    setStyleImages,
    setUserImages,
    setDesignResultImages,
    setThreeDMainImage,
    setThreeDReferenceImages,
    resetDesignStage,
    reset,
  }
})


