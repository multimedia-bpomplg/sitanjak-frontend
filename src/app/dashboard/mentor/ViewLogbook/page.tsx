"use client";

import { useEffect, useState } from "react";
import { HiUser, HiBriefcase } from "react-icons/hi";
import Calendar from "@/components/logbook/Calendar";
import LogbookModal from "@/components/logbook/LogbookModal";
import MentorLogbookModal from "@/components/logbook/MentorLogbookModal";

/* ================= TYPE ================= */
type Peserta = {
  _id: string; // ✅ WAJIB
  nama: string;
  email: string; // 🔑 dipakai sebagai identifier
  posisi: string;
  kategori?: string;
};

export default function ViewLogbookMentor() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);

  const [filledDates, setFilledDates] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* ================= FETCH PESERTA BIMBINGAN ================= */
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mentor/peserta`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Gagal fetch peserta");
        }

        const data = await res.json();
        console.log("DATA PESERTA:", data);

        setPeserta(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("FETCH PESERTA ERROR:", err);
        setPeserta([]);
      }
    };

    fetchPeserta();
  }, []);

  /* ================= FETCH FILLED DATES ================= */
  const loadCalendar = async (email: string) => {
    console.log("LOAD CALENDAR EMAIL:", email);

    if (!email) {
      console.error("email kosong");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/email/${email}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error("Gagal fetch logbook");
    }

    const data = await res.json();

    const map: Record<string, string> = {};
    data.forEach((l: any) => {
      map[l.date] = l.status;
    });

    setFilledDates(map);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <h1 className="text-3xl font-bold mb-8">Logbook Peserta</h1>

      {/* ================= TABLE PESERTA ================= */}
      {!selectedPeserta && (
        <div className="rounded-2xl bg-white border shadow overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4 text-left">Nama</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4">Posisi</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {peserta.map((p, i) => (
                <tr key={p.email} className="border-t">
                  <td className="px-6 py-4 text-center">{i + 1}</td>

                  <td className="px-6 py-4 font-medium flex gap-2">
                    <HiUser /> {p.nama}
                  </td>

                  <td className="px-6 py-4">{p.email}</td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      <HiBriefcase /> {p.posisi}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">{p.kategori || "-"}</td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedPeserta(p); // p SUDAH ADA _id
                        loadCalendar(p.email); // kalender masih pakai email (OK)
                      }}
                    >
                      Lihat Logbook
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= CALENDAR ================= */}
      {selectedPeserta && (
        <>
          <button
            className="mb-4 text-sm text-indigo-600 underline"
            onClick={() => {
              setSelectedPeserta(null);
              setSelectedDate(null);
              setFilledDates({});
            }}
          >
            ← Kembali ke daftar peserta
          </button>

          <h2 className="text-xl font-bold mb-4">
            Logbook: {selectedPeserta.nama}
          </h2>

          <Calendar
            filledDates={filledDates}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        </>
      )}

      {/* ================= MODAL ================= */}
      {selectedDate && selectedPeserta && (
        <MentorLogbookModal
          date={selectedDate}
          pesertaId={selectedPeserta._id}
          pesertaNama={selectedPeserta.nama}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
