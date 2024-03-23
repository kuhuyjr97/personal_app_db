resource "aws_iam_access_key" "node" {
  user = aws_iam_user.node.name
}

resource "aws_iam_user" "node" {
  name = "node"
  path = "/node/"
}

resource "aws_iam_user_policy" "node" {
  name = "node"
  user = aws_iam_user.node.name

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
              "s3:*",
              "ses:*"
            ],
            "Effect": "Allow",
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_user" "ci" {
  name = "ci"
  path = "/ci/"
}

resource "aws_iam_user_policy" "ci" {
  name = "ci"
  user = aws_iam_user.ci.name

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRPermissions",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ECSPermissions",
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:DeregisterTaskDefinition",
                "ecs:ListTaskDefinitions",
                "ecs:DescribeTaskDefinition",
                "ecs:UpdateService",
                "ecs:DescribeServices",
                "ecs:ListServices",
                "ecs:ListTasks",
                "ecs:DescribeTasks",
                "ecs:RunTask",
                "ecs:StartTask",
                "ecs:StopTask"
            ],
            "Resource": "*"
        },
        {
            "Sid": "PassRolePermission",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": [
              "arn:aws:iam::${var.account_id}:role/EcsTaskRole",
              "arn:aws:iam::${var.account_id}:role/EcsTaskExecution"
            ]
        }
    ]
}
EOF
}

resource "aws_iam_access_key" "ecs_exec" {
  user = aws_iam_user.ecs_exec.name
}

resource "aws_iam_user" "ecs_exec" {
  name = "ecs_exec"
  path = "/ecs/"
}

resource "aws_iam_user_policy" "ecs_exec" {
  name = "ecs_exec"
  user = aws_iam_user.ecs_exec.name

  policy = <<EOF
{
   "Version": "2012-10-17",
   "Statement": [
       {
       "Effect": "Allow",
       "Action": [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel",
            "ecs:ExecuteCommand",
            "ecs:DescribeTasks"
       ],
      "Resource": "*"
      }
   ]
}
EOF
}
