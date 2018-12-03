#!/bin/bash
mkdir -p "data"

if [ ! -f "data/oldData.json" ]; then
  echo "[]" > "data/oldData.json"
fi

if [ ! -f "data/users.json" ]; then
  echo "[]" > "data/users.json"
fi

echo "Fetching data..."

CURLOUTPUT=$(curl -s -m 50 https://secure.provincia.tn.it/infovolontariato/Emergenze/Eventi.aspx)
CURLSUCCESS=$?

if [ $CURLSUCCESS -eq "0" ]; then
  echo "CURL ok, Parsing HTML..."
  echo "Parsing JS..."
  echo "$CURLOUTPUT" | sed -n '/GMapsProperties/,$p; /<\//,+1 d' |
  js-beautify -i |
  sed -n '/setOptions/,$p' | #Elimina le prime linee
  sed '/var polyline_subgurim/,$ d' | #Elimina le ultime linee
  #/sed -n '/});/,$p' eventi5.js > eventi6.js #Elimina le prime linee (subgurim_GMap1.setOptions...)
  tail -n +11 |
  #Dovrebbero rimanere solo i marker
  sed 's/var marker_subgurim_.*_ = _sg.cs.createMarker({/{/g' |
  sed 's/,.*marker_subgurim_.*_.*;/,/g' | #Elimina secondo subgurim marker number
  sed 's/position: new google.maps.LatLng(/lat: /g' | #Parse lat
  sed 's/, /,\n        lng: /g' | #Parse lng
  sed 's/)//g' |
  sed '/true/,+0 d' |
  sed '/false/,+0 d' |
  sed '/subgurim/,+0 d' |
  sed 's/icon: .*115.*png./type: 115/g' |
  sed 's/icon: .*118.*png./type: 118/g' |
  sed '$ s/,//g' |
  sed '1s/^/[/' | #Trasforma in Array
  sed '$s/$/\n]/' |
  sed 's/lat/"lat"/g; s/lng/"lon"/g; s/type/"type"/g' > data/newData.json
fi
