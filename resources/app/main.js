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
  download(BrowserWindow.getFocusedWindow(), "https://jonigames.sytes.net/tvtower/serverversion.txt", {directory:__dirname + "/gamefiles/version", filename:"serverversion.txt"});


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
                message: "TvTower-Launcher version " + app.getVersion() + " by Jonathan Frenkel \n\n Node.js version: " + process.versions.node + "\n Chromium version: " + process.versions.chrome + "\n Electron version: " + process.versions.electron + "\n\nDistributed under the MIT license.\nWith this software there comes no warranty for anything.",
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
        update();
      }
    }); //Read Server Version File
  }); //Read Client Version File
}); //On Update Button clicked

function update() {
  //Download the new version
  download(BrowserWindow.getFocusedWindow(), "http://tvgigant.de/downloads/TVTower.LatestRelease.zip", {directory:__dirname + "/gamefiles/download", filename:"latestrelease.zip"}).then(files => {
    unpack()
  });
}

function unpack() {
  //Decompress
  decompress(__dirname + '/gamefiles/download/LatestRelease.zip', __dirname + '/gamefiles/unpacked').then(files => {
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
            message: "Die Versionsdatei wurde erfolgreich überschrieben und dein Spiel geupdated.",
            buttons: ["OK"]
          });
        }
    });
  });
}

//PlayButtonClicked
ipc.on('playButtonClicked', function(event, data){

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
