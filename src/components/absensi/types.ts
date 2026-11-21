export type ManageRole = "mentor" | "admin" | "superadmin";
export type AttendanceMode = "masuk" | "wfh" | "izin" | "tidak_absen";

export interface AbsensiLocation {
  lat: number;
  lng: number;
  accuracy: number;
  address: string;
  distanceMeters: number;
  isInsideBpom: boolean;
}

export interface AbsensiEntry {
  time: string;
  timeWIB: string;
  photoPath: string;
  location: AbsensiLocation;
  timeStatus: "on_time" | "late" | "on_time_note" | "early_no_note";
  timeStatusLabel: string;
  diffMinutes: number;
  score: number;
  keterangan?: string;
  attemptCount: number;
}

export interface AbsensiKoreksiBy {
  id: string;
  name: string;
  role: string;
}

export interface ManageAbsensiItem {
  _id: string;
  date: string;
  userId: string;
  email: string;
  namaPeserta: string;
  posisi: string;
  institusi: string;
  mentorName: string;
  attendanceMode: AttendanceMode;
  isVirtualMissed?: boolean;
  izinNote?: string;
  izinSubmittedWIB?: string;
  checkIn: AbsensiEntry | null;
  checkOut: AbsensiEntry | null;
  dailyScore: number;
  isAnyOutside: boolean;
  koreksiNote: string;
  koreksiBy: AbsensiKoreksiBy | null;
  koreksiAt: string | null;
}

export interface ManageAbsensiSummary {
  totalRecords: number;
  tepatWaktuCount: number;
  terlambatCount: number;
  outsideBpomCount: number;
  averageDailyScore: number;
}

export interface ManageAbsensiListResponse {
  summary: ManageAbsensiSummary;
  items: ManageAbsensiItem[];
}

export interface ManageRekapPesertaItem {
  email: string;
  namaPeserta: string;
  posisi: string;
  institusi: string;
  mentorName: string;
  statusMagang: string;
  totalHari: number;
  wfhCount: number;
  izinCount: number;
  tidakAbsen: number;
  missedDates?: string[];
  totalHariKerja: number;
  tepatWaktuMasuk: number;
  telatMasuk: number;
  pulangAwalTanpaKet: number;
  luarAreaBpom: number;
  avgCheckInScore: number;
  avgCheckOutScore: number;
  avgDailyScore: number;
}
