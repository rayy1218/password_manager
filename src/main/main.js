const {app, BrowserWindow} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const {ipcMain, clipboard} = require('electron')
const sqlite3 = require('sqlite3')

const database = new sqlite3.Database('./public/app.db', (err) => {
    if (err) {
        console.error('Error while connecting to database: ', error)
    }
})

const initDatabase = async() => {
    await database.run(
        `CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            password TEXT NOT NULL
        );`
    )

    await database.run(
        `CREATE TABLE IF NOT EXISTS passwords (
            password_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            password_string TEXT NOT NULL,
            password_title TEXT NOT NULL,
            password_url TEXT,
            user_name_or_email TEXT
        );`
    )
}

ipcMain.on('db-query', async(event, args) => {
    return new Promise((resolve, reject) => {
        database.run(args.statement, (err) => {
            if (err) reject(err)
            else resolve(err)
        })
    })
})

ipcMain.handle('db-get', async(event, args) => {
    return new Promise((resolve, reject) => {
        database.get(args.statement, (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
})

ipcMain.handle('db-get-all', async(event, args) => {
    return new Promise((resolve, reject) => {
        database.all(args.statement, (err, rows) => {
            if (err) {reject(err)}
            else {resolve(rows)}
        })
    })
})

ipcMain.handle('register-user' ,async(event, args) => {
    return new Promise((resolve, reject) => {
        const query_statement = `SELECT * FROM users WHERE user_name = '${args.user.username}'`
        database.get(query_statement, (err, row) => {
            if (err) {reject(err)}
            if (row !== undefined) {
                resolve('username_failure')
            }
            else {
                const query_statement = `INSERT INTO users (user_name, password) VALUES ('${args.user.username}', '${args.user.password}')`
                database.run(query_statement)
                resolve('success')
            }
        })
    })
})

ipcMain.handle('login-check', async(event, args) => {
    return new Promise((resolve, reject) => {
        const query_statement = `SELECT * FROM users WHERE user_name = '${args.username}'`
        database.get(query_statement, (err, row) => {
            if (err) {reject(err)}
            if (row === undefined) {resolve('username_failure')}
            else resolve((row.password === args.password) ? 'success' : 'password_failure')
        })

    })
})

ipcMain.on('clipboard-write', (event, arg) => {
    clipboard.writeText(arg)
})

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        maxWidth: 800,
        maxHeight: 600,
        webPreferences: {
            contextIsolation: true,
            preload: isDev
                ? path.join(app.getAppPath(), './public/preload.js')
                : path.join(app.getAppPath(), './build/preload.js')
        }
    })

    win.removeMenu(true)

    if (isDev) {
        win.loadURL('http://localhost:3000')
        win.webContents.openDevTools()
    }
    else {
        win.loadURL(`file://${path.join(__dirname, '../../index.html')}`)
    }

    initDatabase()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})


