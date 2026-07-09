resource "aws_cloudwatch_log_group" "libops_backend_logs" {
  name              = "LibOps-Backend-Logs"
  retention_in_days = 14

  tags = {
    Name = "libops-backend-logs"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_utilization" {
  alarm_name          = "libops-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization for LibOps"
  
  dimensions = {
    InstanceId = aws_instance.libops_server.id
  }

  tags = {
    Name = "libops-high-cpu-alarm"
  }
}
