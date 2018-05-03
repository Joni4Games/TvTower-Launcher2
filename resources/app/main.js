const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const fs = require('fs')
const decompress = require('decompress')
const {download} = require('electron-dl')
const {dialog} = require('electron')
const ipc = require('electron').ipcMain;
const os = require('os');

global.osname = os.platform();
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, icon: __dirname + '/icon.png'});

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  console.log('test');
  //Download version file
  download(mainWindow, "https://jonigames.sytes.net/tvtower/serverversion.txt", {directory:__dirname + "/gamefiles/version", filename:"serverversion.txt"});


  //Set Overlay Icon
  //mainWindow.setOverlayIcon(
  //  __dirname + "/icon.png",
  //  "Test?");
  //Remove Title Bar
  //mainWindow.setMenu(null);
  const Menu = electron.Menu;
  const menuTemplate = [
        {
            //label: 'Zurück',
            label: 'Entwicklertools',
            click: () => {
                  //mainWindow.webContents.goBack();
                  mainWindow.webContents.openDevTools();
                }
              },
              {
            label: 'Über',
            click: () => {
              dialog.showMessageBox({
                title: "Über",
                message: "TvTower-Launcher version " + app.getVersion() + " by Jonathan Frenkel running on " + global.osname + "\n\n Node.js version: " + process.versions.node + "\n Chromium version: " + process.versions.chrome + "\n Electron version: " + process.versions.electron + "\n\nDistributed under the MIT license.\nWith this software there comes no warranty for anything.",
                buttons: ["OK"]
              });
            }
        }
    ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);


  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

//UpdateButtonClicked
ipc.on('updateButtonClicked', function(event, data){
  //Read Client version file
  fs.readFile(__dirname + '/gamefiles/version/clientversion.txt', function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      //global.clientversion = data.toString();
      global.clientversion = parseInt(data);
    }


    //Read Server version file
    fs.readFile(__dirname + '/gamefiles/version/serverversion.txt', function (err, data) {
      if (err) {
        return console.error(err);
      } else {
        //global.serverversion = data.toString();
        global.serverversion = parseInt(data);
      }

      console.log(data.toString())
      console.log("Asynchronous read: " + data.toString());

      //Compare versions
      if (global.serverversion == global.clientversion) {
        dialog.showMessageBox({
          title: "Alles gut!",
          message: "Dein Spiel entspricht der neusten Version " + global.serverversion + ". Somit gibt es nicht upzudaten. Viel Spaß beim Spielen!",
          buttons: ["OK"]
        });
      } else {
        //If clientversion < serverversion
        dialog.showMessageBox({
          title: "Update verfügbar!",
          message: "Dein Spiel wird sich jetzt von Version " + global.clientversion + " auf Version " + global.serverversion + " updaten. Bitte habe gedult, der Updateprozess geschieht im Hintergrund. Du wirst benachrichtigt, sobald die erforderlichen Dateien heruntergeladen sind.",
          buttons: ["OK"]
        });
        update();
      }
    }); //Read Server Version File
  }); //Read Client Version File
}); //On Update Button clicked

function update() {
  //Download the new version
  download(mainWindow, "http://tvgigant.de/downloads/TVTower.LatestRelease.zip", {directory:__dirname + "/gamefiles/download", filename:"latestrelease.zip"}).then(files => {
    unpack()
  });
}

function unpack() {
  //Decompress
  decompress(__dirname + '/gamefiles/download/latestrelease.zip', __dirname + '/gamefiles/unpacked').then(files => {
      console.log('done!');
      //Update the version file
      fs.writeFile(__dirname + "/gamefiles/version/clientversion.txt", global.serverversion, (err) => {
        if(err){
          dialog.showMessageBox({
            title: "Alles gut!",
            message: "Beim Updaten der Versionsdatei ist etwas schiefgelaufen!\n Fehlermeldung: "+ err.message,
            buttons: ["OK"]
          });
        } else {
          dialog.showMessageBox({
            title: "Alles gut!",
            message: "Die Versionsdatei wurde erfolgreich überschrieben und dein Spiel geupdated. Du kannst das Spiel jetzt über den Play-Button starten.",
            buttons: ["OK"]
          });
        }
    });
  });
}

//PlayButtonClicked
ipc.on('playButtonClicked', function(event, data){
  var child = require('child_process').execFile;
    //Run TVTower-Client
    if (global.osname == 'win32') {
    //Windows
    child(__dirname + "\\gamefiles\\unpacked\\TVTower_Win32.exe", function(err, data) {
    if(err){ console.error(err); return; }
    console.log(data.toString());
    });
  } else if (global.osname == 'linux') {
    child(__dirname + "/gamefiles/unpacked/TVTower_Linux32", function(err, data) {
    if(err){ console.error(err); return; }
    console.log(data.toString());
    });
  } else if (global.osname == 'darwin') {
    child(__dirname + "\\gamefiles\\unpacked\\TVTower.app\\Contents\\MacOS\\TVTower", function(err, data) {
    if(err){ console.error(err); return; }
    console.log(data.toString());
    });
  } else {
    dialog.showMessageBox({
      title: "OS not supported",
      message: "Dein Betriebssystem " + global.osname + " wird im Moment noch nicht unterstützt. Bitte öffne ein Issue auf GitHub.",
      buttons: ["OK"]
    });
  }
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
