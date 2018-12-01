#!/bin/bash
mkdir -p "data"

if [ ! -f "data/oldData.json" ]; then
  echo "[]" > "data/oldData.json"
fi

if [ ! -f "data/users.json" ]; then
  echo "[]" > "data/users.json"
fi

echo "Fetching data..."


if curl -s -m 50 https://secure.provincia.tn.it/infovolontariato/Emergenze/Eventi.aspx > eventi; then
  echo "CURL ok, Parsing HTML..."
  sed -n '/GMapsProperties/,$p' eventi > eventi.js
  sed '/<\//,+1 d' eventi.js > eventi2.js
  echo "Parsing JS..."
  js-beautify2 eventi2.js > eventi3.js
  sed -n '/setOptions/,$p' eventi3.js > eventi4.js #Elimina le prime linee
  sed '/var polyline_subgurim/,$ d' eventi4.js > eventi5.js #Elimina le ultime linee
  #/sed -n '/});/,$p' eventi5.js > eventi6.js #Elimina le prime linee (subgurim_GMap1.setOptions...)
  tail -n +11 eventi5.js > eventi6.js
  #Dovrebbero rimanere solo i marker
  sed 's/var marker_subgurim_.*_ = _sg.cs.createMarker({/{/g' eventi6.js > eventi7.js
  sed 's/,.*marker_subgurim_.*_.*;/,/g' eventi7.js > eventi8.js #Elimina secondo subgurim marker number
  sed 's/position: new google.maps.LatLng(/lat: /g' eventi8.js > eventi9.js #Parse lat
  sed 's/, /,\n        lng: /g' eventi9.js > eventi10.js #Parse lng
  sed 's/)//g' eventi10.js > eventi11.js
  cat eventi11.js | sed '/true/,+0 d'| sed '/false/,+0 d' | sed '/subgurim/,+0 d' > eventi12.js
  cat eventi12.js | sed 's/icon: .*115.*png./type: 115/g' | sed 's/icon: .*118.*png./type: 118/g' | sed '$ s/,//g' > eventi13.js
  #Trasforma in Array
  echo "[" | cat - eventi13.js > eventi14.js
  echo "]" | cat eventi14.js - > eventi15.js
  cat eventi15.js | sed 's/lat/"lat"/g' | sed 's/lng/"lon"/g' | sed 's/type/"type"/g'  > eventi16.js
  echo "Converting JS to JSON..."
  cp eventi16.js data/newData.json
  rm event*

fi
