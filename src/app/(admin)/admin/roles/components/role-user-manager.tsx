"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import {
  assignRoleToUser,
  removeRoleFromUser,
  searchUsersForRole,
} from "@/lib/actions/roles";
import { Search, X, Plus, Loader2 } from "lucide-react";

interface RoleUser {
  id: string;
  username: string;
  avatar: string | null;
  assignedAt: string;
}

interface SearchResult {
  id: string;
  username: string;
  avatar: string | null;
}

interface RoleUserManagerProps {
  roleId: string;
  initialUsers: RoleUser[];
}

export function RoleUserManager({
  roleId,
  initialUsers,
}: RoleUserManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<RoleUser[]>(initialUsers);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  function handleSearch(query: string) {
    setSearchQuery(query);
    setError(null);

    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    startTransition(async () => {
      const result = await searchUsersForRole(query);
      setIsSearching(false);
      if ("error" in result && result.error) {
        setError(result.error);
        setSearchResults([]);
      } else if ("users" in result) {
        // Filter out users already assigned
        const assignedIds = new Set(users.map((u) => u.id));
        setSearchResults(
          (result.users ?? []).filter((u) => !assignedIds.has(u.id))
        );
      }
    });
  }

  function handleAdd(user: SearchResult) {
    setError(null);
    const formData = new FormData();
    formData.set("userId", user.id);
    formData.set("customRoleId", roleId);

    startTransition(async () => {
      const result = await assignRoleToUser(formData);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setUsers((prev) => [
          {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            assignedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        setSearchQuery("");
        setSearchResults([]);
      }
    });
  }

  function handleRemove(userId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeRoleFromUser(userId, roleId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    });
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        Assigned Users ({users.length})
      </h3>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users to add..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/20 divide-y divide-border/30 max-h-48 overflow-y-auto">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden bg-muted shrink-0">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-foreground flex-1 truncate">
                {user.username}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAdd(user)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Current Users */}
      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No users assigned to this role yet.
        </p>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/10 border border-border/30"
            >
              <div className="h-7 w-7 rounded-full overflow-hidden bg-muted shrink-0">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {user.username}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(user.assignedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(user.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
