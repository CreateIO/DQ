#!/bin/bash

export VERSION="2.1.4"

#postgres dq
export DB_HOST="dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com"
#export DB_HOST="dq-prod.cvwdsktow3o7.us-east-1.rds.amazonaws.com"
export DB_NAME="DQ"
export DB_PORT="5432"
export PG_USER="DQUser"
export PG_PASSWORD="ty2015!letmein*"

#knox-copy
export KC_KEY="AKIAI2NVER2KEZ67CZFQ"
export KC_SECRET="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"

#aws-sdk values to access s3
export AWS_ACCESS_KEY_ID="AKIAI44SSOEPHQGAMKGA"
export AWS_SECRET_ACCESS_KEY="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"
export AWS_REGION="us-east-1"

#s3 buckets
export S3_ASSET_BUCKET="create.assets"
export S3_ASSET_FOLDER="regional_assets"

#aws-sdk topic for github notifications
export AWS_SNS_TOPIC="arn:aws:sns:us-east-1:249035392509:GithubDQMatchSetsUpdateReport"
export AWS_SQS_URL="https://sqs.us-east-1.amazonaws.com/249035392509/DQMatchSets-trex3"
#export AWS_SQS_URL="https://sqs.us-east-1.amazonaws.com/249035392509/DQMatchSets-trex2"

#Github
export GITHUB_OWNER="CreateIO"
export GITHUB_USER="DiaryQueenRo"
export GITHUB_TOKEN="4be9d6ff845e754b967169d0ffc8ccd6a641c87f"
export GITHUB_TEMPLATE_REPO="DQMatchSets"
export GITHUB_TEMPLATE_BRANCH="test"
#export GITHUB_TEMPLATE_BRANCH="oberlin/prod"
export GITHUB_FOLDER=""
#export GITHUB_FOLDER="DQTemplates/"    #Don't forget trailing "/"   !!!

#Local cache
export LOCAL_CACHE="DQMatchSetsLocal"
export PASSPHRASE="test-Access*98765!"
