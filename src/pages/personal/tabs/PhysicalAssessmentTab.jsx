import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Plus, FileText, Printer, ArrowUpRight, 
  ArrowDownRight, Minus, Trash2, Heart, Dumbbell, Flame, Compass, ChevronRight 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase.js';
import toast from 'react-hot-toast';

const INITIAL_FORM_STATE = {
  weight: '', height: '', waist: '', abdominalPerimeter: '', hip: '', chest: '', notes: '',
  neck: '', shoulder: '',
  armRightRelaxed: '', armLeftRelaxed: '',
  armRightFlexed: '', armLeftFlexed: '',
  forearmRight: '', forearmLeft: '',
  thighRightProximal: '', thighLeftProximal: '',
  thighRightMedial: '', thighLeftMedial: '',
  thighRightDistal: '', thighLeftDistal: '',
  calfRight: '', calfLeft: '',
  triceps: '', biceps: '', subscapular: '', suprailiac: '', 
  abdominal: '', midaxillary: '', pectoral: '', thighFold: '', calfFold: '',
  cooperDistance: '', wellsFlexibility: '', pushUps: '', squats: '', absCount: ''
};

export default function PhysicalAssessmentTab({
  students = [],
  assessments: initialAssessments = [],
  onSaveAssessment,
  onDeleteAssessment,
  isStudentView = false,
  studentId: currentStudentId = null
}) {
  const [internalStudents, setInternalStudents] = useState(students);
  const [internalAssessments, setInternalAssessments] = useState(initialAssessments);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('skinfolds');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [personalProfile, setPersonalProfile] = useState(null);

  // Sincronização de props de entrada
  useEffect(() => { setInternalStudents(students); }, [students]);
  useEffect(() => { setInternalAssessments(initialAssessments); }, [initialAssessments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchPersonalProfile();
  }, []);

  // Define QUAL aluno deve ser selecionado ao inicializar a tela
  useEffect(() => {
    if (isStudentView) {
      if (currentStudentId) {
        setSelectedStudentId(currentStudentId);
      } else {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) setSelectedStudentId(user.id);
        });
      }
    } else if (students?.length > 0) {
      if (!selectedStudentId) {
        setSelectedStudentId(students[0]?.id || '');
      }
    } else {
      fetchStudents();
    }
  }, [isStudentView, currentStudentId, students]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchAssessments();
    }
  }, [selectedStudentId]);

  const fetchPersonalProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setPersonalProfile(data || { id: user.id, name: user?.email });
      }
    } catch (err) {
      console.error('Erro ao buscar perfil do personal:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) throw error;
      if (data?.length > 0) {
        setInternalStudents(data);
        if (!selectedStudentId) setSelectedStudentId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar alunos:', err);
    }
  };

  const fetchAssessments = async () => {
    if (!selectedStudentId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('date', { ascending: false });

      if (error) throw error;
      setInternalAssessments(data || []);
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = useMemo(() => {
    return internalStudents.find((s) => String(s.id) === String(selectedStudentId)) || {};
  }, [internalStudents, selectedStudentId]);

  const studentGender = (selectedStudent.gender || selectedStudent.sexo || 'M').toUpperCase();
  const studentAge = parseInt(selectedStudent.age || selectedStudent.idade || 25, 10);

  // CÁLCULOS FISIOLÓGICOS
  const calculations = useMemo(() => {
    const numWeight = Math.max(0, parseFloat(formData.weight) || 0);
    const numHeightM = Math.max(0, (parseFloat(formData.height) || 0) / 100);
    const numWaist = Math.max(0, parseFloat(formData.waist) || 0);
    const numHip = Math.max(0, parseFloat(formData.hip) || 0);

    const imc = numWeight > 0 && numHeightM > 0 ? (numWeight / (numHeightM * numHeightM)).toFixed(1) : '---';
    const rcq = numWaist > 0 && numHip > 0 ? (numWaist / numHip).toFixed(2) : '---';

    const sum7 = (
      (parseFloat(formData.triceps) || 0) +
      (parseFloat(formData.subscapular) || 0) +
      (parseFloat(formData.suprailiac) || 0) +
      (parseFloat(formData.abdominal) || 0) +
      (parseFloat(formData.midaxillary) || 0) +
      (parseFloat(formData.pectoral) || 0) +
      (parseFloat(formData.thighFold) || 0)
    );

    let calculatedBf = 0;
    if (sum7 > 0 && studentAge > 0) {
      const bodyDensity = studentGender === 'M'
        ? 1.112 - (0.00043499 * sum7) + (0.00000055 * (sum7 * sum7)) - (0.00028826 * studentAge)
        : 1.097 - (0.00046971 * sum7) + (0.00000056 * (sum7 * sum7)) - (0.00012828 * studentAge);
      
      if (bodyDensity > 0) {
        calculatedBf = parseFloat(((4.95 / bodyDensity - 4.5) * 100).toFixed(1));
      }
      if (calculatedBf < 3) calculatedBf = 3;
      if (calculatedBf > 60) calculatedBf = 60;
    }

    const leanMass = numWeight > 0 && calculatedBf > 0 ? (numWeight * (1 - calculatedBf / 100)).toFixed(1) : '0.0';
    const fatMass = numWeight > 0 && calculatedBf > 0 ? (numWeight * (calculatedBf / 100)).toFixed(1) : '0.0';
    const numCooper = parseFloat(formData.cooperDistance) || 0;
    const vo2Max = numCooper > 0 ? parseFloat(((numCooper - 504.9) / 44.73).toFixed(1)) : 0;

    return { imc, rcq, sum7, calculatedBf, leanMass, fatMass, vo2Max, numWeight, numCooper };
  }, [formData, studentGender, studentAge]);

  const latestAssessment = useMemo(() => {
    return internalAssessments.length > 0 ? internalAssessments[0] : null;
  }, [internalAssessments]);

  const parseNum = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const n = parseFloat(val);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error('Selecione um aluno válido!');
    if (parseNum(formData.weight) <= 0 || parseNum(formData.height) <= 0) {
      return toast.error('Insira Peso e Altura válidos!');
    }

    const payload = {
      student_id: selectedStudentId,
      personal_id: personalProfile?.id || null,
      date: new Date().toISOString().split('T')[0],
      weight: parseNum(formData.weight),
      height: parseNum(formData.height),
      bf: parseNum(calculations.calculatedBf),
      lean_mass: parseNum(calculations.leanMass),
      fat_mass: parseNum(calculations.fatMass),
      
      neck: parseNum(formData.neck),
      shoulder: parseNum(formData.shoulder),
      chest: parseNum(formData.chest),
      waist: parseNum(formData.waist),
      abdominal_perimeter: parseNum(formData.abdominalPerimeter),
      hip: parseNum(formData.hip),
      arm_right_relaxed: parseNum(formData.armRightRelaxed),
      arm_left_relaxed: parseNum(formData.armLeftRelaxed),
      arm_right_flexed: parseNum(formData.armRightFlexed),
      arm_left_flexed: parseNum(formData.armLeftFlexed),
      forearm_right: parseNum(formData.forearmRight),
      forearm_left: parseNum(formData.forearmLeft),
      thigh_right_proximal: parseNum(formData.thighRightProximal),
      thigh_left_proximal: parseNum(formData.thighLeftProximal),
      thigh_right_medial: parseNum(formData.thighRightMedial),
      thigh_left_medial: parseNum(formData.thighLeftMedial),
      thigh_right_distal: parseNum(formData.thighRightDistal),
      thigh_left_distal: parseNum(formData.thighLeftDistal),
      calf_right: parseNum(formData.calfRight),
      calf_left: parseNum(formData.calfLeft),

      skinfold_triceps: parseNum(formData.triceps),
      skinfold_biceps: parseNum(formData.biceps),
      skinfold_subscapular: parseNum(formData.subscapular),
      skinfold_suprailiac: parseNum(formData.suprailiac),
      skinfold_abdominal: parseNum(formData.abdominal),
      skinfold_midaxillary: parseNum(formData.midaxillary),
      skinfold_pectoral: parseNum(formData.pectoral),
      skinfold_thigh: parseNum(formData.thighFold),
      skinfold_calf: parseNum(formData.calfFold),
      skinfold_sum: parseNum(calculations.sum7),

      cooper_distance: parseNum(formData.cooperDistance),
      vo2_max: parseNum(calculations.vo2Max),
      flexibility_wells: parseNum(formData.wellsFlexibility),
      push_ups: parseNum(formData.pushUps),
      squats: parseNum(formData.squats),
      abs: parseNum(formData.absCount),
      notes: formData.notes || ''
    };

    try {
      setSaving(true);
      if (onSaveAssessment) {
        await onSaveAssessment(payload);
      } else {
        const { error } = await supabase.from('assessments').insert([payload]);
        if (error) throw error;
      }
      
      toast.success('Avaliação salva com sucesso!');
      setShowForm(false);
      setFormData(INITIAL_FORM_STATE);
      await fetchAssessments();

    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = () => {
    if (!latestAssessment) {
      return toast.error('Selecione um aluno que possua avaliações!');
    }
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="w-full space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-pdf-area, #printable-pdf-area * { visibility: visible !important; }
          #printable-pdf-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* PAINEL DE AÇÕES E SELEÇÃO DE ALUNO */}
      <div className="no-print flex flex-wrap gap-4 items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-zinc-300">Aluno:</label>
          <select 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-zinc-800 text-white font-bold px-3 py-2 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400"
          >
            {internalStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.full_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl border border-zinc-700 transition-all"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-black font-extrabold px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={18} /> Nova Avaliação
          </button>
        </div>
      </div>

      {/* RELATÓRIO PDF EXCLUSIVO PARA IMPRESSÃO */}
      <div id="printable-pdf-area" className="hidden print:block">
        {latestAssessment ? (
          <div style={{ width: '100%', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
            
            {/* CABEÇALHO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0891b2', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>
                  Relatório de Avaliação Física
                </h1>
                <p style={{ fontSize: '12px', color: '#334155', margin: '3px 0 0 0', fontWeight: '600' }}>
                  Personal Trainer: <span style={{ color: '#0f172a', textTransform: 'capitalize' }}>{personalProfile?.full_name || personalProfile?.name || 'Profissional'}</span>
                  {personalProfile?.cref ? ` | CREF: ${personalProfile.cref}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#0f172a' }}>
                  <strong>Aluno:</strong> <span style={{ textTransform: 'uppercase', color: '#0891b2', fontWeight: '800' }}>{selectedStudent?.name || selectedStudent?.full_name || 'Aluno'}</span>
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
                  Data: {latestAssessment.date}
                </p>
              </div>
            </div>

            {/* CARDS DE RESUMO */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, background: '#f8fafc', borderLeft: '4px solid #0891b2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Peso Corporal</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.weight} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', borderLeft: '4px solid #0891b2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Gordura (% BF)</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.bf || '---'}{latestAssessment.bf ? ' %' : ''}</p>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', borderLeft: '4px solid #10b981', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Massa Magra</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.lean_mass || '---'} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', borderLeft: '4px solid #ef4444', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Massa Gorda</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.fat_mass || '---'} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
            </div>

            {/* MEDIDOR DE COMPOSIÇÃO CORPORAL (% BF) - OTIMIZADO PARA IMPRESSÃO/PDF */}
            {(() => {
              const bf = latestAssessment.bf;
              const level = !bf ? null : bf < 12 ? 'EXCELENTE' : bf < 18 ? 'BOM' : bf < 24 ? 'MÉDIO' : 'RUIM';
              const posMap = { EXCELENTE: '12.5%', BOM: '37.5%', MÉDIO: '62.5%', RUIM: '87.5%' };
              const colorMap = { EXCELENTE: '#10b981', BOM: '#06b6d4', MÉDIO: '#f59e0b', RUIM: '#ef4444' };

              return (
                <div style={{ 
                  marginBottom: '12px', 
                  background: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  padding: '10px 14px', 
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                      Classificação de Composição Corporal (% BF)
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      color: colorMap[level] || '#64748b', 
                      backgroundColor: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${colorMap[level] || '#cbd5e1'}`,
                      textTransform: 'uppercase' 
                    }}>
                      {level || 'Não Informado'}
                    </span>
                  </div>

                  {/* BARRA MULTICOR COM PONTEIRO FIXO */}
                  <div style={{ position: 'relative', width: '100%', height: '14px', margin: '8px 0 6px 0' }}>
                    <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '7px', overflow: 'hidden' }}>
                      <div style={{ width: '25%', backgroundColor: '#10b981' }} />
                      <div style={{ width: '25%', backgroundColor: '#06b6d4' }} />
                      <div style={{ width: '25%', backgroundColor: '#f59e0b' }} />
                      <div style={{ width: '25%', backgroundColor: '#ef4444' }} />
                    </div>

                    {level && (
                      <div style={{
                        position: 'absolute',
                        top: '-2px',
                        left: posMap[level],
                        transform: 'translateX(-50%)',
                        width: '18px',
                        height: '18px',
                        backgroundColor: '#ffffff',
                        border: `4px solid ${colorMap[level]}`,
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 10
                      }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '9px', color: '#334155', fontWeight: '800' }}>
                    <span style={{ width: '25%', color: '#059669' }}>EXCELENTE (&lt;12%)</span>
                    <span style={{ width: '25%', color: '#0891b2' }}>BOM (12-17.9%)</span>
                    <span style={{ width: '25%', color: '#d97706' }}>MÉDIO (18-23.9%)</span>
                    <span style={{ width: '25%', color: '#dc2626' }}>RUIM (&ge;24%)</span>
                  </div>
                </div>
              );
            })()}

            {/* PERIMETRIA */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', marginBottom: '5px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Perimetria (Circunferências em CM)</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 12px', fontSize: '11px', color: '#0f172a', background: '#fafafa', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ margin: 0 }}><strong>Pescoço:</strong> {latestAssessment.neck || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Deltoide:</strong> {latestAssessment.shoulder || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Tórax:</strong> {latestAssessment.chest || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Cintura:</strong> {latestAssessment.waist || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Circunf. Abdominal:</strong> {latestAssessment.abdominal_perimeter || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Quadril:</strong> {latestAssessment.hip || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Braço Dir. (Rel/Flex):</strong> {latestAssessment.arm_right_relaxed || '---'} / {latestAssessment.arm_right_flexed || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Braço Esq. (Rel/Flex):</strong> {latestAssessment.arm_left_relaxed || '---'} / {latestAssessment.arm_left_flexed || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Antebraço (D/E):</strong> {latestAssessment.forearm_right || '---'} / {latestAssessment.forearm_left || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Coxa Med. (D/E):</strong> {latestAssessment.thigh_right_medial || '---'} / {latestAssessment.thigh_left_medial || '---'} cm</p>
                <p style={{ margin: 0 }}><strong>Panturrilha (D/E):</strong> {latestAssessment.calf_right || '---'} / {latestAssessment.calf_left || '---'} cm</p>
              </div>
            </div>

            {/* DOBRAS CUTÂNEAS */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', marginBottom: '5px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Dobras Cutâneas (em MM)</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 12px', fontSize: '11px', color: '#0f172a', background: '#fafafa', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ margin: 0 }}><strong>Tricipital:</strong> {latestAssessment.skinfold_triceps || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Bicipital:</strong> {latestAssessment.skinfold_biceps || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Subescapular:</strong> {latestAssessment.skinfold_subscapular || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Suprailíaca:</strong> {latestAssessment.skinfold_suprailiac || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Abdominal:</strong> {latestAssessment.skinfold_abdominal || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Axilar Média:</strong> {latestAssessment.skinfold_midaxillary || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Peitoral:</strong> {latestAssessment.skinfold_pectoral || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Coxa:</strong> {latestAssessment.skinfold_thigh || '---'} mm</p>
                <p style={{ margin: 0 }}><strong>Panturrilha:</strong> {latestAssessment.skinfold_calf || '---'} mm</p>
              </div>
            </div>

            {/* TESTES FÍSICOS & QUALIFICAÇÃO DE DESEMPENHO - OTIMIZADOS */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>
                  Testes Físicos & Qualificação de Desempenho
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  {
                    title: 'Flexão de Braço',
                    val: latestAssessment?.push_ups ?? latestAssessment?.flexao,
                    unit: 'rep',
                    calcLevel: (v) => v >= 25 ? 'EXCELENTE' : v >= 15 ? 'BOM' : v >= 8 ? 'MÉDIO' : 'RUIM'
                  },
                  {
                    title: 'Abdominais (1 min)',
                    val: latestAssessment?.abs ?? latestAssessment?.abdominais,
                    unit: 'rep',
                    calcLevel: (v) => v >= 35 ? 'EXCELENTE' : v >= 25 ? 'BOM' : v >= 15 ? 'MÉDIO' : 'RUIM'
                  },
                  {
                    title: 'Flexibilidade (Wells)',
                    val: latestAssessment?.flexibility_wells ?? latestAssessment?.wells,
                    unit: 'cm',
                    calcLevel: (v) => v >= 34 ? 'EXCELENTE' : v >= 28 ? 'BOM' : v >= 20 ? 'MÉDIO' : 'RUIM'
                  },
                  {
                    title: 'VO2 Máx Estimado',
                    val: latestAssessment?.vo2_max ?? latestAssessment?.vo2,
                    unit: 'ml/kg/min',
                    calcLevel: (v) => v >= 45 ? 'EXCELENTE' : v >= 38 ? 'BOM' : v >= 30 ? 'MÉDIO' : 'RUIM'
                  }
                ].map((item, idx) => {
                  const numVal = Number(item.val);
                  const hasVal = item.val !== null && item.val !== undefined && item.val !== '' && !isNaN(numVal);
                  const level = hasVal ? item.calcLevel(numVal) : null;

                  const posMap = { EXCELENTE: '12.5%', BOM: '37.5%', MÉDIO: '62.5%', RUIM: '87.5%' };
                  const colorMap = { EXCELENTE: '#10b981', BOM: '#06b6d4', MÉDIO: '#f59e0b', RUIM: '#ef4444' };
                  const bgMap = { EXCELENTE: '#dcfce7', BOM: '#e0f2fe', MÉDIO: '#fef3c7', RUIM: '#fee2e2' };

                  return (
                    <div key={idx} style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#0f172a', fontWeight: 'bold' }}>
                        <span>{item.title}:</span>
                        <span>{hasVal ? `${numVal} ${item.unit}` : '---'}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                        <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '800' }}>CLASSIFICAÇÃO:</span>
                        <span style={{
                          fontSize: '8px',
                          fontWeight: '900',
                          color: colorMap[level] || '#94a3b8',
                          backgroundColor: bgMap[level] || '#f1f5f9',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          {level || '---'}
                        </span>
                      </div>

                      {/* Mini Barra de Status */}
                      <div style={{ position: 'relative', width: '100%', height: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '25%', backgroundColor: '#10b981' }} />
                          <div style={{ width: '25%', backgroundColor: '#06b6d4' }} />
                          <div style={{ width: '25%', backgroundColor: '#f59e0b' }} />
                          <div style={{ width: '25%', backgroundColor: '#ef4444' }} />
                        </div>

                        {level && (
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: posMap[level],
                            transform: 'translateX(-50%)',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#ffffff',
                            border: `3px solid ${colorMap[level]}`,
                            borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            zIndex: 10
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OBSERVAÇÕES DO AVALIADOR */}
            <div>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', marginBottom: '5px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Observações do Avaliador</h3>
              </div>
              <p style={{ fontSize: '11px', color: '#1e293b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', margin: 0, minHeight: '30px', fontWeight: '500' }}>
                {latestAssessment.notes || 'Nenhuma observação adicional cadastrada nesta avaliação.'}
              </p>
            </div>

          </div>
        ) : (
          <p className="no-print text-center text-slate-500 py-4">Nenhuma avaliação disponível para gerar o PDF do aluno.</p>
        )}
      </div>
    </div>
  );
}