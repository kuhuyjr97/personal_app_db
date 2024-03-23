# 固定のマスターAWSID(変更しない)
variable "aws_account_id" {
  default = "582318560864"
}

variable "project_name" {
  default = "affiliate-prod"
}

variable "account_id" {}
variable "domain" {}

variable "env" {
  default = "production"
}

variable "aws_region" {
  default = "ap-northeast-1"
}

variable "rds_dbname" {}
variable "rds_password" {}
variable "rds_username" {}

variable "acm_certificate_arn" {}
