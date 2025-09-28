import Http from '@/utils/axios'

export const list = () => Http.get('/api/v1/user/list');
export const listMap = () => {
    console.log('🌐 调用 listMap API...')
    return Http.get('/api/v1/user/list/map');//获取所有用户信息
}


export const onlineWeb = () => Http.get('/api/v1/user/online/web');

export const update = (param: any) => Http.post('/api/v1/user/update', param);