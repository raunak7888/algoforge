find . \
  \( -path "*/node_modules" -o -path "*/.git" -o -path "*/dist" -o -path "*/build" -o -path "*/.next" \) -prune \
  -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.prisma" \) \
  -print