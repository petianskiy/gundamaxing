"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { mockWorkshops } from "@/lib/mock/data";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function WorkshopsSection() {
  const { t } = useTranslation();
  const workshopKey = (name: string) => t(`workshop.${name.toLowerCase()}`);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gx-surface relative overflow-hidden">
      {/* Decorative mecha-frame corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-gx-red/20" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-gx-red/20" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-gx-red/20" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-gx-red/20" />

      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
            工房 &middot; Workshops
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t("workshops.title")}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            {t("workshops.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockWorkshops.map((workshop, i) => (
            <motion.div
              key={workshop.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={`/builds?technique=${encodeURIComponent(workshop.name)}`}
                className="group flex flex-col rounded-xl border border-border/50 bg-card hover:border-gx-red/30 hover:bg-gx-surface-elevated transition-all relative overflow-hidden"
              >
                {/* Corner accents on hover */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-transparent group-hover:border-gx-red/50 transition-colors z-10" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-transparent group-hover:border-gx-red/50 transition-colors z-10" />

                {/* Workshop image */}
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={workshop.image}
                    alt={workshop.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>

                {/* Text content */}
                <div className="p-3 pt-2 text-center flex flex-col items-center gap-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {workshopKey(workshop.name)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {workshop.buildCount} {t("shared.builds")}
                  </p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-gx-red transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
