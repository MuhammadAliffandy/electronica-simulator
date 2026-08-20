// backend/services/aiService.js

/**
 * Build a rich, structured system prompt that tells the AI exactly what
 * numerical data it has access to, so it never invents numbers.
 */
function buildSystemPrompt(validationResult, lang) {
  const cv = validationResult.computedValues;

  let circuitSummary = '';
  if (cv) {
    circuitSummary += `\n\nCIRCUIT NUMERICAL DATA (use these exact numbers in your response):`;
    circuitSummary += `\n- Source Voltage (Vs): ${cv.V_s !== undefined ? Number(cv.V_s).toFixed(2) : '0'} V`;
    if (cv.ac && cv.ac.isAC) {
      circuitSummary += `\n- Source Type: AC (${cv.ac.freq} Hz)`;
      circuitSummary += `\n- Total Current RMS (I_rms): ${cv.ac.irms !== undefined ? Number(cv.ac.irms).toFixed(2) : '0'} mA`;
      circuitSummary += `\n- Total Impedance (Z): ${cv.ac.z !== undefined ? Number(cv.ac.z).toFixed(2) : '0'} Ω`;
    } else {
      circuitSummary += `\n- Source Type: DC`;
      circuitSummary += `\n- Total Current (I_total): ${cv.I_mA !== undefined ? Number(cv.I_mA).toFixed(2) : '0'} mA`;
      circuitSummary += `\n- Effective Resistance (R_total): ${cv.R_total !== undefined ? Number(cv.R_total).toFixed(1) : '0'} Ω`;
    }
    
    if (cv.components && cv.components.length > 0) {
      circuitSummary += `\n- Component Details:`;
      cv.components.forEach((comp, i) => {
        if (comp.type === 'resistor') {
          circuitSummary += `\n  • Resistor R${i+1} (${comp.r} Ω): V = ${Number(comp.v).toFixed(2)} V, I = ${Number(comp.i_mA).toFixed(2)} mA`;
        } else if (comp.type === 'led') {
          circuitSummary += `\n  • LED${i+1}: State = ${comp.state || 'OFF'}, V(A-K) = ${Number(comp.vak || 0).toFixed(2)} V`;
        } else if (comp.type === 'diode') {
          circuitSummary += `\n  • Diode D${i+1}: State = ${comp.state || 'OFF'}, V(A-K) = ${Number(comp.vak || 0).toFixed(2)} V`;
        } else if (comp.type === 'capacitor') {
          if (comp.xc !== null && comp.xc !== undefined) {
            circuitSummary += `\n  • Capacitor C${i+1}: Xc = ${Number(comp.xc).toFixed(2)} Ω`;
          } else {
            circuitSummary += `\n  • Capacitor C${i+1}: Vc = ${Number(comp.v).toFixed(2)} V (steady-state), τ = ${Number(comp.tau_s * 1000).toFixed(2)} ms`;
          }
        } else if (comp.type === 'inductor') {
          if (comp.xl !== null && comp.xl !== undefined) {
            circuitSummary += `\n  • Inductor L${i+1}: Xl = ${Number(comp.xl).toFixed(2)} Ω`;
          } else {
            circuitSummary += `\n  • Inductor L${i+1}: τ = ${Number(comp.tau_s * 1e6).toFixed(1)} µs`;
          }
        } else if (comp.type === 'transistor') {
          circuitSummary += `\n  • Transistor T${i+1}: State = ${comp.state || 'OFF'}`;
        } else if (comp.type === 'potentiometer') {
          circuitSummary += `\n  • Potentiometer P${i+1}: V_wiper = ${Number(comp.v_wiper || 0).toFixed(2)} V`;
        } else if (comp.type === 'multimeter') {
          circuitSummary += `\n  • Multimeter M${i+1}: Reading = ${comp.reading} ${comp.unit}`;
        }
      });
    }
  }

  circuitSummary += `\n\nFULL ANALYSIS LOG:\n${(validationResult.analysisLog || []).join('\n')}`;

  let prompt = `You are "ELVO AI", an advanced AI physics tutor for an electronics simulator. Do NOT refer to yourself as a Lecturer or Dosen.

PERSONA RULES:
- You speak with a highly analytical, objective, and academic tone — like a brilliant professor.
- Your MAIN GOAL is to narrate the CIRCUIT NUMERICAL DATA below into a clear, educational explanation.
- ALWAYS use the EXACT numbers from the CIRCUIT NUMERICAL DATA section (voltages, currents, resistance, tau values).
- Format your explanation like a step-by-step walkthrough: "Kita memiliki Vs = X V. Dengan hambatan R = Y Ω, maka I = Vs/R = Z mA."
- Do NOT invent or approximate numbers. Use only the data provided.
- Keep it concise but complete (2–4 sentences for explanation).
- If the circuit is broken/open: explain WHY current cannot flow using physics terms.
- If there's burnout risk: explain the danger using Ohm's Law (I→∞ when R→0).`;

  if (lang === 'id') {
    prompt += `\n- CRITICAL: Respond ENTIRELY in Bahasa Indonesia. Gunakan bahasa Indonesia yang akademis namun mudah dipahami.`;
  }

  prompt += circuitSummary;

  prompt += `\n\nRESPONSE FORMAT — respond with ONLY this valid JSON object, no markdown, no extra text:
{
  "greeting": "A short, direct observation about the circuit state (1 sentence)",
  "explanation": "Step-by-step walkthrough using the exact numerical values from CIRCUIT NUMERICAL DATA (2–4 sentences)",
  "hint": "A thought-provoking question to deepen understanding (1–2 sentences)",
  "suggestion_button_text": "A short call-to-action label (3–6 words)"
}`;

  return prompt;
}

/**
 * Mock AI response when no LLM is available.
 * Covers ALL component types with accurate numerical data.
 */
function generateMockAIResponse(validationResult, lang) {
  const { hasLoop, burnoutRisk, nodes = [], computedValues } = validationResult;

  const hasLed         = nodes.some(n => n.type === 'led'          || n.data?.componentType === 'led');
  const hasMotor       = nodes.some(n => n.type === 'motor'        || n.data?.componentType === 'motor');
  const hasCapacitor   = nodes.some(n => n.type === 'capacitor'    || n.data?.componentType === 'capacitor');
  const hasTransistor  = nodes.some(n => n.type === 'transistor'   || n.data?.componentType === 'transistor');
  const hasMultimeter  = nodes.some(n => n.type === 'multimeter'   || n.data?.componentType === 'multimeter');
  const hasDiode       = nodes.some(n => n.type === 'diode'        || n.data?.componentType === 'diode');
  const hasInductor    = nodes.some(n => n.type === 'inductor'     || n.data?.componentType === 'inductor');
  const hasSwitch      = nodes.some(n => n.type === 'switch'       || n.data?.componentType === 'switch');
  const hasPot         = nodes.some(n => n.type === 'potentiometer'|| n.data?.componentType === 'potentiometer');

  const vs    = computedValues?.V_s   !== undefined ? Number(computedValues.V_s).toFixed(2)   : '0.00';
  const i_mA  = computedValues?.I_mA  !== undefined ? Number(computedValues.I_mA).toFixed(2)  : '0.00';
  const r_raw = computedValues?.R_total;
  const r_disp = r_raw > 1e6 ? '∞' : (r_raw !== undefined ? Number(r_raw).toFixed(1) : '0');

  // Pull per-component data from computedValues.components
  const comps       = computedValues?.components || [];
  const resistorComp  = comps.filter(c => c.type === 'resistor');
  const ledComp       = comps.filter(c => c.type === 'led');
  const capacitorComp = comps.filter(c => c.type === 'capacitor');
  const inductorComp  = comps.filter(c => c.type === 'inductor');
  const transistorComp= comps.filter(c => c.type === 'transistor');
  const diodeComp     = comps.filter(c => c.type === 'diode');

  // Helper for resistor list label
  const rList = resistorComp.map((rc, i) => `R${i+1} = ${rc.r} Ω (V = ${Number(rc.v).toFixed(2)} V, I = ${Number(rc.i_mA).toFixed(2)} mA)`).join(', ');

  if (lang === 'id') {
    // --- Burnout / Short Circuit ---
    if (burnoutRisk) {
      const comp = hasLed ? 'LED' : hasDiode ? 'dioda' : hasMotor ? 'motor' : 'komponen';
      return {
        greeting: 'Perhatian! Rangkaianmu berisiko mengalami hubungan singkat.',
        explanation: `${comp} terhubung langsung ke sumber tegangan Vs = ${vs} V tanpa hambatan yang memadai. Sesuai Hukum Ohm (I = V / R), ketika R mendekati 0, arus I akan mendekati tak hingga — kondisi ini akan merusak komponen secara permanen.`,
        hint: 'Komponen apa yang dapat kamu sisipkan untuk membatasi arus sesuai Hukum Ohm?',
        suggestion_button_text: 'Tambahkan resistor pembatas!',
      };
    }

    // --- Open Circuit ---
    if (!hasLoop) {
      return {
        greeting: 'Rangkaian belum terhubung secara lengkap.',
        explanation: `Secara fisis, elektron memerlukan lintasan tertutup untuk mengalir dari terminal positif (+${vs} V) menuju terminal negatif (0 V). Saat ini jalur tersebut terputus, sehingga I = 0 mA secara absolut.`,
        hint: hasSwitch ? 'Apakah ada sakelar yang masih dalam posisi terbuka? Coba tutup sakelarnya.' : 'Lacak jalur kabelmu — apakah semua pin komponen sudah terhubung?',
        suggestion_button_text: 'Periksa sambungan kabel!',
      };
    }

    // --- AC Circuit ---
    if (computedValues?.ac && computedValues.ac.isAC) {
      const z = Number(computedValues.ac.z).toFixed(2);
      const irms = Number(computedValues.ac.irms).toFixed(2);
      return {
        greeting: 'Analisis Rangkaian Arus Bolak-Balik (AC)',
        explanation: `Sistem ini disuplai oleh tegangan AC dengan frekuensi ${computedValues.ac.freq} Hz. Sifat dari kapasitor dan induktor berubah menjadi reaktansi (Xc dan Xl), sehingga kita tidak lagi hanya menjumlahkan resistansi, melainkan menghitung total impedansi (Z). Saat ini Z = ${z} Ω, menghasilkan I_rms = ${irms} mA.`,
        hint: 'Perhatikan bahwa pada AC, arus dapat mengalir melewati kapasitor secara kontinu!',
        suggestion_button_text: 'Lanjutkan observasi AC!',
      };
    }

    // --- Capacitor (RC Circuit) ---
    if (hasCapacitor && capacitorComp.length > 0) {
      const c = capacitorComp[0];
      const tauMs = (c.tau_s * 1000).toFixed(2);
      return {
        greeting: 'Rangkaian RC terdeteksi — ini adalah fenomena pengisian kapasitor.',
        explanation: `Kapasitor mengisi daya dari Vs = ${vs} V melalui resistor ${r_disp} Ω. Tegangan kapasitor saat steady-state adalah Vc = ${Number(c.v).toFixed(2)} V. Konstanta waktu τ = R × C = ${r_disp} Ω × ${(c.tau_s * 1000 / Number(r_disp) * 1000).toFixed(0)} µF = ${tauMs} ms — artinya kapasitor mencapai ~63% pengisian dalam ${tauMs} ms.`,
        hint: 'Apa yang terjadi pada τ jika nilai resistor atau kapasitor dinaikkan dua kali lipat? (Petunjuk: τ = R × C)',
        suggestion_button_text: 'Eksperimen nilai kapasitansi!',
      };
    }

    // --- Inductor (RL Circuit) ---
    if (hasInductor && inductorComp.length > 0) {
      const l = inductorComp[0];
      const tauUs = (l.tau_s * 1e6).toFixed(1);
      return {
        greeting: 'Rangkaian RL terdeteksi — induktor bereaksi terhadap perubahan arus.',
        explanation: `Pada kondisi DC steady-state, induktor berlaku sebagai kabel pendek (short circuit), sehingga arus I = ${i_mA} mA mengalir melalui hambatan R = ${r_disp} Ω. Konstanta waktu RL adalah τ = L / R = ${tauUs} µs — ini menentukan seberapa cepat arus mencapai nilai steady-state.`,
        hint: 'Bagaimana respons induktor jika sumber tegangan diganti dengan sinyal AC? Apa yang berubah pada impedansinya?',
        suggestion_button_text: 'Coba ubah nilai induktansi!',
      };
    }

    // --- Transistor ---
    if (hasTransistor && transistorComp.length > 0) {
      const t = transistorComp[0];
      const state = t.state || 'OFF';
      return {
        greeting: `Transistor terdeteksi dalam kondisi ${state}.`,
        explanation: state === 'SATURATION'
          ? `Transistor berada dalam kondisi SATURASI — sakelar elektronik ini dalam posisi "ON penuh". Arus basis yang cukup memungkinkan arus kolektor-emitor mengalir dengan hambatan minimum. Vs = ${vs} V, I_total = ${i_mA} mA.`
          : state === 'ACTIVE'
          ? `Transistor berada dalam kondisi AKTIF (linear region). Arus kolektor-emitor dikontrol oleh arus basis. I_CE ≈ β × I_B, di mana β adalah penguatan arus transistor.`
          : `Transistor dalam kondisi OFF — arus basis tidak cukup untuk mengaktifkan transistor. Sesuai prinsip kerja BJT, diperlukan V_BE ≥ 0.7 V agar transistor konduksi.`,
        hint: 'Coba ubah nilai resistor basis. Pada nilai hambatan berapa transistor berpindah dari OFF ke ACTIVE atau SATURATION?',
        suggestion_button_text: 'Ubah resistor basis!',
      };
    }

    // --- Diode ---
    if (hasDiode && diodeComp.length > 0) {
      const d = diodeComp[0];
      const state = d.state || 'OFF';
      return {
        greeting: `Dioda dalam kondisi ${state === 'ON' ? 'konduksi maju' : 'reverse biased / belum konduksi'}.`,
        explanation: state === 'ON'
          ? `Dioda mengalami bias maju dengan V(A-K) = ${Number(d.vak).toFixed(2)} V, melewati tegangan ambang Vf. Arus yang mengalir melalui rangkaian adalah I = ${i_mA} mA sesuai Hukum Ohm pada sisi hambatan seri.`
          : `Dioda belum mengalami konduksi. V(A-K) = ${Number(d.vak || 0).toFixed(2)} V belum mencapai tegangan ambang Vf (biasanya 0.7 V untuk Si, 0.3 V untuk Ge). Pada kondisi reverse bias, arus diabaikan.`,
        hint: 'Bagaimana cara memastikan dioda berada dalam bias maju? Cek polaritas sambungan Anoda (+) dan Katoda (-).',
        suggestion_button_text: 'Periksa polaritas dioda!',
      };
    }

    // --- LED ---
    if (hasLed && ledComp.length > 0) {
      const l = ledComp[0];
      const state = l.state || 'OFF';
      return {
        greeting: `LED ${state === 'ON' ? 'menyala' : 'padam'}.`,
        explanation: state === 'ON'
          ? `LED konduksi dengan V(A-K) = ${Number(l.vak).toFixed(2)} V. Setelah tegangan jatuh di LED (Vf ≈ ${Number(l.vak).toFixed(2)} V), sisa tegangan Vs − Vf = ${(Number(vs) - Number(l.vak)).toFixed(2)} V jatuh di resistor ${r_disp} Ω, menghasilkan arus I = ${i_mA} mA.`
          : `LED padam karena V(A-K) = ${Number(l.vak || 0).toFixed(2)} V belum melampaui tegangan maju Vf. Cek nilai resistor — apakah tidak terlalu besar sehingga menghambat arus?`,
        hint: 'Berapa nilai resistor seri minimum agar LED menyala aman? (Petunjuk: R = (Vs − Vf) / I_max)',
        suggestion_button_text: 'Hitung resistor LED!',
      };
    }

    // --- Potentiometer ---
    if (hasPot) {
      const potComp = comps.find(c => c.type === 'potentiometer');
      const vWiper = potComp ? Number(potComp.v_wiper || 0).toFixed(2) : '?';
      return {
        greeting: 'Potensiometer terdeteksi — ini adalah pembagi tegangan variabel.',
        explanation: `Potensiometer berfungsi sebagai voltage divider. Dengan Vs = ${vs} V dan posisi wiper saat ini, tegangan output di wiper (tap tengah) adalah V_wiper = ${vWiper} V. Persamaannya: V_out = Vs × (R2 / (R1 + R2)) di mana R1 dan R2 bergantung pada posisi wiper.`,
        hint: 'Geser posisi wiper dan amati bagaimana tegangan output berubah. Pada posisi berapa V_out = Vs/2?',
        suggestion_button_text: 'Geser posisi wiper!',
      };
    }

    // --- Multimeter ---
    if (hasMultimeter) {
      const mComp = comps.find(c => c.type === 'multimeter');
      const reading = mComp ? `${mComp.reading} ${mComp.unit}` : '—';
      return {
        greeting: 'Multimeter aktif — alat ukur sedang bekerja.',
        explanation: `Multimeter menunjukkan pembacaan ${reading}. Dengan Vs = ${vs} V dan hambatan rangkaian ${r_disp} Ω, arus teoritis adalah I = Vs / R = ${vs} V / ${r_disp} Ω = ${i_mA} mA. Bandingkan dengan pembacaan aktual untuk validasi.`,
        hint: 'Apakah pembacaan multimeter sesuai dengan Hukum Ohm manual? Jika tidak, apa yang mungkin menyebabkan perbedaan?',
        suggestion_button_text: 'Ganti mode multimeter!',
      };
    }

    // --- Default: Successful basic circuit ---
    return {
      greeting: 'Rangkaian berhasil dianalisis.',
      explanation: `Sumber tegangan Vs = ${vs} V mengalirkan arus melalui hambatan total R = ${r_disp} Ω. Berdasarkan Hukum Ohm (I = V / R), arus yang mengalir adalah I = ${vs} V / ${r_disp} Ω = ${i_mA} mA. ${rList ? `Detail: ${rList}.` : ''}`,
      hint: `Apa yang terjadi pada arus jika hambatan total dinaikkan menjadi dua kali lipat? Dengan Vs tetap ${vs} V, hitung nilai I yang baru.`,
      suggestion_button_text: 'Eksperimen nilai resistor!',
    };
  }

  // ──────────────────────── English fallback ────────────────────────

  if (burnoutRisk) {
    const comp = hasLed ? 'LED' : hasDiode ? 'diode' : hasMotor ? 'motor' : 'component';
    return {
      greeting: 'Warning! Your circuit has a short-circuit risk.',
      explanation: `The ${comp} is connected directly to Vs = ${vs} V with insufficient resistance. By Ohm's Law (I = V / R), when R → 0, current I → ∞, which will permanently damage the component.`,
      hint: 'What component can you insert to limit the current according to Ohm\'s Law?',
      suggestion_button_text: 'Add a current-limiting resistor!',
    };
  }

  if (!hasLoop) {
    return {
      greeting: 'The circuit is incomplete.',
      explanation: `Electrons need a closed loop to flow from the positive terminal (+${vs} V) to the negative terminal (0 V). Right now the path is broken, so I = 0.00 mA absolutely.`,
      hint: hasSwitch ? 'Is there a switch still in the OPEN position? Try closing it.' : 'Trace your wires — are all component pins connected?',
      suggestion_button_text: 'Check your wiring!',
    };
  }

  if (hasCapacitor && capacitorComp.length > 0) {
    const c = capacitorComp[0];
    const tauMs = (c.tau_s * 1000).toFixed(2);
    return {
      greeting: 'RC circuit detected — capacitor charging phenomenon.',
      explanation: `The capacitor charges from Vs = ${vs} V through R = ${r_disp} Ω. At steady-state, Vc = ${Number(c.v).toFixed(2)} V. Time constant τ = R × C = ${tauMs} ms — meaning the capacitor reaches ~63% charge in ${tauMs} ms.`,
      hint: 'What happens to τ if you double the resistor or capacitor value? (Hint: τ = R × C)',
      suggestion_button_text: 'Try different capacitance!',
    };
  }

  if (hasInductor && inductorComp.length > 0) {
    const l = inductorComp[0];
    const tauUs = (l.tau_s * 1e6).toFixed(1);
    return {
      greeting: 'RL circuit detected — inductor current response.',
      explanation: `At DC steady-state, the inductor acts as a short circuit, so I = ${i_mA} mA flows through R = ${r_disp} Ω. Time constant τ = L / R = ${tauUs} µs determines how fast current reaches steady-state.`,
      hint: 'How does the inductor behave with an AC source? What happens to its impedance?',
      suggestion_button_text: 'Experiment with inductance!',
    };
  }

  if (hasTransistor && transistorComp.length > 0) {
    const t = transistorComp[0];
    const state = t.state || 'OFF';
    return {
      greeting: `Transistor detected — state: ${state}.`,
      explanation: state === 'SATURATION'
        ? `The transistor is fully ON (SATURATION). Sufficient base current drives the collector-emitter to near-zero resistance. Vs = ${vs} V, I_total = ${i_mA} mA.`
        : state === 'ACTIVE'
        ? `The transistor is in the ACTIVE region. I_CE ≈ β × I_B — the collector current is controlled by base current.`
        : `The transistor is OFF. V_BE has not reached the ~0.7 V threshold needed for conduction.`,
      hint: 'Try adjusting the base resistor. At what resistance does the transistor switch from OFF to ACTIVE?',
      suggestion_button_text: 'Adjust base resistor!',
    };
  }

  if (hasDiode && diodeComp.length > 0) {
    const d = diodeComp[0];
    const state = d.state || 'OFF';
    return {
      greeting: `Diode is ${state === 'ON' ? 'forward biased (conducting)' : 'not conducting'}.`,
      explanation: state === 'ON'
        ? `The diode is forward biased with V(A-K) = ${Number(d.vak).toFixed(2)} V. Current I = ${i_mA} mA flows through the series resistor according to Ohm's Law.`
        : `The diode is not conducting. V(A-K) = ${Number(d.vak || 0).toFixed(2)} V has not reached the forward voltage threshold Vf. No significant current flows in reverse bias.`,
      hint: 'Is the Anode (+) connected to the higher potential? Check diode polarity.',
      suggestion_button_text: 'Check diode polarity!',
    };
  }

  if (hasMultimeter) {
    const mComp = comps.find(c => c.type === 'multimeter');
    const reading = mComp ? `${mComp.reading} ${mComp.unit}` : '—';
    return {
      greeting: 'Multimeter is active and measuring.',
      explanation: `The multimeter reads ${reading}. With Vs = ${vs} V and R = ${r_disp} Ω, theoretical current is I = ${i_mA} mA. Compare this to the actual reading to validate your circuit.`,
      hint: 'Does the multimeter reading match the Ohm\'s Law calculation? If not, what could cause the discrepancy?',
      suggestion_button_text: 'Switch measurement mode!',
    };
  }

  return {
    greeting: 'Circuit successfully analyzed.',
    explanation: `Source voltage Vs = ${vs} V drives current through total resistance R = ${r_disp} Ω. By Ohm\'s Law (I = V / R): I = ${vs} V / ${r_disp} Ω = ${i_mA} mA. ${rList ? `Details: ${rList}.` : ''}`,
    hint: `What happens to current if total resistance doubles? With Vs fixed at ${vs} V, what is the new I?`,
    suggestion_button_text: 'Experiment with resistance!',
  };
}

async function isOllamaAvailable() {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function callOllama(validationResult, lang) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: buildSystemPrompt(validationResult, lang) },
        {
          role: 'user',
          content: lang === 'id'
            ? 'Analisis rangkaian saya dan berikan umpan balik sebagai ELVO AI. Jawab HANYA dengan objek JSON.'
            : 'Analyze my circuit and give feedback as ELVO AI. Respond ONLY with the JSON object.',
        },
      ],
      options: { temperature: 0.7, num_predict: 600 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${res.statusText}`);

  const data = await res.json();
  const raw = data.message?.content || '';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function getAIInsights(validationResult, lang) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: 'system', content: buildSystemPrompt(validationResult, lang) },
          {
            role: 'user',
            content: lang === 'id'
              ? 'Analisis rangkaian saya dan berikan umpan balik sebagai ELVO AI. Jawab HANYA dengan objek JSON.'
              : 'Analyze my circuit and give feedback as ELVO AI. Respond ONLY with the JSON object.',
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content || '';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const insights = JSON.parse(cleaned);
      return { source: 'openai', insights };
    } catch (error) {
      console.warn('⚠️ OpenAI failed:', error.message);
      console.log('🔄 Falling back to Ollama...');
    }
  }

  try {
    const ollamaReady = await isOllamaAvailable();
    if (ollamaReady) {
      console.log('🦙 Ollama detected! Using local LLM...');
      const insights = await callOllama(validationResult, lang);
      return { source: 'ollama', insights };
    } else {
      console.log('🦙 Ollama not available at', process.env.OLLAMA_URL || 'http://localhost:11434');
    }
  } catch (error) {
    console.warn('⚠️ Ollama failed:', error.message);
  }

  console.log('🤖 Using mock AI tutor response.');
  return {
    source: 'mock',
    insights: generateMockAIResponse(validationResult, lang),
  };
}

async function detectAIMode() {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
    return 'openai (→ ollama → mock fallback)';
  }
  const ollama = await isOllamaAvailable();
  if (ollama) return 'ollama (→ mock fallback)';
  return 'mock (no LLM provider found)';
}

async function generateChatResponse(messages, circuitContext, lang) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const cv = circuitContext?.computedValues;
  let circuitSummary = '';
  if (cv) {
    circuitSummary = `\n\nCURRENT CIRCUIT DATA:\n- Vs = ${cv.V_s} V, I_total = ${Number(cv.I_mA || 0).toFixed(2)} mA, R_total = ${Number(cv.R_total || 0).toFixed(1)} Ω`;
    if (cv.components && cv.components.length > 0) {
      cv.components.forEach((comp, i) => {
        if (comp.type === 'resistor') circuitSummary += `\n- R${i+1}: ${comp.r} Ω, V = ${Number(comp.v).toFixed(2)} V, I = ${Number(comp.i_mA).toFixed(2)} mA`;
        else if (comp.type === 'led')  circuitSummary += `\n- LED${i+1}: ${comp.state}, V(A-K) = ${Number(comp.vak || 0).toFixed(2)} V`;
        else if (comp.type === 'capacitor') circuitSummary += `\n- C${i+1}: Vc = ${Number(comp.v).toFixed(2)} V, τ = ${Number(comp.tau_s * 1000).toFixed(2)} ms`;
        else if (comp.type === 'inductor')  circuitSummary += `\n- L${i+1}: τ = ${Number(comp.tau_s * 1e6).toFixed(1)} µs`;
        else if (comp.type === 'transistor') circuitSummary += `\n- T${i+1}: ${comp.state}`;
        else if (comp.type === 'diode') circuitSummary += `\n- D${i+1}: ${comp.state}, V(A-K) = ${Number(comp.vak || 0).toFixed(2)} V`;
      });
    }
  }
  if (circuitContext?.analysisLog) {
    circuitSummary += `\n\nANALYSIS LOG:\n${circuitContext.analysisLog.join('\n')}`;
  }

  let systemContent = `You are "ELVO AI", an advanced AI physics tutor for an electronics simulator.
RULES:
- Respond analytically and academically, using exact numbers from CURRENT CIRCUIT DATA.
- Always relate concepts to Ohm's Law and circuit physics using the actual numbers.
- Be concise (1–3 paragraphs max).`;

  if (lang === 'id') {
    systemContent += `\n- CRITICAL: Respond ENTIRELY in Bahasa Indonesia.`;
  }

  systemContent += circuitSummary;

  const payloadMessages = [
    { role: 'system', content: systemContent },
    ...messages,
  ];

  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: payloadMessages,
        options: { temperature: 0.7 },
      }),
    });

    if (!res.ok) throw new Error('Ollama returned an error');
    const data = await res.json();
    return data.message?.content || 'No response';
  } catch (error) {
    console.warn('Chat generation failed:', error.message);
    return lang === 'id'
      ? 'Maaf, mesin AI-ku sedang beristirahat. Pastikan koneksi atau AI Engine sudah aktif ya!'
      : 'Sorry, my AI engine is resting. Make sure the AI Engine is active!';
  }
}

module.exports = {
  getAIInsights,
  detectAIMode,
  generateChatResponse,
};
