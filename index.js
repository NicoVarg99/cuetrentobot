var fs = require("fs");
//const execSync = require('child_process').execSync;
console.log("\n *START* \n");
var downData = JSON.parse(fs.readFileSync("data/newData.json"));
var oldData = JSON.parse(fs.readFileSync("data/oldData.json"));

//code = execSync('./parser.sh');

 for (var i = 0; i < downData.length; i++) {
   console.log("Current element:");
   console.log("Lat: " + downData[i].lat);
   console.log("Lng: " + downData[i].lng);
   console.log("Tipo evento: " + downData[i].type);

   var found = false;
   console.log("Searching...")
   for (var j = 0; j < oldData.length; j++) {
     if (oldData[j].lat == downData[i].lat && oldData[j].lng == downData[i].lng && oldData[j].type == downData[i].type) {
       //Found
       console.log("Found.\n");
       found = true;
     }
     //.firstSeen = new Date().getTime();
   }

   if (!found) {
     console.log("Not found, adding" + "\n")
     oldData.push({
       lat: downData[i].lat,
       lng: downData[i].lng,
       type: downData[i].type,
       firstSeen: firstSeen = new Date().getTime()
     });
   }

 }

 //Save oldData to file
 fs.writeFileSync('data/oldData.json', JSON.stringify(oldData));

console.log("\n *EXIT* \n");
