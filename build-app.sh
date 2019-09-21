#!/bin/bash
set -e

cd app
GO111MODULE=off GOOS=linux GOARCH=amd64 go build -o app.linux
zip app app.linux