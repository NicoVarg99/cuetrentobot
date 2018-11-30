var fs = require("fs");
const TelegramBot = require('node-telegram-bot-api');
const token =  fs.readFileSync('token', 'utf8').trim();
const chatid =  fs.readFileSync('data/chatid', 'utf8').trim();
const execSync = require('child_process').execSync;
var NodeGeocoder = require('node-geocoder');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
bot.sendMessage(chatid, "Bot started");

var gcoptions = {
  provider: 'openstreetmap',
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(gcoptions);
var users = JSON.parse(fs.readFileSync("data/users.json"));

bot.onText(/ping/, (msg, match) => {
  bot.sendMessage(msg.chat.id, "pong");
});

bot.onText(/\/setradius (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const radius = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, radius);
});


bot.on('location', (msg) => {
  console.log(msg.location.latitude);
  console.log(msg.location.longitude);

  var newEntry = {
    chat: msg.chat,
    location: msg.location,
    radius: 1,
    type: "all"
  };

  console.log(newEntry);
  //Search user
  var found = false;
  for (var i = 0; i < users.length && !found; i++) {
    if (users[i].chat.id == newEntry.chat.id) { //If the user is found overwrite it, without altering radius and type
      newEntry.radius = users[i].radius;
      newEntry.type = users[i].type;
      users[i] = newEntry;
      found = true; //Invalidate looping condition and mark as found
    }
  }
  if (!found) { //If user is not found add it
    users.push(newEntry);
  }

  console.log(users);
  //Save new users file
  fs.writeFileSync('data/users.json', JSON.stringify(users));

});

function checkUpdates() {
  console.log("Downloading data...");
  code = execSync('./parser.sh');
  console.log("Checking...");
  var newData = JSON.parse(fs.readFileSync("data/newData.json"));
  var oldData = JSON.parse(fs.readFileSync("data/oldData.json"));

  for (var i = 0; i < newData.length; i++) {
   var found = false;
   for (var j = 0; j < oldData.length && !found; j++) {
     if (oldData[j].lat == newData[i].lat && oldData[j].lng == newData[i].lng && oldData[j].type == newData[i].type) {
       found = true;
     }
   }

   if (!found) {
     console.log("Not found, adding" + "\n")
     oldData.push({
       lat: newData[i].lat,
       lng: newData[i].lng,
       type: newData[i].type,
       firstSeen: firstSeen = new Date().getTime()
     });
     console.log("New object:");
     console.log("Lat: " + newData[i].lat);
     console.log("Lng: " + newData[i].lng);
     console.log("Tipo evento: " + newData[i].type);

     //Notify
     if (newData[i].type == 115) {
       message = "<b>Evento 115</b> 🚒\n";
     } else {
       message = "<b>Evento 118</b> 🚑\n";
     }
     lat =  newData[i].lat;
     long =  newData[i].lng;
     geocoder.reverse({lat: newData[i].lat, lon: newData[i].lng}, function(err, res) {
       (function (message, lat, long) {
         if (err) {
           console.log("Error");
           console.log(err);
           message += "Lat: " + newData[i].lat + "\nLon: " + newData[i].lng;
         } else {
           message += res[0].formattedAddress;
           console.log(res);
         }
         bot.sendMessage(chatid, message, {parse_mode : "HTML"}).then(() => {
           bot.sendLocation(chatid, lat, long);
         });
       })(message, lat, long);
     });
   }
  }

  //Save oldData to file
  fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));
  console.log(oldData.length + " objects written to file. Restarting in 60 seconds.");
  setTimeout(function() {checkUpdates()}, 60000);
}

checkUpdates();
