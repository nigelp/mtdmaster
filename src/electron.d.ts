export interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, func: (...args: any[]) => void): () => void;
    send(channel: string, ...args: any[]): void;
}

declare global {
    interface Window {
        ipcRenderer: IpcRenderer;
    }
}
