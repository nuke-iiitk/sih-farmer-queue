/**
 * Official Indian administrative geography — 28 States and 8 Union Territories
 * with their current district names.
 *
 * This module is intentionally decoupled from the UI so it can be swapped for
 * a backend later: replace `INDIAN_LOCATIONS` with the result of
 * `GET /api/locations` and keep the same shape (see src/services/api.ts).
 *
 * District lists follow the official Census/state-government names. A few
 * recently re-named districts use their widely recognised current name.
 */

// ------------------------------------------------------------------ types

export type LocationKind = 'state' | 'ut';

export type StateOrUt = {
  /** Short ISO-style code, e.g. 'KL'. */
  code: string;
  /** Official English name. */
  name: string;
  type: LocationKind;
  /** Current official district names. */
  districts: string[];
};

// ------------------------------------------------------------------ data

export const INDIAN_LOCATIONS: StateOrUt[] = [
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'state',
    districts: [
      'Alluri Sitharama Raju', 'Anakapalli', 'Ananthapuramu', 'Annamayya',
      'Bapatla', 'Chittoor', 'Dr. B.R. Ambedkar Konaseema', 'East Godavari',
      'Eluru', 'Guntur', 'Kakinada', 'Krishna', 'Kurnool', 'Nandyal',
      'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam',
      'Sri Potti Sriramulu Nellore', 'Sri Sathya Sai', 'Tirupati',
      'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa',
    ],
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    type: 'state',
    districts: [
      'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang',
      'Itanagar Capital Complex', 'Kamle', 'Kra Daadi', 'Kurung Kumey',
      'Lepa Rada', 'Lohit', 'Longding', 'Lower Dibang Valley',
      'Lower Siang', 'Lower Subansiri', 'Namsai', 'Pakke-Kessang',
      'Papum Pare', 'Shi Yomi', 'Siang', 'Tawang', 'Tirap',
      'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang',
    ],
  },
  {
    code: 'AS',
    name: 'Assam',
    type: 'state',
    districts: [
      'Bajali', 'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar',
      'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh',
      'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat',
      'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj',
      'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari',
      'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tamulpur',
      'Tinsukia', 'Udalguri', 'West Karbi Anglong',
    ],
  },
  {
    code: 'BR',
    name: 'Bihar',
    type: 'state',
    districts: [
      'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur',
      'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya',
      'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria',
      'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger',
      'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas',
      'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar',
      'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
    ],
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    type: 'state',
    districts: [
      'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur',
      'Bilaspur', 'Dakshin Bastar Dantewada', 'Dhamtari', 'Durg',
      'Gariaband', 'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur',
      'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Koriya',
      'Mahasamund', 'Manendragarh-Chirmiri-Bharatpur', 'Mohla-Manpur-Ambagarh Chowki',
      'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon',
      'Sarangarh-Bilaigarh', 'Sukma', 'Surajpur', 'Surguja',
    ],
  },
  {
    code: 'GA',
    name: 'Goa',
    type: 'state',
    districts: ['North Goa', 'South Goa'],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    type: 'state',
    districts: [
      'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
      'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang',
      'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar',
      'Junagadh', 'Kachchh', 'Kheda', 'Mahisagar', 'Mehsana', 'Morbi',
      'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot',
      'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad',
    ],
  },
  {
    code: 'HR',
    name: 'Haryana',
    type: 'state',
    districts: [
      'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad',
      'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal',
      'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula',
      'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar',
    ],
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    type: 'state',
    districts: [
      'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu',
      'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una',
    ],
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    type: 'state',
    districts: [
      'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka',
      'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla',
      'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar',
      'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj',
      'Seraikela Kharsawan', 'Simdega', 'West Singhbhum',
    ],
  },
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'state',
    districts: [
      'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural',
      'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur',
      'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere',
      'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu',
      'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara',
      'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura',
      'Yadgir',
    ],
  },
  {
    code: 'KL',
    name: 'Kerala',
    type: 'state',
    districts: [
      'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
      'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
      'Thiruvananthapuram', 'Thrissur', 'Wayanad',
    ],
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'state',
    districts: [
      'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat',
      'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur',
      'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna',
      'Gwalior', 'Harda', 'Indore', 'Jabalpur', 'Jhabua', 'Katni',
      'Khandwa', 'Khargone', 'Maihar', 'Mandla', 'Mandsaur', 'Morena',
      'Narmadapuram', 'Narsinghpur', 'Neemuch', 'Niwari', 'Panna',
      'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore',
      'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi',
      'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha',
    ],
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'state',
    districts: [
      'Ahmednagar', 'Akola', 'Amravati', 'Beed', 'Bhandara', 'Buldhana',
      'Chandrapur', 'Chhatrapati Sambhajinagar', 'Dhule', 'Gadchiroli',
      'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur',
      'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar',
      'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
      'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane',
      'Wardha', 'Washim', 'Yavatmal',
    ],
  },
  {
    code: 'MN',
    name: 'Manipur',
    type: 'state',
    districts: [
      'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East',
      'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi',
      'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal',
      'Thoubal', 'Ukhrul',
    ],
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    type: 'state',
    districts: [
      'Eastern West Khasi Hills', 'East Garo Hills', 'East Jaintia Hills',
      'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills',
      'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills',
      'West Jaintia Hills', 'West Khasi Hills',
    ],
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    type: 'state',
    districts: [
      'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib',
      'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Saitual', 'Serchhip',
    ],
  },
  {
    code: 'NL',
    name: 'Nagaland',
    type: 'state',
    districts: [
      'Chümoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng',
      'Mokokchung', 'Mon', 'Niuland', 'Noklak', 'Peren', 'Phek',
      'Shamator', 'Tseminyü', 'Tuensang', 'Wokha', 'Zunheboto',
    ],
  },
  {
    code: 'OD',
    name: 'Odisha',
    type: 'state',
    districts: [
      'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh',
      'Cuttack', 'Debagarh', 'Dhenkanal', 'Gajapati', 'Ganjam',
      'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal',
      'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri',
      'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri',
      'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh',
    ],
  },
  {
    code: 'PB',
    name: 'Punjab',
    type: 'state',
    districts: [
      'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib',
      'Fazilka', 'Firozpur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar',
      'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga',
      'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar',
      'Sangrur', 'Shahid Bhagat Singh Nagar', 'Sri Muktsar Sahib',
      'Tarn Taran',
    ],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    type: 'state',
    districts: [
      'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Beawar',
      'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu',
      'Dausa', 'Deeg', 'Didwana-Kuchaman', 'Dholpur', 'Dungarpur',
      'Gangapur City', 'Hanumangarh', 'Jaipur', 'Jaipur Rural',
      'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur',
      'Jodhpur Rural', 'Karauli', 'Khairthal-Tijara', 'Kotputli-Behror',
      'Kota', 'Nagaur', 'Neem Ka Thana', 'Pali', 'Phalodi', 'Pratapgarh',
      'Rajsamand', 'Salumbar', 'Sanchore', 'Sawai Madhopur', 'Shahpura',
      'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur',
    ],
  },
  {
    code: 'SK',
    name: 'Sikkim',
    type: 'state',
    districts: ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Pakyong', 'Soreng'],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'state',
    districts: [
      'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
      'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
      'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
      'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
      'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
      'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
      'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai',
      'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar',
    ],
  },
  {
    code: 'TG',
    name: 'Telangana',
    type: 'state',
    districts: [
      'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad',
      'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal',
      'Kamareddy', 'Karimnagar', 'Khammam', 'Kumaram Bheem Asifabad',
      'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak',
      'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda',
      'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
      'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy', 'Siddipet',
      'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal',
      'Yadadri Bhuvanagiri',
    ],
  },
  {
    code: 'TR',
    name: 'Tripura',
    type: 'state',
    districts: [
      'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala',
      'South Tripura', 'Unakoti', 'West Tripura',
    ],
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'state',
    districts: [
      'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya',
      'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur',
      'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor',
      'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
      'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad',
      'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur',
      'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur',
      'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj',
      'Kaushambi', 'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow',
      'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut',
      'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh',
      'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal',
      'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti',
      'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao',
      'Varanasi',
    ],
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    type: 'state',
    districts: [
      'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun',
      'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh',
      'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi',
    ],
  },
  {
    code: 'WB',
    name: 'West Bengal',
    type: 'state',
    districts: [
      'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar',
      'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri',
      'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
      'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur',
      'Purba Bardhaman', 'Purba Medinipur', 'Purulia',
      'South 24 Parganas', 'Uttar Dinajpur',
    ],
  },
  {
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    type: 'ut',
    districts: ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    type: 'ut',
    districts: ['Chandigarh'],
  },
  {
    code: 'DN',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    type: 'ut',
    districts: ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
  },
  {
    code: 'DL',
    name: 'Delhi',
    type: 'ut',
    districts: [
      'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi',
      'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi',
      'South East Delhi', 'South West Delhi', 'West Delhi',
    ],
  },
  {
    code: 'JK',
    name: 'Jammu and Kashmir',
    type: 'ut',
    districts: [
      'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal',
      'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch',
      'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian',
      'Srinagar', 'Udhampur',
    ],
  },
  {
    code: 'LA',
    name: 'Ladakh',
    type: 'ut',
    districts: ['Kargil', 'Leh'],
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    type: 'ut',
    districts: ['Lakshadweep'],
  },
  {
    code: 'PY',
    name: 'Puducherry',
    type: 'ut',
    districts: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
  },
];

// ------------------------------------------------------------------ helpers
//
// Central accessors keep the UI decoupled and, later, trivial to back with an
// API: `GET /api/locations` can hand back the same `StateOrUt[]` shape.

/** Every State/UT in fixed official order. */
export function getLocations(): StateOrUt[] {
  return INDIAN_LOCATIONS;
}

/** Plain names list — convenient for `{ value, label }` option mapping. */
export function getLocationNames(): string[] {
  return INDIAN_LOCATIONS.map((location) => location.name);
}

/** Look up a State/UT by its official name (case-insensitive). */
export function getLocationByName(name: string): StateOrUt | undefined {
  return INDIAN_LOCATIONS.find(
    (location) => location.name.toLowerCase() === name.trim().toLowerCase()
  );
}

/** Districts of a State/UT, or an empty array when the location is unknown. */
export function getDistrictsForLocation(name: string): string[] {
  return getLocationByName(name)?.districts ?? [];
}

/** Convenience: `{ value, label }` option list for the State/UT selector. */
export function getStateOptions(): { value: string; label: string }[] {
  return INDIAN_LOCATIONS.map((location) => ({
    value: location.name,
    label: location.name,
  }));
}

/** Convenience: `{ value, label }` option list for a location's districts. */
export function getDistrictOptions(
  locationName: string
): { value: string; label: string }[] {
  return getDistrictsForLocation(locationName).map((district) => ({
    value: district,
    label: district,
  }));
}
