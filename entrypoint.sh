#!/bin/bash

while true; do
  bash "./parser.sh"
  node "index.js"
  echo "Sleeping for 1 minute"
  sleep 60
done
