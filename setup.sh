#!/bin/bash

# Update package list
echo "Updating package list..."
yes | sudo apt-get update -y

# Install necessary packages
echo "Installing necessary packages..."
yes | sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    build-essential

# Install NVM (Node Version Manager)
echo "Installing NVM..."
yes | curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Check if nvm is loaded
if command -v nvm &> /dev/null; then
    # Install Node.js version 22.6
    yes | nvm install 22.6
    yes | nvm alias default 22.6
else
    echo "NVM could not be loaded. Please check the installation."
    exit 1
fi

# Install Docker
echo "Installing Docker..."
yes | curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
yes | sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable"
yes | sudo apt-get update -y
yes | sudo apt-get install -y docker-ce

# Install Docker Compose
echo "Installing Docker Compose..."
yes | sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
yes | sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
echo "Verifying Docker installation..."
yes | sudo systemctl start docker
yes | sudo systemctl enable docker
docker --version
docker-compose --version

# Add user to docker group
echo "Adding user to docker group..."
sudo usermod -aG docker $USER
sudo su - $USER

echo "Setup complete! Now you can run docker-compose up --build"
exit
