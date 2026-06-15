export interface Vehicle {
  id: string;
  brand: "Honda" | "Toyota" | "Generic" | "Nissan" | "Hyundai" | "Ford" | "BMW" | "Audi" | "Mercedes-Benz" | "Volkswagen";
  model: string;
  year: number;
  engine: string;
  vin: string;
  weightKg: number;
}

export interface PIDData {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  description: string;
  category: "Engine" | "Transmission" | "Hybrid" | "Turbo" | "Fuel" | "General";
}

export type GaugeType = "analog" | "digital" | "graph" | "bar" | "circular" | "turbo" | "thermometer" | "battery";

export interface GaugeWidgetConfig {
  id: string;
  pidId: string;
  type: GaugeType;
  w: number; // grid coordinate width
  h: number; // grid coordinate height
  title?: string;
}

export interface DTCUnit {
  code: string;
  severity: "Low" | "Moderate" | "High";
  description: string;
  category: "Engine" | "Transmission" | "ABS" | "Airbag" | "Body Control Module" | "Steering Module" | "TPMS";
  status: "Active" | "Pending" | "Permanent";
  possibleCauses: string[];
  recommendedSteps: string[];
}

export interface AlertTrigger {
  id: string;
  name: string;
  pidId: string;
  thresholdType: "above" | "below";
  value: number;
  enabled: boolean;
  isTriggered: boolean;
}

export interface SavedDashboardLayout {
  id: string;
  name: string;
  widgets: GaugeWidgetConfig[];
}

export interface TripData {
  distanceKm: number;
  avgFuelEconomyL100: number;
  instantFuelEconomyL100: number;
  tripCostUsd: number;
  drivingTimeSec: number;
  idleTimeSec: number;
  co2Kg: number;
}

export interface BluetoothAdapter {
  id: string;
  name: string;
  type: "Vgate iCar Pro" | "OBDLink MX+" | "OBDLink LX" | "Veepeak" | "Generic ELM327";
  connected: boolean;
  signalStrength: number;
  firmwareVersion: string;
  supportedProtocols: string[];
}
