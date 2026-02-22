import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil, KeyRound, Loader2, Users, Copy } from "lucide-react";
import { adminGet, adminPost, adminPatch, adminDelete, formatDateTime } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

const ROLES = ["OWNER", "ADMIN", "STAFF", "READONLY"] as const;

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "OWNER": return "default";
    case "ADMIN": return "secondary";
    default: return "outline";
  }
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState({ email: "", name: "", password: "", role: "STAFF" });
  const [editForm, setEditForm] = useState({ name: "", role: "", active: true, password: "" });

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => adminGet("/api/admin/users"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => adminPost("/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created" });
      setCreateOpen(false);
      setCreateForm({ email: "", name: "", password: "", role: "STAFF" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => {
      const payload: Record<string, unknown> = { name: data.name, role: data.role, active: data.active };
      if (data.password) payload.password = data.password;
      return adminPatch(`/api/admin/users/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
      setEditUser(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminPost<{ token: string }>(`/api/admin/users/${id}/reset-password`, {}),
    onSuccess: (data: { token: string }) => {
      setResetToken(data.token);
      setResetDialogOpen(true);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openEdit(user: AdminUser) {
    setEditForm({ name: user.name, role: user.role, active: user.active, password: "" });
    setEditUser(user);
  }

  return (
    <div className="space-y-6" data-testid="admin-users">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-heading font-bold">Admin Users</h1>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-1" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${user.id}`}>{user.name}</TableCell>
                    <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)} data-testid={`badge-role-${user.id}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"} data-testid={`badge-status-${user.id}`}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-login-${user.id}`}>
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(user)} data-testid={`button-edit-${user.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => resetMutation.mutate(user.id)} disabled={resetMutation.isPending} data-testid={`button-reset-${user.id}`}>
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete user "${user.name}"?`)) deleteMutation.mutate(user.id); }} data-testid={`button-delete-${user.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No admin users found</p>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>Create a new admin user account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="user@example.com" data-testid="input-create-email" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Full name" data-testid="input-create-name" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Password" data-testid="input-create-password" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger data-testid="select-create-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={!createForm.email || !createForm.name || !createForm.password || createMutation.isPending}
              data-testid="button-create-submit"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details for {editUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} data-testid="input-edit-name" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New Password (leave blank to keep current)</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Unchanged" data-testid="input-edit-password" />
            </div>
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <Select value={editForm.active ? "true" : "false"} onValueChange={(v) => setEditForm({ ...editForm, active: v === "true" })}>
                <SelectTrigger className="w-32" data-testid="select-edit-active"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => editUser && editMutation.mutate({ id: editUser.id, data: editForm })}
              disabled={!editForm.name || editMutation.isPending}
              data-testid="button-edit-submit"
            >
              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Token</DialogTitle>
            <DialogDescription>Share this token securely with the user to reset their password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={resetToken || ""} readOnly className="font-mono text-sm" data-testid="input-reset-token" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  if (resetToken) {
                    navigator.clipboard.writeText(resetToken);
                    toast({ title: "Copied to clipboard" });
                  }
                }}
                data-testid="button-copy-token"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setResetDialogOpen(false); setResetToken(null); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
