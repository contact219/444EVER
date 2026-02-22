import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Package, Loader2, X } from "lucide-react";
import { adminGet, adminPost, adminPatch, adminDelete, formatMoney } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithVariants, Variant } from "@shared/schema";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProductForm({ product, onClose }: { product?: ProductWithVariants; onClose: () => void }) {
  const { toast } = useToast();
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    scentNotes: product?.scentNotes || "",
    waxType: product?.waxType || "",
    burnTime: product?.burnTime || "",
    tags: product?.tags || "",
    status: product?.status || "ACTIVE",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return adminPatch(`/api/admin/products/${product.id}`, form);
      }
      return adminPost("/api/admin/products", { ...form, slug: form.slug || slugify(form.name) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: isEdit ? "Product updated" : "Product created" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: isEdit ? form.slug : slugify(e.target.value) })} data-testid="input-product-name" />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="input-product-slug" />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-product-description" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Image URL</Label>
          <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/candle.png" data-testid="input-product-image" />
        </div>
        <div>
          <Label>Scent Notes</Label>
          <Input value={form.scentNotes} onChange={(e) => setForm({ ...form, scentNotes: e.target.value })} data-testid="input-scent-notes" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Wax Type</Label>
          <Input value={form.waxType} onChange={(e) => setForm({ ...form, waxType: e.target.value })} placeholder="Soy, Beeswax" />
        </div>
        <div>
          <Label>Burn Time</Label>
          <Input value={form.burnTime} onChange={(e) => setForm({ ...form, burnTime: e.target.value })} placeholder="40-50 hours" />
        </div>
        <div>
          <Label>Tags</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Valentine, New" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="switch-active" />
          <Label>Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} data-testid="switch-featured" />
          <Label>Featured</Label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} data-testid="button-save-product">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

function VariantForm({ productId, variant, onClose }: { productId: string; variant?: Variant; onClose: () => void }) {
  const { toast } = useToast();
  const isEdit = !!variant;
  const [form, setForm] = useState({
    vessel: variant?.vessel || "",
    sizeOz: variant?.sizeOz || 8,
    wickType: (variant?.wickType || "COTTON") as "COTTON" | "WOOD",
    priceCents: variant?.priceCents || 1800,
    sku: variant?.sku || "",
    active: variant?.active ?? true,
    stockOnHand: variant?.stockOnHand ?? 0,
    reorderPoint: variant?.reorderPoint ?? 5,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return adminPatch(`/api/admin/variants/${variant.id}`, form);
      }
      return adminPost(`/api/admin/products/${productId}/variants`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: isEdit ? "Variant updated" : "Variant created" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Vessel</Label>
          <Input value={form.vessel} onChange={(e) => setForm({ ...form, vessel: e.target.value })} placeholder="Glass Jar" data-testid="input-variant-vessel" />
        </div>
        <div>
          <Label>Size (oz)</Label>
          <Input type="number" value={form.sizeOz} onChange={(e) => setForm({ ...form, sizeOz: parseFloat(e.target.value) })} data-testid="input-variant-size" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Wick Type</Label>
          <Select value={form.wickType} onValueChange={(v) => setForm({ ...form, wickType: v as any })}>
            <SelectTrigger data-testid="select-wick-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COTTON">Cotton</SelectItem>
              <SelectItem value="WOOD">Wood</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" value={(form.priceCents / 100).toFixed(2)} onChange={(e) => setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value) * 100) })} data-testid="input-variant-price" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} data-testid="input-variant-sku" />
        </div>
        <div>
          <Label>Stock On Hand</Label>
          <Input type="number" value={form.stockOnHand} onChange={(e) => setForm({ ...form, stockOnHand: parseInt(e.target.value) })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        <Label>Active</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={!form.vessel || mutation.isPending} data-testid="button-save-variant">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{ productId: string; variant?: Variant } | null>(null);

  const { data: products, isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/admin/products"],
    queryFn: () => adminGet("/api/admin/products"),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
  });

  const deleteVariant = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Variant deleted" });
    },
  });

  return (
    <div className="space-y-6" data-testid="admin-products">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Products</h1>
        <Button onClick={() => setCreatingProduct(true)} data-testid="button-create-product">
          <Plus className="w-4 h-4 mr-1" /> New Product
        </Button>
      </div>

      {(creatingProduct || editingProduct) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h3>
            <button onClick={() => { setCreatingProduct(false); setEditingProduct(null); }}><X className="w-4 h-4" /></button>
          </div>
          <ProductForm product={editingProduct || undefined} onClose={() => { setCreatingProduct(false); setEditingProduct(null); }} />
        </Card>
      )}

      {editingVariant && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{editingVariant.variant ? "Edit Variant" : "New Variant"}</h3>
            <button onClick={() => setEditingVariant(null)}><X className="w-4 h-4" /></button>
          </div>
          <VariantForm productId={editingVariant.productId} variant={editingVariant.variant} onClose={() => setEditingVariant(null)} />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="p-5" data-testid={`product-card-${product.slug}`}>
              <div className="flex gap-4">
                {product.imageUrl && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-heading font-semibold">{product.name}</h3>
                    {product.featured && <Badge variant="secondary">Featured</Badge>}
                    <Badge variant={product.active ? "default" : "destructive"}>{product.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  {product.description && <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>}
                  <div className="mt-3 space-y-1">
                    {product.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-1.5">
                        <span>{v.vessel} · {v.sizeOz}oz · {v.wickType} · {v.sku || "no SKU"}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatMoney(v.priceCents)}</span>
                          <span className="text-muted-foreground">Stock: {v.stockOnHand}</span>
                          <button onClick={() => setEditingVariant({ productId: product.id, variant: v })} className="text-primary hover:underline text-xs">Edit</button>
                          <button onClick={() => { if (confirm("Delete this variant?")) deleteVariant.mutate(v.id); }} className="text-destructive hover:underline text-xs">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingVariant({ productId: product.id })} data-testid={`button-add-variant-${product.slug}`}>
                    <Plus className="w-3 h-3 mr-1" /> Variant
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProduct(product)}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete "${product.name}"?`)) deleteProduct.mutate(product.id); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No products yet</p>
        </Card>
      )}
    </div>
  );
}
