export const Roles = ["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"] as const;
export type Role = typeof Roles[number];

export const roleRank: Record<Role, number> = {
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  ACCOUNTING: 1
};
