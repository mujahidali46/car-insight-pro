import { Vehicle, PIDData, DTCUnit, BluetoothAdapter } from "../types";

export const VEHICLE_DATABASE: Vehicle[] = [
  { id: "honda-civic", brand: "Honda", model: "Civic 1.5 Turbo RS", year: 2016, engine: "L15B7 Turbo", vin: "1HGCG1F48GA288541", weightKg: 1310 },
  { id: "honda-accord", brand: "Honda", model: "Accord 2.0T Touring", year: 2018, engine: "K20C4 Turbo", vin: "1HGCV2F8XJA010488", weightKg: 1530 },
  { id: "honda-crv", brand: "Honda", model: "CR-V 1.5T AWD", year: 2020, engine: "L15BE Turbo", vin: "5FNJK2H56LH023904", weightKg: 1590 },
  { id: "toyota-prius", brand: "Toyota", model: "Prius Hybrid Gen 4", year: 2017, engine: "2ZR-FXE 1.8L Hybrid", vin: "JTDKARFU8H1388410", weightKg: 1380 },
  { id: "toyota-corolla", brand: "Toyota", model: "Corolla Altis 1.8", year: 2019, engine: "2ZR-FE Valvematic", vin: "AHTBK5HEXK2014881", weightKg: 1250 },
  { id: "toyota-camry", brand: "Toyota", model: "Camry 2.5 Hybrid", year: 2021, engine: "A25A-FXS 2.5L", vin: "4T1B11HK5MU084799", weightKg: 1580 },
  { id: "toyota-hilux", brand: "Toyota", model: "Hilux Revo d'Cab 2.8", year: 2015, engine: "1GD-FTV Diesel Turbo", vin: "MROFR22G9FK012488", weightKg: 1950 },
  { id: "bmw-m3", brand: "BMW", model: "M3 Competition", year: 2021, engine: "S58 3.0 BiTurbo", vin: "WBS43AY02MFL40192", weightKg: 1730 },
  { id: "ford-mustang", brand: "Ford", model: "Mustang GT Fastback", year: 2018, engine: "Coyote 5.0L V8", vin: "1FA6P8CF3J5104992", weightKg: 1680 }
];

export const ADAPTERS_DATABASE: BluetoothAdapter[] = [
  { id: "vgate", name: "Vgate iCar Pro OBDLink", type: "Vgate iCar Pro", connected: false, signalStrength: 92, firmwareVersion: "v2.3 stable", supportedProtocols: ["ISO 15765-4 (CAN)", "ISO 14230-4 (KWP2000)", "SAE J1850 PWM"] },
  { id: "obdlink-mx", name: "OBDLink MX+ HighSpeed", type: "OBDLink MX+", connected: false, signalStrength: 98, firmwareVersion: "v5.6.3 standard", supportedProtocols: ["ISO 15765-4 (CAN)", "ISO 14230-4", "Ford MS-CAN", "GM SW-CAN"] },
  { id: "veepeak", name: "Veepeak OBDCheck BLE+", type: "Veepeak", connected: false, signalStrength: 85, firmwareVersion: "v1.9 mini", supportedProtocols: ["ISO 15765-4", "ISO 9141-2"] },
  { id: "generic", name: "Generic ELM327 Adapter", type: "Generic ELM327", connected: false, signalStrength: 60, firmwareVersion: "v1.5 clone", supportedProtocols: ["ISO 15765-4"] }
];

// Comprehensive standard & extended OBD-II parameters database
export const STANDARD_PIDS: PIDData[] = [
  { id: "engine_rpm", name: "Engine RPM", value: 750, unit: "rpm", min: 0, max: 8000, description: "Rotations per minute of the engine crankshaft", category: "Engine" },
  { id: "vehicle_speed", name: "Vehicle Speed", value: 0, unit: "km/h", min: 0, max: 260, description: "Calculated vehicle velocity from transmission telemetry", category: "Engine" },
  { id: "coolant_temp", name: "Coolant Temperature", value: 92, unit: "°C", min: -40, max: 130, description: "Engine cooling fluid thermal level", category: "Engine" },
  { id: "battery_voltage", name: "Battery Voltage", value: 14.2, unit: "V", min: 9, max: 16, description: "Alternator / auxiliary battery terminal voltage", category: "Engine" },
  { id: "fuel_level", name: "Fuel Level", value: 65, unit: "%", min: 0, max: 100, description: "Main fuel tank level metric", category: "Fuel" },
  { id: "engine_load", name: "Calculated Engine Load", value: 18, unit: "%", min: 0, max: 100, description: "Proportional engine displacement workload available", category: "Engine" },
  { id: "intake_temp", name: "Intake Air Temp", value: 35, unit: "°C", min: -40, max: 80, description: "Temperature of intake charge air before throttle", category: "Engine" },
  { id: "fuel_pressure", name: "Fuel Rail Pressure", value: 410, unit: "kPa", min: 0, max: 15000, description: "Direct fuel injection high-pressure line level", category: "Fuel" }
];

export const HONDA_EXTENDED_PIDS: PIDData[] = [
  { id: "honda_cvt_temp", name: "CVT Fluid Temp (HFT)", value: 85, unit: "°C", min: 0, max: 140, description: "Honda CVT steel belt lubrication temperature", category: "Transmission" },
  { id: "honda_knock_retard", name: "Knock Retard Angle", value: 0.5, unit: "deg", min: 0, max: 15, description: "Ignition timing reduction to prevent fuel pre-detonation", category: "Engine" },
  { id: "honda_wastegate_duty", name: "Wastegate Duty Cycle", value: 12.5, unit: "%", min: 0, max: 100, description: "Solenoid actuation controlling turbine bypass gas", category: "Turbo" },
  { id: "honda_turbo_boost", name: "Turbo Boost Pressure", value: 0.2, unit: "bar", min: -1.0, max: 2.2, description: "Intake manifold pressure above standard barometric point", category: "Turbo" },
  { id: "honda_vtec_status", name: "VTEC System Engagement", value: 0, unit: "bool", min: 0, max: 1, description: "High-lift camshaft profile actuator active indicator", category: "Engine" },
  { id: "honda_intake_cam", name: "Intake VTC Angle", value: 15, unit: "deg", min: 0, max: 50, description: "Variable timing controller intake displacement lock", category: "Engine" },
  { id: "honda_misfire_count", name: "Total Misfire Counter", value: 0, unit: "counts", min: 0, max: 100, description: "Summed cylinder ignition missed fires over 200 cycles", category: "Engine" },
  { id: "honda_air_fuel_ratio", name: "AFR (Wideband O2)", value: 14.7, unit: ":1", min: 9.0, max: 22.0, description: "Stoichiometric chemical ratio of air to gasoline fuel", category: "Fuel" }
];

export const TOYOTA_EXTENDED_PIDS: PIDData[] = [
  { id: "toyota_cvt_temp", name: "ATF / CVT Oil Temp", value: 82, unit: "°C", min: 0, max: 140, description: "Transmission fluid temperature under high-efficiency lock", category: "Transmission" },
  { id: "toyota_hybrid_soc", name: "Hybrid HV Battery SoC", value: 58, unit: "%", min: 10, max: 90, description: "State of Charge of high voltage nickel-metal/lithium traction pack", category: "Hybrid" },
  { id: "toyota_inverter_temp", name: "Inverter Coolant Temp (MG1/MG2)", value: 48, unit: "°C", min: 0, max: 100, description: "Power assembly inverter gate-driving temperature", category: "Hybrid" },
  { id: "toyota_injection_timing", name: "Fuel Injection Timing", value: -2.3, unit: "deg BTDC", min: -30, max: 20, description: "Rotational fuel injection nozzle onset timing offset", category: "Engine" },
  { id: "toyota_knock_correction", name: "Knock Correction (KCS)", value: 18.2, unit: "deg", min: 0, max: 25, description: "Toyota Ignition feedback controller dynamic learn offset", category: "Engine" },
  { id: "toyota_catalyst_temp", name: "Catalytic Exhaust Temp", value: 650, unit: "°C", min: 0, max: 1000, description: "Catalytic brick chamber exhaust clean heat index", category: "Engine" },
  { id: "toyota_hv_voltage", name: "HV Battery Block Voltage", value: 242.5, unit: "V", min: 180, max: 320, description: "Summed series cell stack voltage for solid chassis power", category: "Hybrid" },
  { id: "toyota_mg2_torque", name: "MG2 Electric Motor Torque", value: 12.0, unit: "N·m", min: -160, max: 163, description: "Secondary electric traction drive rotational power index", category: "Hybrid" }
];

// Rich automotive database of DTC Fault codes for scanner
export const SAMPLE_DTC_CODES: Record<string, DTCUnit> = {
  "P0113": {
    code: "P0113",
    severity: "Moderate",
    description: "Intake Air Temperature (IAT) Sensor 1 Circuit High Input",
    category: "Engine",
    status: "Active",
    possibleCauses: [
      "Open circuit in harness ground/signal wires",
      "Defective Intake Air Temperature sensor element",
      "Corroded pins inside sensor body",
      "Corrupt ECM calibration tables"
    ],
    recommendedSteps: [
      "Inspect connector pins for secure physical contact resistance.",
      "Spray connection pins with automotive electrical cleaner.",
      "Check temperature voltage drop using diagnostic lookup table.",
      "Run the diagnostic cycle clear validation step."
    ]
  },
  "P0171": {
    code: "P0171",
    severity: "High",
    description: "System Too Lean (Bank 1) - Oxygen feedback sensor registers deficient fuel to air ratio",
    category: "Engine",
    status: "Active",
    possibleCauses: [
      "Vacuum leak down-stream of Mass Airflow (MAF) sensor",
      "Clogged, lazy, or dirty MAF sensor element grid",
      "Clogged fuel injection spray orifices",
      "Exhaust pipe weld fracture upstream of O2 sensor"
    ],
    recommendedSteps: [
      "Spray combustible fluid around manifold seams during idle to detect intake leak.",
      "Clean MAF sensor wire mesh using electronic contact spray.",
      "Test primary fuel pressure output at fuel block test schrader port.",
      "Analyze fuel trims (STFT/LTFT) at stable highway RPM load."
    ]
  },
  "P0300": {
    code: "P0300",
    severity: "High",
    description: "Random/Multiple Cylinder Misfire Detected",
    category: "Engine",
    status: "Active",
    possibleCauses: [
      "Worn or severely carbon-fouled spark plugs",
      "Degraded ignition coil pack potting insulation",
      "Low fuel system delivery or poor gasoline octane quality",
      "Cylinder head compression failure"
    ],
    recommendedSteps: [
      "Pull ignition coils and spark plugs to inspect for moisture or structural wear.",
      "Swap coil on misfiring cylinder with good one to check if error follows.",
      "Inspect fuel injector resistance.",
      "Run manual compression test under cold-start baseline conditions."
    ]
  },
  "P0420": {
    code: "P0420",
    severity: "Moderate",
    description: "Catalyst System Efficiency Below Threshold (Bank 1) - Downstream sensor traces too much gas oscillation",
    category: "Engine",
    status: "Active",
    possibleCauses: [
      "Degraded internal catalytic monolithic mesh",
      "Oxygen sensors recording out of specification",
      "Exhaust system mechanical leak near cat converter flange",
      "Delayed combustion depositing raw fuel on elements"
    ],
    recommendedSteps: [
      "Visually inspect physical converter casing for red-heat or steel weld flaws.",
      "Perform live graphing of primary and downstream oxygen sensor cycles. Secondary sensor should remain flat.",
      "Examine fuel injectors for spray leakage."
    ]
  },
  "P2563": {
    code: "P2563",
    severity: "Moderate",
    description: "Turbocharger Boost Control Position Sensor Circuit Range/Performance (VGT Core Code)",
    category: "Engine",
    status: "Pending",
    possibleCauses: [
      "Sticky exhaust guide vanes due to excessive carbon build-up",
      "VGT position electronic target sensor error",
      "Damaged signal wires near engine exhaust runner block",
      "Deficient manifold vacuum reference supply"
    ],
    recommendedSteps: [
      "Inspect variable vane actuator linkage physically with keys cycled.",
      "Read out actual position sensor voltage parameters.",
      "Clean turbo block inner volute to reduce internal soot friction."
    ]
  },
  "C0040": {
    code: "C0040",
    severity: "High",
    description: "Right Front Wheel Speed Sensor Malfunction (ABS System)",
    category: "ABS",
    status: "Active",
    possibleCauses: [
      "Road debris blocking the magnet on speed exciter ring",
      "Severed hub harness wiring during chassis service",
      "Internal sensor pickup coil wire coil breakage"
    ],
    recommendedSteps: [
      "De-mount right front wheel assembly to expose the ABS tone ring.",
      "Wipe off magnetic wear dust or replace cracked exciter tone ring.",
      "Measure harness line voltage output when manually spinning raw hub."
    ]
  },
  "B1000": {
    code: "B1000",
    severity: "High",
    description: "Electronic Control Unit (ECU) Memory Checksum Performance (SRS Airbag BCM Core)",
    category: "Airbag",
    status: "Permanent",
    possibleCauses: [
      "Vehicle voltage dropping below 9V during engine crank startup",
      "SRS SRS control module board component deterioration",
      "Corroded ground block pin behind front fire-wall shield"
    ],
    recommendedSteps: [
      "Charge primary starter battery to correct 12.6V baseline state.",
      "Inspect system chassis engine block ground points for tightness.",
      "Submit module assembly configuration details for rebuild validation."
    ]
  }
};
