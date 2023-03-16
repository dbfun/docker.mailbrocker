#!/bin/bash

# @return ObjectId string
function RandomObjectId {

  local chars=1234567890abcdef
  ObjectId=
  for i in {1..24} ; do
    ObjectId=$ObjectId${chars:RANDOM%${#chars}:1}
  done
}