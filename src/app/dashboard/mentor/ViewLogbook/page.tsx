"use client";

import { useEffect, useState } from "react";
import {
  HiUser,
  HiBriefcase,
  HiSearch,
  HiArrowLeft,
  HiCalendar,
  HiUsers,
} from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import Calendar from "@/components/logbook/Calendar";
import MentorLogbookModal from "@/components/logbook/MentorLogbookModal";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPE ================= */
type Peserta = {
  _id?: string;
  id?: string;
  nama: string;
  email: string;
  posisi: string;
  kategori?: string;
};

export default function ViewLogbookMentor() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [filledDates, setFilledDates] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /* ================= FETCH PESERTA BIMBINGAN ================= */
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        setLoading(true);
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
        console.log("DATA PESERTA RAW:", data);

        const transformedData = data.map((p: any, index: number) => ({
          ...p,
          _id: p._id || p.id || `temp-${p.email}-${index}`,
          email: p.email || `unknown-${index}@example.com`,
          kategori: p.kategori || "Magang", // Default value jika tidak ada
        }));

        console.log("DATA PESERTA TRANSFORMED:", transformedData);
        setPeserta(transformedData);
        setFilteredPeserta(transformedData);
      } catch (err) {
        console.error("FETCH PESERTA ERROR:", err);
        showToast.error("Gagal memuat data peserta");
        setPeserta([]);
        setFilteredPeserta([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPeserta();
  }, []);

  /* ================= HANDLE SEARCH ================= */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPeserta(peserta);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = peserta.filter(
      (p) =>
        p.nama.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.posisi.toLowerCase().includes(query) ||
        (p.kategori && p.kategori.toLowerCase().includes(query)),
    );
    setFilteredPeserta(filtered);
  }, [searchQuery, peserta]);

  /* ================= FETCH FILLED DATES ================= */
  const loadCalendar = async (email: string) => {
    console.log("LOAD CALENDAR EMAIL:", email);

    if (!email) {
      showToast.error("Email peserta tidak valid");
      return;
    }

    try {
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
      console.log("LOGBOOK DATA:", data);

      const map: Record<string, string> = {};
      data.forEach((l: any) => {
        map[l.date] = l.status;
      });

      setFilledDates(map);
    } catch (err) {
      console.error("LOAD CALENDAR ERROR:", err);
      showToast.error("Gagal memuat logbook peserta");
    }
  };

  /* ================= GET USER ID BY EMAIL ================= */
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/by-email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (res.ok) {
        const user = await res.json();
        return user._id;
      }
      return null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  };

  /* ================= HANDLE VIEW LOGBOOK ================= */
  const handleViewLogbook = async (p: Peserta) => {
    console.log("HANDLE VIEW LOGBOOK FOR:", p);

    let userId = p._id;

    if (!userId || userId.includes("temp-")) {
      const loadingToast = showToast.loading("Mengambil data peserta...");

      setTimeout(async () => {
        try {
          const fetchedUserId = await getUserIdByEmail(p.email);

          if (!fetchedUserId) {
            showToast.updateError(
              loadingToast,
              "Tidak dapat menemukan ID peserta",
            );
            return;
          }

          userId = fetchedUserId;
          const updatedPeserta = { ...p, _id: userId };
          setSelectedPeserta(updatedPeserta);
          showToast.updateSuccess(
            loadingToast,
            "Data peserta berhasil diambil",
          );

          await loadCalendar(p.email);
        } catch (error) {
          showToast.updateError(loadingToast, "Gagal mengambil data peserta");
        }
      }, 0);
    } else {
      setSelectedPeserta(p);
      await loadCalendar(p.email);
    }
  };

  /* ================= RENDER LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-slate-600 font-medium">
            Memuat data peserta...
          </p>
          <p className="mt-2 text-sm text-slate-500">Harap tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">
        Logbook Peserta
      </h1>
      <p className="text-slate-600 mb-8">
        Kelola dan pantau logbook peserta magang Anda
      </p>

      {!selectedPeserta ? (
        <>
          {/* ================= STATISTICS CARDS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Peserta
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {peserta.length}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <HiUsers className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500">
                  Jumlah peserta bimbingan aktif
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Sedang Dipantau
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {filteredPeserta.length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <HiUser className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500">
                  Hasil pencarian: "{searchQuery || "Semua peserta"}"
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Posisi Tersedia
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {[...new Set(peserta.map((p) => p.posisi))].length}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <HiBriefcase className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500">Berbagai posisi magang</p>
              </div>
            </div>
          </div>

          {/* ================= SEARCH BAR ================= */}
          <div className="mb-8">
            <div className="relative">
              <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari peserta berdasarkan nama, email, posisi, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-500">
              <p>
                Menampilkan {filteredPeserta.length} dari {peserta.length}{" "}
                peserta
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Reset pencarian
                </button>
              )}
            </div>
          </div>

          {/* ================= TABLE PESERTA ================= */}
          {filteredPeserta.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <HiUser className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {searchQuery
                  ? "Peserta tidak ditemukan"
                  : "Belum ada peserta bimbingan"}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada peserta yang sesuai dengan pencarian "${searchQuery}". Coba dengan kata kunci lain.`
                  : "Saat ini belum ada peserta yang ditugaskan untuk bimbingan Anda."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Tampilkan Semua Peserta
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        No
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Peserta
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Posisi
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPeserta.map((p, i) => (
                      <tr
                        key={p.email}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-center text-slate-500 font-medium">
                          {i + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <HiUser className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {p.nama}
                              </p>
                              <p className="text-xs text-slate-500">
                                Peserta Magang
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MdEmail className="w-4 h-4" />
                            <span className="text-sm">{p.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <HiBriefcase className="w-3 h-3" />
                            {p.posisi}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {p.kategori}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleViewLogbook(p)}
                            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            <HiCalendar className="w-4 h-4" />
                            Lihat Logbook
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ================= CALENDAR VIEW ================= */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedPeserta(null);
                setSelectedDate(null);
                setFilledDates({});
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke daftar peserta
            </button>
          </div>

          <div className="bg-white rounded-2xl border p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Logbook: {selectedPeserta.nama}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MdEmail className="w-4 h-4" />
                    <span className="text-sm">{selectedPeserta.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <HiBriefcase className="w-4 h-4" />
                    <span className="text-sm">{selectedPeserta.posisi}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Logbook Terisi</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {Object.keys(filledDates).length} Hari
                </p>
              </div>
            </div>

            <Calendar
              filledDates={filledDates}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          </div>
        </>
      )}

      {/* ================= MODAL ================= */}
      {selectedDate && selectedPeserta && (
        <MentorLogbookModal
          date={selectedDate}
          pesertaId={selectedPeserta._id || ""}
          pesertaNama={selectedPeserta.nama}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
