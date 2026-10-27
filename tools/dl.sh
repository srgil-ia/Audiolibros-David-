#!/bin/sh
# Shortcut for ElevenLabs signed URLs: dl.sh <cardId> <session> <generation> <date> <signature>
B="https://storage.googleapis.com/xi-backend/database/workspace/05db21a8f27b459298074853b4e807c8/content_generation"
Q="X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261027%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Expires=7200&X-Goog-SignedHeaders=host"
node "$(dirname "$0")/save-audio.mjs" "$1" "$B/$2/$3/content.mp3?$Q&X-Goog-Date=$4&X-Goog-Signature=$5"
