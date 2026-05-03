export type EmployeeTypeFilter = 'all' | 'national' | 'expat';

export type DayKey =
  | 'j_1' | 'j_2' | 'j_3' | 'j_4' | 'j_5' | 'j_6' | 'j_7' | 'j_8' | 'j_9' | 'j_10'
  | 'j_11' | 'j_12' | 'j_13' | 'j_14' | 'j_15' | 'j_16' | 'j_17' | 'j_18' | 'j_19' | 'j_20'
  | 'j_21' | 'j_22' | 'j_23' | 'j_24' | 'j_25' | 'j_26' | 'j_27' | 'j_28' | 'j_29' | 'j_30'
  | 'j_31';

export type TimesheetDayValue = string | null;

export type TimesheetApiRow = {
  id_tran: number;
  id_emp: number | null;
  DATE_JS: string | null;
  job?: string | null;
  nom?: string | null;
  employeeName?: string | null;
  missing?: boolean | null;
  IS_OK?: boolean | null;
  NATIONAL_NO?: string | null;
  IN_CALL?: string | null;
  COST_CENTER?: string | null;
  COST_CENTER_CODE?: string | null;
  Ref_emp?: string | null;
  NAME?: string | null;
  IS_FOREINGHT?: boolean | null;
} & Record<DayKey, TimesheetDayValue>;

export type TimesheetDirtyUpdate = {
  id_tran: number;
  fields: Partial<Record<DayKey, TimesheetDayValue>>;
};
