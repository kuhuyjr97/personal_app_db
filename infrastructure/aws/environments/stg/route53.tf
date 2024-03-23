# # Route53
# resource "aws_route53_zone" "this" {
#   name = var.domain
# }

# # Api sub domain
# resource "aws_route53_record" "api" {
#   zone_id = aws_route53_zone.this.zone_id
#   name    = "stg-api.${aws_route53_zone.this.name}"
#   type    = "A"

#   alias {
#     name                   = aws_lb.api.dns_name
#     zone_id                = aws_lb.api.zone_id
#     evaluate_target_health = true
#   }
# }

# # web sub domain
# resource "aws_route53_record" "web" {
#   zone_id = aws_route53_zone.this.zone_id
#   name    = "stg-admin.${aws_route53_zone.this.name}"
#   type    = "A"

#   alias {
#     name                   = aws_lb.web.dns_name
#     zone_id                = aws_lb.web.zone_id
#     evaluate_target_health = true
#   }
# }

# # ACM
# resource "aws_acm_certificate" "this" {
#   domain_name               = var.domain
#   subject_alternative_names = ["*.${var.domain}"]
#   validation_method         = "DNS"

#   lifecycle {
#     create_before_destroy = true
#   }
# }
# resource "aws_route53_record" "certificate1" {
#   for_each = {
#     for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }

#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = aws_route53_zone.this.id
# }

# resource "aws_acm_certificate_validation" "this" {
#   certificate_arn         = aws_acm_certificate.this.arn
#   validation_record_fqdns = [for record in aws_route53_record.certificate1 : record.fqdn]
# }
