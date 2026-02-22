import axios from "axios";

export interface IFormasi {
  _id: string;
  title: string;
  kuota: number;
  jumlahPendaftar: number;
  sisaKuota: number;
  kode: string;
  divisi: string;
  jurusan: string[];
}

export const fetchFormasi = async (): Promise<IFormasi[]> => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/formasi`);

  return res.data;
};

export const fetchPrediksi = async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/formasi/prediksi`,
  );

  return res.data;
};
