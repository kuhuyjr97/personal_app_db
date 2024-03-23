resource "aws_ecs_cluster" "this" {
  name = var.project_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# API Service
resource "aws_ecs_task_definition" "api" {
  family                   = "api"
  cpu                      = "512"
  memory                   = "1024"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  container_definitions    = file("./container_definitions/api.json")
  execution_role_arn       = module.ecs_task_execution_role.iam_role_arn
  task_role_arn            = aws_iam_role.ecs_task.arn
}

resource "aws_ecs_service" "api" {
  name                              = "api"
  cluster                           = aws_ecs_cluster.this.arn
  task_definition                   = aws_ecs_task_definition.api.arn
  desired_count                     = 1
  launch_type                       = "FARGATE"
  platform_version                  = "1.4.0"
  health_check_grace_period_seconds = 60
  enable_execute_command            = true

  network_configuration {
    assign_public_ip = true
    security_groups  = [module.nginx_sg.security_group_id]

    subnets = [
      aws_subnet.private_0.id,
      aws_subnet.private_1.id,
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "nginx"
    container_port   = 80
  }

  lifecycle {
    ignore_changes = [
      desired_count,
      task_definition,
      load_balancer,
    ]
  }
}

data "aws_iam_policy" "ecs_task_execution_role_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_task_execution" {
  source_policy_documents = [data.aws_iam_policy.ecs_task_execution_role_policy.policy]

  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameters",
      "kms:Decrypt",
      "s3:*"
    ]
    resources = ["*"]
  }
}

module "ecs_task_execution_role" {
  source     = "../../modules/iam_role"
  name       = "EcsTaskExecution"
  identifier = "ecs-tasks.amazonaws.com"
  policy     = data.aws_iam_policy_document.ecs_task_execution.json
}

resource "aws_iam_role" "ecs_task" {
  assume_role_policy = <<POLICY
{
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Sid": ""
    }
  ],
  "Version": "2012-10-17"
}
POLICY

  max_session_duration = "3600"
  name                 = "EcsTaskRole"
  path                 = "/"
}

resource "aws_iam_policy" "ecs_exec" {
  name   = "EcsExec"
  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Action": [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
        ],
      "Resource": "*"
      }
    ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "ecs_exec" {
  policy_arn = aws_iam_policy.ecs_exec.arn
  role       = aws_iam_role.ecs_task.name
}

module "nginx_sg" {
  source      = "../../modules/sg"
  name        = "nginx-sg"
  vpc_id      = aws_vpc.this.id
  port        = 80
  cidr_blocks = [aws_vpc.this.cidr_block]
}

module "node_sg" {
  source      = "../../modules/sg"
  name        = "node-sg"
  vpc_id      = aws_vpc.this.id
  port        = 3000
  cidr_blocks = [aws_vpc.this.cidr_block]
}

resource "aws_security_group" "allow_all" {
  vpc_id      = aws_vpc.this.id
  name        = "allow-all"
  description = "Allow all inbound traffic"
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
