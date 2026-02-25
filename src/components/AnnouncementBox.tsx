"use client";

import { useEffect, useState } from "react";

type Announcement = {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
};

export default function AnnouncementBox({
  type,
}: {
  type: "admin" | "mentor" | "peserta";
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/announcements/${type}`,
        );

        const result = await res.json();

        const activeOnly = result.filter((item: any) => item.isActive === true);

        setAnnouncements(activeOnly);
      } catch (err) {
        console.error("Gagal load pengumuman", err);
      }
    };

    fetchData();
  }, [type]);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {announcements.map((data) => (
        <div
          key={data._id}
          className="
          relative overflow-hidden
          rounded-2xl
          border
          border-amber-200 dark:border-indigo-500/20
          bg-linear-to-br
          from-amber-50 via-white to-amber-100
          dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-950
          shadow-lg hover:shadow-2xl
          transition-all duration-300
        "
      >
        {/* Decorative Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#7F1D1D] to-[#F59E0B] dark:from-indigo-500 dark:to-violet-500" />

        <div className="p-5 sm:p-6 lg:p-8">
          {/* DATE BADGE */}
          {data.createdAt && (
            <div className="absolute top-4 right-4">
              <div
                className="
                  flex items-center gap-2
                  px-3 py-1.5 rounded-full
                  text-[11px] sm:text-xs
                  font-semibold
                  bg-amber-100 text-[#7F1D1D]
                  dark:bg-indigo-800 dark:text-indigo-200
                  shadow-sm
                "
              >
                <span>📅</span>
                <span>
                  Dipublikasikan{" "}
                  {new Date(data.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          {/* IMAGE */}
          {data.image && (
            <div className="w-full rounded-xl mb-5 overflow-hidden border border-amber-200 dark:border-indigo-500/20 bg-black/90">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/announcements/${data.image}`}
                alt="Pengumuman"
                className="
                  w-full
                  max-h-62.5 sm:max-h-87.5 lg:max-h-112.5
                  object-contain
                  transition-transform duration-300 hover:scale-105
                "
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* ICON */}
            <div
              className="
                shrink-0
                w-10 h-10
                rounded-full
                flex items-center justify-center
                bg-linear-to-br
                from-[#7F1D1D] to-[#F59E0B]
                dark:from-indigo-600 dark:to-violet-500
                text-white shadow-md
              "
            >
              <span className="text-lg">🔔</span>
            </div>

            {/* TITLE & SUBTITLE */}
            <div className="flex-1">
              <h3
                className="
                  text-lg sm:text-xl lg:text-2xl
                  font-bold
                  text-[#7F1D1D]
                  dark:text-indigo-300
                "
              >
                {data.title}
              </h3>

              {data.subtitle && (
                <p
                  className="
                    mt-1
                    text-sm sm:text-base
                    font-medium
                    text-amber-700
                    dark:text-indigo-400
                  "
                >
                  {data.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <p className="
            mt-3
            text-sm sm:text-base
            leading-relaxed
            text-slate-700
            dark:text-indigo-200/80
          ">
            {data.content}
          </p>
        </div>
      </div>
    ))}
  </div>
);
}