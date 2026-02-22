import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Mail, Clock, Plus, Pencil, Trash2, ShoppingCart, Star, Package, Loader2 } from "lucide-react";
import { adminGet, adminPost, adminPatch, adminDelete, formatDateTime } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutomationTemplate {
  id: string;
  name: string;
  triggerType: string;
  delayHours: number;
  subject: string;
  body: string;
  active: boolean;
  createdAt?: string;
}

interface AutomationSend {
  id: string;
  customerEmail: string;
  templateName?: string;
  automationTemplate?: { name: string };
  status: "PENDING" | "SENT" | "FAILED";
  scheduledFor: string;
  sentAt?: string | null;
}

const TRIGGER_TYPES = [
  { value: "POST_PURCHASE", label: "Post Purchase", icon: ShoppingCart },
  { value: "REVIEW_REQUEST", label: "Review Request", icon: Star },
  { value: "RESTOCK_ALERT", label: "Restock Alert", icon: Package },
  { value: "ABANDON_CART", label: "Abandon Cart", icon: ShoppingCart },
] as const;

function getTriggerIcon(type: string) {
  const found = TRIGGER_TYPES.find((t) => t.value === type);
  return found ? found.icon : Mail;
}

function getTriggerLabel(type: string) {
  const found = TRIGGER_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

const emptyForm = {
  name: "",
  triggerType: "POST_PURCHASE",
  delayHours: 1,
  subject: "",
  body: "",
  active: true,
};

function AutomationFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: AutomationTemplate;
}) {
  const { toast } = useToast();
  const isEdit = !!template;
  const [form, setForm] = useState(
    template
      ? {
          name: template.name,
          triggerType: template.triggerType,
          delayHours: template.delayHours,
          subject: template.subject,
          body: template.body,
          active: template.active,
        }
      : { ...emptyForm }
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return adminPatch(`/api/admin/automations/${template.id}`, form);
      return adminPost("/api/admin/automations", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automations"] });
      toast({ title: isEdit ? "Template updated" : "Template created" });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-automation">
            {isEdit ? "Edit Template" : "New Automation Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Welcome email"
              data-testid="input-automation-name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Trigger Type</Label>
              <Select
                value={form.triggerType}
                onValueChange={(v) => setForm({ ...form, triggerType: v })}
              >
                <SelectTrigger data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delay (hours)</Label>
              <Input
                type="number"
                min={0}
                value={form.delayHours}
                onChange={(e) =>
                  setForm({ ...form, delayHours: parseInt(e.target.value) || 0 })
                }
                data-testid="input-delay-hours"
              />
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Thank you for your purchase!"
              data-testid="input-automation-subject"
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the email body content..."
              rows={5}
              data-testid="textarea-automation-body"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              data-testid="switch-automation-active"
            />
            <Label>Active</Label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.name || !form.subject || mutation.isPending}
              data-testid="button-save-automation"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "SENT") return "default";
  if (status === "FAILED") return "destructive";
  return "outline";
}

function statusColor(status: string): string {
  if (status === "SENT") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (status === "FAILED") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
}

export default function AdminAutomations() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutomationTemplate | undefined>();

  const { data: templates, isLoading: templatesLoading } = useQuery<AutomationTemplate[]>({
    queryKey: ["/api/admin/automations"],
    queryFn: () => adminGet("/api/admin/automations"),
  });

  const { data: sends, isLoading: sendsLoading } = useQuery<AutomationSend[]>({
    queryKey: ["/api/admin/automations", "sends"],
    queryFn: () => adminGet("/api/admin/automations/sends"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automations"] });
      toast({ title: "Template deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminPatch(`/api/admin/automations/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automations"] });
      toast({ title: "Status updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditingTemplate(undefined);
    setDialogOpen(true);
  }

  function openEdit(t: AutomationTemplate) {
    setEditingTemplate(t);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-8" data-testid="admin-automations">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage automated email templates and view send history
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-automation">
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </div>

      <AutomationFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTemplate(undefined);
        }}
        template={editingTemplate}
      />

      <section>
        <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Templates
        </h2>

        {templatesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((t) => {
              const TriggerIcon = getTriggerIcon(t.triggerType);
              return (
                <Card key={t.id} className="p-5" data-testid={`automation-card-${t.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 mt-0.5 rounded-md bg-muted p-2">
                        <TriggerIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{t.name}</span>
                          <Badge variant={t.active ? "default" : "secondary"} data-testid={`badge-status-${t.id}`}>
                            {t.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getTriggerLabel(t.triggerType)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.delayHours}h delay
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {t.subject}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={t.active}
                        onCheckedChange={(v) =>
                          toggleMutation.mutate({ id: t.id, active: v })
                        }
                        data-testid={`switch-toggle-${t.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        data-testid={`button-edit-${t.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Delete template "${t.name}"?`))
                            deleteMutation.mutate(t.id);
                        }}
                        data-testid={`button-delete-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No automation templates yet</p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" /> Send History
        </h2>

        {sendsLoading ? (
          <Card className="p-4">
            <Skeleton className="h-40 w-full" />
          </Card>
        ) : sends && sends.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Email</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sends.map((s) => (
                    <TableRow key={s.id} data-testid={`send-row-${s.id}`}>
                      <TableCell className="font-medium" data-testid={`text-email-${s.id}`}>
                        {s.customerEmail}
                      </TableCell>
                      <TableCell data-testid={`text-template-${s.id}`}>
                        {s.templateName || s.automationTemplate?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColor(s.status)}
                          data-testid={`badge-send-status-${s.id}`}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-scheduled-${s.id}`}>
                        {formatDateTime(s.scheduledFor)}
                      </TableCell>
                      <TableCell data-testid={`text-sent-at-${s.id}`}>
                        {s.sentAt ? formatDateTime(s.sentAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No automation sends yet</p>
          </Card>
        )}
      </section>
    </div>
  );
}
