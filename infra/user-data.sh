#!/bin/bash
# User data de la EC2 (Amazon Linux 2023, t3.nano): la deja lista para recibir despliegues.
# Se pega en "Advanced details -> User data" al lanzar la instancia. Corre UNA sola vez, como root.
set -euxo pipefail

# 1. PRIMERO 1 GB de swap: la t3.nano solo tiene 512 MB y sin swap "dnf install" muere por falta de memoria
dd if=/dev/zero of=/swapfile bs=1M count=1024
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

# 2. Docker
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# 3. Plugin "docker compose" (Amazon Linux 2023 no lo trae)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose


# 4. Carpeta donde el pipeline deja compose.prod.yml
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app
echo "LISTA PARA DESPLEGAR" > /home/ec2-user/LISTA.txt
