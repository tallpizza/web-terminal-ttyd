#!/bin/bash

# GitHub Release Creation Script
# Creates a new release with assets and changelog

set -e

# Configuration
REPO_OWNER="yourusername"
REPO_NAME="web-terminal"
GITHUB_API="https://api.github.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_usage() {
    echo "Usage: $0 <version> [options]"
    echo ""
    echo "Options:"
    echo "  -t, --token <token>    GitHub personal access token (or set GITHUB_TOKEN env)"
    echo "  -d, --draft            Create as draft release"
    echo "  -p, --prerelease       Mark as pre-release"
    echo "  -b, --branch <branch>  Target branch (default: main)"
    echo "  -n, --notes <file>     Release notes file (default: auto-generate)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 v1.0.0 --token ghp_xxxxx --draft"
}

print_error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Parse arguments
VERSION=""
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
DRAFT="false"
PRERELEASE="false"
BRANCH="main"
NOTES_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token)
            GITHUB_TOKEN="$2"
            shift 2
            ;;
        -d|--draft)
            DRAFT="true"
            shift
            ;;
        -p|--prerelease)
            PRERELEASE="true"
            shift
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -n|--notes)
            NOTES_FILE="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        v*)
            VERSION="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate inputs
if [ -z "$VERSION" ]; then
    print_error "Version is required"
    print_usage
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GitHub token is required (use -t or set GITHUB_TOKEN env)"
    exit 1
fi

# Validate version format
if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., v1.0.0 or v1.0.0-beta)"
    exit 1
fi

print_info "Creating release $VERSION..."

# Generate release notes
if [ -z "$NOTES_FILE" ]; then
    print_info "Generating release notes from CHANGELOG.md..."
    
    # Extract section for this version from CHANGELOG.md
    RELEASE_NOTES=$(awk "/## \[${VERSION#v}\]/{flag=1; next} /## \[/{flag=0} flag" CHANGELOG.md)
    
    if [ -z "$RELEASE_NOTES" ]; then
        print_info "No changelog entry found for $VERSION, using default notes"
        RELEASE_NOTES="Release $VERSION

## What's Changed
Please see the [full changelog](https://github.com/$REPO_OWNER/$REPO_NAME/blob/$BRANCH/CHANGELOG.md) for details.

## Installation

### Quick Install (Unix/Linux/macOS)
\`\`\`bash
curl -fsSL https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$VERSION/install.sh | bash
\`\`\`

### Docker
\`\`\`bash
docker pull $REPO_OWNER/$REPO_NAME:$VERSION
\`\`\`

### Manual Download
Download the appropriate binary for your platform from the assets below.

## Checksums
See \`checksums.txt\` in the release assets for SHA256 checksums of all files."
    fi
else
    print_info "Using release notes from $NOTES_FILE"
    RELEASE_NOTES=$(cat "$NOTES_FILE")
fi

# Build binaries if not already built
if [ ! -d "dist/packages" ]; then
    print_info "Building binaries..."
    npm run build:binaries
fi

# Create git tag if it doesn't exist
if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
    print_info "Creating git tag $VERSION..."
    git tag -a "$VERSION" -m "Release $VERSION"
    git push origin "$VERSION"
else
    print_info "Tag $VERSION already exists"
fi

# Create release via GitHub API
print_info "Creating GitHub release..."

RELEASE_DATA=$(cat <<EOF
{
  "tag_name": "$VERSION",
  "target_commitish": "$BRANCH",
  "name": "Web Terminal $VERSION",
  "body": $(echo "$RELEASE_NOTES" | jq -Rs .),
  "draft": $DRAFT,
  "prerelease": $PRERELEASE,
  "generate_release_notes": false
}
EOF
)

RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "$GITHUB_API/repos/$REPO_OWNER/$REPO_NAME/releases" \
    -d "$RELEASE_DATA")

# Check if release was created successfully
RELEASE_ID=$(echo "$RESPONSE" | jq -r '.id')
if [ "$RELEASE_ID" == "null" ]; then
    print_error "Failed to create release"
    echo "$RESPONSE" | jq .
    exit 1
fi

UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.upload_url' | sed 's/{?name,label}//')
print_success "Release created with ID: $RELEASE_ID"

# Upload assets
print_info "Uploading release assets..."

upload_asset() {
    local file=$1
    local name=$(basename "$file")
    
    # Determine content type
    case "$name" in
        *.tar.gz)
            content_type="application/gzip"
            ;;
        *.zip)
            content_type="application/zip"
            ;;
        *.txt)
            content_type="text/plain"
            ;;
        *.md)
            content_type="text/markdown"
            ;;
        *)
            content_type="application/octet-stream"
            ;;
    esac
    
    print_info "Uploading $name..."
    
    UPLOAD_RESPONSE=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: $content_type" \
        --data-binary "@$file" \
        "$UPLOAD_URL?name=$name")
    
    ASSET_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
    if [ "$ASSET_ID" == "null" ]; then
        print_error "Failed to upload $name"
        echo "$UPLOAD_RESPONSE" | jq .
        return 1
    else
        print_success "Uploaded $name"
        return 0
    fi
}

# Upload all packages
for package in dist/packages/*; do
    if [ -f "$package" ]; then
        upload_asset "$package"
    fi
done

# Upload additional files
upload_asset "README.md"
upload_asset "LICENSE"
upload_asset "CHANGELOG.md"
upload_asset ".env.example"

# Create and upload install scripts archive
print_info "Creating install scripts archive..."
tar -czf dist/install-scripts.tar.gz install.sh install.ps1
upload_asset "dist/install-scripts.tar.gz"

# Get release URL
RELEASE_URL=$(echo "$RESPONSE" | jq -r '.html_url')

print_success "Release created successfully!"
print_info "Release URL: $RELEASE_URL"

if [ "$DRAFT" == "true" ]; then
    print_info "Release created as draft. Visit the URL above to publish it."
fi

# Cleanup
rm -f dist/install-scripts.tar.gz

exit 0