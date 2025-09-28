import 'pinia'

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S extends StateTree, Store> {
        persist?: boolean | {
            key?: string
            storage?: Storage
            paths?: string[]
        }
    }
} 