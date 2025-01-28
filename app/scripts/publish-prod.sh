#!/usr/bin/env bash

RAW_COMMIT=$(git rev-parse HEAD)

export VITE_GIT_BRANCH=$(git branch --show-current)
export VITE_GIT_COMMIT=${RAW_COMMIT:0:7}

echo "branch: $VITE_GIT_BRANCH; commit: $VITE_GIT_COMMIT"
pnpm run build

if [ "$VITE_GIT_BRANCH" = "trunk" ]; then
	DEPLOY_BRANCH="main"
else
	DEPLOY_BRANCH="$BRANCH"
fi

pnpm exec wrangler pages deploy desktop/dist \
	--project-name=skeetdeck \
	--branch=$DEPLOY_BRANCH
