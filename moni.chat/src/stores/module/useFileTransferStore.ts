import { defineStore } from 'pinia'
// 导入 file.ts 中的 API 方法
import { cancel } from '@/api/file'
import { useMessageStore } from './useMessageStore';

export const useFileTransferStore = defineStore('fileTransfer', {
  state: () => ({
    targetId: '',       // 目标用户 ID
    isGetFile: false,   // 是否有接收文件
    isSendFile: false,   // 是否发送文件
    // file: null as File | null,         // 文件对象，初始值设置为 null
  }),
  actions: {
    setSendFileStatus(status: boolean) {
      this.isSendFile = status;
    },
    // setFile(file: File) {
    //   this.file = file;
    //   this.targetId = useMessageStore().targetId,
    //     this.isSendFile = true;
    //   console.log(this.file.name);
    //   console.log(this.file.type);
    // },
    async cancelFile(userId: string) {
        console.log("cancelFile");
        await cancel({ "userId": useMessageStore().targetId });
        // this.file = null;
        this.targetId = '';
        this.isSendFile = false;
        this.isGetFile = false;
        console.log(userId);
    }
  }
})