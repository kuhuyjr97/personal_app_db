terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.5.0"

  backend "s3" {
    bucket = "affiliate-stg-terraform"
    key = "terraform.tfstate"
    region = "ap-northeast-1"
  }
}
