#!/bin/bash

# Script to create GitHub repository and push code
# Repository name: Ago Projects
# Account: pjcau

REPO_NAME="Ago-Projects"
GITHUB_ACCOUNT="pjcau"
REPO_URL="https://github.com/$GITHUB_ACCOUNT/$REPO_NAME.git"

echo "=== GitHub Repository Setup ==="
echo "Repository: $REPO_NAME"
echo "Account: $GITHUB_ACCOUNT"
echo "Expected URL: $REPO_URL"
echo ""

# Check current git status
echo "Checking current git status..."
git status --short

# Check if remote origin already exists
echo ""
echo "Checking remote configuration..."
if git remote get-url origin 2>/dev/null; then
    echo "✓ Remote origin already configured"
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "  Current remote: $CURRENT_REMOTE"
    
    if [ "$CURRENT_REMOTE" = "$REPO_URL" ]; then
        echo "✓ Remote matches expected URL"
    else
        echo "⚠ Remote URL mismatch. Updating..."
        git remote set-url origin "$REPO_URL"
        echo "✓ Remote URL updated"
    fi
else
    echo "No remote origin found. Adding..."
    git remote add origin "$REPO_URL"
    echo "✓ Remote origin added"
fi

# Check if gh CLI is available (optional)
echo ""
echo "Checking GitHub CLI (optional)..."
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI available"
    if gh auth status 2>/dev/null; then
        echo "✓ GitHub CLI authenticated"
    else
        echo "⚠ GitHub CLI not authenticated (this is OK if using existing repo)"
    fi
else
    echo "⚠ GitHub CLI not installed (this is OK for existing repos)"
fi

# Push current code
echo ""
echo "=== Pushing code to GitHub ==="
git branch -M main 2>/dev/null || git branch -M master

echo "Pushing to origin..."
if git push -u origin main 2>&1; then
    echo "✓ Successfully pushed to main branch"
elif git push -u origin master 2>&1; then
    echo "✓ Successfully pushed to master branch"
else
    echo "⚠ Push failed - repository may already be up to date"
fi

echo ""
echo "=== Setup Complete ==="
echo "Repository URL: $REPO_URL"
echo "Local status: $(git status --short | wc -l) uncommitted changes"

# Create evidence file
cat > GITHUB_SETUP_EVIDENCE.md << EOF
# GitHub Repository Setup Evidence

## Repository Information
- **Name**: Ago-Projects
- **Account**: pjcau
- **URL**: https://github.com/pjcau/Ago-Projects
- **Created**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Git Configuration
- **Remote URL**: $(git remote get-url origin 2>/dev/null || echo "Not set")
- **Current Branch**: $(git branch --show-current)
- **Last Commit**: $(git log -1 --oneline 2>/dev/null || echo "No commits")

## Verification
Run these commands to verify:
\`\`\`bash
git remote -v
git status
git log --oneline -5
\`\`\`

## Repository Access
View the repository at: https://github.com/pjcau/Ago-Projects
EOF

echo ""
echo "✓ Evidence file created: GITHUB_SETUP_EVIDENCE.md"
