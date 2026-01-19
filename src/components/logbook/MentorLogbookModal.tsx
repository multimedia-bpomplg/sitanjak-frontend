"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/toastDashboard";

/* ================= TYPE ================= */

type Status =
  | "hadir"
  | "tidak_hadir_keterangan"
  | "tidak_hadir_tanpa_keterangan";

type Props = {
  date: string;
  pesertaId: string; // ⬅️ WAJIB
  pesertaNama: string;
  onClose: () => void;
};

/* ================= COMPONENT ================= */

export default function MentorLogbookModal({
  date,
  pesertaId,
  pesertaNama,
  onClose,
}: Props) {
  const [logbookId, setLogbookId] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("hadir");
  const [judul, setJudul] = useState("");
  const [pengalaman, setPengalaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const [approvedByMentor, setApprovedByMentor] = useState(false);
  const [mentorNote, setMentorNote] = useState("");

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  /* ================= FETCH LOGBOOK ================= */

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/peserta/${pesertaId}/date/${date}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Gagal mengambil logbook");
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        setLogbookId(data._id);
        setStatus(data.status);
        setJudul(data.judul || "");
        setPengalaman(data.pengalaman || "");
        setKendala(data.kendala || "");
        setKeterangan(data.keterangan || "");
        setFiles(data.files || []);
        setApprovedByMentor(Boolean(data.approvedByMentor));
        setMentorNote(data.mentorNote || "");
      })
      .catch(console.error);
  }, [date, pesertaId]);

  /* ================= APPROVE / REJECT ================= */

  const handleApprove = async (approved: boolean) => {
    if (!logbookId) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/logbook/mentor/approve/${logbookId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          approvedByMentor: approved,
          mentorNote,
        }),
      },
    );

    if (!res.ok) {
      showToast.error("Gagal memproses logbook");
      return;
    }

    showToast.success(approved ? "Logbook disetujui" : "Logbook ditolak");

    setApprovedByMentor(approved);
  };

  /* ================= JSX ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <h2 className="text-xl font-extrabold">Logbook Peserta</h2>
          <p className="text-sm text-slate-600">
            {pesertaNama} • {date}
          </p>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* STATUS PERSETUJUAN */}
          {approvedByMentor && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              ✅ Logbook sudah disetujui mentor
            </div>
          )}

          <Field label="Status Kehadiran">
            <TextBlock value={status} />
          </Field>

          {status === "hadir" && (
            <>
              <Field label="Uraian Aktivitas">
                <TextBlock value={judul} />
              </Field>

              <Field label="Pembelajaran">
                <TextBlock value={pengalaman} />
              </Field>

              <Field label="Kendala">
                <TextBlock value={kendala} />
              </Field>

              {files.length > 0 && (
                <Field label="Dokumentasi">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((f, i) => (
                      <img
                        key={i}
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}/${f}`}
                        onClick={() =>
                          setPreviewImage(
                            `${process.env.NEXT_PUBLIC_BASE_URL}/${f}`,
                          )
                        }
                        className="h-28 w-full rounded-xl object-cover cursor-pointer hover:scale-105 transition"
                      />
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}

          {status === "tidak_hadir_keterangan" && (
            <Field label="Alasan Tidak Hadir">
              <TextBlock value={keterangan} />
            </Field>
          )}

          <Field label="Catatan Mentor">
            <textarea
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2"
            />
          </Field>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose}>Tutup</button>

          <button
            onClick={() => handleApprove(false)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white"
          >
            ❌ Tolak
          </button>

          <button
            onClick={() => handleApprove(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
          >
            ✅ Terima
          </button>
        </div>

        {/* PREVIEW FOTO */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} className="max-h-[90vh] rounded-2xl" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= REUSABLE ================= */

function Field({ label, children }: any) {
  return (
    <div>
      <label className="font-bold mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function TextBlock({ value }: { value: string }) {
  return <div className="text-sm whitespace-pre-line">{value || "-"}</div>;
}
