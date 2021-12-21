const {ipcRenderer, contextBridge} = require('electron')

contextBridge.exposeInMainWorld('dbcall', {
    query: async(args) => {return (await ipcRenderer.send('db-query', args))},
    get: async(args) => {return (await ipcRenderer.invoke('db-get', args))},
    getAll: async(args) => {return (await ipcRenderer.invoke('db-get-all', args))},
    loginCheck: async(args) => {return (await ipcRenderer.invoke('login-check', args))},
    registerUser: async(args) => {return (await ipcRenderer.invoke('register-user', args))},
})

contextBridge.exposeInMainWorld('clipboard', {
    write: (args) => {ipcRenderer.send('clipboard-write', args)}
})
