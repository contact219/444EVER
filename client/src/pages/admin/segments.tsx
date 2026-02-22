import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Target, Mail, Send, Trash2, Plus, Loader2, X, Crown, UserPlus, UserMinus, Repeat, UsersRound } from "lucide-react";
import { adminGet, adminPost, adminDelete, formatMoney, formatDate } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SegmentCounts {
  vip: number;
  first_time: number;
  inactive: number;
  repeat: number;
  all: number;
}

interface SegmentCustomer {
  id: number;
  name: string;
  email: string;
  totalOrderCount: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  segment: string;
  subject: string;
  body: string;
  promoCode: string | null;
  recipientCount: number;
  status: string;
  createdAt: string;
}

const SEGMENTS = [
  { key: "vip", label: "VIP", description: "Top spenders > $100", icon: Crown, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { key: "first_time", label: "First-Time", description: "1 order", icon: UserPlus, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", badgeClass: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { key: "inactive", label: "Inactive", description: "No order 60+ days", icon: UserMinus, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300" },
  { key: "repeat", label: "Repeat", description: "2+ orders", icon: Repeat, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { key: "all", label: "All", description: "All customers", icon: UsersRound, color: "bg-muted text-muted-foreground", badgeClass: "bg-muted text-muted-foreground" },
] as const;

function getSegmentBadge(segment: string) {
  const s = SEGMENTS.find((seg) => seg.key === segment);
  if (!s) return <Badge variant="secondary">{segment}</Badge>;
  return <Badge className={s.badgeClass}>{s.label}</Badge>;
}

export default function AdminSegments() {
  const { toast } = useToast();
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    segment: "all",
    subject: "",
    body: "",
    promoCode: "",
  });

  const { data: counts, isLoading: countsLoading } = useQuery<SegmentCounts>({
    queryKey: ["/api/admin/segments/counts"],
    queryFn: () => adminGet("/api/admin/segments/counts"),
  });

  const { data: segmentCustomers, isLoading: customersLoading } = useQuery<SegmentCustomer[]>({
    queryKey: ["/api/admin/segments", activeSegment],
    queryFn: () => adminGet(`/api/admin/segments?segment=${activeSegment}`),
    enabled: !!activeSegment,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
    queryFn: () => adminGet("/api/admin/campaigns"),
  });

  const createCampaign = useMutation({
    mutationFn: () =>
      adminPost("/api/admin/campaigns", {
        ...campaignForm,
        promoCode: campaignForm.promoCode || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign created" });
      setCreating(false);
      setCampaignForm({ name: "", segment: "all", subject: "", body: "", promoCode: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendCampaign = useMutation({
    mutationFn: (id: string) => adminPost(`/api/admin/campaigns/${id}/send`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign sent" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-8" data-testid="admin-segments">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Target className="w-6 h-6" />
          Customer Segments & Campaigns
        </h1>
        <p className="text-muted-foreground mt-1">Target customer groups and manage marketing campaigns</p>
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Customer Segments</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            const count = counts ? counts[seg.key as keyof SegmentCounts] : 0;
            const isActive = activeSegment === seg.key;
            return (
              <Card
                key={seg.key}
                className={`p-4 cursor-pointer transition-colors ${isActive ? "ring-2 ring-primary" : ""}`}
                onClick={() => setActiveSegment(isActive ? null : seg.key)}
                data-testid={`segment-card-${seg.key}`}
              >
                <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-2 ${seg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm">{seg.label}</div>
                <div className="text-xs text-muted-foreground">{seg.description}</div>
                {countsLoading ? (
                  <Skeleton className="h-6 w-10 mt-2" />
                ) : (
                  <div className="text-xl font-bold mt-2" data-testid={`segment-count-${seg.key}`}>{count}</div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {activeSegment && (
        <div>
          <h3 className="text-base font-heading font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {SEGMENTS.find((s) => s.key === activeSegment)?.label} Customers
          </h3>
          {customersLoading ? (
            <Card className="p-4">
              <Skeleton className="h-40 w-full" />
            </Card>
          ) : segmentCustomers && segmentCustomers.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="segment-customers-table">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-right p-3 font-medium">Orders</th>
                      <th className="text-right p-3 font-medium">Total Spent</th>
                      <th className="text-left p-3 font-medium">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {segmentCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30" data-testid={`segment-customer-row-${c.id}`}>
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3 text-muted-foreground">{c.email}</td>
                        <td className="p-3 text-right">{c.totalOrderCount}</td>
                        <td className="p-3 text-right font-semibold">{formatMoney(c.totalSpentCents)}</td>
                        <td className="p-3 text-muted-foreground text-sm">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No customers in this segment</p>
            </Card>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Campaigns
          </h2>
          <Button onClick={() => setCreating(true)} data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-1" /> New Campaign
          </Button>
        </div>

        {creating && (
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h3 className="font-heading font-semibold">Create Campaign</h3>
              <button onClick={() => setCreating(false)} data-testid="button-close-campaign-form">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Spring Sale Blast"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div>
                  <Label>Target Segment</Label>
                  <Select value={campaignForm.segment} onValueChange={(v) => setCampaignForm({ ...campaignForm, segment: v })}>
                    <SelectTrigger data-testid="select-campaign-segment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((seg) => (
                        <SelectItem key={seg.key} value={seg.key}>{seg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Don't miss our latest deals!"
                  data-testid="input-campaign-subject"
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  value={campaignForm.body}
                  onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                  placeholder="Write your campaign message here..."
                  rows={4}
                  data-testid="input-campaign-body"
                />
              </div>
              <div>
                <Label>Promo Code (optional)</Label>
                <Input
                  value={campaignForm.promoCode}
                  onChange={(e) => setCampaignForm({ ...campaignForm, promoCode: e.target.value.toUpperCase() })}
                  placeholder="SPRING20"
                  data-testid="input-campaign-promo"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreating(false)} data-testid="button-cancel-campaign">
                  Cancel
                </Button>
                <Button
                  onClick={() => createCampaign.mutate()}
                  disabled={!campaignForm.name || !campaignForm.subject || !campaignForm.body || createCampaign.isPending}
                  data-testid="button-save-campaign"
                >
                  {createCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {campaignsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-5" data-testid={`campaign-card-${c.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{c.name}</span>
                      {getSegmentBadge(c.segment)}
                      <Badge variant={c.status === "SENT" ? "default" : "secondary"} data-testid={`campaign-status-${c.id}`}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>Recipients: {c.recipientCount}</span>
                      {c.promoCode && <span>Promo: {c.promoCode}</span>}
                      <span>Created: {formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => sendCampaign.mutate(c.id)}
                        disabled={sendCampaign.isPending}
                        data-testid={`button-send-campaign-${c.id}`}
                      >
                        {sendCampaign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete campaign "${c.name}"?`)) deleteCampaign.mutate(c.id);
                      }}
                      data-testid={`button-delete-campaign-${c.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No campaigns yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
