import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getCustomers: () => ipcRenderer.send("getCustomers"),
  onCustomers: (callback) =>
    ipcRenderer.on("customersData", (_e, data) => callback(data)),
});
