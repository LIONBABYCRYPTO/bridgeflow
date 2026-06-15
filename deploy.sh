#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "Building..."
npm run build

echo "Copying to mafia repo..."
rm -rf ../mafia-automated-assembly/bridgeflow
cp -r dist ../mafia-automated-assembly/bridgeflow

cd ../mafia-automated-assembly
git add bridgeflow
if git diff --quiet && git diff --staged --quiet; then
  echo "No changes to deploy"
else
  git commit -m "deploy: BridgeFlow update"
  git push
  echo "Deployed to https://imp.cx/bridgeflow/"
fi
