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

function checkUpdates() {
  console.log("Downloading data...");
  code = execSync('./parser.sh');
  console.log("Checking...");
  var newData = JSON.parse(fs.readFileSync("data/newData.json"));
  var oldData = JSON.parse(fs.readFileSync("data/oldData.json"));

  for (var i = 0; i < newData.length; i++) {
   // console.log("Current element:");
   // console.log("Lat: " + newData[i].lat);
   // console.log("Lng: " + newData[i].lng);
   // console.log("Tipo evento: " + newData[i].type);

   var found = false;
   // console.log("Searching...")
   for (var j = 0; j < oldData.length; j++) {
     if (oldData[j].lat == newData[i].lat && oldData[j].lng == newData[i].lng && oldData[j].type == newData[i].type) {
       //Found
       //console.log("Found.\n");
       found = true;
     }
     //.firstSeen = new Date().getTime();
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
       if (err) {
         console.log("ERROR");
         console.log(err);
         message += "Lat: " + newData[i].lat + "\nLng: " + newData[i].lng;
       } else {
         message += res[0].formattedAddress;
       }
       bot.sendMessage(chatid, message, {parse_mode : "HTML"}).then(() => {
         bot.sendLocation(chatid, lat, long);
       });
     });
   }
  }

  //Save oldData to file
  fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));
  console.log(oldData.length + " objects written to file. Restarting in 60 seconds.");
  setTimeout(function() {checkUpdates()}, 60000);
}

checkUpdates();
