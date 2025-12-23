export function hasRole(userRoles: string[], allowedRoles: string[]) {
  return userRoles.some((r) => allowedRoles.includes(r));
}
