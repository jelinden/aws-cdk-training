# Useful commands

 * `npm run build`   compile typescript to js
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
 * `bash build-app.sh` build the app and zip it

Starting from zero, you want to
* take care of your `~/.aws/credentials` file
* run `npm install`
* run `bash build-app.sh` and `npm run build` to build
* run `cdk deploy` to deploy

## Project started with

* `cdk init sample-app --language typescript`


## Usefull reading

* [https://docs.aws.amazon.com/cdk/api/latest/](https://docs.aws.amazon.com/cdk/api/latest/)

