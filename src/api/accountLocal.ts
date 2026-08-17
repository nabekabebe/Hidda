import { CURRENT_TREE_KEY, SESSION_KEY, TREES_KEY, USERS_KEY, type AccountUser, type TreeRecord } from "@/domain/account";
import { hashPassword, verifyPassword } from "@/lib/password";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listUsers(): AccountUser[] {
  return readJson<AccountUser[]>(USERS_KEY, []);
}

export function listTrees(ownerId?: string): TreeRecord[] {
  const trees = readJson<TreeRecord[]>(TREES_KEY, []);
  return ownerId ? trees.filter((tree) => tree.ownerId === ownerId) : trees;
}

export function currentSession(): { userId: string } | null {
  return readJson<{ userId: string } | null>(SESSION_KEY, null);
}

export function currentTreeId(): string | null {
  return localStorage.getItem(CURRENT_TREE_KEY);
}

export function setCurrentTreeId(id: string | null) {
  if (id) localStorage.setItem(CURRENT_TREE_KEY, id);
  else localStorage.removeItem(CURRENT_TREE_KEY);
}

export async function signUp(input: { email: string; name: string; password: string }): Promise<AccountUser> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) throw new Error("Use an email and a password of at least 8 characters.");
  const users = listUsers();
  if (users.some((user) => user.email === email)) throw new Error("That email already has an atlas.");
  const { salt, hash } = await hashPassword(input.password);
  const user: AccountUser = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim() || email.split("@")[0],
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  writeJson(USERS_KEY, [...users, user]);
  writeJson(SESSION_KEY, { userId: user.id });
  return user;
}

export async function signIn(email: string, password: string): Promise<AccountUser> {
  const user = listUsers().find((item) => item.email === email.trim().toLowerCase());
  if (!user || !(await verifyPassword(password, user.salt, user.hash))) throw new Error("Email or password is wrong.");
  writeJson(SESSION_KEY, { userId: user.id });
  return user;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function createTree(ownerId: string, name: string): TreeRecord {
  const tree: TreeRecord = {
    id: crypto.randomUUID(),
    ownerId,
    name: name.trim() || "Untitled atlas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeJson(TREES_KEY, [...listTrees(), tree]);
  setCurrentTreeId(tree.id);
  return tree;
}

export function renameTree(id: string, name: string): TreeRecord | null {
  const trees = listTrees();
  const next = trees.map((tree) => (tree.id === id ? { ...tree, name: name.trim() || tree.name, updatedAt: new Date().toISOString() } : tree));
  writeJson(TREES_KEY, next);
  return next.find((tree) => tree.id === id) ?? null;
}

export function deleteTreeRecord(id: string) {
  writeJson(TREES_KEY, listTrees().filter((tree) => tree.id !== id));
  localStorage.removeItem(`night-atlas.tree.${id}`);
  if (currentTreeId() === id) setCurrentTreeId(null);
}
