#!/usr/bin/sh

DROPLET_IP=24.144.94.185

# Building locally because the resources are too limited on the droplet
NODE_ENV=production npm run build
scp -r dist root@$DROPLET_IP:Code/zomboban

