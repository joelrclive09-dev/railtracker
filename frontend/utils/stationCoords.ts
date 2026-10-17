// Comprehensive coordinate lookup and geospatial utilities for Indian Railways stations

export interface StationGeo {
  code: string;
  name: string;
  lat: number;
  lon: number;
  state: string;
}

// Major hubs, junctions, and regional stations across Indian Railways
export const STATION_COORDINATES: Record<string, { lat: number; lon: number; name: string; state: string }> = {
  // Southern Railway (Kerala & Tamil Nadu)
  QLN: { lat: 8.8932, lon: 76.6141, name: "Kollam Junction", state: "Kerala" },
  TVC: { lat: 8.4855, lon: 76.9492, name: "Trivandrum Central", state: "Kerala" },
  KTYM: { lat: 9.5916, lon: 76.5322, name: "Kottayam", state: "Kerala" },
  ERS: { lat: 9.9816, lon: 76.2999, name: "Ernakulam Junction", state: "Kerala" },
  ERN: { lat: 9.9984, lon: 76.2917, name: "Ernakulam Town", state: "Kerala" },
  AWY: { lat: 10.1085, lon: 76.3533, name: "Aluva", state: "Kerala" },
  TCR: { lat: 10.5195, lon: 76.2133, name: "Thrissur", state: "Kerala" },
  SRR: { lat: 10.7601, lon: 76.2755, name: "Shoranur Junction", state: "Kerala" },
  PGT: { lat: 10.7963, lon: 76.6548, name: "Palakkad Junction", state: "Kerala" },
  CLT: { lat: 11.2467, lon: 75.7804, name: "Kozhikode", state: "Kerala" },
  CAN: { lat: 11.8745, lon: 75.3704, name: "Kannur", state: "Kerala" },
  KGQ: { lat: 12.5102, lon: 74.9852, name: "Kasaragod", state: "Kerala" },
  ALLP: { lat: 9.4924, lon: 76.3264, name: "Alappuzha", state: "Kerala" },
  KYJ: { lat: 9.1724, lon: 76.4962, name: "Kayamkulam Junction", state: "Kerala" },
  CNGR: { lat: 9.3175, lon: 76.6166, name: "Chengannur", state: "Kerala" },
  TRVL: { lat: 9.3833, lon: 76.5742, name: "Tiruvalla", state: "Kerala" },

  // Tamil Nadu
  MAS: { lat: 13.0827, lon: 80.2707, name: "Chennai Central", state: "Tamil Nadu" },
  MS: { lat: 13.0815, lon: 80.2600, name: "Chennai Egmore", state: "Tamil Nadu" },
  TBM: { lat: 12.9249, lon: 80.1167, name: "Tambaram", state: "Tamil Nadu" },
  CBE: { lat: 11.0168, lon: 76.9558, name: "Coimbatore Junction", state: "Tamil Nadu" },
  ED: { lat: 11.3410, lon: 77.7172, name: "Erode Junction", state: "Tamil Nadu" },
  SA: { lat: 11.6643, lon: 78.1460, name: "Salem Junction", state: "Tamil Nadu" },
  TPJ: { lat: 10.8152, lon: 78.6952, name: "Tiruchirappalli Junction", state: "Tamil Nadu" },
  MDU: { lat: 9.9178, lon: 78.1147, name: "Madurai Junction", state: "Tamil Nadu" },
  DG: { lat: 10.3673, lon: 77.9803, name: "Dindigul Junction", state: "Tamil Nadu" },
  TEN: { lat: 8.7139, lon: 77.7567, name: "Tirunelveli Junction", state: "Tamil Nadu" },
  NCJ: { lat: 8.1833, lon: 77.4119, name: "Nagercoil Junction", state: "Tamil Nadu" },
  CAPE: { lat: 8.0883, lon: 77.5385, name: "Kanniyakumari", state: "Tamil Nadu" },
  RMM: { lat: 9.2876, lon: 79.3129, name: "Rameswaram", state: "Tamil Nadu" },
  KRR: { lat: 10.9601, lon: 78.0766, name: "Karur Junction", state: "Tamil Nadu" },
  TJ: { lat: 10.7870, lon: 79.1378, name: "Thanjavur Junction", state: "Tamil Nadu" },
  VM: { lat: 11.9401, lon: 79.4861, name: "Villupuram Junction", state: "Tamil Nadu" },
  KPD: { lat: 12.9698, lon: 79.1325, name: "Katpadi Junction", state: "Tamil Nadu" },
  AJJ: { lat: 13.0783, lon: 79.6677, name: "Arakkonam Junction", state: "Tamil Nadu" },

  // Karnataka & South Western Railway
  SBC: { lat: 12.9774, lon: 77.5713, name: "KSR Bengaluru City", state: "Karnataka" },
  YPR: { lat: 13.0238, lon: 77.5503, name: "Yesvantpur Junction", state: "Karnataka" },
  SMVB: { lat: 13.0031, lon: 77.6534, name: "SMVT Bengaluru", state: "Karnataka" },
  BNC: { lat: 12.9934, lon: 77.5985, name: "Bengaluru Cant", state: "Karnataka" },
  KJM: { lat: 12.9961, lon: 77.6792, name: "Krishnarajapuram", state: "Karnataka" },
  MYS: { lat: 12.3160, lon: 76.6465, name: "Mysuru Junction", state: "Karnataka" },
  MAQ: { lat: 12.8622, lon: 74.8398, name: "Mangaluru Central", state: "Karnataka" },
  MAJN: { lat: 12.8687, lon: 74.8717, name: "Mangaluru Junction", state: "Karnataka" },
  UBL: { lat: 15.3647, lon: 75.1240, name: "Hubballi Junction", state: "Karnataka" },
  BGM: { lat: 15.8497, lon: 74.5089, name: "Belagavi", state: "Karnataka" },
  BAY: { lat: 15.1394, lon: 76.9214, name: "Ballari Junction", state: "Karnataka" },
  DVG: { lat: 14.4644, lon: 75.9218, name: "Davangere", state: "Karnataka" },

  // Andhra Pradesh & Telangana
  HYB: { lat: 17.3916, lon: 78.4678, name: "Hyderabad Deccan", state: "Telangana" },
  SC: { lat: 17.4339, lon: 78.5045, name: "Secunderabad Junction", state: "Telangana" },
  KCG: { lat: 17.3888, lon: 78.5015, name: "Kacheguda", state: "Telangana" },
  BZA: { lat: 16.5186, lon: 80.6195, name: "Vijayawada Junction", state: "Andhra Pradesh" },
  VSKP: { lat: 17.7215, lon: 83.2870, name: "Visakhapatnam Junction", state: "Andhra Pradesh" },
  TPTY: { lat: 13.6288, lon: 79.4192, name: "Tirupati", state: "Andhra Pradesh" },
  RU: { lat: 13.6397, lon: 79.5264, name: "Renigunta Junction", state: "Andhra Pradesh" },
  GNT: { lat: 16.2974, lon: 80.4431, name: "Guntur Junction", state: "Andhra Pradesh" },
  OGL: { lat: 15.5057, lon: 80.0499, name: "Ongole", state: "Andhra Pradesh" },
  NLR: { lat: 14.4426, lon: 79.9865, name: "Nellore", state: "Andhra Pradesh" },
  RJY: { lat: 17.0005, lon: 81.7800, name: "Rajahmundry", state: "Andhra Pradesh" },

  // Maharashtra & Western / Central Railway
  CSMT: { lat: 18.9402, lon: 72.8354, name: "Mumbai CSMT", state: "Maharashtra" },
  MMCT: { lat: 18.9696, lon: 72.8193, name: "Mumbai Central", state: "Maharashtra" },
  DR: { lat: 19.0178, lon: 72.8478, name: "Dadar Central", state: "Maharashtra" },
  LTT: { lat: 19.0699, lon: 72.8911, name: "Lokmanya Tilak Terminus", state: "Maharashtra" },
  BDTS: { lat: 19.0553, lon: 72.8415, name: "Bandra Terminus", state: "Maharashtra" },
  TNA: { lat: 19.1860, lon: 72.9759, name: "Thane", state: "Maharashtra" },
  KYN: { lat: 19.2354, lon: 73.1306, name: "Kalyan Junction", state: "Maharashtra" },
  PUNE: { lat: 18.5284, lon: 73.8739, name: "Pune Junction", state: "Maharashtra" },
  NGP: { lat: 21.1524, lon: 79.0882, name: "Nagpur Junction", state: "Maharashtra" },
  BSL: { lat: 21.0455, lon: 75.7885, name: "Bhusaval Junction", state: "Maharashtra" },
  NK: { lat: 19.9535, lon: 73.8315, name: "Nashik Road", state: "Maharashtra" },
  SUR: { lat: 17.6599, lon: 75.9064, name: "Solapur", state: "Maharashtra" },

  // Gujarat
  ADI: { lat: 23.0225, lon: 72.6029, name: "Ahmedabad Junction", state: "Gujarat" },
  BRC: { lat: 22.3107, lon: 73.1812, name: "Vadodara Junction", state: "Gujarat" },
  ST: { lat: 21.2049, lon: 72.8407, name: "Surat", state: "Gujarat" },
  RJT: { lat: 22.3106, lon: 70.8022, name: "Rajkot Junction", state: "Gujarat" },
  BVC: { lat: 21.7645, lon: 72.1519, name: "Bhavnagar Terminus", state: "Gujarat" },

  // Delhi NCR & Northern Railway
  NDLS: { lat: 28.6419, lon: 77.2194, name: "New Delhi", state: "Delhi" },
  DLI: { lat: 28.6606, lon: 77.2272, name: "Old Delhi", state: "Delhi" },
  NZM: { lat: 28.5888, lon: 77.2536, name: "Hazrat Nizamuddin", state: "Delhi" },
  ANVT: { lat: 28.6504, lon: 77.3153, name: "Anand Vihar Terminal", state: "Delhi" },
  GZB: { lat: 28.6678, lon: 77.4347, name: "Ghaziabad Junction", state: "Uttar Pradesh" },

  // Uttar Pradesh & North Central
  CNB: { lat: 26.4547, lon: 80.3512, name: "Kanpur Central", state: "Uttar Pradesh" },
  LKO: { lat: 26.8319, lon: 80.9229, name: "Lucknow Charbagh", state: "Uttar Pradesh" },
  BSB: { lat: 25.3276, lon: 82.9863, name: "Varanasi Junction", state: "Uttar Pradesh" },
  DDU: { lat: 25.2818, lon: 83.1235, name: "Pt. Deen Dayal Upadhyaya", state: "Uttar Pradesh" },
  PRYJ: { lat: 25.4484, lon: 81.8340, name: "Prayagraj Junction", state: "Uttar Pradesh" },
  AGC: { lat: 27.1593, lon: 77.9930, name: "Agra Cantt", state: "Uttar Pradesh" },
  GKP: { lat: 26.7588, lon: 83.3732, name: "Gorakhpur Junction", state: "Uttar Pradesh" },
  MB: { lat: 28.8286, lon: 78.7768, name: "Moradabad", state: "Uttar Pradesh" },
  BE: { lat: 28.3370, lon: 79.4140, name: "Bareilly", state: "Uttar Pradesh" },

  // West Bengal & Eastern / South Eastern
  HWH: { lat: 22.5839, lon: 88.3433, name: "Howrah Junction", state: "West Bengal" },
  SDAH: { lat: 22.5697, lon: 88.3712, name: "Sealdah", state: "West Bengal" },
  KOAA: { lat: 22.6025, lon: 88.3768, name: "Kolkata Chitpur", state: "West Bengal" },
  KGP: { lat: 22.3295, lon: 87.3235, name: "Kharagpur Junction", state: "West Bengal" },
  ASN: { lat: 23.6841, lon: 86.9639, name: "Asansol Junction", state: "West Bengal" },
  NJP: { lat: 26.6844, lon: 88.4419, name: "New Jalpaiguri", state: "West Bengal" },

  // Bihar
  PNBE: { lat: 25.6024, lon: 85.1376, name: "Patna Junction", state: "Bihar" },
  GAYA: { lat: 24.8078, lon: 84.9984, name: "Gaya Junction", state: "Bihar" },
  MFP: { lat: 26.1209, lon: 85.3906, name: "Muzaffarpur Junction", state: "Bihar" },

  // Odisha
  BBS: { lat: 20.2648, lon: 85.8413, name: "Bhubaneswar", state: "Odisha" },
  CTC: { lat: 20.4630, lon: 85.8930, name: "Cuttack Junction", state: "Odisha" },
  PURI: { lat: 19.8135, lon: 85.8312, name: "Puri", state: "Odisha" },
  ROU: { lat: 22.2274, lon: 84.8587, name: "Rourkela", state: "Odisha" },

  // Rajasthan
  JP: { lat: 26.9196, lon: 75.7878, name: "Jaipur Junction", state: "Rajasthan" },
  JU: { lat: 26.2808, lon: 73.0232, name: "Jodhpur Junction", state: "Rajasthan" },
  AII: { lat: 26.4525, lon: 74.6399, name: "Ajmer Junction", state: "Rajasthan" },
  KOTA: { lat: 25.2185, lon: 75.8648, name: "Kota Junction", state: "Rajasthan" },

  // Madhya Pradesh
  BPL: { lat: 23.2662, lon: 77.4124, name: "Bhopal Junction", state: "Madhya Pradesh" },
  RKMP: { lat: 23.2081, lon: 77.4373, name: "Rani Kamlapati", state: "Madhya Pradesh" },
  INDB: { lat: 22.7177, lon: 75.8682, name: "Indore Junction", state: "Madhya Pradesh" },
  GWL: { lat: 26.2163, lon: 78.1873, name: "Gwalior Junction", state: "Madhya Pradesh" },
  JBP: { lat: 23.1670, lon: 79.9575, name: "Jabalpur", state: "Madhya Pradesh" },

  // Punjab, Haryana, J&K
  ASR: { lat: 31.6340, lon: 74.8723, name: "Amritsar Junction", state: "Punjab" },
  LDH: { lat: 30.9090, lon: 75.8573, name: "Ludhiana Junction", state: "Punjab" },
  CDG: { lat: 30.7020, lon: 76.8208, name: "Chandigarh", state: "Chandigarh" },
  UMB: { lat: 30.3441, lon: 76.8247, name: "Ambala Cantt", state: "Haryana" },
  JAT: { lat: 32.7060, lon: 74.8797, name: "Jammu Tawi", state: "Jammu & Kashmir" },

  // Assam & Northeast
  GHY: { lat: 26.1818, lon: 91.7533, name: "Guwahati", state: "Assam" },
  DBRG: { lat: 27.4878, lon: 94.9126, name: "Dibrugarh", state: "Assam" },

  // Goa
  MAO: { lat: 15.2736, lon: 73.9789, name: "Madgaon Junction", state: "Goa" },
  KRMI: { lat: 15.4852, lon: 73.9161, name: "Karmali", state: "Goa" },
};

// Calculate distance in kilometers using Haversine formula
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find nearest stations to a given user lat/lon
export function findNearestStations(
  userLat: number,
  userLon: number,
  limit = 5
): Array<{ code: string; name: string; state: string; lat: number; lon: number; distanceKm: number }> {
  const list = Object.entries(STATION_COORDINATES).map(([code, info]) => {
    const distanceKm = haversineDistance(userLat, userLon, info.lat, info.lon);
    return {
      code,
      name: info.name,
      state: info.state,
      lat: info.lat,
      lon: info.lon,
      distanceKm,
    };
  });

  list.sort((a, b) => a.distanceKm - b.distanceKm);
  return list.slice(0, limit);
}

// Retrieve coordinates for any station code, with regional fallback
export function getStationCoords(code: string, stationName = ""): { lat: number; lon: number } {
  if (STATION_COORDINATES[code]) {
    return { lat: STATION_COORDINATES[code].lat, lon: STATION_COORDINATES[code].lon };
  }

  // Fallback hash generator pinned to central India if unknown, to keep map centered
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
  }
  const pseudoOffsetLat = ((Math.abs(hash) % 100) - 50) * 0.05;
  const pseudoOffsetLon = ((Math.abs(hash >> 2) % 100) - 50) * 0.05;

  return {
    lat: 10.8505 + pseudoOffsetLat,
    lon: 76.2711 + pseudoOffsetLon,
  };
}
