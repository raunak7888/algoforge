#!/bin/bash

# --- Strict Mode ---
set -euo pipefail
IFS=$'\n\t'

# Output file path
OUTPUT_FILE="project_context.md"

# Clear or create output file
: > "$OUTPUT_FILE"

echo "=========================================================="
echo "Generating Project Context for AI..."
echo "Output file: $OUTPUT_FILE"
echo "=========================================================="

# Write header to output file
cat << 'EOF' >> "$OUTPUT_FILE"
# Project Context: AlgoForge

This document provides context about the project structure and source code to help understand its architecture, logic, and functionality.

EOF

# 1. Append README.md if it exists
if [ -f "README.md" ]; then
    echo "Adding README.md..."
    cat << 'EOF' >> "$OUTPUT_FILE"
## Project Overview (README)

```markdown
EOF
    cat "README.md" >> "$OUTPUT_FILE"
    echo -e "\n\`\`\`\n" >> "$OUTPUT_FILE"
fi

# 2. Append Directory Tree Structure
echo "Adding Project Structure..."
cat << 'EOF' >> "$OUTPUT_FILE"
## Directory Structure

```text
EOF

# Use find and awk to generate a clean text tree structure (similar to your sss.sh)
find . \
    \( \
    -path "./.git" -o \
    -path "*/node_modules" -o \
    -path "*/.next" -o \
    -path "*/dist" -o \
    -path "*/build" -o \
    -path "*/.cache" \
    \) -prune -o \
    -print | sort | awk -F/ '
BEGIN {
    print "."
}
NR > 1 {
    depth = NF - 1
    for(i=2;i<NF;i++)
        printf "│   "
    printf "├── %s\n",$NF
}
' >> "$OUTPUT_FILE"

echo -e "\`\`\`\n" >> "$OUTPUT_FILE"

# 3. Helper function to append a file with appropriate syntax highlighting
append_file() {
    local filepath="$1"
    if [ -f "$filepath" ]; then
        echo "Adding $filepath..."
        
        # Determine language for markdown syntax highlighting
        local lang="txt"
        case "$filepath" in
            *.ts) lang="typescript" ;;
            *.tsx) lang="tsx" ;;
            *.js) lang="javascript" ;;
            *.jsx) lang="jsx" ;;
            *.json) lang="json" ;;
            *.prisma) lang="prisma" ;;
            *.yaml|*.yml) lang="yaml" ;;
            *.md) lang="markdown" ;;
            *.sh) lang="bash" ;;
        esac

        {
            echo "### File: $filepath"
            echo ""
            echo "\`\`\`$lang"
            cat "$filepath"
            echo ""
            echo "\`\`\`"
            echo ""
        } >> "$OUTPUT_FILE"
    fi
}

# 4. Curated list of important files that define the project's core logic
IMPORTANT_FILES=(
    # Root Configurations
    "package.json"
    "pnpm-workspace.yaml"
    "docker-compose.yml"

    # Database Schema
    "packages/db/prisma/schema.prisma"
    "packages/db/src/index.ts"

    # Shared Package Logic
    "packages/analysis/src/schema.ts"
    "packages/forge/src/types.ts"
    "packages/forge/src/recorder.ts"

    # Express API (Backend Entrypoints & Core Logic)
    "apps/api/src/server.ts"
    "apps/api/src/app.ts"
    "apps/api/src/routes/analysis.ts"
    "apps/api/src/controllers/analysis.controller.ts"
    "apps/api/src/services/analysis.service.ts"
    "apps/api/src/prompts/analysis.prompt.ts"

    # Next.js Web (Frontend Entrypoint & Core UI Components)
    "apps/web/src/app/page.tsx"
    "apps/web/src/components/AnalysisForm.tsx"
    "apps/web/src/components/AnalysisResult.tsx"
)

echo "Adding important files..."
for file in "${IMPORTANT_FILES[@]}"; do
    append_file "$file"
done

echo "=========================================================="
echo "Done! Project context collected in $OUTPUT_FILE"
echo "=========================================================="
