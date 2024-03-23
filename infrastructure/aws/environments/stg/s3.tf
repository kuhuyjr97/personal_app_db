resource "aws_s3_bucket" "public" {
  bucket = "${var.project_name}-public"

  tags = {
    folder_name = "public"
  }
}

resource "aws_s3_bucket" "assets" {
  bucket = "${var.project_name}-assets"
}

resource "aws_s3_bucket" "api_alb_log" {
  bucket = "${var.project_name}-api-alb-logs"
}
resource "aws_s3_bucket_policy" "api_alb_log" {
  bucket = aws_s3_bucket.api_alb_log.id
  policy = data.aws_iam_policy_document.api_alb_log.json
}
data "aws_iam_policy_document" "api_alb_log" {
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${aws_s3_bucket.api_alb_log.id}/*"]
    principals {
      type        = "AWS"
      identifiers = ["${var.aws_account_id}"]
    }
  }
}
