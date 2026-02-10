import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import mysql from "mysql2";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "voice_khaata",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

ipcMain.on("getCustomers", (event) => {
  db.query("SELECT * FROM customers", (err, results) => {
    if (err) {
      event.reply("customersData", []);
    } else {
      event.reply("customersData", results);
    }
  });
});
