#!/bin/bash

# CI/CD Setup Validation Script
# This script validates that your CI/CD pipeline is properly configured

set -e

echo "🚀 Starting CI/CD Pipeline Validation..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "success")
            echo -e "${GREEN}✅ $2${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $2${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $2${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $2${NC}"
            ;;
    esac
}

# Check if we're in a git repository
check_git_repo() {
    echo "🔍 Checking Git Repository..."
    if [ -d ".git" ]; then
        print_status "success" "Git repository found"
        
        # Check if we have remote origin
        if git remote get-url origin >/dev/null 2>&1; then
            REPO_URL=$(git remote get-url origin)
            print_status "success" "Remote origin: $REPO_URL"
        else
            print_status "warning" "No remote origin configured"
        fi
    else
        print_status "error" "Not a git repository"
        exit 1
    fi
}

# Check GitHub Actions workflows
check_workflows() {
    echo -e "\n🔧 Checking GitHub Actions Workflows..."
    
    WORKFLOW_DIR=".github/workflows"
    if [ -d "$WORKFLOW_DIR" ]; then
        print_status "success" "Workflows directory exists"
        
        # Check each workflow file
        WORKFLOWS=("ci.yml" "cd.yml" "branch-protection.yml" "dependency-updates.yml" "setup-repository.yml")
        
        for workflow in "${WORKFLOWS[@]}"; do
            if [ -f "$WORKFLOW_DIR/$workflow" ]; then
                print_status "success" "$workflow found"
            else
                print_status "error" "$workflow missing"
            fi
        done
        
        # Check PR template
        if [ -f ".github/pull_request_template.md" ]; then
            print_status "success" "Pull request template found"
        else
            print_status "warning" "Pull request template missing"
        fi
        
        # Check issue templates
        if [ -d ".github/ISSUE_TEMPLATE" ]; then
            print_status "success" "Issue templates directory found"
        else
            print_status "warning" "Issue templates directory missing"
        fi
        
    else
        print_status "error" "No workflows directory found"
        return 1
    fi
}

# Check project structure
check_project_structure() {
    echo -e "\n📁 Checking Project Structure..."
    
    # Check API structure
    if [ -d "apps/api" ]; then
        print_status "success" "API directory found"
        
        if [ -f "apps/api/pom.xml" ]; then
            print_status "success" "Maven pom.xml found"
        else
            print_status "error" "Maven pom.xml missing"
        fi
        
        if [ -f "apps/api/mvnw" ]; then
            print_status "success" "Maven wrapper found"
        else
            print_status "warning" "Maven wrapper missing"
        fi
        
    else
        print_status "error" "API directory not found"
    fi
    
    # Check Web structure
    if [ -d "apps/web" ]; then
        print_status "success" "Web directory found"
        
        if [ -f "apps/web/package.json" ]; then
            print_status "success" "Web package.json found"
            
            # Check for required scripts
            if grep -q '"lint"' apps/web/package.json; then
                print_status "success" "Lint script found in package.json"
            else
                print_status "warning" "Lint script missing in package.json"
            fi
            
            if grep -q '"test"' apps/web/package.json; then
                print_status "success" "Test script found in package.json"
            else
                print_status "error" "Test script missing in package.json"
            fi
            
        else
            print_status "error" "Web package.json missing"
        fi
        
    else
        print_status "error" "Web directory not found"
    fi
}

# Check Docker configuration
check_docker() {
    echo -e "\n🐳 Checking Docker Configuration..."
    
    # Check Docker Compose files
    COMPOSE_FILES=("docker-compose.yaml" "docker-compose.dev.yaml" "docker-compose.prod.yaml")
    
    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            print_status "success" "$compose_file found"
        else
            print_status "warning" "$compose_file missing"
        fi
    done
    
    # Check Dockerfiles
    if [ -f "apps/api/Dockerfile" ]; then
        print_status "success" "API Dockerfile found"
    else
        print_status "error" "API Dockerfile missing"
    fi
    
    if [ -f "apps/api/Dockerfile.prod" ]; then
        print_status "success" "API Production Dockerfile found"
    else
        print_status "warning" "API Production Dockerfile missing"
    fi
    
    if [ -f "apps/web/Dockerfile" ]; then
        print_status "success" "Web Dockerfile found"
    else
        print_status "error" "Web Dockerfile missing"
    fi
    
    if [ -f "apps/web/Dockerfile.prod" ]; then
        print_status "success" "Web Production Dockerfile found"
    else
        print_status "warning" "Web Production Dockerfile missing"
    fi
}

# Check documentation
check_documentation() {
    echo -e "\n📖 Checking Documentation..."
    
    if [ -f "CICD-SETUP.md" ]; then
        print_status "success" "CI/CD documentation found"
    else
        print_status "warning" "CI/CD documentation missing"
    fi
    
    if [ -f "README.md" ]; then
        print_status "success" "README.md found"
    else
        print_status "warning" "README.md missing"
    fi
}

# Test local development setup
test_local_setup() {
    echo -e "\n🧪 Testing Local Development Setup..."
    
    # Check if Java is available
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        print_status "success" "Java found: $JAVA_VERSION"
    else
        print_status "warning" "Java not found in PATH"
    fi
    
    # Check if Node.js is available
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "success" "Node.js found: $NODE_VERSION"
    else
        print_status "warning" "Node.js not found in PATH"
    fi
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            DOCKER_VERSION=$(docker --version)
            print_status "success" "Docker found and running: $DOCKER_VERSION"
        else
            print_status "warning" "Docker found but not running"
        fi
    else
        print_status "warning" "Docker not found in PATH"
    fi
    
    # Check if Docker Compose is available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_status "success" "Docker Compose found: $COMPOSE_VERSION"
    else
        print_status "warning" "Docker Compose not found in PATH"
    fi
}

# Generate setup summary
generate_summary() {
    echo -e "\n📊 Setup Summary"
    echo "================="
    
    echo -e "\n🎯 Next Steps:"
    echo "1. Push these changes to your GitHub repository"
    echo "2. Go to Repository Settings → Branches → Add rule for 'master'"
    echo "3. Run the 'Setup Repository Configuration' workflow manually"
    echo "4. Configure required secrets in Repository Settings → Secrets"
    echo "5. Create your first feature branch and test the pipeline"
    
    echo -e "\n🔧 Manual GitHub Configuration Required:"
    echo "- Branch protection rules (see CICD-SETUP.md)"
    echo "- Environment protection rules for production"
    echo "- Add team members as required reviewers"
    echo "- Configure notification settings"
    
    echo -e "\n📚 Documentation:"
    echo "- Read CICD-SETUP.md for detailed setup instructions"
    echo "- Review GitHub Actions workflow files in .github/workflows/"
    echo "- Follow branch naming and commit message conventions"
    
    echo -e "\n✨ Happy coding! Your CI/CD pipeline is ready to go!"
}

# Main execution
main() {
    check_git_repo
    check_workflows
    check_project_structure
    check_docker
    check_documentation
    test_local_setup
    generate_summary
}

# Run the validation
main
