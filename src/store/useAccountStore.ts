import { STORAGE_KEY } from "@/api/familyApi";
import {
  createTree,
  currentSession,
  currentTreeId,
  deleteTreeRecord,
  listTrees,
  listUsers,
  renameTree,
  setCurrentTreeId,
  signIn,
  signOut,
  signUp,
} from "@/api/accountLocal";
import { publicUser, treeStorageKey, type AccountUser, type TreeRecord } from "@/domain/account";
import { create } from "zustand";

type SafeUser = Omit<AccountUser, "salt" | "hash">;

interface AccountState {
  ready: boolean;
  user: SafeUser | null;
  trees: TreeRecord[];
  currentTreeId: string | null;
  hydrate: () => void;
  register: (input: { email: string; name: string; password: string }) => Promise<SafeUser>;
  login: (email: string, password: string) => Promise<SafeUser>;
  logout: () => void;
  addTree: (name: string) => TreeRecord;
  selectTree: (id: string) => void;
  rename: (id: string, name: string) => void;
  removeTree: (id: string) => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  ready: false,
  user: null,
  trees: [],
  currentTreeId: null,

  hydrate: () => {
    const session = currentSession();
    const user = session ? listUsers().find((item) => item.id === session.userId) : undefined;
    const trees = user ? listTrees(user.id) : [];
    const selected = currentTreeId();
    const current = trees.some((tree) => tree.id === selected) ? selected : trees[0]?.id ?? null;
    if (current) setCurrentTreeId(current);
    set({
      ready: true,
      user: user ? publicUser(user) : null,
      trees,
      currentTreeId: current,
    });
  },

  register: async (input) => {
    const user = await signUp(input);
    let tree = listTrees(user.id)[0];
    if (!tree) {
      tree = createTree(user.id, "My atlas");
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy && !localStorage.getItem(treeStorageKey(tree.id))) {
        localStorage.setItem(treeStorageKey(tree.id), legacy);
      }
    }
    set({ user: publicUser(user), trees: listTrees(user.id), currentTreeId: tree.id });
    return publicUser(user);
  },

  login: async (email, password) => {
    const user = await signIn(email, password);
    const trees = listTrees(user.id);
    const tree = trees[0] ?? createTree(user.id, "My atlas");
    const current = trees.some((item) => item.id === currentTreeId()) ? currentTreeId() : tree.id;
    if (current) setCurrentTreeId(current);
    set({ user: publicUser(user), trees: listTrees(user.id), currentTreeId: current });
    return publicUser(user);
  },

  logout: () => {
    signOut();
    set({ user: null, trees: [], currentTreeId: null });
  },

  addTree: (name) => {
    const user = get().user;
    if (!user) throw new Error("Sign in first");
    const tree = createTree(user.id, name);
    set({ trees: listTrees(user.id), currentTreeId: tree.id });
    return tree;
  },

  selectTree: (id) => {
    setCurrentTreeId(id);
    set({ currentTreeId: id });
  },

  rename: (id, name) => {
    renameTree(id, name);
    const user = get().user;
    set({ trees: user ? listTrees(user.id) : [] });
  },

  removeTree: (id) => {
    deleteTreeRecord(id);
    const user = get().user;
    const trees = user ? listTrees(user.id) : [];
    set({ trees, currentTreeId: trees[0]?.id ?? null });
  },
}));
