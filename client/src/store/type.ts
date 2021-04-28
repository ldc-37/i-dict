export enum SYNC_SOURCE {
    local, cloud
}

export interface syncFuncParams {
    source: SYNC_SOURCE
    syncTime?: number
}