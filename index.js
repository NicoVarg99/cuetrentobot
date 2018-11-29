var fs = require("fs");
const TelegramBot = require('node-telegram-bot-api');
const token =  fs.readFileSync('token', 'utf8').trim();
//const execSync = require('child_process').execSync;
console.log("\n *START* \n");
var newData = JSON.parse(fs.readFileSync("data/newData.json"));
var oldData = JSON.parse(fs.readFileSync("data/oldData.json"));
//code = execSync('./parser.sh');

 for (var i = 0; i < newData.length; i++) {
   console.log("Current element:");
   console.log("Lat: " + newData[i].lat);
   console.log("Lng: " + newData[i].lng);
   console.log("Tipo evento: " + newData[i].type);

   var found = false;
   console.log("Searching...")
   for (var j = 0; j < oldData.length; j++) {
     if (oldData[j].lat == newData[i].lat && oldData[j].lng == newData[i].lng && oldData[j].type == newData[i].type) {
       //Found
       console.log("Found.\n");
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
     //TODO: Notify
   }

 }

//Save oldData to file
fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));
console.log( oldData.length + " objects written to file.");

console.log("\n *EXIT* \n");
