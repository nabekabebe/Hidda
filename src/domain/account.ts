export interface AccountUser {
  id: string;
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface TreeRecord {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const USERS_KEY = "night-atlas.users.v1";
export const SESSION_KEY = "night-atlas.session.v1";
export const TREES_KEY = "night-atlas.trees.v1";
export const CURRENT_TREE_KEY = "night-atlas.current-tree";

export function treeStorageKey(treeId: string): string {
  return `night-atlas.tree.${treeId}`;
}

export function publicUser(user: AccountUser): Omit<AccountUser, "salt" | "hash"> {
  const { salt: _salt, hash: _hash, ...safe } = user;
  return safe;
}
