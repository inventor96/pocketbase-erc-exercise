#!/bin/bash
set -e

# Check if jq is installed
if ! command -v jq &>/dev/null; then
  echo "Error: 'jq' is not installed. Please install jq to run this script."
  exit 1
fi

# Set your authorization token
authToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTg1NDE0NzQsImlkIjoibzNzMWtvN3c0d3d3a3JiIiwidHlwZSI6ImFkbWluIn0.Z_rHc-LK3g8Azqq-2c00U86ReCNxtj1GkwU-5I1qncE"

# File paths for regions and stakes CSV files
itemsCsvFile="items.csv"
regionsCsvFile="regions.csv"
stakesCsvFile="stakes.csv"

# API endpoint URLs
itemsApiUrl="http://127.0.0.1:8090/api/collections/items/records"
regionsApiUrl="http://127.0.0.1:8090/api/collections/regions/records"
stakesApiUrl="http://127.0.0.1:8090/api/collections/stakes/records"

# Item precedences
declare -A itemPrecedences
itemPrecedences[1]='Emergency'
itemPrecedences[2]='Priority'
itemPrecedences[3]='Welfare'
itemPrecedences[4]='Routine'

# Initialize an array to store region IDs
declare -A regionIds

# Function to create a region and retrieve its ID
createRegionAndGetId() {
  local name="$1"
  local authToken="$2"
  local regionsApiUrl="$3"
  
  jsonData="{\"name\":\"$name\"}"
  
  response=$(curl -X POST -d "$jsonData" -H "Authorization: $authToken" -H "Content-Type: application/json" -s "$regionsApiUrl")
  
  if [ $? -ne 0 ]; then
    echo "cURL Error: $response"
  else
    regionId=$(echo "$response" | jq -r '.id')
    echo "$regionId"
  fi
}

# Open and read the items CSV file
if [ -r "$itemsCsvFile" ]; then
  IFS=","
  while read -r itemDescription itemQuantity itemPrecedence; do
    itemPrecedenceText=${itemPrecedences[$itemPrecedence]}
    jsonData="{\"description\":\"$itemDescription\",\"quantity\":\"$itemQuantity\",\"priority\":\"$itemPrecedenceText\"}"

    response=$(curl -X POST -d "$jsonData" -H "Authorization: $authToken" -H "Content-Type: application/json" -s "$itemsApiUrl")

    if [ $? -ne 0 ]; then
      echo "cURL Error: $response"
    else
      echo "Item created: $itemDescription"
    fi
  done < "$itemsCsvFile"
else
  echo "Error opening file: $itemsCsvFile"
fi

# Open and read the regions CSV file
if [ -r "$regionsCsvFile" ]; then
  IFS=","
  while read -r regionId regionName; do
    newRegionId=$(createRegionAndGetId "$regionName" "$authToken" "$regionsApiUrl")
    regionIds["$regionId"]=$newRegionId
    echo "Region created: $regionName"
  done < "$regionsCsvFile"
else
  echo "Error opening file: $regionsCsvFile"
fi

# Open and read the stakes CSV file
if [ -r "$stakesCsvFile" ]; then
  IFS=","
  while read -r stakeId stakeName originalRegionId; do
    if [ -n "${regionIds["$originalRegionId"]}" ]; then
      regionName="${regionIds["$originalRegionId"]}"
      jsonData="{\"name\":\"$stakeName\",\"region\":\"$regionName\"}"
      response=$(curl -X POST -d "$jsonData" -H "Authorization: $authToken" -H "Content-Type: application/json" -s "$stakesApiUrl")

      if [ $? -ne 0 ]; then
        echo "cURL Error: $response"
      else
        echo "Stake created: $stakeName"
      fi
    else
      echo "Region ID not found for stake: $stakeName"
    fi
  done < "$stakesCsvFile"
else
  echo "Error opening file: $stakesCsvFile"
fi
