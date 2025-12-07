import apiClient from './apiClient'

export interface InvitationBasicInfo {
    groom_name: string
    bride_name: string
    groom_father_name?: string
    groom_mother_name?: string
    bride_father_name?: string
    bride_mother_name?: string
    wedding_date: string
    wedding_time?: string
    wedding_location: string
    wedding_location_detail?: string
    additional_message?: string
    requirements?: string  // 청첩장 만들 때 요구사항
}

export interface ToneOption {
    tone: string
    description: string
    main_text: string
    parents_greeting: string
    wedding_info: string
    closing: string
}

export interface MapInfo {
    lat: number
    lng: number
    formatted_address: string
    map_url?: string       // 카카오맵에서 보기 링크
    direction_url?: string // 길찾기 링크
}

export interface ImageGenerateRequest {
    design_id: number
    selected_tone: string
    selected_text: string
    prompt: string
    model_type: 'free' | 'pro'
    base_image_url?: string
}

export const invitationService = {
    /**
     * 5가지 톤 제안 요청
     */
    async generateTones(basicInfo: InvitationBasicInfo) {
        const response = await apiClient.post('/invitation-tones', basicInfo)
        return response.data
    },

    /**
     * 지도 정보 요청
     */
    async getMapInfo(address: string): Promise<{ message: string; data: MapInfo }> {
        const response = await apiClient.post('/invitation-map', { address })
        return response.data
    },

    /**
     * 이미지 생성
     */
    async generateImage(data: ImageGenerateRequest) {
        const response = await apiClient.post('/invitation-image-generate', data)
        return response.data
    },

    /**
     * 이미지 수정
     */
    async modifyImage(data: {
        design_id: number
        base_image_url: string
        modification_prompt: string
        model_type: 'free' | 'pro'
    }) {
        const response = await apiClient.post('/invitation-image-modify', data)
        return response.data
    },

    /**
     * 청첩장 디자인 생성
     */
    async createDesign(data: {
        template_id?: number
        design_data: any
        qr_code_data?: any
        // 기본 정보 필드
        groom_name?: string
        bride_name?: string
        groom_father_name?: string
        groom_mother_name?: string
        bride_father_name?: string
        bride_mother_name?: string
        wedding_date?: string
        wedding_time?: string
        wedding_location?: string
        wedding_location_detail?: string
        map_address?: string
        additional_message?: string
    }) {
        const response = await apiClient.post('/invitation-designs', data)
        return response.data
    },

    /**
     * 청첩장 디자인 저장 (업데이트)
     */
    async updateDesign(designId: number, data: any) {
        const response = await apiClient.put(`/invitation-designs/${designId}`, data)
        return response.data
    },

    /**
     * 청첩장 디자인 목록 조회
     */
    async getDesigns() {
        const response = await apiClient.get('/invitation-designs')
        return response.data
    },

    /**
     * 청첩장 디자인 상세 조회
     */
    async getDesign(designId: number) {
        const response = await apiClient.get(`/invitation-designs/${designId}`)
        return response.data
    }
}
