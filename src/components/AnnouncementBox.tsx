"use client";

import { useEffect, useState } from "react";

type Announcement = {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  isActive: boolean;
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
    <div className="space-y-4 mb-6">
      {announcements.map((data) => (
        <div
          key={data._id}
          className="bg-white border rounded-xl shadow-lg p-6"
        >
          {/* IMAGE */}
          {data.image && (
            <div className="w-full h-56 bg-black/90 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/announcements/${data.image}`}
                alt="Pengumuman"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* TITLE */}
          <h3 className="font-bold text-xl">{data.title}</h3>

          {/* SUBTITLE */}
          {data.subtitle && <p className="text-indigo-600">{data.subtitle}</p>}

          {/* CONTENT */}
          <p className="text-slate-600 mt-2">{data.content}</p>
        </div>
      ))}
    </div>
  );
}
