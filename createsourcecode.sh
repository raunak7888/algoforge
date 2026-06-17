#!/bin/bash

# --- Strict Mode ---
set -euo pipefail
IFS=$'\n\t'

# Configuration
OUTPUT_FILE="sourcecode.txt"
# Using an array for extensions is cleaner and avoids globbing issues
EXTENSIONS=( -name "*.tsx" -o -name "*.ts" -o -name "*.prisma" )

# Initialize/Clear the output file
: > "$OUTPUT_FILE"

echo "Collecting source code into $OUTPUT_FILE..."

# Find files and process them
# The '|| true' at the end of find is a safety measure for strict mode 
# in case find returns a non-zero exit code but you want the script to continue.
find . \
    -path "./node_modules" -prune -o \
    -path "./dist" -prune -o \
    -path "./apps/web" -prune -o \
    \( "${EXTENSIONS[@]}" \) -print | while read -r file; do
        {
            echo "------------------------------------------------"
            echo "FILE: $file"
            echo "------------------------------------------------"
            cat "$file"
            echo -e "\n"
        } >> "$OUTPUT_FILE"
done

echo "Done! Processed files are saved in $OUTPUT_FILE."