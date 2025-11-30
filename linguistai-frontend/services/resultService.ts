import { api } from "./api";
import { ExamResult } from "../types";

const submitResult = (score: number, extraData?: any) => {
  // Although the doc only specifies score, we send extra data if the backend supports it in the future
  return api.post("/results/submit", { score, ...extraData });
};

const getMyResults = (): Promise<ExamResult[]> => {
  return api.get<ExamResult[]>("/results/my");
};

const getAllResults = (): Promise<ExamResult[]> => {
  return api.get<ExamResult[]>("/results");
};

export const ResultService = {
  submitResult,
  getMyResults,
  getAllResults,
};