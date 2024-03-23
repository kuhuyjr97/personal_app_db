resource "aws_ssm_parameter" "aws_asset_public" {
  name        = "/app/aws_s3_bucket"
  value       = aws_s3_bucket.public.bucket
  type        = "String"
  description = "S3 bucket name for public"
}

resource "aws_ssm_parameter" "aws_access_key_id" {
  name        = "/app/aws_access_key_id"
  value       = aws_iam_access_key.node.id
  type        = "String"
  description = "AWS Access Key ID"
}

resource "aws_ssm_parameter" "aws_secret_access_key" {
  name        = "/app/aws_secret_access_key"
  value       = aws_iam_access_key.node.secret
  type        = "SecureString"
  description = "AWS Secret Access Key"
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/app/database_url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.core.username}:${var.rds_password}@${aws_db_instance.core.endpoint}/${aws_db_instance.core.db_name}"
}

resource "aws_ssm_parameter" "app_env" {
  name  = "/app/app_env"
  type  = "String"
  value = var.env
}

resource "aws_ssm_parameter" "aws_region" {
  name  = "/app/aws_region"
  type  = "String"
  value = var.aws_region
}