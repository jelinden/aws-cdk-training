import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import { Asset } from '@aws-cdk/aws-s3-assets';
import autoscaling = require('@aws-cdk/aws-autoscaling');

export class AwsCdkTrainingStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create vpc and subnets
    const vpc = new ec2.Vpc(this, 'TheVPC', {
      cidr: "10.229.0.0/24", // 10.229.0.1 - 10.229.0.255
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: 'public subnet', // 10.229.0.1 - 10.229.0.15, two zones at eu-north-1
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28, // 10.229.0.32 - 10.229.0.47, two zones at eu-north-1
          name: 'private subnet',
          subnetType: ec2.SubnetType.PRIVATE,
        }
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3
        }
      }
    });
   
    // Copy our zipped app to s3
    const asset = new Asset(this, 'appAssetToS3', {
      path: 'app/app.zip'
    });

    // Create the load balancer in a VPC. 'internetFacing' is 'false'
    // by default, which creates an internal load balancer.
    const lb = new elbv2.ApplicationLoadBalancer(this, 'appLoadBalancer', {
      vpc,
      internetFacing: true,
    });

    // Add a listener and open up the load balancer's security group
    // to the world. 'open' is the default, set this to 'false'
    // and use `listener.connections` if you want to be selective
    // about who can access the listener.
    const httpListener = lb.addListener('httpListener', {
      port: 80,
      open: true,
    });

    // Auto scaling and ec2 spot instances in private subnet
    var appAutoscalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      allowAllOutbound: true,
      maxCapacity: 3,
      minCapacity: 1,
      desiredCapacity: 1,
      spotPrice: "0.009", // $0.0032 per Hour when writing, $0.0108 per Hour on-demand
      updateType: autoscaling.UpdateType.REPLACING_UPDATE,
      healthCheck: autoscaling.HealthCheck.ec2(),
      //keyName: "aws-ssh-key-pair", // ssh key-pair name which was made separately
    });

    // Scale instances with cpu
    appAutoscalingGroup.scaleOnCpuUtilization('cpuScale', {
      targetUtilizationPercent: 10,
      cooldown: cdk.Duration.minutes(5),
      estimatedInstanceWarmup: cdk.Duration.minutes(1),
    });

    // Get zipped app, unzip and run the app in user data
    appAutoscalingGroup.addUserData(`
      #!/bin/bash
      yum update -y
      yum -y install unzip
      mkdir /app
      cd /app
      chown -R ec2-user:ec2-user .
      aws s3 cp s3://` + asset.bucket.bucketName+ "/" + asset.s3ObjectKey + ` /app/app.zip
      unzip app.zip
      ./app.linux
    `);

    // In case you need ssh access (private subnet, say through bastion host)
    //appAutoscalingGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(22), 'Allow from load balancer');

    // Load balance incoming requests to the given load balancing targets
    httpListener.addTargets('ApplicationSpotFleet', {
      port: 8080,
      targets: [appAutoscalingGroup],
      healthCheck: {
        path: "/health"
      }
    });

    // Allow ec2 instances to get the zipped app from s3
    appAutoscalingGroup.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [asset.bucket.bucketArn + '/*'],
      actions: [
        's3:ListBucket', 
        's3:GetObject', 
        's3:HeadObject', 
        's3:ListObjectsV2',
      ],
    }));
  }
}
