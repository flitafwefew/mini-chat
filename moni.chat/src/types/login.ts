export interface LoginResponse {
    code: number
    msg: string
    data: {
        token: string
        user: {
            id: string
            account: string
            name: string
            email: string
            phone: string
            portrait: string | null
            is_online: boolean
        }
    }
}

export interface RegisterResponse {
    code: number
    msg: string
    data: {
        token: string
        user: {
            id: string
            account: string
            name: string
            email: string
            phone: string
            portrait: string | null
        }
    }
}

export interface CodeResponse {
    code: number
    msg: string
    data: null
}

export interface UserInfo {
    id: string
    account: string
    name: string
    email: string
    phone: string
    portrait: string | null
    avatar?: string | null
    signature?: string | null
    sex?: string | null
    birthday?: string | null
    is_online: boolean
    create_time?: string
    update_time?: string
    userId?: string
    type?: string
}