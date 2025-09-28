import Http from '@/utils/axios'

export const offer = (param: any) => Http.post('/api/v1/file/offer', param);//发送WebRTC中的offer，发起文件传输

export const answer = (param: any) => Http.post('/api/v1/file/answer', param);//发送WebRTC中的answer，响应offer

export const candidate = (param: any) => Http.post('/api/v1/file/candidate', param);//发送WebRTC中的candidate，用于建立网络连接的候选地址信息

export const cancel = (param: any) => Http.post('/api/v1/file/cancel', param);

export const invite = (param: any) => Http.post('/api/v1/file/invite', param);

export const accept = (param: any) => Http.post('/api/v1/file/accept', param);

export const upload = (param: any) => Http.post('/api/v1/common/uploadImage', param);