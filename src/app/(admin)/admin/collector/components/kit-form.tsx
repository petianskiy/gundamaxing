"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, Loader2, X, ArrowLeft } from "lucide-react";
import { useUploadThing } from "@/lib/upload/uploadthing";
import { adminCreateKit, adminUpdateKit } from "@/lib/actions/admin-collector";
import { FocalPointPicker } from "./focal-point-picker";
import type { AdminGunplaKitUI } from "@/lib/types";

const GRADES = ["HG", "RG", "MG", "PG", "SD", "RE/100", "FM", "EG", "MGEX", "HiRM"];
const SCALES = ["1/144", "1/100", "1/60", "Non-scale"];
const TIMELINES = [
  "Universal Century",
  "Future Century",
  "After Colony",
  "After War",
  "Correct Century",
  "Cosmic Era",
  "Anno Domini",
  "Advanced Generation",
  "Regild Century",
  "Post Disaster",
  "Ad Stella",
  "Build Series",
];

interface KitFormProps {
  initialData?: AdminGunplaKitUI | null;
  series: { id: string; name: string; timeline: string | null }[];
}

export function KitForm({ initialData, series }: KitFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState(initialData?.name ?? "");
  const [grade, setGrade] = useState(initialData?.grade ?? "");
  const [scale, setScale] = useState(initialData?.scale ?? "");
  const [seriesId, setSeriesId] = useState(initialData?.seriesId ?? "");
  const [seriesName, setSeriesName] = useState(initialData?.seriesName ?? "");
  const [timeline, setTimeline] = useState(initialData?.timeline ?? "");
  const [modelNumber, setModelNumber] = useState(initialData?.modelNumber ?? "");
  const [japaneseTitle, setJapaneseTitle] = useState(initialData?.japaneseTitle ?? "");
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer ?? "Bandai");
  const [brand, setBrand] = useState(initialData?.brand ?? "Bandai");
  const [category, setCategory] = useState<"BANDAI" | "THIRD_PARTY">(initialData?.category ?? "BANDAI");
  const [releaseYear, setReleaseYear] = useState(initialData?.releaseYear?.toString() ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [focalX, setFocalX] = useState(initialData?.imageFocalX ?? 0.5);
  const [focalY, setFocalY] = useState(initialData?.imageFocalY ?? 0.5);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const { startUpload } = useUploadThing("kitImageUpload", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setImageUrl(res[0].ufsUrl);
      }
      setUploading(false);
    },
    onUploadError: (err) => {
      setError(err.message || "Image upload failed");
      setUploading(false);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    startUpload([file]);
  }

  // When series dropdown changes, auto-fill seriesName and timeline
  function handleSeriesChange(sid: string) {
    setSeriesId(sid);
    if (sid) {
      const match = series.find((s) => s.id === sid);
      if (match) {
        setSeriesName(match.name);
        if (match.timeline) setTimeline(match.timeline);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const payload = {
      ...(initialData ? { id: initialData.id } : {}),
      name: name.trim(),
      seriesName: seriesName.trim(),
      grade,
      scale: scale || null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      manufacturer: manufacturer.trim() || "Bandai",
      imageUrl: imageUrl || null,
      description: description.trim() || null,
      modelNumber: modelNumber.trim() || null,
      japaneseTitle: japaneseTitle.trim() || null,
      price: price ? parseFloat(price) : null,
      imageFocalX: focalX,
      imageFocalY: focalY,
      timeline: timeline || null,
      brand: brand.trim() || "Bandai",
      category,
      isActive,
      seriesId: seriesId || null,
    };

    startTransition(async () => {
      const result = initialData
        ? await adminUpdateKit(payload)
        : await adminCreateKit(payload);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (!initialData) {
          router.push("/admin/collector?tab=kits");
        }
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/admin/collector?tab=kits")}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to kits
      </button>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Kit {initialData ? "updated" : "created"} successfully!
        </div>
      )}

      {/* ── Basic Info ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Kit Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. RX-78-2 Gundam"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Model Number
            </label>
            <input
              type="text"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="e.g. MSN-04, RX-78-2"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Japanese Title
            </label>
            <input
              type="text"
              value={japaneseTitle}
              onChange={(e) => setJapaneseTitle(e.target.value)}
              placeholder="e.g. サザビー"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Brief description of this kit..."
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Classification ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          Classification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Grade <span className="text-red-400">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            >
              <option value="">Select grade...</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Scale
            </label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            >
              <option value="">Select scale...</option>
              {SCALES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Timeline
            </label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            >
              <option value="">Select timeline...</option>
              {TIMELINES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Anime Series
            </label>
            <select
              value={seriesId}
              onChange={(e) => handleSeriesChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            >
              <option value="">Select series or type manually...</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.timeline ? `(${s.timeline})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Series Name (display) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              required
              placeholder="e.g. Mobile Suit Gundam: Char's Counterattack"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Auto-filled when selecting a series above, or type manually
            </p>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Category
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value="BANDAI"
                checked={category === "BANDAI"}
                onChange={() => { setCategory("BANDAI"); setBrand("Bandai"); setManufacturer("Bandai"); }}
                className="accent-gx-gold"
              />
              <span className="text-sm text-foreground">Bandai Official</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value="THIRD_PARTY"
                checked={category === "THIRD_PARTY"}
                onChange={() => setCategory("THIRD_PARTY")}
                className="accent-gx-gold"
              />
              <span className="text-sm text-foreground">3rd Party</span>
            </label>
          </div>
        </div>
      </section>

      {/* ── Manufacturer & Pricing ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          Manufacturer & Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Manufacturer / Brand
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => { setManufacturer(e.target.value); setBrand(e.target.value); }}
              placeholder={category === "THIRD_PARTY" ? "e.g. Daban, SuperNova, MG..." : "Bandai"}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Release Year
            </label>
            <input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              min={1979}
              max={2030}
              placeholder="e.g. 2024"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              MSRP (JPY)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
              step={1}
              placeholder="e.g. 5500"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
        </div>
      </section>

      {/* ── Image ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          Image & Focal Point
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or upload below"
                  className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          </div>

          <FocalPointPicker
            imageUrl={imageUrl || null}
            focalX={focalX}
            focalY={focalY}
            onChange={(x, y) => { setFocalX(x); setFocalY(y); }}
          />
        </div>
      </section>

      {/* ── Visibility ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          Visibility
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsActive(!isActive)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-muted"
            }`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm text-foreground">
            {isActive ? "Active — visible in catalog" : "Inactive — hidden from catalog"}
          </span>
        </label>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium border border-gx-gold/30 hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initialData ? "Update Kit" : "Create Kit"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/collector?tab=kits")}
          className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
