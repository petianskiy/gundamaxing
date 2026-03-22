import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Trophy, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

async function getAchievements() {
  return db.achievement.findMany({ orderBy: { sortOrder: "asc" } });
}

// ─── Server Actions ──────────────────────────────────────────────

async function createAchievement(formData: FormData) {
  "use server";
  const tiers = (formData.get("tiers") as string).split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
  const xpPerTier = (formData.get("xpPerTier") as string).split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
  const maxSort = await db.achievement.aggregate({ _max: { sortOrder: true } });

  await db.achievement.create({
    data: {
      slug: formData.get("slug") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as "BUILDING" | "SOCIAL" | "POPULARITY" | "LINEAGE" | "FORUM" | "COLLECTOR" | "COMMUNITY",
      icon: (formData.get("icon") as string) || null,
      tiers,
      xpPerTier,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

async function updateAchievement(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const tiers = (formData.get("tiers") as string).split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
  const xpPerTier = (formData.get("xpPerTier") as string).split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));

  await db.achievement.update({
    where: { id },
    data: {
      slug: formData.get("slug") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as "BUILDING" | "SOCIAL" | "POPULARITY" | "LINEAGE" | "FORUM" | "COLLECTOR" | "COMMUNITY",
      icon: (formData.get("icon") as string) || null,
      tiers,
      xpPerTier,
    },
  });
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

async function deleteAchievement(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await db.achievement.delete({ where: { id } });
  revalidatePath("/admin/achievements");
}

async function moveAchievement(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";
  const all = await db.achievement.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, sortOrder: true } });
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;
  const a = all[idx], b = all[swapIdx];
  await db.$transaction([
    db.achievement.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    db.achievement.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath("/admin/achievements");
}

// ─── Page ────────────────────────────────────────────────────────

const CATEGORIES = ["BUILDING", "SOCIAL", "POPULARITY", "LINEAGE", "FORUM", "COLLECTOR", "COMMUNITY"];
const ICONS = ["hammer", "heart", "star", "message-square", "git-branch", "package", "book-open", "users", "trophy", "zap", "target", "shield"];

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const achievements = await getAchievements();
  const editId = params.edit;
  const editItem = editId ? achievements.find((a) => a.id === editId) : null;

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-gx-red/50";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-gx-red" />
        <h1 className="text-xl font-bold text-foreground">Achievements</h1>
        <span className="text-xs text-muted-foreground">({achievements.length})</span>
      </div>

      {/* Create / Edit Form */}
      <div className="rounded-xl border border-border/50 bg-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          {editItem ? `Edit: ${editItem.name}` : "Add New Achievement"}
        </h2>
        <form action={editItem ? updateAchievement : createAchievement} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {editItem && <input type="hidden" name="id" value={editItem.id} />}

          <div>
            <label className={labelClass}>Slug *</label>
            <input name="slug" required defaultValue={editItem?.slug || ""} placeholder="builder" className={inputClass} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Used for i18n key: achievements.name.{"{slug}"}</p>
          </div>
          <div>
            <label className={labelClass}>Name (EN fallback) *</label>
            <input name="name" required defaultValue={editItem?.name || ""} placeholder="Builder" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select name="category" required defaultValue={editItem?.category || "BUILDING"} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description (EN fallback) *</label>
            <input name="description" required defaultValue={editItem?.description || ""} placeholder="Upload Gunpla builds..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Icon</label>
            <select name="icon" defaultValue={editItem?.icon || ""} className={inputClass}>
              <option value="">None</option>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tiers (comma-separated) *</label>
            <input name="tiers" required defaultValue={editItem?.tiers.join(", ") || "1, 3, 5, 10, 20"} placeholder="1, 3, 5, 10, 20" className={inputClass} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Thresholds to reach each tier</p>
          </div>
          <div>
            <label className={labelClass}>XP per tier (comma-separated) *</label>
            <input name="xpPerTier" required defaultValue={editItem?.xpPerTier.join(", ") || "25, 50, 100, 150, 200"} placeholder="25, 50, 100, 150, 200" className={inputClass} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex gap-3 mt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-gx-red/80 transition-colors">
              {editItem ? "Update" : "Create"}
            </button>
            {editItem && (
              <Link href="/admin/achievements" className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Achievements Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3 w-8">#</th>
              <th className="px-4 py-3">Achievement</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Tiers</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((a, idx) => (
              <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30">
                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-2.5">
                  <p className="text-foreground font-medium">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{a.slug}</p>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{a.category}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{a.tiers.join(", ")}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{a.xpPerTier.join(", ")}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <form action={moveAchievement}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" disabled={idx === 0} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30">
                        <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </form>
                    <form action={moveAchievement}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" disabled={idx === achievements.length - 1} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30">
                        <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </form>
                    <Link href={`/admin/achievements?edit=${a.id}`} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <form action={deleteAchievement}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="p-1.5 rounded hover:bg-red-500/20 transition-colors">
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

      {/* i18n Note */}
      <p className="text-[10px] text-muted-foreground mt-4">
        Translations use i18n keys based on the slug: <code className="font-mono">achievements.name.{"{slug}"}</code> and <code className="font-mono">achievements.desc.{"{slug}"}</code>.
        Add translations in <code className="font-mono">src/lib/i18n/locales/*/achievements.ts</code>.
      </p>
    </div>
  );
}
