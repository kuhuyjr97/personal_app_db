resource "aws_wafregional_regex_pattern_set" "robot" {
  name = "robot_pattern"
  regex_pattern_strings = [
    ".php",
    ".env",
    "graphql",
    "instance-identity",
    "/api/v1/time",
    "cgi-bih"
  ]
}

resource "aws_wafregional_regex_match_set" "robot_set" {
  name = "robot_attach"

  regex_match_tuple {
    field_to_match {
      type = "URI"
    }

    regex_pattern_set_id = aws_wafregional_regex_pattern_set.robot.id
    text_transformation  = "NONE"
  }
}

resource "aws_wafregional_rule" "robot" {
  name        = "RobotAttachWAFRule"
  metric_name = "RobotAttachWAFRule"

  predicate {
    data_id = aws_wafregional_regex_match_set.robot_set.id
    negated = false
    type    = "RegexMatch"
  }
}

resource "aws_wafregional_web_acl" "robot_attach" {
  name        = "RobotAttachACl"
  metric_name = "RobotAttachACl"

  default_action {
    type = "ALLOW"
  }

  rule {
    action {
      type = "BLOCK"
    }

    priority = 1
    rule_id  = aws_wafregional_rule.robot.id
  }
}

resource "aws_wafregional_web_acl_association" "api" {
  resource_arn = aws_lb.api.arn
  web_acl_id   = aws_wafregional_web_acl.robot_attach.id
}
