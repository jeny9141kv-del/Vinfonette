import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/lib/demo-data.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Regex to find candidate blocks inside DEMO_CANDIDATES
// Each candidate block starts with { and has candidate_id: 'VN-2026-xxx'
// and ends before the next candidate or end of array.

const candidateMeta = {
  'VN-2026-001': {
    payment_status: "'PAID'",
    payment_amount: 25000,
    amount_paid: 25000,
    payment_date: "'2026-01-16'",
    payment_reference: "'UPI/VN2026011601'",
    payment_notes: "'Full tuition and placement fee paid.'",
    education_certificate_url: "'/sample-resumes/aarav_degree.pdf'",
    education_certificate_filename: "'Aarav_BTech_ComputerScience_Degree.pdf'",
    pf_status: "'APPLICABLE'",
    pf_uan: "'101234567890'",
    pf_number: "'MH/BAN/0012345/000/0001234'",
    pf_notes: "'EPFO account active from previous internship.'",
    has_experience: true,
    total_experience_years: 1.5,
    service_history: JSON.stringify([
      {
        id: 'sh-001',
        company_name: 'TechNova Solutions',
        designation: 'Associate Software Engineer',
        start_date: '2024-06-01',
        end_date: '2025-11-30',
        is_current: false,
        location: 'Bengaluru',
        roles_responsibilities: 'Built React and TypeScript user interfaces and REST services with Node.js.',
        last_drawn_salary: '₹4,50,000 / year'
      }
    ], null, 2),
    experience_certificate_url: "'/sample-resumes/aarav_experience.pdf'",
    experience_certificate_filename: "'TechNova_Relieving_Experience_Letter.pdf'",
  },
  'VN-2026-002': {
    payment_status: "'PAID'",
    payment_amount: 25000,
    amount_paid: 25000,
    payment_date: "'2026-01-18'",
    payment_reference: "'NEFT/HDFC881923'",
    payment_notes: "'Full payment verified by accounts.'",
    education_certificate_url: "'/sample-resumes/diya_degree.pdf'",
    education_certificate_filename: "'Diya_Sen_Degree_Certificate.pdf'",
    pf_status: "'NOT_APPLICABLE'",
    pf_notes: "'Fresher candidate, first-time job seeker.'",
    has_experience: false,
    total_experience_years: 0,
    service_history: '[]',
  },
  'VN-2026-003': {
    payment_status: "'PARTIAL'",
    payment_amount: 30000,
    amount_paid: 18000,
    payment_date: "'2026-02-02'",
    payment_reference: "'UPI/VN9823141'",
    payment_notes: "'Installment 1 received. Installment 2 ₹12,000 due upon offer acceptance.'",
    education_certificate_url: "'/sample-resumes/karthik_degree.pdf'",
    education_certificate_filename: "'Karthik_MTech_DataScience_Degree.pdf'",
    pf_status: "'APPLICABLE'",
    pf_uan: "'101889922110'",
    pf_number: "'TS/HYD/0043210/000/0009876'",
    pf_notes: "'Previous employer PF account verified.'",
    has_experience: true,
    total_experience_years: 2.0,
    service_history: JSON.stringify([
      {
        id: 'sh-002',
        company_name: 'QuantX Intelligence',
        designation: 'Junior ML Researcher',
        start_date: '2023-08-01',
        end_date: '2025-07-31',
        is_current: false,
        location: 'Hyderabad',
        roles_responsibilities: 'Trained computer vision models with PyTorch and built data pipelines.',
        last_drawn_salary: '₹5,20,000 / year'
      }
    ], null, 2),
    experience_certificate_url: "'/sample-resumes/karthik_experience.pdf'",
    experience_certificate_filename: "'QuantX_Experience_Relieving_Certificate.pdf'",
  },
  'VN-2026-004': {
    payment_status: "'PAID'",
    payment_amount: 25000,
    amount_paid: 25000,
    payment_date: "'2026-02-06'",
    payment_reference: "'IMPS/9921381273'",
    education_certificate_url: "'/sample-resumes/meera_degree.pdf'",
    education_certificate_filename: "'Meera_Krishnan_Degree.pdf'",
    pf_status: "'NOT_APPLICABLE'",
    has_experience: false,
    total_experience_years: 0,
    service_history: '[]',
  },
  'VN-2026-005': {
    payment_status: "'PARTIAL'",
    payment_amount: 25000,
    amount_paid: 15000,
    payment_date: "'2026-01-22'",
    payment_reference: "'UPI/VN772631'",
    payment_notes: "'Final balance of ₹10,000 due.'",
    education_certificate_url: "'/sample-resumes/rohan_degree.pdf'",
    education_certificate_filename: "'Rohan_Verma_MCA_Degree.pdf'",
    pf_status: "'APPLICABLE'",
    pf_uan: "'101998822334'",
    pf_number: "'DL/CPM/0022334/000/0005566'",
    has_experience: true,
    total_experience_years: 1.0,
    service_history: JSON.stringify([
      {
        id: 'sh-005',
        company_name: 'CodeMatrix Labs',
        designation: 'Web Development Intern',
        start_date: '2024-05-01',
        end_date: '2025-04-30',
        is_current: false,
        location: 'Noida',
        roles_responsibilities: 'Developed REST APIs in Express and React dashboards.',
        last_drawn_salary: '₹3,60,000 / year'
      }
    ], null, 2),
    experience_certificate_url: "'/sample-resumes/rohan_experience.pdf'",
    experience_certificate_filename: "'CodeMatrix_Experience_Letter.pdf'",
  },
  'VN-2026-006': {
    payment_status: "'PAID'",
    payment_amount: 25000,
    amount_paid: 25000,
    payment_date: "'2026-02-10'",
    payment_reference: "'UPI/VN881234'",
    education_certificate_url: "'/sample-resumes/ananya_degree.pdf'",
    education_certificate_filename: "'Ananya_Sharma_Degree.pdf'",
    pf_status: "'NOT_APPLICABLE'",
    has_experience: false,
    total_experience_years: 0,
    service_history: '[]',
  },
};

// Default fallback for any candidate not in map
function getDefaultMeta(candId, name, stage) {
  const isPaid = ['Placed Successfully', 'Offer Received', 'Interview Completed', 'Interview Scheduled'].includes(stage);
  const isPartial = stage === 'Training Completed' || stage === 'Placement Ready';
  const payStatus = isPaid ? "'PAID'" : (isPartial ? "'PARTIAL'" : "'PENDING'");
  const fee = 25000;
  const paid = isPaid ? 25000 : (isPartial ? 15000 : 0);
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');

  return {
    payment_status: payStatus,
    payment_amount: fee,
    amount_paid: paid,
    payment_date: paid > 0 ? "'2026-01-25'" : 'undefined',
    payment_reference: paid > 0 ? `'UPI/VN${candId.replace(/[^0-9]/g, '')}01'` : 'undefined',
    education_certificate_url: `'//sample-resumes/${safeName.toLowerCase()}_degree.pdf'`,
    education_certificate_filename: `'${safeName}_Degree_Certificate.pdf'`,
    pf_status: "'NOT_APPLICABLE'",
    has_experience: false,
    total_experience_years: 0,
    service_history: '[]',
  };
}

// We'll search for each candidate entry between export const DEMO_CANDIDATES: Candidate[] = [ and ];
const startIdx = content.indexOf('export const DEMO_CANDIDATES: Candidate[] = [');
const endIdx = content.indexOf('export const DEMO_APPLICATIONS: JobApplication[] = [');

let candidatesSlice = content.substring(startIdx, endIdx);

// Match each candidate object
candidatesSlice = candidatesSlice.replace(
  /\{\s+id:\s+'(e[0-9a-f-]+)',\s+candidate_id:\s+'(VN-2026-\d{3})',\s+full_name:\s+'([^']+)',[\s\S]+?internal_notes:\s+'([^']*)',?\s+\},/g,
  (fullMatch, id, candId, fullName, internalNotes) => {
    // Extract current_stage
    const stageMatch = fullMatch.match(/current_stage:\s+'([^']+)'/);
    const stage = stageMatch ? stageMatch[1] : 'Registered';

    const meta = candidateMeta[candId] || getDefaultMeta(candId, fullName, stage);

    // Build fields to insert before the closing brace
    let fields = `\n    payment_status: ${meta.payment_status},`;
    if (meta.payment_amount !== undefined) fields += `\n    payment_amount: ${meta.payment_amount},`;
    if (meta.amount_paid !== undefined) fields += `\n    amount_paid: ${meta.amount_paid},`;
    if (meta.payment_date && meta.payment_date !== 'undefined') fields += `\n    payment_date: ${meta.payment_date},`;
    if (meta.payment_reference && meta.payment_reference !== 'undefined') fields += `\n    payment_reference: ${meta.payment_reference},`;
    if (meta.payment_notes) fields += `\n    payment_notes: ${meta.payment_notes},`;
    if (meta.education_certificate_url) fields += `\n    education_certificate_url: ${meta.education_certificate_url},`;
    if (meta.education_certificate_filename) fields += `\n    education_certificate_filename: ${meta.education_certificate_filename},`;
    if (meta.pf_status) fields += `\n    pf_status: ${meta.pf_status},`;
    if (meta.pf_uan) fields += `\n    pf_uan: ${meta.pf_uan},`;
    if (meta.pf_number) fields += `\n    pf_number: ${meta.pf_number},`;
    if (meta.pf_notes) fields += `\n    pf_notes: ${meta.pf_notes},`;
    fields += `\n    has_experience: ${meta.has_experience ? 'true' : 'false'},`;
    fields += `\n    total_experience_years: ${meta.total_experience_years || 0},`;
    fields += `\n    service_history: ${meta.service_history || '[]'},`;
    if (meta.experience_certificate_url) fields += `\n    experience_certificate_url: ${meta.experience_certificate_url},`;
    if (meta.experience_certificate_filename) fields += `\n    experience_certificate_filename: ${meta.experience_certificate_filename},`;

    // Replace the end of the candidate object
    return fullMatch.replace(/\s+\},$/, `${fields}\n  },`);
  }
);

content = content.substring(0, startIdx) + candidatesSlice + content.substring(endIdx);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully enriched DEMO_CANDIDATES in demo-data.ts');

