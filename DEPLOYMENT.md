# GoBudget Deployment Guide

## Prerequisites

1. **Hetzner VPS** with Docker and Docker Compose installed
2. **SSH Key** for ### 1. **DNS Resolution Issues**
   ```bash
   # Test DNS resolution from your local machine
   nslookup your-domain.com

   # If DNS fails, use your VPS IP address instead
   # Update VPS_HOST secret to: 123.456.789.0 (your actual IP)
   ```

   **Common Solutions:**
   - **Use IP Address**: Replace domain with direct IP in `VPS_HOST` secret
   - **Check Domain**: Ensure domain is properly configured and propagated
   - **Firewall**: Verify VPS firewall allows connections from GitHub Actions IPs
   - **DNS Propagation**: Wait 24-48 hours if domain was recently changed

### 2. **Quick Fix - Use IP Address**
   If DNS continues to fail, update your `VPS_HOST` secret to use your VPS's IP address directly:

   **Find your VPS IP:**
   ```bash
   # From Hetzner Console:
   # 1. Go to your project dashboard
   # 2. Click on your server
   # 3. Copy the IPv4 address

   # Or from your VPS (if you can access it):
   curl ifconfig.me
   hostname -I

   # Then update the VPS_HOST secret in GitHub to: 123.456.789.0
   ```

   **Why this happens:**
   - GitHub Actions runners may have DNS resolution issues with certain domains
   - Using IP address bypasses DNS entirely
   - This is a common workaround for deployment issues

### 3. **SSH Connection Issues**
   ```bash
   # Test SSH connection
   ssh -T user@your-vps-ip

   # Check SSH key permissions
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

   **Common Issues:**
   - **Wrong secret names**: Make sure you're using `VPS_USERNAME`, `VPS_SSH_KEY`, etc.
   - **SSH key format**: Ensure your private key is properly formatted
   - **Passphrase**: If your SSH key has a passphrase, set `VPS_SSH_PASSPHRASE` secret

   **Common Issues:**
   - **Wrong secret names**: Make sure you're using `VPS_USERNAME`, `VPS_SSH_KEY`, etc. (not the old names)
   - **SSH key format**: Ensure your private key is properly formatted (no extra spaces or line breaks)
   - **Passphrase**: If your SSH key has a passphrase, set `VPS_SSH_PASSPHRASE` secretess authentication
3. **GitHub Repository** with proper permissions

## GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets:

1. **VPS_HOST**
   - Your VPS IP address or domain name
   - Example: `gobudget.duckdns.org` or `123.456.789.0`

2. **VPS_USERNAME**
   - SSH username for your VPS
   - Usually: `root` or your sudo user

3. **VPS_SSH_KEY**
   - Your private SSH key for connecting to the VPS
   - Generate with: `ssh-keygen -t rsa -b 4096 -C "github-actions@gobudget.duckdns.org"`
   - Copy the private key content (not the .pub file)

4. **VPS_SSH_PASSPHRASE** (optional)
   - Passphrase for your SSH key (if you set one)
   - Leave empty if your SSH key has no passphrase

5. **DB_PASSWORD**
   - Database password for PostgreSQL
   - Should match: `Secure1!`

6. **JWT_SECRET**
   - JWT secret key for authentication
   - Use the same one from your `.env` file

## VPS Setup

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for Docker group to take effect
```

### 2. Create Project Directory

```bash
mkdir -p ~/gobudget
cd ~/gobudget
```

**Note:** The GitHub Actions workflow will deploy to `/home/gobudget/GoBudget` on your VPS.

### 3. Set up SSH Key Authentication

```bash
# On your local machine, copy your public key
ssh-copy-id user@your-vps-ip

# Or manually add to authorized_keys
echo "your-public-key-here" >> ~/.ssh/authorized_keys
```

### 4. Create External Network (if using portfolio_default)

```bash
# If you have an existing portfolio network, join it
docker network create portfolio_default
# Or connect to existing network if it already exists
```

### 5. Run Health Check

After setup, run the health check script:

```bash
wget https://raw.githubusercontent.com/yourusername/gobudget/main/health-check.sh
chmod +x health-check.sh
./health-check.sh
```

## Deployment

### Automatic Deployment

Once secrets are configured, deployment happens automatically on:
- Push to `main` branch
- Manual trigger via GitHub Actions

### Manual Deployment

You can also trigger deployment manually:
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Production" workflow
4. Click "Run workflow"

## Monitoring Deployment

### Check Deployment Status

```bash
# SSH into your VPS
ssh user@your-vps-ip
cd ~/gobudget

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check container health
docker-compose exec backend curl -f http://localhost:8000/
```

### Troubleshooting

1. **SSH Connection Issues**
   ```bash
   # Test SSH connection
   ssh -T user@your-vps-ip

   # Check SSH key permissions
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

2. **Container Issues**
   ```bash
   # Restart services
   docker-compose restart

   # Rebuild and restart
   docker-compose up -d --build
   ```

3. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose exec postgres pg_isready

   # Check database logs
   docker-compose logs postgres
   ```

## Environment Variables

The deployment uses these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint
- `NEXT_PUBLIC_APP_URL`: Frontend application URL
- `DOMAIN`: Domain name for SSL

## SSL Certificate

Since you mentioned SSL is already set up, make sure:
1. SSL certificates are properly configured
2. Nginx/Caddy is proxying requests correctly
3. SSL certificates are renewed automatically

## Post-Deployment

After successful deployment:

1. **Verify Services**
   ```bash
   curl https://gobudget.duckdns.org/
   curl https://gobudget.duckdns.org/api/
   ```

2. **Check Application Logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

3. **Database Migration**
   ```bash
   docker-compose exec backend python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"
   ```

## Security Notes

- SSH keys are more secure than passwords
- Database password is stored as a GitHub secret
- JWT secret should be strong and unique
- Consider using Docker secrets for sensitive data in production
- Regularly rotate SSH keys and secrets
- The workflow uses `StrictHostKeyChecking=no` for automation (acceptable for private VPS deployments)

## Rollback

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Pull previous working version (if tagged)
docker pull ghcr.io/yourusername/gobudget/backend:v1.0.0
docker pull ghcr.io/yourusername/gobudget/frontend:v1.0.0

# Update docker-compose.yml with specific tags
# Then restart
docker-compose up -d
```
