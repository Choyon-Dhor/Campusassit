// ============================================================
// database/seed_user_routine.js
// Seeds the user's complete Metropolitan University Routine
// Run: node database/seed_user_routine.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

const rawCSV = `58 B+1,Sunday,03:00 PM-04:30 PM,DSP,409,SAS
58 B+1,Sunday,04:30 PM-06:00 PM,CG&IP Lab,309,SRC
58 C+G,Sunday,01:30 PM-03:00 PM,DSP Lab,309,SAS
58 C+G,Sunday,03:00 PM-04:30 PM,DSP Lab,309,SAS
58 C+G,Sunday,04:30 PM-06:00 PM,CG&IP,402,SRC
58 D+H,Sunday,09:00 AM-10:30 AM,DSP,508,IMA
58 D+H,Sunday,01:30 PM-03:00 PM,CG&IP Lab,307,AWS
58 E+F,Sunday,10:30 AM-12:00 PM,CG&IP Lab,405,INC
58 E+F,Sunday,01:30 PM-03:00 PM,DSP,508,IMA
59 A+D,Sunday,01:30 PM-03:00 PM,CN Lab,310,AAB
59 A+D,Sunday,03:00 PM-04:30 PM,CN Lab,310,AAR
59 C+H,Sunday,01:30 PM-03:00 PM,CN,507,FRS
59 C+H,Sunday,03:00 PM-04:30 PM,BIC Lab,307,NZR
59 C+H,Sunday,04:30 PM-06:00 PM,CE,508,MHL
59 E+F,Sunday,03:00 PM-04:30 PM,BIC,507,MDP
59 E+F,Sunday,04:30 PM-06:00 PM,CC,404,NEW1
59 E+F,Sunday,04:30 PM-06:00 PM,CN,508,FRS
59 I+J,Sunday,09:00 AM-10:30 AM,BIC Lab,405,MBL
60 A,Sunday,01:30 PM-03:00 PM,CN,E2,MHM
60 A,Sunday,03:00 PM-04:30 PM,AI,509,RFZ
60 A,Sunday,04:30 PM-06:00 PM,Web-Project Lab,309,AWS
60 B,Sunday,09:00 AM-10:30 AM,SE&DP Lab,307,MHM
60 B,Sunday,10:30 AM-12:00 PM,SE&DP Lab,307,MHM
60 B,Sunday,01:30 PM-03:00 PM,TOC,506,RFZ
60 C,Sunday,09:00 AM-10:30 AM,SE&DP,507,TJN
60 C,Sunday,10:30 AM-12:00 PM,AI,507,BAH
60 C,Sunday,03:00 PM-04:30 PM,AI,509,RFZ
61 B,Sunday,03:00 PM-04:30 PM,OS,507,SRR
61 B,Sunday,04:30 PM-06:00 PM,CE,517,WIC
61 C,Sunday,01:30 PM-03:00 PM,CE,503,WIC
61 C,Sunday,03:00 PM-04:30 PM,OS,507,SRR
61 D,Sunday,04:30 PM-06:00 PM,CE,507,WIC
61 E,Sunday,01:30 PM-03:00 PM,OS,509,KBS
61 E,Sunday,03:00 PM-04:30 PM,CE,408,IMA
61 F,Sunday,09:00 AM-10:30 AM,OS Lab,309,SRR
61 F,Sunday,10:30 AM-12:00 PM,OS Lab,309,SRR
61 G,Sunday,01:30 PM-03:00 PM,OS,509,KBS
61 G,Sunday,03:00 PM-04:30 PM,CE,503,WIC
62 A,Sunday,03:00 PM-04:30 PM,CE,501,WIC
62 A,Sunday,03:00 PM-04:30 PM,DBMS,509,GMN
62 A,Sunday,04:30 PM-06:00 PM,G&VA,505,NZI
62 B,Sunday,09:00 AM-10:30 AM,MP&I Lab,BSS,BSS
62 B,Sunday,10:30 AM-12:00 PM,MP&I Lab,330,BSS
62 B,Sunday,01:30 PM-03:00 PM,DBMS,,GMN
62 B,Sunday,03:00 PM-04:30 PM,MP&I,,BSS
62 D+E,Sunday,09:00 AM-10:30 AM,MP&I Lab,311,AIR
62 D+E,Sunday,10:30 AM-12:00 PM,MP&I Lab,311,AIR
62 D+E,Sunday,03:00 PM-04:30 PM,DBMS,506,TJN
63 D,Sunday,09:00 AM-10:30 AM,OOP,E3,BAH
64 A,Sunday,10:30 AM-12:00 PM,BS&P,E3,RAR
64 A,Sunday,01:30 PM-03:00 PM,AD&A,205,RSA
64 A,Sunday,03:00 PM-04:30 PM,AD&A,E2,RSA
64 B,Sunday,03:00 PM-04:30 PM,DLD,505,AAR
64 B,Sunday,04:30 PM-06:00 PM,DLD,E2,MAK
65 A,Sunday,01:30 PM-03:00 PM,DS,E1,AIA
65 A,Sunday,03:00 PM-04:30 PM,DLD,409,AAR
65 B,Sunday,03:00 PM-04:30 PM,DS,401,KBS
65 B,Sunday,04:30 PM-06:00 PM,BS&EC,502,FAM
65 C,Sunday,01:30 PM-03:00 PM,AD&A Lab,307,AJMJ
65 C,Sunday,03:00 PM-04:30 PM,AD&A Lab,307,AJMJ
65 C,Sunday,04:30 PM-06:00 PM,MG&VA,502,RMD
65 D,Sunday,01:30 PM-03:00 PM,BS&EC,501,ATB
65 D,Sunday,03:00 PM-04:30 PM,IS,GL1,AR
66 A,Sunday,01:30 PM-03:00 PM,SP Lab,311,BKD
66 A,Sunday,03:00 PM-04:30 PM,IS,E3,AR
66 A,Sunday,04:30 PM-06:00 PM,DS Lab,311,NMA
66 B,Sunday,03:00 PM-04:30 PM,IP,E3,NSR
66 B,Sunday,03:00 PM-04:30 PM,SP Lab,311,BKD
66 B,Sunday,04:30 PM-06:00 PM,SP,GL2,BKD
66 B,Sunday,04:30 PM-06:00 PM,DS Lab,311,NMA
66 B,Sunday,04:30 PM-06:00 PM,MM&CV,E5,AMR
66 C,Sunday,10:30 AM-12:00 PM,SP,408,AJMJ
66 C,Sunday,01:30 PM-03:00 PM,IP,GL2,NSR
66 D,Sunday,01:30 PM-03:00 PM,IP,GL2,NSR
66 D,Sunday,03:00 PM-04:30 PM,MM&CV,408,AMR
67 A,Sunday,03:00 PM-04:30 PM,PHY,GL2,CMW
67 A,Sunday,04:30 PM-06:00 PM,SP Lab,310,AIA
67 A,Sunday,04:30 PM-06:00 PM,D&IC,E4,RMD
67 B,Sunday,03:00 PM-04:30 PM,PHY,GL2,CMW
67 B,Sunday,04:30 PM-06:00 PM,SP Lab,310,AIA
67 C,Sunday,04:30 PM-06:00 PM,DM,E4,FAR
58 A,Monday,09:00 AM-10:30 AM,DSP Lab,311,SAS
58 A,Monday,10:30 AM-12:00 PM,DSP Lab,311,SAS
58 B+1,Monday,01:30 PM-03:00 PM,CG&IP,E2,AWS
58 D+H,Monday,01:30 PM-03:00 PM,CG&IP,503,INC
58 D+H,Monday,03:00 PM-04:30 PM,DSP,403,IMA
58 E+F,Monday,03:00 PM-04:30 PM,CG&IP,E6,AWS
58 E+F,Monday,03:00 PM-04:30 PM,DSP Lab,309,IMA
58 E+F,Monday,04:30 PM-06:00 PM,DSP Lab,309,IMA
59 A+D,Monday,09:00 AM-10:30 AM,CC Lab,309,NEW1
59 A+D,Monday,03:00 PM-04:30 PM,CN,502,AAB
59 B+G,Monday,10:30 AM-12:00 PM,BIC,408,MDP
59 B+G,Monday,03:00 PM-04:30 PM,BIC,508,NZR
59 B+G,Monday,04:30 PM-06:00 PM,CC,502,MBL
59 C+H,Monday,09:00 AM-10:30 AM,BIC,408,MDP
59 E+F,Monday,10:30 AM-12:00 PM,CC Lab,309,NEW1
59 E+F,Monday,01:30 PM-03:00 PM,BIC,501,NZR
59 I+J,Monday,03:00 PM-04:30 PM,CC Lab,309,MBL
60 A,Monday,01:30 PM-03:00 PM,TOC,509,RFZ
60 A,Monday,03:00 PM-04:30 PM,SE&DP Lab,310,MHM
60 A,Monday,04:30 PM-06:00 PM,SE&DP Lab,310,MHM
60 B,Monday,01:30 PM-03:00 PM,TOC,509,RFZ
60 B,Monday,03:00 PM-04:30 PM,AI Lab,307,RFZ
60 B,Monday,04:30 PM-06:00 PM,AI Lab,307,RFZ
60 C,Monday,09:00 AM-10:30 AM,TOC,E6,RFZ
60 C,Monday,10:30 AM-12:00 PM,SE&DP,506,TJN
60 D+E+F+G,Monday,01:30 PM-03:00 PM,Web-Project Lab,309,GMN
60 D+E+F+G,Monday,03:00 PM-04:30 PM,AI,503,BAH
60 D+E+F+G,Monday,04:30 PM-06:00 PM,SE&DP,503,TIN
61 A,Monday,01:30 PM-03:00 PM,CE,409,MHM
61 A,Monday,03:00 PM-04:30 PM,OS,501,BSS
61 A,Monday,04:30 PM-06:00 PM,CE,GL1,KA
61 B,Monday,03:00 PM-04:30 PM,CE,GL1,WIC
61 B,Monday,04:30 PM-06:00 PM,CE,GL1,KA
61 C,Monday,01:30 PM-03:00 PM,OS Lab,405,SRR
61 C,Monday,03:00 PM-04:30 PM,OS Lab,405,SRR
61 C,Monday,04:30 PM-06:00 PM,CE,501,WIC
61 C,Monday,04:30 PM-06:00 PM,CE,GL1,KA
61 D,Monday,03:00 PM-04:30 PM,BC,GL1,RH
61 E,Monday,03:00 PM-04:30 PM,BC,GL1,RH
61 F,Monday,01:30 PM-03:00 PM,BC,GL1,RH
61 F,Monday,04:30 PM-06:00 PM,OS,508,SRR
61 G,Monday,01:30 PM-03:00 PM,MP&I,205,BSS
61 G,Monday,03:00 PM-04:30 PM,BC,GL1,RH
61 G,Monday,04:30 PM-06:00 PM,OS,508,SRR
62 A,Monday,03:00 PM-04:30 PM,G&VA,E4,NZI
62 A,Monday,04:30 PM-06:00 PM,DBMS,501,GMN
62 B,Monday,01:30 PM-03:00 PM,CP Lab,307,AIA
62 B,Monday,03:00 PM-04:30 PM,CP Lab,307,AIA
62 B,Monday,04:30 PM-06:00 PM,DBMS Lab,311,SRC
62 C,Monday,03:00 PM-04:30 PM,DBMS Lab,311,SRC
62 C,Monday,04:30 PM-06:00 PM,MP&I,505,BSS
62 D+E,Monday,01:30 PM-03:00 PM,G&VA,402,NZI
62 D+E,Monday,03:00 PM-04:30 PM,DBMS,506,TJN
62 D+E,Monday,04:30 PM-06:00 PM,MP&I,506,AIR
63 A,Monday,01:30 PM-03:00 PM,COA,GL2,MMH
63 B,Monday,10:30 AM-12:00 PM,IM&FA,502,RH
63 B,Monday,01:30 PM-03:00 PM,COA,GL2,MMH
63 C,Monday,09:00 AM-10:30 AM,OOP Lab,310,INC
63 C,Monday,10:30 AM-12:00 PM,OOP Lab,310,INC
63 C,Monday,01:30 PM-03:00 PM,COA,GL2,MMH
63 D,Monday,09:00 AM-10:30 AM,OOP,409,BAH
63 D,Monday,10:30 AM-12:00 PM,BS&P,402,RAR
64 A,Monday,03:00 PM-04:30 PM,DLD,502,MAK
64 A,Monday,04:30 PM-06:00 PM,EE&CL,GL2,TM
64 B,Monday,01:30 PM-03:00 PM,AD&A Lab,310,RSA
64 B,Monday,03:00 PM-04:30 PM,AD&A Lab,310,RSA
64 B,Monday,04:30 PM-06:00 PM,DLD,E3,AAR
64 B,Monday,04:30 PM-06:00 PM,EE&CL,GL2,TM
64 C,Monday,01:30 PM-03:00 PM,DLD Lab,108,AAR
64 C,Monday,03:00 PM-04:30 PM,DLD Lab,108,AAR
64 C,Monday,04:30 PM-06:00 PM,AD&A,505,AJMJ
64 C,Monday,04:30 PM-06:00 PM,EE&CL,GL2,TM
65 A,Monday,01:30 PM-03:00 PM,IS,E4,SAL
65 A,Monday,03:00 PM-04:30 PM,BS&EC,408,FAM
65 A,Monday,04:30 PM-06:00 PM,DS,503,KBS
65 A,Monday,04:30 PM-06:00 PM,MG&VA,E5,RMD
65 B,Monday,01:30 PM-03:00 PM,BS&EC,E3,ATB
65 B,Monday,03:00 PM-04:30 PM,IS,E3,AH
65 C,Monday,09:00 AM-10:30 AM,BS&EC,508,ATB
65 C,Monday,01:30 PM-03:00 PM,DS Lab,311,NMA
65 C,Monday,03:00 PM-04:30 PM,DS Lab,311,NMA
65 D,Monday,09:00 AM-10:30 AM,SP Lab,307,BKD
65 D,Monday,10:30 AM-12:00 PM,SP Lab,307,BKD
65 D,Monday,03:00 PM-04:30 PM,BS&EC,504,ATB
65 D,Monday,04:30 PM-06:00 PM,MG&VA,504,RMD
66 A,Monday,03:00 PM-04:30 PM,IP,505,NSR
66 B,Monday,01:30 PM-03:00 PM,MM&CV,507,AMR
66 B,Monday,03:00 PM-04:30 PM,SP,500,BKD
66 B,Monday,04:30 PM-06:00 PM,IP,500,NSR
66 C,Monday,10:30 AM-12:00 PM,SP,508,AJMJ
66 C,Monday,01:30 PM-03:00 PM,MM&CV,509,AMR
66 C,Monday,03:00 PM-04:30 PM,BS,GL2,SAL
66 D,Monday,10:30 AM-12:00 PM,ENG,GL1,AYM
66 D,Monday,01:30 PM-03:00 PM,BS,GL2,SAL
66 D,Monday,03:00 PM-04:30 PM,SP,401,AIA
67 A,Monday,01:30 PM-03:00 PM,DM,506,FAR
67 B,Monday,10:30 AM-12:00 PM,ENG,GL1,AYM
67 B,Monday,03:00 PM-04:30 PM,D&IC,408,FAR
62 B,Tuesday,10:30 AM-12:00 PM,MP&I,507,BSS
62 B,Tuesday,12:00 PM-01:30 PM,G&VA,507,NZI
62 B,Tuesday,01:30 PM-03:00 PM,DBMS,506,GMN
58 A,Tuesday,09:00 AM-10:30 AM,Web Special,405,AJMJ
58 A,Tuesday,10:30 AM-12:00 PM,Web Special,405,AJMJ
58 A,Tuesday,03:00 PM-04:30 PM,CG&IP Lab,309,AWS
58 A,Tuesday,04:30 PM-06:00 PM,DSP,E3,SAS
58 D+H,Tuesday,09:00 AM-10:30 AM,CG&IP,508,INC
58 D+H,Tuesday,10:30 AM-12:00 PM,DSP,508,IMA
58 D+H,Tuesday,03:00 PM-04:30 PM,DSP,E4,SAS
58 D+H,Tuesday,04:30 PM-06:00 PM,CG&IP Lab,309,SRC
59 A+D,Tuesday,10:30 AM-12:00 PM,CC Lab,309,MBL
59 A+D,Tuesday,12:00 PM-01:30 PM,Project Lab,311,MSI
59 A+D,Tuesday,03:00 PM-04:30 PM,BIC Lab,310,NZR
59 A+D,Tuesday,04:30 PM-06:00 PM,CC,502,NEW1
59 B+G,Tuesday,12:00 PM-01:30 PM,CN,404,AAB
59 B+G,Tuesday,01:30 PM-03:00 PM,Project Lab,311,MSR
59 C+H,Tuesday,09:00 AM-10:30 AM,BIC Lab,309,MDP
59 C+H,Tuesday,10:30 AM-12:00 PM,CC,402,NEW1
59 C+H,Tuesday,01:30 PM-03:00 PM,CC,503,MBL
59 C+H,Tuesday,03:00 PM-04:30 PM,CN Lab,405,FRS
59 C+H,Tuesday,04:30 PM-06:00 PM,CN Lab,405,FRS
59 E+F,Tuesday,01:30 PM-03:00 PM,CN,E4,FRS
59 I+J,Tuesday,09:00 AM-10:30 AM,CN Lab,310,MHM
59 I+J,Tuesday,10:30 AM-12:00 PM,CN Lab,310,MHM
59 I+J,Tuesday,12:00 PM-01:30 PM,BIC,409,MBL
59 I+J,Tuesday,01:30 PM-03:00 PM,CC,E3,MDP
60 A,Tuesday,09:00 AM-10:30 AM,AI Lab,301,RFZ
60 A,Tuesday,10:30 AM-12:00 PM,AI Lab,301,RFZ
60 A,Tuesday,12:00 PM-01:30 PM,TOC,509,RFZ
60 A,Tuesday,01:30 PM-03:00 PM,SE&DP,408,MHM
60 B,Tuesday,09:00 AM-10:30 AM,SE&DP Lab,311,TJN
60 B,Tuesday,10:30 AM-12:00 PM,SE&DP Lab,311,TJN
60 B,Tuesday,12:00 PM-01:30 PM,TOC,509,RFZ
60 B,Tuesday,01:30 PM-03:00 PM,SE&DP,408,MHM
60 C,Tuesday,12:00 PM-01:30 PM,AI,402,BAH
60 D+E+F+G,Tuesday,03:00 PM-04:30 PM,AI Lab,311,BAH
60 D+E+F+G,Tuesday,04:30 PM-06:00 PM,AI Lab,311,BAH
61 A,Tuesday,12:00 PM-01:30 PM,CE,GL2,KA
61 A,Tuesday,01:30 PM-03:00 PM,OS,508,BSS
61 B,Tuesday,12:00 PM-01:30 PM,CE,GL2,KA
61 B,Tuesday,01:30 PM-03:00 PM,OS,505,SRR
61 C,Tuesday,12:00 PM-01:30 PM,CE,GL2,KA
61 C,Tuesday,01:30 PM-03:00 PM,OS,505,SRR
61 E,Tuesday,12:00 PM-01:30 PM,OS Lab,309,KBS
61 E,Tuesday,01:30 PM-03:00 PM,OS Lab,309,KBS
61 G,Tuesday,12:00 PM-01:30 PM,CP Lab,307,AIA
61 G,Tuesday,01:30 PM-03:00 PM,CP Lab,307,AIA
62 A,Tuesday,03:00 PM-04:30 PM,DBMS Lab,301,GMN
62 A,Tuesday,04:30 PM-06:00 PM,DBMS Lab,301,GMN
62 C,Tuesday,09:00 AM-10:30 AM,G&VA,507,NZI
62 C,Tuesday,10:30 AM-12:00 PM,DBMS,505,SRC
62 C,Tuesday,12:00 PM-01:30 PM,MP&I Lab,310,AAR
62 C,Tuesday,01:30 PM-03:00 PM,MP&I Lab,310,AAR
63 A,Tuesday,09:00 AM-10:30 AM,OOP,205,NEW1
63 A,Tuesday,10:30 AM-12:00 PM,BS&P,504,MMZ
63 A,Tuesday,01:30 PM-03:00 PM,IM&FA,502,TA
63 B,Tuesday,09:00 AM-10:30 AM,BS&P,506,MMZ
63 B,Tuesday,10:30 AM-12:00 PM,IM&FA,506,RH
63 B,Tuesday,12:00 PM-01:30 PM,OOP,505,INC
63 C,Tuesday,01:30 PM-03:00 PM,OOP,501,INC
63 C,Tuesday,01:30 PM-03:00 PM,IM&FA,E2,RH
63 D,Tuesday,10:30 AM-12:00 PM,COA,403,NMA
63 D,Tuesday,01:30 PM-03:00 PM,IM&FA,502,TA
64 A,Tuesday,09:00 AM-10:30 AM,AD&A,402,RSA
64 A,Tuesday,12:00 PM-01:30 PM,EE,GL1,CMA
64 B,Tuesday,10:30 AM-12:00 PM,AD&A,408,RSA
64 B,Tuesday,12:00 PM-01:30 PM,EE,GL1,CMA
64 C,Tuesday,09:00 AM-10:30 AM,BS&EC Lab,109,FAM
64 C,Tuesday,10:30 AM-12:00 PM,DLD,E1,AAR
64 C,Tuesday,12:00 PM-01:30 PM,EE,GL1,CMA
64 C,Tuesday,01:30 PM-03:00 PM,AD&A,402,AJMJ
65 A,Tuesday,10:30 AM-12:00 PM,BS&EC Lab,109,FAM
65 B,Tuesday,09:00 AM-10:30 AM,DS,502,NMA
65 B,Tuesday,10:30 AM-12:00 PM,IS,GL2,AR
65 B,Tuesday,12:00 PM-01:30 PM,BS&EC Lab,108,ATB
65 B,Tuesday,01:30 PM-03:00 PM,BS&EC Lab,108,ATB
65 C,Tuesday,03:00 PM-04:30 PM,MG&VA,E3,RMD
65 D,Tuesday,09:00 AM-10:30 AM,BS&EC,408,ATB
65 D,Tuesday,10:30 AM-12:00 PM,IS,GL2,AR
66 A,Tuesday,09:00 AM-10:30 AM,BS,GL1,SAL
66 A,Tuesday,10:30 AM-12:00 PM,MM&CV,E5,AMR
66 B,Tuesday,09:00 AM-10:30 AM,BS,GL1,SAL
66 B,Tuesday,10:30 AM-12:00 PM,SP,E4,BKD
66 C,Tuesday,10:30 AM-12:00 PM,BS,GL1,SAL
66 C,Tuesday,01:30 PM-03:00 PM,IP,GL2,NSR
66 D,Tuesday,09:00 AM-10:30 AM,MM&CV,505,AMR
66 D,Tuesday,10:30 AM-12:00 PM,BS,GL1,SAL
66 D,Tuesday,01:30 PM-03:00 PM,IP,GL2,NSR
67 B,Tuesday,12:00 PM-01:30 PM,DM,506,FAR
67 C,Tuesday,01:30 PM-03:00 PM,D&IC,409,FAR
ACM,Wednesday,03:00 PM-04:30 PM,ACM,311,BKD
ACM,Wednesday,04:30 PM-06:00 PM,ACM,311,BKD
58 B+1,Wednesday,01:30 PM-03:00 PM,CG&IP,506,SRC
58 B+1,Wednesday,03:00 PM-04:30 PM,DSP Lab,405,SAS
58 B+1,Wednesday,04:30 PM-06:00 PM,DSP Lab,405,SAS
59 A+D,Wednesday,09:00 AM-10:30 AM,CN,E4,AAB
59 A+D,Wednesday,10:30 AM-12:00 PM,CC,E3,MBL
59 A+D,Wednesday,12:00 PM-01:30 PM,BIC,509,NZR
59 B+G,Wednesday,09:00 AM-10:30 AM,BIC,E3,MDP
59 B+G,Wednesday,12:00 PM-01:30 PM,CN Lab,309,AAB
59 B+G,Wednesday,01:30 PM-03:00 PM,CN Lab,309,AAB
59 C+H,Wednesday,09:00 AM-10:30 AM,BIC,507,NZR
59 C+H,Wednesday,10:30 AM-12:00 PM,CN,509,FRS
59 C+H,Wednesday,12:00 PM-01:30 PM,Project Lab,307,MSI
59 I+J,Wednesday,09:00 AM-10:30 AM,BIC,E6,MBL
59 I+J,Wednesday,12:00 PM-01:30 PM,CC Lab,311,MDP
60 A,Wednesday,12:00 PM-01:30 PM,Project Lab,311,MSI
60 A,Wednesday,01:30 PM-03:00 PM,SE&DP,402,MHM
60 A,Wednesday,03:00 PM-04:30 PM,AI,402,RFZ
60 B,Wednesday,01:30 PM-03:00 PM,Web-Project Lab,307,AWS
60 B,Wednesday,01:30 PM-03:00 PM,SE&DP,402,MHM
60 B,Wednesday,03:00 PM-04:30 PM,AI,402,RFZ
60 C,Wednesday,09:00 AM-10:30 AM,AI Lab,,BAH
60 C,Wednesday,10:30 AM-12:00 PM,AI Lab,311,BAH
60 D+E+F+G,Wednesday,12:00 PM-01:30 PM,TOC,404,RFZ
60 D+E+F+G,Wednesday,01:30 PM-03:00 PM,SE&DP,507,TJN
61 A,Wednesday,10:30 AM-12:00 PM,CE,501,MHM
61 B,Wednesday,12:00 PM-01:30 PM,OS Lab,405,BSS
61 B,Wednesday,01:30 PM-03:00 PM,OS Lab,405,BSS
61 D,Wednesday,09:00 AM-10:30 AM,OS Lab,309,SRR
61 D,Wednesday,10:30 AM-12:00 PM,OS Lab,309,SRR
61 E,Wednesday,12:00 PM-01:30 PM,CE,505,WIC
61 F,Wednesday,12:00 PM-01:30 PM,CE,505,WIC
61 G,Wednesday,03:00 PM-04:30 PM,OS Lab,309,KBS
61 G,Wednesday,04:30 PM-06:00 PM,OS Lab,309,KBS
62 B,Wednesday,09:00 AM-10:30 AM,DBMS Lab,307,GMN
62 B,Wednesday,10:30 AM-12:00 PM,DBMS Lab,307,GMN
62 C,Wednesday,09:00 AM-10:30 AM,CP Lab,405,NMA
62 C,Wednesday,10:30 AM-12:00 PM,CP Lab,405,NMA
62 C,Wednesday,12:00 PM-01:30 PM,G&VA,502,NZI
62 C,Wednesday,01:30 PM-03:00 PM,MP&I,E4,AAR
62 D+E,Wednesday,01:30 PM-03:00 PM,MP&I,502,AIR
62 D+E,Wednesday,03:00 PM-04:30 PM,DBMS,310,TJN
63 A,Wednesday,09:00 AM-10:30 AM,BS&P,E2,RAR
63 A,Wednesday,12:00 PM-01:30 PM,COA,GL1,MMH
63 B,Wednesday,12:00 PM-01:30 PM,COA,GL1,MMH
63 B,Wednesday,01:30 PM-03:00 PM,BS&P,403,MMZ
63 B,Wednesday,03:00 PM-04:30 PM,DBMS Lab,310,NEW1
63 B,Wednesday,04:30 PM-06:00 PM,DBMS Lab,307,INC
63 C,Wednesday,12:00 PM-01:30 PM,COA,GL1,MMH
63 C,Wednesday,03:00 PM-04:30 PM,OOP,504,INC
63 C,Wednesday,03:00 PM-04:30 PM,OOP Lab,307,INC
64 A,Wednesday,09:00 AM-10:30 AM,DLD Lab,108,MAK
64 A,Wednesday,10:30 AM-12:00 PM,DLD Lab,108,MAK
64 A,Wednesday,12:00 PM-01:30 PM,EE,GL2,CMA
64 A,Wednesday,01:30 PM-03:00 PM,EE&CL,GL2,TM
64 B,Wednesday,09:00 AM-10:30 AM,DLD Lab,109,AAR
64 B,Wednesday,10:30 AM-12:00 PM,DLD Lab,109,AAR
64 B,Wednesday,12:00 PM-01:30 PM,EE,GL2,CMA
64 B,Wednesday,01:30 PM-03:00 PM,EE&CL,GL2,TM
64 C,Wednesday,12:00 PM-01:30 PM,EE,GL2,CMA
64 C,Wednesday,01:30 PM-03:00 PM,EE&CL,GL2,TM
65 B,Wednesday,10:30 AM-12:00 PM,BS&EC,507,ATB
65 B,Wednesday,12:00 PM-01:30 PM,DS Lab,310,AIA
65 B,Wednesday,01:30 PM-03:00 PM,DS Lab,310,AIA
65 B,Wednesday,03:00 PM-04:30 PM,MG&VA,E4,RMD
65 C,Wednesday,12:00 PM-01:30 PM,BS&EC Lab,108,MSS
65 C,Wednesday,01:30 PM-03:00 PM,BS&EC Lab,108,MSS
65 C,Wednesday,03:00 PM-04:30 PM,DS,E5,NMA
65 C,Wednesday,04:30 PM-06:00 PM,MG&VA,E5,RMD
67 A,Wednesday,09:00 AM-10:30 AM,PHY,GL1,CMW
67 A,Wednesday,10:30 AM-12:00 PM,ENG,GL1,AYM
67 B,Wednesday,09:00 AM-10:30 AM,PHY,GL1,CMW
67 B,Wednesday,10:30 AM-12:00 PM,ENG,GL1,AYM
58 A,Thursday,03:00 PM-04:30 PM,CG&IP,E6,AWS
58 A,Thursday,04:30 PM-06:00 PM,DSP,E6,SAS
58 B+1,Thursday,09:00 AM-10:30 AM,CG&IP,402,SRC
58 B+1,Thursday,10:30 AM-12:00 PM,DSP,E4,SAS
58 C+G,Thursday,03:00 PM-04:30 PM,DSP,508,SAS
58 C+G,Thursday,04:30 PM-06:00 PM,CG&IP,508,SRC
58 D+H,Thursday,09:00 AM-10:30 AM,DSP Lab,405,IMA
58 D+H,Thursday,10:30 AM-12:00 PM,DSP Lab,405,IMA
58 D+H,Thursday,12:00 PM-01:30 PM,CG&IP,404,AWS
59 B+G,Thursday,09:00 AM-10:30 AM,CC,505,NEW1
59 B+G,Thursday,10:30 AM-12:00 PM,CN,505,AAB
59 B+G,Thursday,12:00 PM-01:30 PM,BIC Lab,309,MDP
59 E+F,Thursday,09:00 AM-10:30 AM,CC,E6,MDP
59 E+F,Thursday,10:30 AM-12:00 PM,CN,E6,MHM
59 I+J,Thursday,01:30 PM-03:00 PM,Project Lab,309,MSR
59 I+J,Thursday,03:00 PM-04:30 PM,CN Lab,405,FRS
59 I+J,Thursday,04:30 PM-06:00 PM,CN Lab,405,FRS
60 C,Thursday,09:00 AM-10:30 AM,SE&DP Lab,310,TJN
60 C,Thursday,10:30 AM-12:00 PM,SE&DP Lab,310,TJN
60 C,Thursday,12:00 PM-01:30 PM,AI,506,BAH
60 C,Thursday,01:30 PM-03:00 PM,TOC,507,RFZ
60 D+E+F+G,Thursday,10:30 AM-12:00 PM,TOC,506,RFZ
61 A,Thursday,03:00 PM-04:30 PM,Web-Project Lab,307,GMN
61 B,Thursday,03:00 PM-04:30 PM,OS Lab,309,SRR
61 B,Thursday,04:30 PM-06:00 PM,OS Lab,309,SRR
61 D,Thursday,12:00 PM-01:30 PM,OS,502,SRR
61 D,Thursday,04:30 PM-06:00 PM,BC,GL1,RH
61 E,Thursday,10:30 AM-12:00 PM,CE,409,IMA
61 E,Thursday,12:00 PM-01:30 PM,OS,GL1,KBS
61 E,Thursday,04:30 PM-06:00 PM,BC,GL1,RH
61 F,Thursday,10:30 AM-12:00 PM,CE,409,IMA
61 F,Thursday,12:00 PM-01:30 PM,OS,GL1,KBS
61 F,Thursday,04:30 PM-06:00 PM,BC,GL1,RH
61 G,Thursday,10:30 AM-12:00 PM,MP&I Lab,310,BSS
61 G,Thursday,12:00 PM-01:30 PM,OS,502,SRR
61 G,Thursday,04:30 PM-06:00 PM,BC,GL1,RH
62 A,Thursday,12:00 PM-01:30 PM,MP&I Lab,310,BSS
62 C,Thursday,10:30 AM-12:00 PM,G&VA,E6,NZI
62 C,Thursday,12:00 PM-01:30 PM,DBMS,E4,SRC
62 C,Thursday,01:30 PM-03:00 PM,MP&I,E4,AAR
62 D+E,Thursday,09:00 AM-10:30 AM,CP Lab,307,BKD
62 D+E,Thursday,10:30 AM-12:00 PM,CP Lab,307,BKD
63 A,Thursday,12:00 PM-01:30 PM,IM&FA,GL2,TA
63 A,Thursday,01:30 PM-03:00 PM,G&VA,408,NZI
63 A,Thursday,03:00 PM-04:30 PM,OOP Lab,301,NEW1
63 A,Thursday,04:30 PM-06:00 PM,OOP Lab,301,NEW1
63 B,Thursday,10:30 AM-12:00 PM,OOP,E3,INC
63 B,Thursday,12:00 PM-01:30 PM,BS&P,506,MMZ
63 C,Thursday,12:00 PM-01:30 PM,OOP,505,INC
63 C,Thursday,01:30 PM-03:00 PM,IM&FA,505,RH
63 C,Thursday,03:00 PM-04:30 PM,BS&P,505,RAR
63 D,Thursday,10:30 AM-12:00 PM,IM&FA,GL2,TA
63 D,Thursday,12:00 PM-01:30 PM,COA,E6,NMA
63 D,Thursday,01:30 PM-03:00 PM,OOP Lab,311,BAH
63 D,Thursday,03:00 PM-04:30 PM,OOP Lab,311,BAH
64 A,Thursday,10:30 AM-12:00 PM,AD&A Lab,307,RSA
64 A,Thursday,12:00 PM-01:30 PM,AD&A Lab,307,RSA
65 A,Thursday,09:00 AM-10:30 AM,DS Lab,311,KBS
65 A,Thursday,10:30 AM-12:00 PM,DS Lab,311,KBS
65 A,Thursday,12:00 PM-01:30 PM,IS,E5,SAL
65 A,Thursday,01:30 PM-03:00 PM,MG&VA,E5,RMD
65 B,Thursday,09:00 AM-10:30 AM,DS,507,NMA
65 B,Thursday,10:30 AM-12:00 PM,MG&VA,507,RMD
65 C,Thursday,12:00 PM-01:30 PM,DS,408,AIA
65 D,Thursday,09:00 AM-10:30 AM,BS&EC Lab,108,FAM
65 D,Thursday,10:30 AM-12:00 PM,BS&EC Lab,108,FAM
66 A,Thursday,10:30 AM-12:00 PM,BS,GL1,SAL
66 A,Thursday,12:00 PM-01:30 PM,DS,403,NMA
66 A,Thursday,01:30 PM-03:00 PM,SP,E2,BKD
66 B,Thursday,09:00 AM-10:30 AM,BS,GL1,SAL
66 B,Thursday,12:00 PM-01:30 PM,IP,507,NSR
66 B,Thursday,01:30 PM-03:00 PM,MM&CV,501,AMR
66 C,Thursday,09:00 AM-10:30 AM,MM&CV,508,AMR
66 C,Thursday,12:00 PM-01:30 PM,SP Lab,311,AJMJ
66 C,Thursday,01:30 PM-03:00 PM,SP Lab,311,AJMJ
66 D,Thursday,01:30 PM-03:00 PM,SP,503,AIA
67 A,Thursday,01:30 PM-03:00 PM,DM,109,FAR
67 B,Thursday,03:00 PM-04:30 PM,D&IC,503,RMD`;

const facultyMap = {
  SAS: 'Dr. Md. Sadman Sakib',
  SRC: 'Shrabanti Chowdhury',
  IMA: 'Md. Imam Mahdi',
  AWS: 'Abdul Wadud Shakib',
  INC: 'Ishrar Nazah Chowdhury',
  AAB: 'Archi Arani Basak',
  AAR: 'Ahmed Afif Rafsan',
  FRS: 'Md. Fahmidur Rahman Sakib',
  NZR: 'Nabila Zannat Rifa',
  MHL: 'Md. Mahfuzul Hasan',
  MDP: 'Mayami Das Purba',
  NEW1: 'New Faculty 1',
  MBL: 'Md. Belal Hossain',
  MHM: 'Md. Hasan Mahmud',
  RFZ: 'Raisa Fairooz',
  TJN: 'Tajbin Jahan',
  BAH: 'Bushra Azmat Hussain',
  SRR: 'Samia Rahman Rima',
  WIC: 'Md. Wahiduzzaman',
  KBS: 'Kazi Bushra',
  GMN: 'Golam Mostofa Naeem',
  NZI: 'Nazmul Islam',
  BSS: 'Biplob Sharma',
  AIR: 'Ahmed Istiakur Rahman',
  RAR: 'Ruhul Amin',
  RSA: 'Rifat Sadik Ahmed',
  MAK: 'Md. Ashiqur Khan',
  AIA: 'Ahmed Istiak Anik',
  FAM: 'Fardin Ahasan Maraz',
  AJMJ: 'Abu Jafar Md. Jakaria',
  RMD: 'Ruma Das',
  ATB: 'Anika Tabassum',
  AR: 'Ashikur Rahman',
  BKD: 'Biplob Kanti Das',
  NMA: 'Nurul Mohammad Arafat',
  NSR: 'Nasrin Akter',
  AMR: 'Abdullah Al Masud',
  CMW: 'Prof. Chowdhury Mukammel Wahid',
  FAR: 'Farhana Akter',
  MSI: 'Md. Shamihul Islam',
  MSR: 'Md. Mushtaq Shahriyar Rafee',
  NIR: 'Nasif Istiak Remon',
  PBT: 'Plabon Talukder',
  AHC: 'Aisha Hayder Chowdhury',
  TWR: 'Tawsifur Rahman',
  MSS: 'Md. Shadman Shakib',
  NAT: 'Nasrin Akter Tanya',
  NI: 'Nazrul Islam',
  FHR: 'Fahim Ashraf',
  RA: 'Rishad Amin Pulok',
  DRH: 'Dr. Razaul Haque',
  MMR: 'Dr. Md. Masud Rana',
  TA: 'Prof. Dr. Tofayel Ahmed',
  MAH: 'Md. Amjad Hossain',
  MMZ: 'Muhammad Muzammil',
  NSN: 'Nowshin Sharmin',
  NHC: 'Prof. Dr. Nazrul Haque',
  SA: 'Salma Akhter',
  RD: 'Ruma Das',
  AYM: 'Md. Abu Yousuf Musa',
  AAM: 'Abdullah Al Mashud',
  MMH: 'Md. Mahfujul Hasan',
  SR: 'Md. Saidur Rahman Polash',
  KA: 'Kamrul Ahmed',
  RH: 'Razaul Haque',
  TM: 'Tanjina Mahbub',
  SAL: 'Salma Akhter',
  AH: 'Amjad Hossain',
  CMA: 'Chowdhury Mukammel Ahmed'
};

const courseMap = {
  'DSP': { code: 'CSE-411', name: 'Digital Signal Processing' },
  'DSP Lab': { code: 'CSE-412', name: 'Digital Signal Processing Lab' },
  'CG&IP': { code: 'CSE-413', name: 'Computer Graphics & Image Processing' },
  'CG&IP Lab': { code: 'CSE-414', name: 'Computer Graphics & Image Processing Lab' },
  'CN': { code: 'CSE-315', name: 'Computer Networks' },
  'CN Lab': { code: 'CSE-316', name: 'Computer Networks Lab' },
  'BIC': { code: 'CSE-331', name: 'Bioinformatics & Computing' },
  'BIC Lab': { code: 'CSE-332', name: 'Bioinformatics & Computing Lab' },
  'CE': { code: 'CSE-215', name: 'Communication Engineering' },
  'CC': { code: 'CSE-435', name: 'Cloud Computing' },
  'CC Lab': { code: 'CSE-436', name: 'Cloud Computing Lab' },
  'AI': { code: 'CSE-421', name: 'Artificial Intelligence' },
  'AI Lab': { code: 'CSE-422', name: 'Artificial Intelligence Lab' },
  'Web-Project Lab': { code: 'CSE-330', name: 'Web-Project Lab' },
  'Project Lab': { code: 'CSE-399', name: 'Project / Capstone Lab' },
  'SE&DP': { code: 'CSE-313', name: 'Software Engineering & Design Pattern' },
  'SE&DP Lab': { code: 'CSE-314', name: 'Software Engineering & Design Pattern Lab' },
  'TOC': { code: 'CSE-327', name: 'Theory of Computation' },
  'OS': { code: 'CSE-321', name: 'Operating Systems' },
  'OS Lab': { code: 'CSE-322', name: 'Operating Systems Lab' },
  'DBMS': { code: 'CSE-223', name: 'Database Management Systems' },
  'DBMS Lab': { code: 'CSE-224', name: 'Database Management Systems Lab' },
  'G&VA': { code: 'MAT-216', name: 'Geometry & Vector Analysis' },
  'MP&I': { code: 'CSE-237', name: 'Microprocessor & Interfacing' },
  'MP&I Lab': { code: 'CSE-238', name: 'Microprocessor & Interfacing Lab' },
  'OOP': { code: 'CSE-221', name: 'Object Oriented Programming' },
  'OOP Lab': { code: 'CSE-222', name: 'Object Oriented Programming Lab' },
  'BS&P': { code: 'STA-215', name: 'Basic Statistics & Probability' },
  'AD&A': { code: 'CSE-231', name: 'Algorithm Design and Analysis' },
  'AD&A Lab': { code: 'CSE-232', name: 'Algorithm Design and Analysis Lab' },
  'DLD': { code: 'CSE-211', name: 'Digital Logic Design' },
  'DLD Lab': { code: 'CSE-212', name: 'Digital Logic Design Lab' },
  'DS': { code: 'CSE-133', name: 'Data Structures' },
  'DS Lab': { code: 'CSE-134', name: 'Data Structures Lab' },
  'BS&EC': { code: 'CSE-123', name: 'Basic Electrical & Electronic Circuits' },
  'BS&EC Lab': { code: 'CSE-124', name: 'Basic Electrical & Electronic Circuits Lab' },
  'MG&VA': { code: 'MAT-217', name: 'Matrices, Geometry & Vector Analysis' },
  'IS': { code: 'CSE-423', name: 'Information Security' },
  'SP': { code: 'CSE-121', name: 'Structured Programming' },
  'SP Lab': { code: 'CSE-122', name: 'Structured Programming Lab' },
  'IP': { code: 'CSE-325', name: 'Internet Programming' },
  'MM&CV': { code: 'CSE-437', name: 'Multimedia & Computer Vision' },
  'PHY': { code: 'PHY-111', name: 'Physics' },
  'D&IC': { code: 'MAT-112', name: 'Differential & Integral Calculus' },
  'DM': { code: 'CSE-125', name: 'Discrete Mathematics' },
  'COA': { code: 'CSE-213', name: 'Computer Organization & Architecture' },
  'IM&FA': { code: 'GED-215', name: 'Industrial Management & Financial Accounting' },
  'EE': { code: 'GED-214', name: 'Engineering Economics' },
  'EE&CL': { code: 'GED-119', name: 'Engineering Ethics & Cyber Law' },
  'BC': { code: 'GED-431', name: 'Business Communication' },
  'CP Lab': { code: 'CSE-200', name: 'Competitive Programming Lab' },
  'ENG': { code: 'ENG-114', name: 'English' },
  'BS': { code: 'GED-201', name: 'Bangladesh Studies' },
  'ACM': { code: 'ACM-001', name: 'ACM Competitive Programming' },
  'Web Special': { code: 'CSE-480', name: 'Web Specialization' },
};

function parse12HourTime(t) {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${min}:00`;
}

function parseBatch(rawBatch) {
  const cleaned = (rawBatch || '').trim();
  if (cleaned.toUpperCase() === 'ACM') {
    return { batch_number: 0, batch_section: 'ACM', batch_str: 'ACM' };
  }
  const match = cleaned.match(/^(\d{1,3})\s*(.*)$/);
  if (!match) {
    return { batch_number: 0, batch_section: cleaned, batch_str: `CSE-${cleaned}` };
  }
  const num = parseInt(match[1], 10);
  let sec = (match[2] || '').trim();
  if (sec === 'B+1') sec = 'B+I'; // normalize B+1 to B+I
  const batchStr = `CSE-${num}${sec}`;
  return { batch_number: num, batch_section: sec, batch_str: batchStr };
}

async function run() {
  console.log('🌱 Starting Routine Seeder into Supabase PostgreSQL...\n');
  const ok = await db.testConnection();
  if (!ok) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Clear old routine
  await db.query(`DELETE FROM routine`);
  console.log('🧹 Cleared existing routine entries.');

  const lines = rawCSV.trim().split('\n');
  const roomsSet = new Set();
  const batchesSet = new Set();
  const entries = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 6) continue;

    const rawBatch = parts[0].trim();
    const day = parts[1].trim();
    const rawTime = parts[2].trim();
    const subject = parts[3].trim();
    const room = (parts[4] || '').trim() || 'TBA';
    const teacherInit = parts[5].trim();

    // Time slot e.g. "03:00 PM-04:30 PM"
    const timeParts = rawTime.split('-');
    const startTimeStr = parse12HourTime(timeParts[0]);
    const endTimeStr = parse12HourTime(timeParts[1]);

    const { batch_number, batch_section, batch_str } = parseBatch(rawBatch);

    const courseInfo = courseMap[subject] || {
      code: `CSE-${subject.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: subject
    };

    const facultyName = facultyMap[teacherInit] || teacherInit;

    roomsSet.add(room);
    if (batch_number > 0 && batch_section) {
      batchesSet.add(JSON.stringify({ num: batch_number, sec: batch_section }));
    }

    entries.push({
      day,
      time_slot: rawTime,
      start_time: startTimeStr || '09:00:00',
      end_time: endTimeStr || '10:30:00',
      course_code: courseInfo.code,
      course_name: courseInfo.name,
      room_name: room,
      faculty_name: facultyName,
      department: 'CSE',
      batch_number: batch_number > 0 ? batch_number : null,
      batch_section: batch_section || null,
      batch: batch_str
    });
  }

  // 2. Ensure all rooms exist in rooms table
  console.log(`🏢 Ensuring ${roomsSet.size} rooms exist in rooms table...`);
  for (const r of roomsSet) {
    let bldg = 'Main Building';
    let type = 'classroom';
    let floor = 4;

    if (r.startsWith('GL')) {
      bldg = 'Gallery Hall';
      type = 'lecture_hall';
      floor = 1;
    } else if (r.startsWith('E')) {
      bldg = 'Extension Building';
      type = 'classroom';
      floor = 2;
    } else if (r.startsWith('1')) {
      floor = 1;
      if (r === '108' || r === '109') type = 'lab';
    } else if (r.startsWith('2')) {
      floor = 2;
    } else if (r.startsWith('3')) {
      floor = 3;
      if (['301','307','309','310','311','330'].includes(r)) type = 'lab';
    } else if (r.startsWith('4')) {
      floor = 4;
      if (['405'].includes(r)) type = 'lab';
    } else if (r.startsWith('5')) {
      floor = 5;
    }

    await db.query(
      `INSERT INTO rooms (room_name, building, capacity, type, floor)
       VALUES ($1, $2, 50, $3, $4)
       ON CONFLICT (room_name) DO UPDATE
       SET building = EXCLUDED.building, type = EXCLUDED.type`,
      [r, bldg, type, floor]
    );
  }

  // 3. Ensure all batches exist in batches table
  console.log(`🎓 Ensuring batches exist in batches table...`);
  for (const bStr of batchesSet) {
    const b = JSON.parse(bStr);
    await db.query(
      `INSERT INTO batches (batch_number, section, department)
       VALUES ($1, $2, 'CSE')
       ON CONFLICT ON CONSTRAINT unique_batch_section DO NOTHING`,
      [b.num, b.sec]
    );
  }

  // 4. Insert all routine entries
  console.log(`📅 Inserting ${entries.length} routine classes...`);
  let inserted = 0;
  for (const e of entries) {
    await db.query(
      `INSERT INTO routine
         (day, time_slot, start_time, end_time, course_code, course_name,
          room_name, faculty_name, department, batch_number, batch_section, batch)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        e.day, e.time_slot, e.start_time, e.end_time,
        e.course_code, e.course_name, e.room_name,
        e.faculty_name, e.department, e.batch_number,
        e.batch_section, e.batch
      ]
    );
    inserted++;
  }

  console.log(`\n🎉 Success! Seeded:`);
  console.log(`   - ${inserted} Routine Class Schedules`);
  console.log(`   - ${roomsSet.size} Unique Rooms`);
  console.log(`   - Batches covered: 58th, 59th, 60th, 61st, 62nd, 63rd, 64th, 65th, 66th, 67th, ACM`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
