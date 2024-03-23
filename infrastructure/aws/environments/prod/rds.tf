# ParameterGroup
resource "aws_db_parameter_group" "db-pg" {
  name        = "${var.project_name}-pg"
  family      = "postgres14"
  description = "${var.project_name}-pg"
}

# SubnetGroup
resource "aws_db_subnet_group" "this" {
  name = "${var.project_name}-db-sn"
  subnet_ids = [
    aws_subnet.private_0.id,
    aws_subnet.private_1.id
  ]
}

# RDS
resource "aws_db_instance" "core" {
  identifier                      = "${var.project_name}-db"
  db_name                         = var.rds_dbname
  engine                          = "postgres"
  engine_version                  = "14.8"
  instance_class                  = "db.t3.small"
  allocated_storage               = 20
  max_allocated_storage           = 100
  storage_type                    = "gp2"
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.master.arn
  username                        = var.rds_username
  password                        = var.rds_password
  multi_az                        = false
  publicly_accessible             = false
  backup_window                   = "09:10-09:40"
  backup_retention_period         = 30
  maintenance_window              = "mon:10:10-mon:10:40"
  auto_minor_version_upgrade      = false
  deletion_protection             = true
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.project_name}-final-snapshot"
  port                            = 5432
  apply_immediately               = false
  vpc_security_group_ids          = [aws_security_group.postgres_sg.id]
  parameter_group_name            = aws_db_parameter_group.db-pg.name
  db_subnet_group_name            = aws_db_subnet_group.this.name
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  lifecycle {
    ignore_changes = [password]
  }
}

resource "aws_security_group" "postgres_sg" {
  name        = "postgres-sg"
  description = "Allow inbound traffic from bastion and VPC"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "PostgreSQL from bastion"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.bastion_sg.security_group_id]
  }

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.this.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "postgres-sg"
  }
}
