#!/bin/bash

cd "${0%/*}"

# while true; do
  # bash "./parser.sh"
  node "index.js" 2> errors.log
  # echo "Sleeping for 1 minute"
  # sleep 60
# done
