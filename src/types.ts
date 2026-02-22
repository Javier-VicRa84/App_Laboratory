export interface Customer {
  id: number;
  name: string;
  tax_id: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contact_person: string;
  notes?: string;
  created_at: string;
}

export interface Technique {
  id: number;
  name: string;
  method: string;
  category: string;
  formula: string;
  variables: string; // JSON string
  notes?: string;
  status: 'active' | 'inactive';
  updated_at: string;
}

export interface Sample {
  id: number;
  code: string;
  customer_id: number;
  customer_name?: string;
  type: string;
  description: string;
  entry_date: string;
  estimated_delivery: string;
  status: 'pending' | 'in_progress' | 'completed' | 'validated';
  responsible_service: string;
  observations?: string;
  renspa?: string;
  dte?: string;
  animal_species?: string;
  sample_weight?: number;
}

export interface Analysis {
  id: number;
  sample_id: number;
  technique_id: number;
  technique_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'validated';
  result_value?: number;
  variables_data?: string; // JSON string
  analyst_id?: number;
  completed_at?: string;
  observations?: string;
  formula?: string;
  variables?: string; // Technique variables definition
}

export interface Equipment {
  id: number;
  name: string;
  internal_code: string;
  serial_number: string;
  purchase_date: string;
  calibration_frequency: number;
  last_maintenance: string;
  next_maintenance: string;
  status: 'operational' | 'maintenance' | 'broken';
  notes?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  batch: string;
  stock: number;
  unit: string;
  expiry_date: string;
  location: string;
  provider: string;
  min_stock: number;
}

export interface Document {
  id: number;
  title: string;
  type: string;
  version: string;
  file_path: string;
  author: string;
  status: 'active' | 'review' | 'obsolete';
  expiry_date: string;
  created_at: string;
}

export interface TriquinosisJornada {
  id: number;
  date: string;
  analyst_id: number;
  technique_id: number;
  type: 'normal' | 'sospechosa';
  status: 'open' | 'completed';
  created_at: string;
}

export interface TriquinosisTropa {
  id: number;
  jornada_id: number;
  customer_id: number;
  tropa_number: string;
  total_animals: number;
  species: string;
  category: string;
  created_at: string;
}

export interface TriquinosisPool {
  id: number;
  jornada_id: number;
  pool_number: string;
  sample_count: number;
  weight: number;
  result: 'pending' | 'ND' | 'P';
  larvae_count: number;
  range_start: number;
  range_end: number;
  composition?: string;
  composition_tropas?: string;
  composition_counts?: string;
  observations?: string;
}

export interface TriquinosisTemperature {
  id: number;
  jornada_id: number;
  time: string;
  water_temp: number;
  chamber_temp: number;
  observations?: string;
}

export interface TriquinosisNCF {
  id: number;
  code: string;
  date: string;
  description: string;
  category: string;
  action_taken: string;
  responsible_id: number;
  status: 'open' | 'in_progress' | 'closed';
}
