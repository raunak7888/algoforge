// Approve Prisma build scripts in pnpm
function readPackage(pkg) {
  return pkg;
}

module.exports = { hooks: { readPackage } };
