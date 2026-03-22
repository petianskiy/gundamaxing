import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Layers, Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

async function getCards() {
  return db.cardProduct.findMany({
    orderBy: [{ releaseDate: "desc" }, { sortOrder: "asc" }],
  });
}

// ─── Server Actions ──────────────────────────────────────────────

async function deleteCard(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await db.cardProduct.delete({ where: { id } });
  revalidatePath("/admin/cards");
}

async function toggleActive(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const card = await db.cardProduct.findUnique({ where: { id }, select: { isActive: true } });
  if (card) {
    await db.cardProduct.update({ where: { id }, data: { isActive: !card.isActive } });
  }
  revalidatePath("/admin/cards");
}

async function toggleFeatured(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const card = await db.cardProduct.findUnique({ where: { id }, select: { isFeatured: true } });
  if (card) {
    await db.cardProduct.update({ where: { id }, data: { isFeatured: !card.isFeatured } });
  }
  revalidatePath("/admin/cards");
}

async function createCard(formData: FormData) {
  "use server";
  const data = {
    code: formData.get("code") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as "STARTER_DECK" | "BOOSTER_PACK" | "PREMIUM_COLLECTION" | "ACCESSORIES" | "LIMITED",
    description: (formData.get("description") as string) || null,
    seriesTheme: (formData.get("seriesTheme") as string) || null,
    releaseDate: formData.get("releaseDate") ? new Date(formData.get("releaseDate") as string) : null,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : null,
    imageUrl: (formData.get("imageUrl") as string) || null,
    officialUrl: (formData.get("officialUrl") as string) || null,
    isFeatured: formData.get("isFeatured") === "on",
  };
  await db.cardProduct.create({ data });
  revalidatePath("/admin/cards");
  redirect("/admin/cards");
}

async function updateCard(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const data = {
    code: formData.get("code") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as "STARTER_DECK" | "BOOSTER_PACK" | "PREMIUM_COLLECTION" | "ACCESSORIES" | "LIMITED",
    description: (formData.get("description") as string) || null,
    seriesTheme: (formData.get("seriesTheme") as string) || null,
    releaseDate: formData.get("releaseDate") ? new Date(formData.get("releaseDate") as string) : null,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : null,
    imageUrl: (formData.get("imageUrl") as string) || null,
    officialUrl: (formData.get("officialUrl") as string) || null,
    isFeatured: formData.get("isFeatured") === "on",
  };
  await db.cardProduct.update({ where: { id }, data });
  revalidatePath("/admin/cards");
  redirect("/admin/cards");
}

// ─── Page ────────────────────────────────────────────────────────

export default async function AdminCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const cards = await getCards();
  const editId = params.edit;
  const editCard = editId ? cards.find((c) => c.id === editId) : null;

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-gx-red/50";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Layers className="h-6 w-6 text-gx-red" />
        <h1 className="text-xl font-bold text-foreground">Card Products</h1>
        <span className="text-xs text-muted-foreground">({cards.length})</span>
      </div>

      {/* Create / Edit Form */}
      <div className="rounded-xl border border-border/50 bg-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          {editCard ? `Edit: ${editCard.name}` : "Add New Card Product"}
        </h2>
        <form action={editCard ? updateCard : createCard} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {editCard && <input type="hidden" name="id" value={editCard.id} />}

          <div>
            <label className={labelClass}>Code *</label>
            <input name="code" required defaultValue={editCard?.code || ""} placeholder="ST09" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Name *</label>
            <input name="name" required defaultValue={editCard?.name || ""} placeholder="Destiny Ignition" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type *</label>
            <select name="type" required defaultValue={editCard?.type || "STARTER_DECK"} className={inputClass}>
              <option value="STARTER_DECK">Starter Deck</option>
              <option value="BOOSTER_PACK">Booster Pack</option>
              <option value="PREMIUM_COLLECTION">Premium Collection</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="LIMITED">Limited</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Series/Theme</label>
            <input name="seriesTheme" defaultValue={editCard?.seriesTheme || ""} placeholder="Mobile Suit Gundam SEED" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Release Date</label>
            <input name="releaseDate" type="date" defaultValue={editCard?.releaseDate ? new Date(editCard.releaseDate).toISOString().split("T")[0] : ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price (USD)</label>
            <input name="price" type="number" step="0.01" defaultValue={editCard?.price ? Number(editCard.price) : ""} placeholder="15.99" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={2} defaultValue={editCard?.description || ""} placeholder="Product description..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input name="imageUrl" defaultValue={editCard?.imageUrl || ""} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Official URL</label>
            <input name="officialUrl" defaultValue={editCard?.officialUrl || ""} placeholder="https://www.gundam-gcg.com/..." className={inputClass} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="isFeatured" id="isFeatured" defaultChecked={editCard?.isFeatured || false} className="rounded" />
            <label htmlFor="isFeatured" className="text-sm text-foreground">Featured</label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex gap-3 mt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-gx-red/80 transition-colors">
              {editCard ? "Update" : "Create"}
            </button>
            {editCard && (
              <Link href="/admin/cards" className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Cards Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Release</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-b border-border/30 hover:bg-muted/30">
                <td className="px-4 py-2.5 font-mono text-gx-red/70">{card.code}</td>
                <td className="px-4 py-2.5 text-foreground">
                  {card.name}
                  {card.isFeatured && <Star className="inline h-3 w-3 ml-1 text-amber-400 fill-amber-400" />}
                  {!card.isActive && <span className="ml-1 text-[10px] text-muted-foreground">(hidden)</span>}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{card.type.replace("_", " ")}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{card.price ? `$${Number(card.price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{card.releaseDate ? new Date(card.releaseDate).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/cards?edit=${card.id}`} className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <form action={toggleFeatured}>
                      <input type="hidden" name="id" value={card.id} />
                      <button type="submit" className="p-1.5 rounded hover:bg-muted transition-colors" title="Toggle featured">
                        <Star className={`h-3.5 w-3.5 ${card.isFeatured ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                      </button>
                    </form>
                    <form action={toggleActive}>
                      <input type="hidden" name="id" value={card.id} />
                      <button type="submit" className="p-1.5 rounded hover:bg-muted transition-colors" title="Toggle visibility">
                        {card.isActive ? <Eye className="h-3.5 w-3.5 text-muted-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </form>
                    <form action={deleteCard}>
                      <input type="hidden" name="id" value={card.id} />
                      <button type="submit" className="p-1.5 rounded hover:bg-red-500/20 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-red-400/60" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
