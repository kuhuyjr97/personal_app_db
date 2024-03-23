# EC2 instance for Bastion
resource "aws_instance" "bastion" {
  ami                    = "ami-08c84d37db8aafe00"
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.bastion_key.key_name
  vpc_security_group_ids = [module.bastion_sg.security_group_id]
  subnet_id              = aws_subnet.public_0.id

  tags = {
    Name = "BastionHost"
  }
}

# Security Group for Bastion
module "bastion_sg" {
  source      = "../../modules/sg"
  name        = "bastion-sg"
  vpc_id      = aws_vpc.this.id
  port        = 22
  cidr_blocks = ["0.0.0.0/0"]
}

# SSH key pair
resource "aws_key_pair" "bastion_key" {
  key_name   = "bastion_key"
  public_key = file("./id_rsa.pub")
}
