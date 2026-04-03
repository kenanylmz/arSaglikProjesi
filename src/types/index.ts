export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  manufacturer: string;
  defaultTimes: string[];
  color: string;
  description: string;
}

export interface MedicineSchedule {
  [medicineId: string]: string[];
}

export interface CountdownInfo {
  hours: number;
  minutes: number;
  seconds: number;
  nextTime: string;
  isOverdue: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  ARCamera: undefined;
};
