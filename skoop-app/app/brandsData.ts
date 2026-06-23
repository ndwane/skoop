// brandsData.ts — قائمة شركات السيارات وموديلاتها (شاملة للسوق الإماراتي والعالمي)
// الاستخدام: import { BRANDS_DATA } from './brandsData';
// القيمة (value) ثابتة لا تُغيّرها بعد النشر حتى تبقى الإعلانات القديمة مرتبطة.

export const BRANDS_DATA = [
  // ===== يابانية =====
  { label: 'تويوتا / Toyota', value: 'toyota', models: ['Land Cruiser','Land Cruiser 70','Prado','Camry','Corolla','Corolla Cross','Hilux','Yaris','RAV4','Fortuner','Highlander','Avalon','C-HR','Rush','Sequoia','Tundra','4Runner','Venza','Crown','Supra','GR86','bZ4X','Granvia','Hiace','Innova','FJ Cruiser','Previa'] },
  { label: 'نيسان / Nissan', value: 'nissan', models: ['Patrol','Patrol Safari','Altima','Sunny','X-Trail','Murano','Armada','Navara','Juke','Kicks','Maxima','Pathfinder','GT-R','Z','370Z','Sentra','Leaf','Qashqai','Pickup','Urvan','Tiida','Micra','Ariya'] },
  { label: 'هوندا / Honda', value: 'honda', models: ['Civic','Accord','CR-V','HR-V','ZR-V','Pilot','Odyssey','Jazz','City','Fit','Passport','Ridgeline','e:NS1'] },
  { label: 'ميتسوبيشي / Mitsubishi', value: 'mitsubishi', models: ['Pajero','Montero Sport','L200','Outlander','Eclipse Cross','Lancer','ASX','Attrage','Xpander','Mirage','Triton'] },
  { label: 'مازدا / Mazda', value: 'mazda', models: ['CX-3','CX-30','CX-5','CX-8','CX-9','CX-60','CX-90','Mazda 2','Mazda 3','Mazda 6','MX-5','BT-50'] },
  { label: 'سوبارو / Subaru', value: 'subaru', models: ['Impreza','Forester','Outback','XV','Crosstrek','Legacy','WRX','BRZ','Ascent'] },
  { label: 'سوزوكي / Suzuki', value: 'suzuki', models: ['Vitara','Grand Vitara','Swift','Jimny','Ignis','Baleno','Ertiga','Dzire','Ciaz','S-Presso','Fronx'] },
  { label: 'دايهاتسو / Daihatsu', value: 'daihatsu', models: ['Terios','Gran Max','Sirion','Materia'] },
  { label: 'لكزس / Lexus', value: 'lexus', models: ['ES250','ES300h','ES350','IS250','IS350','IS500','LS460','LS500','GX460','GX550','LX570','LX600','RX350','RX450h','RX500h','NX300','NX350','UX200','LC500','RC350','RZ'] },
  { label: 'انفينيتي / Infiniti', value: 'infiniti', models: ['QX80','QX60','QX55','QX50','QX30','Q50','Q60','Q70'] },
  { label: 'أكورا / Acura', value: 'acura', models: ['MDX','RDX','TLX','ILX','ZDX','NSX'] },
  { label: 'سايون / Scion', value: 'scion', models: ['tC','xB','xD','FR-S','iA','iM'] },

  // ===== كورية =====
  { label: 'هيونداي / Hyundai', value: 'hyundai', models: ['Sonata','Elantra','Accent','Tucson','Santa Fe','Creta','Azera','Grand i10','Staria','H1','Palisade','Venue','Ioniq 5','Ioniq 6','Kona','Bayon','Custo'] },
  { label: 'كيا / Kia', value: 'kia', models: ['Sorento','Sportage','Optima','K5','Stinger','Cerato','Pegas','Rio','Carnival','Telluride','EV6','EV9','Niro','Soul','Seltos','Picanto','Carens','Sonet'] },
  { label: 'جينيسيس / Genesis', value: 'genesis', models: ['G70','G80','G90','GV60','GV70','GV80'] },
  { label: 'سانغ يونغ / SsangYong', value: 'ssangyong', models: ['Rexton','Tivoli','Korando','Musso','Actyon'] },
  { label: 'دايو / Daewoo', value: 'daewoo', models: ['Lanos','Nubira','Leganza','Matiz','Nexia'] },

  // ===== أمريكية =====
  { label: 'فورد / Ford', value: 'ford', models: ['Explorer','F-150','F-150 Raptor','Mustang','Mustang Mach-E','Edge','Expedition','Ranger','Bronco','Bronco Sport','Escape','Fusion','Maverick','Territory','Taurus','EcoSport'] },
  { label: 'شيفروليه / Chevrolet', value: 'chevrolet', models: ['Tahoe','Suburban','Traverse','Trailblazer','Malibu','Camaro','Caprice','Captiva','Colorado','Silverado','Blazer','Corvette','Groove','Spark','Equinox','Impala','Cruze'] },
  { label: 'جي ام سي / GMC', value: 'gmc', models: ['Yukon','Yukon XL','Sierra','Terrain','Canyon','Acadia','Hummer EV'] },
  { label: 'كاديلاك / Cadillac', value: 'cadillac', models: ['Escalade','CT4','CT5','CT6','XT4','XT5','XT6','Lyriq'] },
  { label: 'لينكون / Lincoln', value: 'lincoln', models: ['Navigator','Aviator','Nautilus','Corsair','MKZ','MKX','MKC','Continental'] },
  { label: 'بويك / Buick', value: 'buick', models: ['Enclave','Encore','Envision','LaCrosse','Regal'] },
  { label: 'دودج / Dodge', value: 'dodge', models: ['Challenger','Charger','Durango','Journey','Ram 1500','Nitro'] },
  { label: 'كرايسلر / Chrysler', value: 'chrysler', models: ['300C','Pacifica','Voyager','Sebring'] },
  { label: 'جيب / Jeep', value: 'jeep', models: ['Wrangler','Grand Cherokee','Cherokee','Compass','Renegade','Gladiator','Wagoneer','Grand Wagoneer'] },
  { label: 'رام / RAM', value: 'ram', models: ['1500','2500','3500','TRX'] },
  { label: 'هامر / Hummer', value: 'hummer', models: ['H1','H2','H3','EV'] },
  { label: 'تسلا / Tesla', value: 'tesla', models: ['Model 3','Model S','Model X','Model Y','Cybertruck'] },
  { label: 'ريفيان / Rivian', value: 'rivian', models: ['R1T','R1S'] },
  { label: 'لوسيد / Lucid', value: 'lucid', models: ['Air','Gravity'] },
  { label: 'بونتياك / Pontiac', value: 'pontiac', models: ['GTO','Firebird','Grand Prix','G8'] },

  // ===== ألمانية =====
  { label: 'مرسيدس / Mercedes-Benz', value: 'mercedes', models: ['A-Class','C-Class','E-Class','S-Class','CLA','CLS','GLA','GLB','GLC','GLE','GLS','G-Class','G63','AMG GT','EQA','EQB','EQC','EQE','EQS','V-Class','Maybach S-Class','Maybach GLS','SL','SLC'] },
  { label: 'بي ام دبليو / BMW', value: 'bmw', models: ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series','X1','X2','X3','X4','X5','X6','X7','XM','Z4','M2','M3','M4','M5','M8','i4','i5','i7','iX','iX1','iX3'] },
  { label: 'ميني / Mini', value: 'mini', models: ['Cooper','Cooper S','Countryman','Clubman','John Cooper Works','Paceman','Convertible'] },
  { label: 'اودي / Audi', value: 'audi', models: ['A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','RS3','RS5','RS6','RS7','RS Q8','S3','S5','TT','R8','e-tron','e-tron GT','Q4 e-tron','Q8 e-tron'] },
  { label: 'فولكس واجن / Volkswagen', value: 'volkswagen', models: ['Passat','Golf','Golf GTI','Golf R','Tiguan','Touareg','Polo','Jetta','Teramont','Atlas','Arteon','T-Roc','ID.4','ID.6','Beetle'] },
  { label: 'بورش / Porsche', value: 'porsche', models: ['911','718 Boxster','718 Cayman','Cayenne','Macan','Panamera','Taycan'] },
  { label: 'اوبل / Opel', value: 'opel', models: ['Astra','Insignia','Corsa','Grandland','Crossland','Mokka','Zafira'] },
  { label: 'سمارت / Smart', value: 'smart', models: ['ForTwo','ForFour','#1','#3'] },
  { label: 'مايباخ / Maybach', value: 'maybach', models: ['57','62','S-Class','GLS'] },

  // ===== بريطانية =====
  { label: 'لاند روفر / Land Rover', value: 'land rover', models: ['Defender','Discovery','Discovery Sport','Freelander','Series'] },
  { label: 'رنج روفر / Range Rover', value: 'range rover', models: ['Vogue','Range Rover Sport','Evoque','Velar','Autobiography','SVR'] },
  { label: 'جاكوار / Jaguar', value: 'jaguar', models: ['XE','XF','XJ','F-Pace','E-Pace','I-Pace','F-Type'] },
  { label: 'بنتلي / Bentley', value: 'bentley', models: ['Bentayga','Continental GT','Flying Spur','Mulsanne','Bentayga EWB'] },
  { label: 'رولز رويس / Rolls-Royce', value: 'rolls royce', models: ['Ghost','Phantom','Wraith','Dawn','Cullinan','Spectre'] },
  { label: 'استون مارتن / Aston Martin', value: 'aston martin', models: ['DB11','DB12','DBS','DBX','Vantage','Vanquish','Valkyrie'] },
  { label: 'مكلارين / McLaren', value: 'mclaren', models: ['540C','570S','600LT','720S','765LT','GT','Artura','750S'] },
  { label: 'لوتس / Lotus', value: 'lotus', models: ['Emira','Eletre','Evora','Exige','Elise','Emeya'] },
  { label: 'MG', value: 'mg', models: ['MG3','MG5','MG6','MG7','ZS','HS','RX5','RX8','GT','Cyberster','Whale','One'] },
  { label: 'فوكسهول / Vauxhall', value: 'vauxhall', models: ['Astra','Corsa','Insignia','Mokka','Grandland'] },

  // ===== إيطالية =====
  { label: 'فيراري / Ferrari', value: 'ferrari', models: ['Roma','Portofino','F8 Tributo','SF90','296 GTB','812','Purosangue','Daytona SP3','296 GTS'] },
  { label: 'لامبورغيني / Lamborghini', value: 'lamborghini', models: ['Urus','Huracan','Aventador','Revuelto','Gallardo','Murcielago'] },
  { label: 'مازيراتي / Maserati', value: 'maserati', models: ['Ghibli','Quattroporte','Levante','Grecale','GranTurismo','GranCabrio','MC20'] },
  { label: 'الفا روميو / Alfa Romeo', value: 'alfa romeo', models: ['Giulia','Stelvio','Tonale','Giulietta','4C'] },
  { label: 'فيات / Fiat', value: 'fiat', models: ['500','500X','Tipo','Doblo','Panda','Punto'] },
  { label: 'ابارث / Abarth', value: 'abarth', models: ['595','695','500e','124 Spider'] },
  { label: 'باجاني / Pagani', value: 'pagani', models: ['Huayra','Zonda','Utopia'] },

  // ===== فرنسية =====
  { label: 'بيجو / Peugeot', value: 'peugeot', models: ['208','301','308','2008','3008','5008','408','508','Partner','Landtrek','Rifter'] },
  { label: 'رينو / Renault', value: 'renault', models: ['Duster','Koleos','Megane','Talisman','Captur','Symbol','Dokker','Kadjar','Arkana','Megane E-Tech','Austral'] },
  { label: 'ستروين / Citroen', value: 'citroen', models: ['C3','C4','C5 Aircross','C5 X','Berlingo','C-Elysee'] },
  { label: 'دي اس / DS', value: 'ds', models: ['DS3','DS4','DS7','DS9'] },
  { label: 'بوغاتي / Bugatti', value: 'bugatti', models: ['Chiron','Veyron','Divo','Tourbillon'] },

  // ===== إسبانية / تشيكية =====
  { label: 'سيات / SEAT', value: 'seat', models: ['Leon','Ibiza','Arona','Ateca','Tarraco'] },
  { label: 'كوبرا / Cupra', value: 'cupra', models: ['Leon','Formentor','Ateca','Born','Tavascan','Terramar'] },
  { label: 'سكودا / Skoda', value: 'skoda', models: ['Octavia','Superb','Kodiaq','Karoq','Kamiq','Fabia','Scala','Enyaq'] },

  // ===== سويدية =====
  { label: 'فولفو / Volvo', value: 'volvo', models: ['XC40','XC60','XC90','S60','S90','V60','V90','C40','EX30','EX90'] },
  { label: 'كونيجزيج / Koenigsegg', value: 'koenigsegg', models: ['Jesko','Regera','Gemera','Agera'] },
  { label: 'ساب / Saab', value: 'saab', models: ['9-3','9-5','9-7X','900'] },

  // ===== صينية =====
  { label: 'بي واي دي / BYD', value: 'byd', models: ['Atto 3','Han','Tang','Song Plus','Seal','Dolphin','Seagull','Yuan Plus','Qin','Sealion'] },
  { label: 'جيلي / Geely', value: 'geely', models: ['Coolray','Emgrand','Azkarra','Tugella','Okavango','Monjaro','Starray','Preface','GX3 Pro','Geometry C'] },
  { label: 'شيري / Chery', value: 'chery', models: ['Tiggo 2','Tiggo 4','Tiggo 4 Pro','Tiggo 7','Tiggo 7 Pro','Tiggo 8','Tiggo 8 Pro','Tiggo 9','Arrizo 5','Arrizo 6','Arrizo 8'] },
  { label: 'جيتور / Jetour', value: 'jetour', models: ['X70','X70 Plus','X90','X90 Plus','Dashing','T1','T2'] },
  { label: 'شانجان / Changan', value: 'changan', models: ['CS35 Plus','CS55 Plus','CS75 Plus','CS85','CS95','Eado','Alsvin','UNI-T','UNI-K','UNI-V','Hunter','Lamore'] },
  { label: 'جاك / JAC', value: 'jac', models: ['S2','S3','S4','S5','S7','T6','T8','T9','JS4','JS6'] },
  { label: 'جي ايه سي / GAC', value: 'gac', models: ['GS3','GS4','GS5','GS8','GA4','GA6','GA8','Empow','Emkoo','GN6','M8'] },
  { label: 'هافال / Haval', value: 'haval', models: ['H6','H9','Jolion','Big Dog','Dargo','H6 GT','H2','M6'] },
  { label: 'جريت وول / GWM', value: 'gwm', models: ['Poer','Wingle','Tank 300','Tank 500','Ora 03','Ora 07'] },
  { label: 'تانك / Tank', value: 'tank', models: ['300','400','500','700'] },
  { label: 'اومودا / Omoda', value: 'omoda', models: ['Omoda 5','Omoda C5','Omoda E5','Omoda 7'] },
  { label: 'جايكو / Jaecoo', value: 'jaecoo', models: ['J7','J8','J6'] },
  { label: 'هونشي / Hongqi', value: 'hongqi', models: ['H5','H9','HS5','HS7','E-HS9','H6'] },
  { label: 'نيو / Nio', value: 'nio', models: ['ES6','ES8','ET5','ET7','EC6','EL7'] },
  { label: 'اكس بينج / Xpeng', value: 'xpeng', models: ['G6','G9','P7','P5','X9'] },
  { label: 'لي شيانج / Li Auto', value: 'li auto', models: ['L6','L7','L8','L9','Mega'] },
  { label: 'زيكر / Zeekr', value: 'zeekr', models: ['001','007','009','X'] },
  { label: 'فوياه / Voyah', value: 'voyah', models: ['Free','Dream','Passion','Courage'] },
  { label: 'دينزا / Denza', value: 'denza', models: ['D9','N7','N8','Z9'] },
  { label: 'لينك آند كو / Lynk & Co', value: 'lynk co', models: ['01','03','05','06','09'] },
  { label: 'اكسيد / Exeed', value: 'exeed', models: ['TXL','VX','LX','RX','Sterra'] },
  { label: 'بيستون / Bestune', value: 'bestune', models: ['B70','T77','T99','B30','T55'] },
  { label: 'دونغ فينغ / Dongfeng', value: 'dongfeng', models: ['580','T5 Evo','AX7','Rich 6','E70'] },
  { label: 'فوتون / Foton', value: 'foton', models: ['Tunland','View','Aumark','Sauvana'] },
  { label: 'فورثينج / Forthing', value: 'forthing', models: ['T5 Evo','Friday','Yacht','U-Tour'] },
  { label: 'ماكسوس / Maxus', value: 'maxus', models: ['T60','T90','D90','G10','Euniq'] },
  { label: 'وولينج / Wuling', value: 'wuling', models: ['Hongguang','Bingo','Air EV','Almaz'] },
  { label: 'كايي / Kaiyi', value: 'kaiyi', models: ['X3','X3 Pro','E5','X7'] },
  { label: 'سكاي ويل / Skywell', value: 'skywell', models: ['ET5','HT-i'] },
  { label: 'ليب موتور / Leapmotor', value: 'leapmotor', models: ['C10','C11','T03','C16'] },
  { label: 'افاتر / Avatr', value: 'avatr', models: ['11','12'] },
  { label: 'بايك / BAIC', value: 'baic', models: ['BJ40','BJ80','X55','X7','BJ60'] },
  { label: 'برليانس / Brilliance', value: 'brilliance', models: ['V3','V5','V7','H530'] },
  { label: 'سوايست / Soueast', value: 'soueast', models: ['DX3','DX7','DX8S'] },
  { label: 'زوتاي / Zotye', value: 'zotye', models: ['T600','Z300','SR9','T700'] },
  { label: 'ليفان / Lifan', value: 'lifan', models: ['X60','X70','620','820'] },

  // ===== هندية / آسيوية أخرى =====
  { label: 'تاتا / Tata', value: 'tata', models: ['Nexon','Harrier','Safari','Punch','Tiago','Altroz'] },
  { label: 'ماهيندرا / Mahindra', value: 'mahindra', models: ['Scorpio','XUV700','Thar','Bolero','XUV300'] },
  { label: 'ايسوزو / Isuzu', value: 'isuzu', models: ['D-Max','MU-X','NPR','NLR'] },
  { label: 'هينو / Hino', value: 'hino', models: ['300','500','700'] },
  { label: 'بروتون / Proton', value: 'proton', models: ['Saga','X50','X70','Persona'] },

  // ===== كلاسيكية / قديمة في السوق المستعمل =====
  { label: 'مركوري / Mercury', value: 'mercury', models: ['Grand Marquis','Mountaineer','Milan','Mariner'] },
  { label: 'أولدزموبيل / Oldsmobile', value: 'oldsmobile', models: ['Alero','Cutlass','Aurora','Bravada'] },
  { label: 'ساتيرن / Saturn', value: 'saturn', models: ['Ion','Vue','Aura','Sky'] },
  { label: 'بليموث / Plymouth', value: 'plymouth', models: ['Prowler','Voyager','Neon'] },
  { label: 'داتسون / Datsun', value: 'datsun', models: ['240Z','280Z','510','Go'] },

  // ===== أخرى =====
  { label: 'غير ذلك / Other', value: 'other', models: [] },
];
