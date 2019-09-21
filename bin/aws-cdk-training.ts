#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AwsCdkTrainingStack } from '../lib/aws-cdk-training-stack';

const app = new cdk.App();
new AwsCdkTrainingStack(app, 'AwsCdkTrainingStack', {
    env: {
        region: "eu-north-1"
    }
});