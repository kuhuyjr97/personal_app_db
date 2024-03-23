# API Alb
resource "aws_lb" "api" {
  name                       = "${var.project_name}-api-alb"
  load_balancer_type         = "application"
  internal                   = false
  idle_timeout               = 60
  enable_deletion_protection = true
  subnets = [
    aws_subnet.public_0.id,
    aws_subnet.public_1.id,
  ]
  access_logs {
    bucket  = aws_s3_bucket.api_alb_log.id
    enabled = true
  }
  security_groups = [
    module.http_sg.security_group_id,
    module.https_sg.security_group_id,
  ]
}

# API Target Group
resource "aws_lb_target_group" "api" {
  name                 = "api"
  target_type          = "ip"
  vpc_id               = aws_vpc.this.id
  port                 = 80
  protocol             = "HTTP"
  deregistration_delay = 300

  health_check {
    path                = "/rpa/health"
    healthy_threshold   = 5
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = 200
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  depends_on = [aws_lb.api]
}

# API Listener
resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener_rule" "api_http" {
  listener_arn = aws_lb_listener.api_http.arn
  priority     = 100

  lifecycle {
    ignore_changes = [action]
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

resource "aws_lb_listener" "api_https" {
  load_balancer_arn = aws_lb.api.arn
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn   = var.acm_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-2016-08"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# API Listener Rules
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.api_https.arn
  priority     = 100

  lifecycle {
    ignore_changes = [action]
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# Security Group
module "http_sg" {
  source      = "../../modules/sg"
  name        = "http-sg"
  vpc_id      = aws_vpc.this.id
  port        = 80
  cidr_blocks = ["0.0.0.0/0"]
}

module "https_sg" {
  source      = "../../modules/sg"
  name        = "https-sg"
  vpc_id      = aws_vpc.this.id
  port        = 443
  cidr_blocks = ["0.0.0.0/0"]
}

module "http_green_sg" {
  source      = "../../modules/sg"
  name        = "http-green-sg"
  vpc_id      = aws_vpc.this.id
  port        = 8080
  cidr_blocks = ["0.0.0.0/0"]
}

