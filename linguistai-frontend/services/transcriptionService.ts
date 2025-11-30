import { api } from "./api";

export interface TranscriptionRecord {
  _id: string;
  fileName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  text?: string;
  language: string;
  createdAt: string;
}

const uploadAudio = (file: File, language = "en-US"): Promise<TranscriptionRecord> => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("language", language);

  // We use fetch directly here because our generic api wrapper might enforce JSON headers
  const token = localStorage.getItem("token");
  return fetch("http://localhost:5000/api/transcriptions/upload", {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: formData,
  }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      return data;
  });
};

const checkStatus = (id: string): Promise<TranscriptionRecord> => {
  return api.get<TranscriptionRecord>(`/transcriptions/status/${id}`);
};

const getAllTranscriptions = (): Promise<TranscriptionRecord[]> => {
  return api.get<TranscriptionRecord[]>(`/transcriptions`);
};

const deleteTranscription = (id: string): Promise<void> => {
  return api.delete<void>(`/transcriptions/${id}`);
};

export const TranscriptionService = {
  uploadAudio,
  checkStatus,
  getAllTranscriptions,
  deleteTranscription,
};