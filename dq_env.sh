#!/bin/bash

export VERSION="1.2.1"

#postgres dq
export DB_HOST="dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com"
#export DB_HOST="dq-prod.cvwdsktow3o7.us-east-1.rds.amazonaws.com"
export DB_NAME="DQ"
export PG_USER="DQUser"
export PG_PASSWORD="ty2015!letmein*"

#knox-copy
export KC_KEY="AKIAI2NVER2KEZ67CZFQ"
export KC_SECRET="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"

#aws-skd values to access s3
export AWS_ACCESS_KEY_ID="AKIAI44SSOEPHQGAMKGA"
export AWS_SECRET_ACCESS_KEY="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"
export AWS_REGION="us-east-1"

#s3 buckets
export S3_ASSET_BUCKET="create.assets"
export S3_ASSET_FOLDER="regional_assets"

#Github
export GITHUB_OWNER="CreateIO"
export GITHUB_USER="DiaryQueenRo"
export GITHUB_TOKEN="4be9d6ff845e754b967169d0ffc8ccd6a641c87f"
export GITHUB_TEMPLATE_REPO="DQMatchSets"
export GITHUB_TEMPLATE_BRANCH="test"
#export GITHUB_TEMPLATE_BRANCH="prod"
export GITHUB_FOLDER=""
#export GITHUB_FOLDER="DQTemplates/"    #Don't forget trailing "/"   !!!

#Local cache
export LOCAL_CACHE="DQMatchSetsLocal"
export PASSPHRASE="test-Access*98765!"