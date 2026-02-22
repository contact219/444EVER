import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Check, X, Trash2, ShieldCheck, MessageSquare, Ticket, Loader2 } from "lucide-react";
import { adminGet, adminPatch, adminDelete, formatDate } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Review = {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  approved: boolean;
  incentiveCouponCode?: string | null;
  createdAt: string;
};

type FilterType = "all" | "pending" | "approved";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" data-testid="star-rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: () => adminGet("/api/admin/reviews"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      adminPatch(`/api/admin/reviews/${id}`, { approved }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: variables.approved ? "Review approved" : "Review rejected" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = reviews?.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const counts = {
    all: reviews?.length || 0,
    pending: reviews?.filter((r) => !r.approved).length || 0,
    approved: reviews?.filter((r) => r.approved).length || 0,
  };

  return (
    <div className="space-y-6" data-testid="admin-reviews">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-heading font-bold">Reviews</h1>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
            >
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Approved"} ({counts[f]})
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-24 w-full" /></Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card key={review.id} className="p-5" data-testid={`review-card-${review.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" data-testid={`review-name-${review.id}`}>{review.customerName}</span>
                    <span className="text-sm text-muted-foreground" data-testid={`review-email-${review.id}`}>{review.customerEmail}</span>
                    {review.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`review-verified-${review.id}`}>
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    <Badge variant={review.approved ? "default" : "secondary"} data-testid={`review-status-${review.id}`}>
                      {review.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">Product: {review.productId}</span>
                  </div>

                  {review.title && (
                    <p className="font-medium" data-testid={`review-title-${review.id}`}>{review.title}</p>
                  )}

                  {review.body && (
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`review-body-${review.id}`}>
                      {review.body}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span data-testid={`review-date-${review.id}`}>{formatDate(review.createdAt)}</span>
                    {review.incentiveCouponCode && (
                      <Badge variant="outline" className="text-xs" data-testid={`review-coupon-${review.id}`}>
                        <Ticket className="w-3 h-3 mr-1" /> {review.incentiveCouponCode}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {!review.approved && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${review.id}`}
                    >
                      {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                    </Button>
                  )}
                  {review.approved && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => approveMutation.mutate({ id: review.id, approved: false })}
                      disabled={approveMutation.isPending}
                      data-testid={`button-reject-${review.id}`}
                    >
                      {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 text-orange-500" />}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this review permanently?")) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${review.id}`}
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {filter === "all" ? "No reviews yet" : filter === "pending" ? "No pending reviews" : "No approved reviews"}
          </p>
        </Card>
      )}
    </div>
  );
}
