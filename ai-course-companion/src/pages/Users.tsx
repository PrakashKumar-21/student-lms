import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { getUsers, type UserWithPlan } from "@/services/userApi";

const formatExpiry = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const Users = () => {
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      console.log(data)
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-muted-foreground">
            Read-only list of users and their active plan.
          </p>
        </div>

        <div className="card-elevated p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {users.length ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {user.full_name || user.phone_or_email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.phone_or_email}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-foreground">
                      {user.subscription.plan_name || "No plan"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {user.subscription.status}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-foreground">
                      Expiry
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatExpiry(user.subscription.expires_at)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold">
                    {user.subscription.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No users found.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Users;
