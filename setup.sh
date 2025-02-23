#!/bin/bash

# Update package list
echo "Updating package list..."
sudo apt-get update -y

# Install necessary packages
echo "Installing necessary packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    build-essential

# Install NVM (Node Version Manager)
echo "Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Load NVM
eval "
  export NVM_DIR=\"$HOME/.nvm\"  
  [ -s \"$NVM_DIR/nvm.sh\" ] && \ . \"$NVM_DIR/nvm.sh\"  # This loads nvm
  [ -s \"$NVM_DIR/bash_completion\" ] && \ . \"$NVM_DIR/bash_completion\"  # This loads nvm bash_completion
"

# Install Node.js version 22.6
nvm install 22.6
nvm alias default 22.6

# Install Docker
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable"
sudo apt-get update -y
sudo apt-get install -y docker-ce

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
echo "Verifying Docker installation..."
sudo systemctl start docker
sudo systemctl enable docker
docker --version
docker-compose --version

echo "Setup complete! Now you can run docker-compose up --build"
exit
