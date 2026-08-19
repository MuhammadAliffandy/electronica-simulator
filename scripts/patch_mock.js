const fs = require('fs');
let code = fs.readFileSync('backend/services/aiService.js', 'utf8');

code = code.replace(
  '        greeting: "Halo, penjelajah rangkaian! Sepertinya kamu sedang mencari bahaya.",\n        explanation: `${activeComponent} kamu terhubung langsung ke sumber tegangan ${vs}V tanpa hambatan yang cukup! Dalam elektronika, Hukum Ohm (V = I x R) mengatakan bahwa tanpa hambatan, arus akan menjadi terlalu tinggi dan merusak komponen.`',
  '        greeting: "Perhatikan baik-baik rangkaianmu, mahasiswa! Ini sangat berbahaya.",\n        explanation: `Secara matematis, ${activeComponent} ini terhubung langsung ke sumber tegangan ${vs}V tanpa adanya hambatan. Sesuai dengan Hukum Ohm (I = V / R), jika nilai R mendekati 0, maka arus (I) akan melonjak mendekati tak terhingga dan menyebabkan komponen terbakar.`'
);

code = code.replace(
  '        greeting: "Selamat datang kembali, ilmuwan rangkaian! Kulihat kamu sedang menghubungkan komponen.",\n        explanation: "Saat ini rangkaianmu terlihat seperti jalan buntu — elektron ingin bergerak dalam satu putaran penuh dari terminal positif baterai, melewati komponen, dan kembali ke terminal negatif. Tanpa putaran yang tertutup, arus tidak bisa mengalir!"',
  '        greeting: "Mari kita analisis topologi rangkaianmu.",\n        explanation: "Secara fisis, elektron membutuhkan lintasan tertutup untuk mengalir dari potensial tinggi (positif) ke potensial rendah (negatif). Saat ini, rangkaianmu memiliki lintasan yang terputus (open circuit), sehingga arus yang mengalir adalah 0 mA secara absolut."'
);

code = code.replace(
  '        greeting: "Kerja bagus! Kamu berhasil membuat rangkaian beroperasi dengan sukses.",\n        explanation: `Arus mengalir dengan sempurna membentuk putaran dari baterai ${vs}V, melewati resistor ${r_disp} Ohm yang membatasi arus menjadi sekitar ${i_mA} mA, dan masuk ke ${activeComponent}. Hukum Ohm sedang beraksi secara real-time!`',
  '        greeting: "Analisis perhitungan Hukum Ohm kita sudah sesuai teori.",\n        explanation: `Kita memiliki sumber tegangan DC sebesar ${vs}V. Tegangan ini dihambat oleh resistor sebesar ${r_disp} Ohm. Jika kita masukkan ke dalam persamaan Hukum Ohm (I = V / R), maka didapatkan arus stabil sebesar ${i_mA} mA yang mengalir melintasi ${activeComponent}.`'
);

code = code.replace(
  '        greeting: "Kerja bagus! Kamu sedang melihat fenomena RC (Resistor-Capacitor)!",\n        explanation: `Kapasitor bertindak seperti tangki air. Saat ini tegangan dari baterai ${vs}V sedang mengisi tangki tersebut melalui resistor ${r_disp} Ohm. Setelah tegangan kapasitor sama dengan sumber, arus akan berhenti mengalir (steady-state).`',
  '        greeting: "Mari perhatikan fenomena pengisian Kapasitor (RC Circuit).",\n        explanation: `Kapasitor sedang melakukan pengisian daya dari sumber tegangan ${vs}V yang dihambat oleh resistor ${r_disp} Ohm. Pada kondisi tunak (steady-state), tegangan kapasitor akan sama dengan sumber dan memblokir arus DC sepenuhnya.`'
);

fs.writeFileSync('backend/services/aiService.js', code);
console.log('patched mock responses');
