const fs = require("fs");
const TelegramBot = require('node-telegram-bot-api');
const token =  fs.readFileSync('data/token', 'utf8').trim();
const execSync = require('child_process').execSync;
const { exec } = require('child_process');
var NodeGeocoder = require('node-geocoder');
var Distance = require('geo-distance');
var oldData = [], newData = [], closedData = [];
var users = JSON.parse(fs.readFileSync("data/users.json"));
var adminId = fs.readFileSync("data/adminid");
const maxRadius = 100;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

var gcoptions = { //NodeGeocoder options
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(gcoptions);

function compareEvents_unsafe(event1, event2) {
  return (event1.lat == event2.lat && event1.lon == event2.lon && event1.type == event2.type);
}

// function compareEvents_safe() {
//   //TODO: check time
// }

function isUserActive(user) {
  return (user.location && user.radius && user.type);
}

function saveUsers() {
  fs.writeFileSync('data/users.json', JSON.stringify(users));
}

function deleteUserByChat(chat) {
  users[getUserIndexByChat(chat)].type = null;
  saveUsers();
}

function getUserIndexByChat(chat) {
  // console.log(chat);
  // console.log(users);
  //Search user

  for (var i = 0; i < users.length; i++)
    if (users[i].chat.id == chat.id)
      return i;

  //Add new user
  var newEntry = {
    chat: chat,
    location: null,
    radius: null,
    type: null
  };

  users.push(newEntry);
  saveUsers();
  console.log("New user:");
  console.log(newEntry);
  return users.length - 1;
}

bot.onText(/help/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "Comandi disponibili:\n/start configura le notifiche\n/stop arresta il bot\n/config stampa la configurazione dell'utente\n/ping verifica che il bot sia online\n/stats statistiche sul bot");
});

bot.onText(/ping/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "pong");
});

bot.onText(/config/, (msg, match) => {
  var message = "Configurazione\n" + JSON.stringify(users[getUserIndexByChat(msg.chat)], null, 2);
  bot.sendMessage(msg.chat.id, message);
});

bot.onText(/listall/, (msg, match) => {
  if (msg.chat.id == adminId) {
    var message = "Configurazione\n" + JSON.stringify(users[getUserIndexByChat(msg.chat)], null, 2);
    bot.sendMessage(msg.chat.id, message);
    var message = "Utenti: " + JSON.stringify(users, null, 2);
    bot.sendMessage(msg.chat.id, message);
  } else {
    bot.sendMessage(msg.chat.id, "Utente non autorizzato.");
  }
});

bot.onText(/stats/, (msg, match) => {

  exec('echo 1.$(git rev-list --count HEAD).$(git log --pretty=format:\'%h\' -n 1 )', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }

    // the *entire* stdout and stderr (buffered)
    // console.log(`stdout: ${stdout}`);
    // console.log(`stderr: ${stderr}`);
    var utentiAttivi = 0;

    for (var i = 0; i < users.length; i++)
    if (isUserActive(users[i]))
    utentiAttivi++;

    var message = "<b>Statistiche</b>\n";
    message += "Versione: " + stdout;
    message += "Eventi aperti: " + oldData.length + "\n";
    message += "Eventi chiusi: " + closedData.length + "\n";
    message += "Utenti attivi: " + utentiAttivi + "\n";
    message += "Utenti non attivi: " + (users.length - utentiAttivi) + "\n";
    bot.sendMessage(msg.chat.id, message, {parse_mode : "HTML"});

  });


});

bot.onText(/start/, (msg, match) => {
  //Fresh start
  var i = getUserIndexByChat(msg.chat);
  users[i].location = null;
  users[i].radius = null;
  users[i].type = null;
  saveUsers();
  bot.sendMessage(msg.chat.id, "Inviami la tua posizione, così potrò aggiornarti degli eventi nelle tue vicinanze.");
});

bot.onText(/stop/, (msg, match) => {
  deleteUserByChat(msg.chat);
  bot.sendMessage(msg.chat.id, "Impostazioni eliminate. Digita /start per reimpostare le notifiche.");
});

bot.on('location', (msg) => {
  users[getUserIndexByChat(msg.chat)].location = msg.location;
  var replyOptions = {
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      keyboard: [
        ['1', '5'],
        ['10', '20']
      ],
    },
  };
  bot.sendMessage(msg.chat.id, "Scrivimi il raggio in km dell'area che ti interessa.", replyOptions);
});

bot.on('message', (msg) => {
  //Log message
  fs.appendFile('data/messages.log', msg.chat.id + ": " + msg.text + "\n", function (err) {
    // if (err) throw err;
    // console.log('Saved!');
  });

  if (!isNaN(msg.text) && users[getUserIndexByChat(msg.chat)].radius == null) {
    //Set radius
    var rad = parseInt(msg.text, 10);

    users[getUserIndexByChat(msg.chat)].radius = (rad <= maxRadius ? rad : maxRadius);
    var replyOptions = {
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [
          ['115 🚒'],
          ['118 🚑'],
          ['Tutti 🚒🚑'],
        ],
      }
    };

    if (rad > maxRadius) {
      bot.sendMessage(msg.chat.id, 'Il raggio selezionato eccede il massimo consentito.\nHo modificato il tuo raggio a ' + maxRadius + ' km.', replyOptions).then(() => {
        bot.sendMessage(msg.chat.id, 'Seleziona il corpo per cui vuoi ricevere aggiornamenti.', replyOptions);
      });
    } else {
      bot.sendMessage(msg.chat.id, 'Seleziona il corpo per cui vuoi ricevere aggiornamenti.', replyOptions);
    }

    // bot.sendMessage(msg.chat.id, 'Seleziona il corpo per cui vuoi ricevere aggiornamenti.', replyOptions);
  }
  if (msg.text == "115 🚒" || msg.text == "118 🚑" || msg.text == "Tutti 🚒🚑") {
    if (msg.text == "115 🚒") users[getUserIndexByChat(msg.chat)].type = "115";
    if (msg.text == "118 🚑") users[getUserIndexByChat(msg.chat)].type = "118";
    if (msg.text == "Tutti 🚒🚑") users[getUserIndexByChat(msg.chat)].type = "all";
    //Save settings
    var replyOptions = {
      reply_markup: {
        hide_keyboard: true
      }
    };
    saveUsers();
    bot.sendMessage(msg.chat.id, 'Impostazioni salvate ✅\nDigita /start per modificarle\nDigita /stop per smettere di ricevere aggiornamenti.', replyOptions);
  }
});

function deleteClosedEvents() {
  closedData = JSON.parse(fs.readFileSync("data/closedData.json"));

  if (!oldData.length || !newData.length) //If data is empty do not delete old events
    return;

  var closedEvents = 0;

  //If events in oldData are missing in newData, close them.
  for (var i = 0; i < oldData.length; i++) {
    var found = false;

    for (var j = 0; j < newData.length; j++)
      if (compareEvents_unsafe(oldData[i], newData[j]))
        found = true;

    if (!found) { //old event not found in newdata, delete oldData[i]
      console.log("Deleting event: ");
      console.log(oldData[i]);
      closedData.push(oldData[i]); //Add oldData[i] to closed events
      oldData.splice(i, 1); //Delete element i from open events
      i--; //oldData.length gets reduced by 1, decrease index to avoid skipping elements
      closedEvents++;
    }
  }

  console.log(closedEvents + " closed events.");

  //Write to file closed Events
  fs.writeFileSync('data/closedData.json', JSON.stringify(closedData));

}

function parseData() {
  console.log("Downloading data...");
  exec('./parser.sh', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }

    // the *entire* stdout and stderr (buffered)
    // console.log(`stdout: ${stdout}`);
    // console.log(`stderr: ${stderr}`);
    newData = JSON.parse(fs.readFileSync("data/newData.json"));
    oldData = JSON.parse(fs.readFileSync("data/oldData.json"));
    console.log("Data downloaded.");
    checkUpdates();
  });

}

function checkUpdates() {
  // parseData();
  console.log("Checking...    checkUpdates()");

  var counter = 0; //Counts new events
  for (var i = 0; i < newData.length; i++) {
   var found = false;
   for (var j = 0; j < oldData.length && !found; j++) {
     if (oldData[j].lat == newData[i].lat && oldData[j].lon == newData[i].lon && oldData[j].type == newData[i].type) {
       found = true;
     }
   }

   if (!found) {
     counter++;
     console.log("Not found, adding" + "\n")
     oldData.push({
       lat: newData[i].lat,
       lon: newData[i].lon,
       type: newData[i].type,
       firstSeen: firstSeen = new Date().getTime()
     });

     console.log("New object:");
     console.log("Lat: " + newData[i].lat);
     console.log("lon: " + newData[i].lon);
     console.log("Tipo evento: " + newData[i].type);
   }
   if (!found && counter < 10 + 1){
     //Notify
     var type = newData[i].type;
     var message = (type == 115 ? "<b>Evento 115</b> 🚒\n" : "<b>Evento 118</b> 🚑\n");
     var lat =  newData[i].lat;
     var long =  newData[i].lon;

     (function(message, lat, longs) {
       geocoder.reverse({lat: lat, lon: long}, function(err, res) {
         (function (mess, type) {
           if (err) {
             console.log("Error");
             console.log(err);
             mess += "Lat: " + newData[i].lat + "\nLon: " + newData[i].lon;
           } else {
             mess += res[0].formattedAddress;
             //console.log(res);
             lat = res[0].latitude;
             long = res[0].longitude;
           }
           var event = {
             lat: lat,
             lon: long
           };
           for (var i = 0; i < users.length; i++) { //Loop through all users
             (function (mess, i) {
               if (!isUserActive(users[i])) //If user is not properly set, skip it
                return;

               var user = {
                 lat: users[i].location.latitude,
                 lon: users[i].location.longitude
               };
               var usertoevent = Distance.between(user, event);
               var distance = (usertoevent <= Distance(users[i].radius + " km"));
               mess = mess.substr(0, 20) + " a " + usertoevent.human_readable() + mess.substr(20, 1000);
               if ((users[i].type == type || users[i].type == "all") && distance) { //Try sending message if user is in the radius
                 bot.sendMessage(users[i].chat.id, mess, {parse_mode : "HTML"}).then((function(cid, lat, long) { //Send message to user
                   bot.sendLocation(cid, lat, long); //If successful send location
                 })(users[i].chat.id, lat, long)).catch(
                   function(error) {
                     if (error.response) {
                       if (error.response.statusCode === 403 || error.response.statusCode === 404) { //If user blocked bot (or deleted the account) delete it
                         console.log("User blocked bot - Deleting user " + users[i].chat);
                         deleteUserByChat(users[i].chat);
                       }
                     }
                   }
                 );
               }
             })(mess, i);
           }
         })(message, type);
       });
     })(message, lat, long);
   }
  }
  //Save oldData to file
  deleteClosedEvents();
  fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));
  console.log(oldData.length + " objects written to file. Restarting in 60 seconds.");
  setTimeout(function() {parseData()}, 60000);
}

parseData();
