var fs = require("fs");
const TelegramBot = require('node-telegram-bot-api');
const token =  fs.readFileSync('token', 'utf8').trim();
const chatid =  fs.readFileSync('data/chatid', 'utf8').trim();
const execSync = require('child_process').execSync;
console.log("\n *START* \n");

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
bot.sendMessage(chatid, "Bot started");

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
     //TODO: Notify
     if (newData[i].type == 115) {
      message = "Evento 115 🚒\n" + "Lat: " + newData[i].lat + "\nLng: " + newData[i].lng;
     } else {
      message = "Evento 118 🚑\n" + "Lat: " + newData[i].lat + "\nLng: " + newData[i].lng;
     }
     bot.sendMessage(chatid, message);
   }
  }

  //Save oldData to file
  fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));
  console.log(oldData.length + " objects written to file. Restarting in 60 seconds.");
  setTimeout(function() {checkUpdates()}, 60000);
}

checkUpdates();

//console.log("\n *EXIT* \n");
