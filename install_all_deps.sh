#!/bin/bash

# MicroMerit Portal - Install All Dependencies Script
# This script installs dependencies for all 6 modules

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists yarn && ! command_exists npm; then
    print_error "Neither yarn nor npm is installed. Please install one of them."
    exit 1
fi

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

print_success "All prerequisites are installed!"

# Determine package manager
if command_exists yarn; then
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn install"
else
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
fi

print_status "Using package manager: $PKG_MANAGER"

# Get the script directory (project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
print_status "=========================================="
print_status "Installing MicroMerit Portal Dependencies"
print_status "=========================================="
echo ""

# Module 1: Main Backend (server/node-app)
echo ""
print_status "📦 [1/6] Installing Main Backend dependencies (server/node-app)..."
cd "$PROJECT_ROOT/server/node-app"
if [ -f "package.json" ]; then
    $INSTALL_CMD
    print_success "Main Backend dependencies installed!"
else
    print_error "package.json not found in server/node-app"
    exit 1
fi

# Module 2: AI Service (server/ai_groq_service)
echo ""
print_status "🤖 [2/6] Installing AI Service dependencies (server/ai_groq_service)..."
cd "$PROJECT_ROOT/server/ai_groq_service"
if [ -f "requirements.txt" ]; then
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install
    print_status "Activating virtual environment and installing packages..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    print_success "AI Service dependencies installed!"
else
    print_error "requirements.txt not found in server/ai_groq_service"
    exit 1
fi

# Module 3: Blockchain Service (server/blockchain)
echo ""
print_status "⛓️  [3/6] Installing Blockchain Service dependencies (server/blockchain)..."
cd "$PROJECT_ROOT/server/blockchain"
if [ -f "package.json" ]; then
    $INSTALL_CMD
    print_success "Blockchain Service dependencies installed!"
else
    print_error "package.json not found in server/blockchain"
    exit 1
fi

# Module 4: Main App (client/main-app)
echo ""
print_status "🌐 [4/6] Installing Main App dependencies (client/main-app)..."
cd "$PROJECT_ROOT/client/main-app"
if [ -f "package.json" ]; then
    $INSTALL_CMD
    print_success "Main App dependencies installed!"
else
    print_error "package.json not found in client/main-app"
    exit 1
fi

# Module 5: Admin Dashboard (client/admin)
echo ""
print_status "👨‍💼 [5/6] Installing Admin Dashboard dependencies (client/admin)..."
cd "$PROJECT_ROOT/client/admin"
if [ -f "package.json" ]; then
    $INSTALL_CMD
    print_success "Admin Dashboard dependencies installed!"
else
    print_error "package.json not found in client/admin"
    exit 1
fi

# Module 6: Dummy Server (dummy-server)
echo ""
print_status "🔧 [6/6] Installing Dummy Server dependencies (dummy-server)..."
cd "$PROJECT_ROOT/dummy-server"
if [ -f "package.json" ]; then
    $INSTALL_CMD
    print_success "Dummy Server dependencies installed!"
else
    print_warning "package.json not found in dummy-server (optional module)"
fi

# Return to project root
cd "$PROJECT_ROOT"

echo ""
print_status "=========================================="
print_success "✅ All dependencies installed successfully!"
print_status "=========================================="
echo ""

print_status "Next steps:"
echo "  1. Copy .env.example to .env in each module:"
echo "     - server/node-app/.env"
echo "     - server/ai_groq_service/.env"
echo "     - server/blockchain/.env"
echo "     - client/main-app/.env"
echo "     - client/admin/.env"
echo ""
echo "  2. Configure environment variables in each .env file"
echo ""
echo "  3. Setup PostgreSQL database:"
echo "     sudo -u postgres psql"
echo "     CREATE DATABASE micromerit;"
echo "     CREATE USER micromerit_user WITH PASSWORD 'your_password';"
echo "     GRANT ALL PRIVILEGES ON DATABASE micromerit TO micromerit_user;"
echo ""
echo "  4. Run database migrations:"
echo "     cd server/node-app"
echo "     npx prisma generate"
echo "     npx prisma migrate dev"
echo "     npx tsx prisma/seed.ts"
echo ""
echo "  5. Start all services (see QUICKSTART.md for details)"
echo ""

print_success "Installation complete! 🚀"
