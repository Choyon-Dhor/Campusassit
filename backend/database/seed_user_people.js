

// ============================================================
// database/seed_user_people.js
// Seeds Teachers and Students into Supabase PostgreSQL
// Run: node database/seed_user_people.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const rawTeachers = [
  { name: 'Mr. Sadman Sakib', initial: 'SS' },
  { name: 'Mr. Md Imam Mahdi', initial: 'MIM' },
  { name: 'Abdul Wadud Shakib', initial: 'AWS' },
  { name: 'Shrabanti Chowdhury', initial: 'SC' },
  { name: 'Ishrar Nazah Chowdhury', initial: 'INC' },
  { name: 'Mr. Md Shamihul Islam Khan Limon', initial: 'MSIKL' },
  { name: 'Mr. Md. Mushtaq Shahriyar Rafee', initial: 'MMSR' },
  { name: 'Ms. Archi Arani Basak', initial: 'AAB' },
  { name: 'Md. Fahmidur Rahman Sakib', initial: 'MFRS' },
  { name: 'Mashia Hossain', initial: 'MH' },
  { name: 'Mahbuba Akther Liza', initial: 'MAL' },
  { name: 'Aisha Hayder Chowdhury', initial: 'AHC' },
  { name: 'Ms. Mayami Das Purkayastha', initial: 'MDP' },
  { name: 'Ms. Nabila Zannat Rifa', initial: 'NZR' },
  { name: 'Raisa Fairooz', initial: 'RF' },
  { name: 'Tajbin Jahan', initial: 'TJ' },
  { name: 'Golam Mostofa Naeem', initial: 'GMN' },
  { name: 'Ms. Bushra Azmat Hussain', initial: 'BAH' },
  { name: 'Barnali Sarker Shoumita', initial: 'BSS' },
  { name: 'Samia Rahman Rima', initial: 'SRR' },
  { name: 'Khalid Bin Selim', initial: 'KBS' },
  { name: 'Wadia Iqbal Chowdhury', initial: 'WIC' },
  { name: 'Mr. Ahmed Afif Rafsan', initial: 'AAR' },
  { name: 'Mr. Ahmed Istiakur Rahman', initial: 'AIR' },
  { name: 'Arfatul Islam Asif', initial: 'AIA' },
  { name: 'Nayem Ahmed', initial: 'NA' },
  { name: 'Bibek Das', initial: 'BD' },
  { name: 'Mr. Md. Mahfujul Hasan', initial: 'MMH' },
  { name: 'Mr. Rishad Amin Pulok', initial: 'RAP' },
  { name: 'Mr. Abu Jafar Md. Jakaria', initial: 'AJMJ' },
  { name: 'Mr. Anwarul Kawchar', initial: 'AK' },
  { name: 'Mr. Fardin Ahasan Maraz', initial: 'FAM' },
  { name: 'Ms. Anika Tabassum', initial: 'AT' },
  { name: 'Mr. Md. Shadman Shakib', initial: 'MSS' },
  { name: 'Farhana Akter', initial: 'FA' },
  { name: 'Ruhul Amin', initial: 'RA' },
  { name: 'Nazrul Islam', initial: 'NI' },
  { name: 'Muhammad Muzammil', initial: 'MM' },
  { name: 'Ruma Das', initial: 'RD' },
  { name: 'Abdullah Al Masud', initial: 'AAM' },
  { name: 'Professor Chowdhury Mukammel Wahid', initial: 'CMW' },
  { name: 'Khadia Akter', initial: 'KA' },
  { name: 'Dr. Md. Razaul Haque', initial: 'MRH' },
  { name: 'Prof. Dr. Tofayel Ahmed', initial: 'TA' },
  { name: 'Taspia Mostofa', initial: 'TM' },
  { name: 'Salma Akter', initial: 'SA' },
  { name: 'Md. Alaul Haque', initial: 'MAH' },
  { name: 'Ashikur Rahman', initial: 'AR' },
  { name: 'Nahida Sarkar', initial: 'NS' }
];

const rawStudentsText = `
Batch: 58th [A]
নাম: A. H. M. Rezaul Karim, Role: student, Batch: 58th [A], Dept: CSE, ID: 223-115-056
নাম: MD. Alvi, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-001
নাম: Sourov Sharma Joy, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-003
নাম: Md. Sifat Ahmed Chowdhury, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-004
নাম: MD. RIFAT MIAH, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-005
নাম: SHUVO CHANDA, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-006
নাম: MD. AL-AMIN SARKER, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-008
নাম: S.M.Riyad Ahmed, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-009
নাম: MD. EMON MIAH, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-010
নাম: Syed Arafath Hossain, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-011
নাম: Shahriar Hossain Sayem, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-012
নাম: Tonmoy Debnath, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-014
নাম: Mst. Habiba Akther, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-015
নাম: ABDULLAH ALL MAMUN, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-016
নাম: MD. ASHRAFUL ALAM, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-017
নাম: TAZNIN SULTANA, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-018
নাম: MUBASHSHIR AHMED, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-019
নাম: Shuvo Das, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-020
নাম: Md. Tanvir Hosen, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-021
নাম: Ashikur Rahman, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-022
নাম: Rayhan Uddin Ahmed, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-024
নাম: Ankan Das, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-026
নাম: Joy Roy, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-027
নাম: MD. ABU TOYOB, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-028
নাম: Rupa Akter, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-029
নাম: MD. FOYSAL AHMED, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-030
নাম: Mahir Shahriar, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-032
নাম: Alif Uddin, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-033
নাম: SHIHAB UDDIN, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-034
নাম: Debashis Ghosh, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-036
নাম: Tahmina Begum, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-038
নাম: MD. RAFIQUL ISLAM, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-039
নাম: MOHAMMAD OLIUR RAHMAN MAHI, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-040
নাম: Joydeb Paul Dipon, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-041
নাম: Sreejoy Roy, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-042
নাম: Joy Podder, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-043
নাম: SAIDUL ISLAM, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-044
নাম: S. M. NAIMUL ISLAM NAIM, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-045
নাম: Anupam Nath, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-046
নাম: SHAHRIAR ISLAM SHUVO, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-047
নাম: MD. NAZMUL HASAN, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-048
নাম: MOHAMMAD MASUM BILLAH, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-049
নাম: SAYED TANVIR HOSSAIN, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-050
নাম: Tanjeel Ahmed, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-051
নাম: SHARIAR RAHMAN, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-052
নাম: Shahriar Jahan Samid, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-053
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-054
নাম: Moshahid Ali, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-055
নাম: Rayhan Uddin, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-056
নাম: Fahmidur Rahman, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-057
নাম: Md. Mehedi Hasan, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-058
নাম: Md. Asif Ahmed, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-060

Batch: 58th [B]
নাম: Naimur Rahman, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-061
নাম: Afsana Khanam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-062
নাম: Farhan Tanvir, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-063
নাম: Mahir Asif, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-064
নাম: Sakibul Hasan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-065
নাম: Joyonto Das, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-066
নাম: Sadia Afrin, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-067
নাম: Ashfaqur Rahman, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-068
নাম: Tasnim Ahmed, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-069
নাম: Sumon Roy, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-070
নাম: Md. Rabbi Hossain, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-071
নাম: Tahmidul Islam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-072
নাম: Mahmudul Hasan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-073
নাম: Zannatun Nayeem, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-074
নাম: Shuvashish Roy, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-075
নাম: Md. Shahparan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-076
নাম: Fariha Sultana, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-077
নাম: Nazmul Huda, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-078
নাম: Abu Bakar Siddik, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-079
নাম: Fahim Shahriar, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-080
নাম: Niloy Deb, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-081
নাম: Tasfia Tabassum, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-082
নাম: MD. Tanvir Hasan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-083
নাম: Shakil Ahmed, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-084
নাম: Amit Das, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-085
নাম: Nusrat Jahan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-086
নাম: Riazul Islam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-087
নাম: Mehedi Hasan Shawon, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-088
নাম: Pronob Kumar, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-089
নাম: Anik Sen, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-090
নাম: Md. Imran Hossain, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-091
নাম: Tanjina Akter, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-092
নাম: Moinul Islam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-093
নাম: Shahadat Hossain, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-094
নাম: Pritom Dhar, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-095
নাম: Ashraful Islam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-096
নাম: Md. Al Amin, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-097
নাম: Farjana Akter, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-098
নাম: Arifur Rahman, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-099
নাম: Sabbir Ahmed, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-100
নাম: Towhidul Islam, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-101
নাম: Nishat Tasnim, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-102
নাম: Jubayer Ahmed, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-103
নাম: Shourav Das, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-104
নাম: Kazi Tanvir, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-105
নাম: Hasibul Hasan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-106
নাম: Anisur Rahman, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-107
নাম: Mehedi Hasan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-108
নাম: Rifat Jahan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-109
নাম: Shakhawat Hossain, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-110
নাম: Tanvir Ahmed, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-111
নাম: Md. Raihan, Role: student, Batch: 58th [B], Dept: CSE, ID: 231-115-112

Batch: 58th [C]
নাম: MD. AHSAN HABIB SIAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-121
নাম: NABILA JAHAN ANNI, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-122
নাম: FAHMIDA KHATUN NISA, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-123
নাম: MD. EMON AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-124
নাম: SAYED AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-125
নাম: SUMAYA AKTHER, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-126
নাম: TANZILA AKTHER, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-127
নাম: MD. SALMAN AHMED SADI, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-128
নাম: MD. SOURAV HASAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-129
নাম: BISHAL DEV CHOUDHURY, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-130
নাম: TAHERA JAHAN KEYA, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-131
নাম: SANJIDA KHANAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-132
নাম: MOHAMMAD TAHSIN AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-133
নাম: SHARIAR AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-134
নাম: ANTOR SEN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-135
নাম: FAHAD AL MAMUN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-136
নাম: ABU JAFAR MD. ABDULLAH, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-137
নাম: MD. ARIF HOSSAIN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-138
নাম: MOHAMMED MAHBUB HASAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-139
নাম: MD. SHAWON AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-140
নাম: AFIA TAHSIN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-141
নাম: MD. SHAHRIAR NAFIZ, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-142
নাম: MD. AL-AMIN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-143
নাম: JANNATUL FERDAUS, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-144
নাম: MD. ASHIKUR RAHMAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-145
নাম: MD. TANVIR AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-146
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-147
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-148
নাম: SHAWON PAUL, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-149
নাম: FARHANA AKTER, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-150
নাম: MD. NAIMUL ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-151
নাম: AFSANA MIMI, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-152
নাম: MD. SHAKIL AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-153
নাম: ABDUR RAHMAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-154
নাম: SOURAV SARKER, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-155
নাম: MST. SUMIYA AKTHER, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-156
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-157
নাম: MD. TANJIMUL ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-158
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-159
নাম: SHAHRIAR AHMED SHUVO, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-160
নাম: MD. SHIHAB UDDIN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-161
নাম: MD. RASHEDUL ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-162
নাম: TAHSIN AHMED, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-163
নাম: NAZMUS SAKIB, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-164
নাম: TANZINA SULTANA, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-165
নাম: MD. MEHEDI HASAN EMON, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-166
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-167
নাম: MD. ASHIKUL ISLAM, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-168
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-169
নাম: MD. SAZZAD HOSSAIN, Role: student, Batch: 58th [C], Dept: CSE, ID: 231-115-170

Batch: 58th [E]
নাম: MD. TAHMIDUL ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-238
নাম: MD. FAHIM SHAHRIAR, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-239
নাম: MST. SHADIA AFRIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-240
নাম: MD. ASHIKUR RAHMAN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-241
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-242
নাম: SHAKIL AHMED, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-243
নাম: JOYONTO ROY, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-244
নাম: MD. TANVIR HASAN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-245
নাম: MD. RIFAT HOSSAIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-246
নাম: SUMAIYA AKTER, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-247
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-248
নাম: MD. RASHEDUL ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-249
নাম: NAZMIN SULTANA, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-250
নাম: MD. SHIHAB UDDIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-251
নাম: SOURAV SARKER, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-252
নাম: ANIK KUMAR DAS, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-253
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-254
নাম: FARHANA YEASMIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-255
নাম: MD. AHSAN HABIB, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-256
নাম: MD. SAZZAD HOSSAIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-257
নাম: TANVIR AHMED, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-258
নাম: MD. AL-AMIN, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-259
নাম: MST. RIMA AKTER, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-260
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-261
নাম: MD. ASHIKUL ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-262
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-263
নাম: MD. TANJIMUL ISLAM, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-264
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-265
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-266
নাম: SHAHRIAR AHMED, Role: student, Batch: 58th [E], Dept: CSE, ID: 231-115-267

Batch: 58th [F]
নাম: MD. JUBAYER AHMED, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-296
নাম: AFSANA KHANAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-297
নাম: MD. SHAKIL HOSSAIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-298
নাম: MD. TANVIR HASAN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-299
নাম: RIFAT JAHAN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-300
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-301
নাম: SOURAV CHANDRA DAS, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-302
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-303
নাম: MST. SHADIA AFRIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-304
নাম: MD. ASHIKUR RAHMAN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-305
নাম: TANZILA AKTHER, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-306
নাম: MD. RASHEDUL ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-307
নাম: JOYONTO ROY, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-308
নাম: MD. TAHMIDUL ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-309
নাম: NAZMIN SULTANA, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-310
নাম: MD. SHIHAB UDDIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-311
নাম: FARHANA YEASMIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-312
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-313
নাম: ANIK KUMAR DAS, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-314
নাম: MD. AHSAN HABIB, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-315
নাম: MD. SAZZAD HOSSAIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-316
নাম: TANVIR AHMED, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-317
নাম: MD. AL-AMIN, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-318
নাম: MST. RIMA AKTER, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-319
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-320
নাম: MD. ASHIKUL ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-321
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-322
নাম: MD. TANJIMUL ISLAM, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-323
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-324
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [F], Dept: CSE, ID: 231-115-325

Batch: 58th [G]
নাম: MD. SAZZAD HOSSAIN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-350
নাম: MST. RIMA AKTER, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-351
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-352
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-353
নাম: MD. AHSAN HABIB, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-354
নাম: MD. TANVIR HASAN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-355
নাম: FARHANA YEASMIN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-356
নাম: MD. TAHMIDUL ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-357
নাম: JOYONTO ROY, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-358
নাম: MD. RASHEDUL ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-359
নাম: NAZMIN SULTANA, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-360
নাম: MD. SHIHAB UDDIN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-361
নাম: SOURAV SARKER, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-362
নাম: ANIK KUMAR DAS, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-363
নাম: TANVIR AHMED, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-364
নাম: MD. AL-AMIN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-365
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-366
নাম: MD. ASHIKUL ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-367
নাম: MD. TANJIMUL ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-368
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-369
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-370
নাম: SHAHRIAR AHMED, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-371
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-372
নাম: AFSANA KHANAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-373
নাম: RIFAT JAHAN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-374
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-375
নাম: SOURAV CHANDRA DAS, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-376
নাম: MST. SHADIA AFRIN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-377
নাম: MD. ASHIKUR RAHMAN, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-378
নাম: TANZILA AKTHER, Role: student, Batch: 58th [G], Dept: CSE, ID: 231-115-379

Batch: 58th [H]
নাম: ABDUR RAHMAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-401
নাম: MD. RIFAT HOSSAIN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-402
নাম: MST. TANZINA AKTER, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-403
নাম: MD. SHAKIB HASAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-404
নাম: NAZMUS SAKIB, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-405
নাম: SUMAIYA AKTER, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-406
নাম: MD. SAZZADUL ISLAM, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-407
নাম: SHAWON PAUL, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-408
নাম: MD. EMON AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-409
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-410
নাম: MD. ARIF HOSSAIN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-411
নাম: SAYED AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-412
নাম: MST. SUMIYA AKTHER, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-413
নাম: MD. FAHIM SHAHRIAR, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-414
নাম: MD. SALMAN AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-415
নাম: ANIK SEN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-416
নাম: MD. SHAWON AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-417
নাম: MOHAMMED MAHBUB HASAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-418
নাম: MD. NAIMUL ISLAM, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-419
নাম: FARHANA AKTER, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-420
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-421
নাম: SOURAV SARKER, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-422
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-423
নাম: MD. TANVIR HASAN, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-424
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-425
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-426
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-427
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-428
নাম: JOYONTO ROY, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-429
নাম: MD. AHSAN HABIB, Role: student, Batch: 58th [H], Dept: CSE, ID: 231-115-430

Batch: 58th [I]
নাম: MD. SHAKIL HOSSAIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-451
নাম: MD. JUBAYER AHMED, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-452
নাম: AFSANA KHANAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-453
নাম: RIFAT JAHAN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-454
নাম: MD. SAIFUL ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-455
নাম: MD. TANVIR HASAN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-456
নাম: MD. MEHEDI HASAN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-457
নাম: MST. SHADIA AFRIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-458
নাম: MD. ASHIKUR RAHMAN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-459
নাম: TANZILA AKTHER, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-460
নাম: MD. RASHEDUL ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-461
নাম: JOYONTO ROY, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-462
নাম: MD. TAHMIDUL ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-463
নাম: NAZMIN SULTANA, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-464
নাম: MD. SHIHAB UDDIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-465
নাম: SOURAV CHANDRA DAS, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-466
নাম: FARHANA YEASMIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-467
নাম: MD. SHAKIL KHAN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-468
নাম: ANIK KUMAR DAS, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-469
নাম: MD. AHSAN HABIB, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-470
নাম: MD. SAZZAD HOSSAIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-471
নাম: TANVIR AHMED, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-472
নাম: MD. AL-AMIN, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-473
নাম: MST. RIMA AKTER, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-474
নাম: MD. NAYEEM ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-475
নাম: MD. ASHIKUL ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-476
নাম: SABIKUN NAHAR, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-477
নাম: MD. TANJIMUL ISLAM, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-478
নাম: MD. MARUF AHMED, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-479
নাম: MD. REZWAN AHMED, Role: student, Batch: 58th [I], Dept: CSE, ID: 231-115-480
`;

function parseStudents(text) {
  const students = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Batch:')) continue;

    // Format: নাম: Sourov Sharma Joy, Role: student, Batch: 58th [A], Dept: CSE, ID: 231-115-003
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 5) {
      const name = parts[0].replace(/^নাম:\s*/, '');
      const role = parts[1].replace(/^Role:\s*/i, '');
      const batch = parts[2].replace(/^Batch:\s*/i, '');
      const dept = parts[3].replace(/^Dept:\s*/i, '');
      const id = parts[4].replace(/^ID:\s*/i, '');

      const secMatch = batch.match(/\[([A-Z])\]/i);
      const sec = secMatch ? secMatch[1].toUpperCase() : 'A';

      students.push({
        name,
        role: 'student',
        batch_number: 58,
        batch_section: sec,
        department: dept,
        student_number: id
      });
    }
  }
  return students;
}

async function run() {
  console.log('👥 Seeding Teachers and Students into Supabase PostgreSQL...\n');
  const ok = await db.testConnection();
  if (!ok) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // Pre-hash password once
  console.log('🔒 Generating bcrypt hash for default password "password123"...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Batches (58 A, B, C, E, F, G, H, I)
  const sections = ['A', 'B', 'C', 'E', 'F', 'G', 'H', 'I'];
  for (const s of sections) {
    await db.query(
      `INSERT INTO batches (batch_number, section, department)
       VALUES (58, $1, 'CSE')
       ON CONFLICT ON CONSTRAINT unique_batch_section DO NOTHING`,
      [s]
    );
  }
  console.log('✅ Ensured individual Batch 58 sections exist in batches table.');

  // 2. Fetch existing user emails and student numbers to avoid any conflicts
  const existingUsers = await db.query(`SELECT name, email, student_number FROM users`);
  const usedEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  const usedStudentNumbers = new Set(existingUsers.map(u => (u.student_number || '').trim()).filter(Boolean));

  // 3. Insert Teachers
  console.log(`\n👨‍🏫 Seeding ${rawTeachers.length} Teachers...`);
  let teachersInserted = 0;
  for (const t of rawTeachers) {
    const initClean = t.initial.toLowerCase().replace(/[^a-z0-9]/g, '');
    let email = `${initClean}@campus.edu`;

    if (usedEmails.has(email)) {
      const nameSlug = t.name.toLowerCase().replace(/^(mr\.|ms\.|prof\.|dr\.)\s*/, '').replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      email = `${nameSlug}@campus.edu`;
      if (usedEmails.has(email)) {
        email = `${initClean}.${Date.now() % 1000}@campus.edu`;
      }
    }
    usedEmails.add(email);

    await db.query(
      `INSERT INTO users (name, email, password, role, department, is_active)
       VALUES ($1, $2, $3, 'teacher', 'CSE', TRUE)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, department = EXCLUDED.department, role = 'teacher'`,
      [t.name, email, passwordHash]
    );
    teachersInserted++;
  }
  console.log(`✅ Seeded ${teachersInserted} Teachers!`);

  // 4. Insert Students
  const students = parseStudents(rawStudentsText);
  console.log(`\n👨‍🎓 Parsed ${students.length} Students across Batch 58 sections...`);

  let studentsInserted = 0;
  let studentsUpdated = 0;

  for (const s of students) {
    let studentNum = s.student_number;
    let email = `${studentNum}@student.edu`;

    // Handle student number uniqueness
    if (usedStudentNumbers.has(studentNum)) {
      // If student number is already used by an existing user with different name
      const existing = existingUsers.find(u => u.student_number === studentNum);
      if (existing && (existing.name || '').toLowerCase() !== (s.name || '').toLowerCase()) {
        studentNum = `${studentNum}-${s.batch_section.toLowerCase()}`;
        email = `${studentNum}@student.edu`;
      }
    }

    if (usedEmails.has(email)) {
      email = `${studentNum}-${s.batch_section.toLowerCase()}@student.edu`;
    }

    usedEmails.add(email);
    usedStudentNumbers.add(studentNum);

    // Insert or update
    await db.query(
      `INSERT INTO users
         (name, email, password, role, department, batch_number, batch_section, student_number, is_active)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, TRUE)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           student_number = EXCLUDED.student_number,
           batch_number = EXCLUDED.batch_number,
           batch_section = EXCLUDED.batch_section`,
      [s.name, email, passwordHash, s.department, s.batch_number, s.batch_section, studentNum]
    );
    studentsInserted++;
  }

  console.log(`\n🎉 Success! Seeding Completed:`);
  console.log(`   - ${teachersInserted} Teachers seeded with role "teacher"`);
  console.log(`   - ${studentsInserted} Students seeded with role "student" in Batch 58 [A, B, C, E, F, G, H, I]`);
  console.log(`   - All accounts have password: "password123"`);

  // Summary by role
  const roleSummary = await db.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
  console.log('\n📊 Database Users Summary:');
  for (const r of roleSummary) {
    console.log(`   - ${r.role}: ${r.count} users`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
