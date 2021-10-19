#!/bin/bash

ECS_REGION='us-east-1'
ECR_NAME='cognito-list-users'
AWSACCOUNT='SOME-ACCOUNT'
ECR_URI="${AWSACCOUNT}.dkr.ecr.us-east-1.amazonaws.com"

docker build -t "${ECR_NAME}" .
aws ecr get-login-password --region "${ECS_REGION}" | docker login --username AWS --password-stdin "${ECR_URI}"
docker tag "${ECR_NAME}:latest" "${ECR_URI}/${ECR_NAME}:latest"
docker push "${ECR_URI}/${ECR_NAME}:latest"