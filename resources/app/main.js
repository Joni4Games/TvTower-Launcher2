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
const request = require('request');
const crypto = require('crypto');

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

  console.log('Anwendung gestartet.');
  //Download version file
  //download(mainWindow, "https://jonigames.sytes.net/tvtower/serverversion.txt", {directory:__dirname + "/gamefiles/version", filename:"serverversion.txt"});



  request('https://api.github.com/repos/TVTower/TVTower/releases/latest', { headers: {'User-Agent':'Super Agent/0.0.1','Content-Type':'application/x-www-form-urlencoded'}, json: true }, (err, res, body) => {

    if (err) { dialog.showMessageBox({
      title: "Fehler",
      message: "Fehler beim Beziehen der aktuellen Version: " + err + "\nBitte eröffne ein Issue auf GitHub oder schreib mir an jonigamesstudios@gmail.com",
      buttons: ["OK"]
    }); }


    //var versionnumberwithdot = versionnumberwithv.substr(2).slice(0, -1);
    //var versionnumberwith0 = versionnumberwithdot.split('.').join("");
    //var versionnumber = versionnumberwith0.replace(/^0+/, '');

    //var versionnumber = JSON.stringify(body.name).substr(2).slice(0, -1).split('.').join("").replace(/^0+/, '');
    global.serverversion = crypto.createHash("md5").update(body.name).digest("hex");
    //global.serverversion = versionnumber;
    console.log('Server version: ' + global.serverversion)
    //Get Download count
    var downloadcount = JSON.stringify(body.assets[0].download_count);
    //Get Publish Date
    var publishdate = JSON.stringify(body.published_at).replace(/['"]+/g, '');
    mainWindow.webContents.send('downloadcountnumber', downloadcount, publishdate);


    //Write version to file
    try { fs.writeFileSync(__dirname + "/gamefiles/version/serverversion.txt", global.serverversion, 'utf-8'); }
      catch(e) {
        dialog.showMessageBox({
          title: "Fehler",
          message: "Fehler beim Speichern der Versionsdatei.\nBitte eröffne ein Issue auf GitHub oder schreib mir an jonigamesstudios@gmail.com\nError: " + e,
          buttons: ["OK"]
        });
      }
  });

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
  //console.log(crypto.createHash('md5').update('TestHash').digest('hex'));
  fs.readFile(__dirname + '/gamefiles/version/clientversion.txt', function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      //global.clientversion = data.toString();
      //global.clientversion = parseInt(data);
      //global.clientversion = crypto.createHash("md5").update(data).digest("hex");
      global.clientversion = data;
      console.log('Client version: ' + global.clientversion)
    }


    //Read Server version file
    fs.readFile(__dirname + '/gamefiles/version/serverversion.txt', function (err, data) {
      if (err) {
        return console.error(err);
      } else {
        //global.serverversion = data.toString();
        //global.serverversion = parseInt(data);
        global.serverversion = crypto.createHash("md5").update(data).digest("hex");
        console.log('Server version: ' + global.serverversion)
      }



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
            message: "Die Versionsdatei wurde erfolgreich mit Version " + global.serverversion + " überschrieben und dein Spiel geupdated. Du kannst das Spiel jetzt über den Play-Button starten.",
            buttons: ["OK"]
          });
        }
    });
  });
}

//PlayButtonClicked
ipc.on('playButtonClicked', function(event, data){
  var child = require('child_process').execFile;
  var archvar = os.arch();
    //Run TVTower-Client
    if (global.osname == 'win32') {
      //Windows
        child(__dirname + "\\gamefiles\\unpacked\\TVTower_Win32.exe", function(err, data) {
        if(err){ console.error(err); return; }
        console.log(data.toString());
        });
  } else if (global.osname == 'linux') {
    //Linux
      if (archvar.includes("32")) { //32-Bit Linux
        child(__dirname + "/gamefiles/unpacked/TVTower_Linux32", function(err, data) {
          if(err){ console.error(err); return; }
          console.log(data.toString());
        })
      } else { //64-Bit Linux
        child(__dirname + "/gamefiles/unpacked/TVTower_Linux64", function(err, data) {
          if(err){ console.error(err); return; }
          console.log(data.toString());
        })
      };

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
