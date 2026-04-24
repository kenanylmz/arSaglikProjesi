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

export interface DoseRecord {
  id: string;
  medicineId: string;
  date: string;        // 'YYYY-MM-DD'
  scheduledTime: string; // 'HH:MM'
  takenAt: string | null;
  taken: boolean;
}

export type TabParamList = {
  HomeTab: undefined;
  RoutineTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ARCamera: undefined;
};
