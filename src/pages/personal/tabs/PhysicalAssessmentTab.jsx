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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchPersonalProfile();
  }, []);

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
      setInternalStudents(students);
      if (!selectedStudentId) setSelectedStudentId(students[0]?.id || '');
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
  // Evita disparar requisição se não houver um ID válido selecionado
  if (!selectedStudentId || selectedStudentId === '') return;

  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', selectedStudentId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro retornado pelo Supabase:', error);
      throw error;
    }

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

  const calculations = useMemo(() => {
    const numWeight = parseFloat(formData.weight) || 0;
    const numHeightM = (parseFloat(formData.height) || 0) / 100;
    const numWaist = parseFloat(formData.waist) || 0;
    const numHip = parseFloat(formData.hip) || 0;

    const imc = numWeight && numHeightM ? (numWeight / (numHeightM * numHeightM)).toFixed(1) : '---';
    const rcq = numWaist && numHip ? (numWaist / numHip).toFixed(2) : '---';

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
      let bodyDensity = studentGender === 'M'
        ? 1.112 - (0.00043499 * sum7) + (0.00000055 * (sum7 * sum7)) - (0.00028826 * studentAge)
        : 1.097 - (0.00046971 * sum7) + (0.00000056 * (sum7 * sum7)) - (0.00012828 * studentAge);
      
      calculatedBf = parseFloat(((4.95 / bodyDensity - 4.5) * 100).toFixed(1));
      if (calculatedBf < 3) calculatedBf = 3;
    }

    const leanMass = numWeight && calculatedBf ? (numWeight * (1 - calculatedBf / 100)).toFixed(1) : '0';
    const fatMass = numWeight && calculatedBf ? (numWeight * (calculatedBf / 100)).toFixed(1) : '0';
    const numCooper = parseFloat(formData.cooperDistance) || 0;
    const vo2Max = numCooper > 0 ? parseFloat(((numCooper - 504.9) / 44.73).toFixed(1)) : 0;

    return { imc, rcq, sum7, calculatedBf, leanMass, fatMass, vo2Max, numWeight, numCooper };
  }, [formData, studentGender, studentAge]);

  const latestAssessment = useMemo(() => {
    return internalAssessments.length > 0 ? internalAssessments[0] : null;
  }, [internalAssessments]);

  const previousAssessment = useMemo(() => {
    return internalAssessments.length > 1 ? internalAssessments[1] : null;
  }, [internalAssessments]);

  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

 const handleSave = async (e) => {
  e.preventDefault();
  if (!selectedStudentId) {
    return toast.error('Selecione um aluno válido antes de salvar!');
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
      if (error) {
        console.error('Detalhes do Erro Supabase:', error);
        throw error;
      }
    }
    
    toast.success('Avaliação cadastrada com sucesso!');
    setShowForm(false);
    setFormData(INITIAL_FORM_STATE);
    await fetchAssessments();

  } catch (err) {
    console.error('Erro ao salvar:', err);
    toast.error('Erro ao salvar avaliação. Verifique a tabela no banco.');
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta avaliação permanentemente?')) return;
    try {
      if (onDeleteAssessment) {
        await onDeleteAssessment(id);
      } else {
        const { error } = await supabase.from('assessments').delete().eq('id', id);
        if (error) throw error;
      }
      toast.success('Avaliação removida!');
      fetchAssessments();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir.');
    }
  };

  const handlePrintPDF = () => {
    if (!latestAssessment) {
      return toast.error('Selecione um aluno que possua ao menos uma avaliação!');
    }
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const renderDiff = (current, prev, unit = '') => {
    if (current === undefined || current === null || prev === undefined || prev === null) return null;
    const diff = (parseFloat(current) - parseFloat(prev)).toFixed(1);
    if (diff > 0) return <span className="text-emerald-400 text-sm font-bold flex items-center gap-0.5"><ArrowUpRight size={16} />+{diff}{unit}</span>;
    if (diff < 0) return <span className="text-cyan-400 text-sm font-bold flex items-center gap-0.5"><ArrowDownRight size={16} />{diff}{unit}</span>;
    return <span className="text-slate-500 text-sm font-bold flex items-center gap-0.5"><Minus size={16} />0{unit}</span>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-base">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pdf-area, #printable-pdf-area * {
            visibility: visible !important;
          }
          #printable-pdf-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 30px !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Activity className="text-cyan-400 w-8 h-8" /> {isStudentView ? 'Minha Evolução Física' : 'Avaliação Física & Diagnóstico'}
          </h2>
          <p className="text-slate-300 text-base mt-1">Acompanhamento de composição corporal e histórico.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isStudentView && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-base rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
            >
              {internalStudents.length === 0 ? (
                <option value="">Nenhum aluno encontrado</option>
              ) : (
                internalStudents.map((st) => (
                  <option key={st.id} value={st.id}>{st.name || st.full_name}</option>
                ))
              )}
            </select>
          )}

          {!isStudentView && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-base transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Plus size={20} /> {showForm ? 'Fechar Form' : 'Nova Avaliação'}
            </button>
          )}

          <button
            onClick={handlePrintPDF}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-base transition flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer size={20} /> Gerar PDF
          </button>
        </div>
      </div>

      {/* FORMULÁRIO */}
      {showForm && !isStudentView && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-2xl no-print">
          <div className="flex border-b border-slate-800 gap-6 overflow-x-auto pb-3">
            {[
              { id: 'skinfolds', label: 'Dobras Cutâneas', icon: Flame },
              { id: 'perimeters', label: 'Perimetria Completa', icon: Compass },
              { id: 'fitness', label: 'Capacidade Física', icon: Dumbbell },
              { id: 'notes', label: 'Observações', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm md:text-base font-bold uppercase pb-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'skinfolds' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Peso (kg)</label>
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-base focus:border-cyan-400 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Altura (cm)</label>
                  <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-base focus:border-cyan-400 outline-none" required />
                </div>

                <div className="col-span-1 sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-4 gap-2 text-center items-center">
                  <div>
                    <span className="block text-xs text-slate-400 font-bold uppercase">Soma</span>
                    <span className="text-white font-bold text-lg">{calculations.sum7} mm</span>
                  </div>
                  <div>
                    <span className="block text-xs text-cyan-400 font-bold uppercase">% BF</span>
                    <span className="text-cyan-400 font-extrabold text-xl">{calculations.calculatedBf}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-emerald-400 font-bold uppercase">M. Magra</span>
                    <span className="text-emerald-400 font-bold text-lg">{calculations.leanMass} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-rose-400 font-bold uppercase">M. Gorda</span>
                    <span className="text-rose-400 font-bold text-lg">{calculations.fatMass} kg</span>
                  </div>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Dobras Cutâneas (mm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { name: 'triceps', label: 'Tricipital' },
                  { name: 'biceps', label: 'Bicipital' },
                  { name: 'subscapular', label: 'Subescapular' },
                  { name: 'suprailiac', label: 'Suprailíaca' },
                  { name: 'abdominal', label: 'Abdominal' },
                  { name: 'midaxillary', label: 'Axilar Média' },
                  { name: 'pectoral', label: 'Peitoral' },
                  { name: 'thighFold', label: 'Coxa' },
                  { name: 'calfFold', label: 'Panturrilha Medial' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="text-xs text-slate-300 font-medium block mb-1">{field.label}</label>
                    <input type="number" name={field.name} value={formData[field.name]} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base focus:border-cyan-500 outline-none" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3">
                <button type="button" onClick={() => setActiveTab('perimeters')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer">
                  Aba Perimetria <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'perimeters' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {[
                  { name: 'neck', label: 'Pescoço (cm)' },
                  { name: 'shoulder', label: 'Deltoide (cm)' },
                  { name: 'chest', label: 'Tórax (cm)' },
                  { name: 'waist', label: 'Cintura (cm)' },
                  { name: 'abdominalPerimeter', label: 'Circunf. Abdominal (cm)' },
                  { name: 'hip', label: 'Quadril (cm)' }
                ].map((f) => (
                  <div key={f.name}>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">{f.label}</label>
                    <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-base focus:border-cyan-400 outline-none" />
                  </div>
                ))}
              </div>

              <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Membros Superiores (cm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Braço Dir. Relaxado</label><input type="number" name="armRightRelaxed" value={formData.armRightRelaxed} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Braço Esq. Relaxado</label><input type="number" name="armLeftRelaxed" value={formData.armLeftRelaxed} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Braço Dir. Contraído</label><input type="number" name="armRightFlexed" value={formData.armRightFlexed} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Braço Esq. Contraído</label><input type="number" name="armLeftFlexed" value={formData.armLeftFlexed} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Antebraço Dir.</label><input type="number" name="forearmRight" value={formData.forearmRight} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Antebraço Esq.</label><input type="number" name="forearmLeft" value={formData.forearmLeft} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
              </div>

              <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Membros Inferiores (cm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Proximal Dir.</label><input type="number" name="thighRightProximal" value={formData.thighRightProximal} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Proximal Esq.</label><input type="number" name="thighLeftProximal" value={formData.thighLeftProximal} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Medial Dir.</label><input type="number" name="thighRightMedial" value={formData.thighRightMedial} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Medial Esq.</label><input type="number" name="thighLeftMedial" value={formData.thighLeftMedial} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Distal Dir.</label><input type="number" name="thighRightDistal" value={formData.thighRightDistal} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Coxa Distal Esq.</label><input type="number" name="thighLeftDistal" value={formData.thighLeftDistal} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Panturrilha Dir.</label><input type="number" name="calfRight" value={formData.calfRight} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
                <div><label className="text-xs text-slate-300 font-medium block mb-1">Panturrilha Esq.</label><input type="number" name="calfLeft" value={formData.calfLeft} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-base" /></div>
              </div>

              <div className="flex justify-end pt-3">
                <button type="button" onClick={() => setActiveTab('fitness')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer">
                  Aba Capacidade Física <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'fitness' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Heart size={16} className="text-rose-400"/> Cooper (12 Min)
                  </span>
                  <input type="number" name="cooperDistance" placeholder="Distância percorrida (m)" value={formData.cooperDistance} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-base outline-none focus:border-cyan-400" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-sm font-bold text-slate-300">Banco de Wells</span>
                  <input type="number" name="wellsFlexibility" placeholder="Alcançado (cm)" value={formData.wellsFlexibility} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-base outline-none focus:border-cyan-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-sm font-bold text-slate-300">Flexão de Braço</label>
                  <input type="number" name="pushUps" placeholder="Repetições" value={formData.pushUps} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-base" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-sm font-bold text-slate-300">Agachamento</label>
                  <input type="number" name="squats" placeholder="Repetições" value={formData.squats} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-base" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-sm font-bold text-slate-300">Abdominal</label>
                  <input type="number" name="absCount" placeholder="Repetições" value={formData.absCount} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-base" />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button type="button" onClick={() => setActiveTab('notes')} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer">
                  Aba Observações <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Observações / Anamnese Final</label>
                <textarea name="notes" placeholder="Observações do treino..." value={formData.notes} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-base h-36 outline-none focus:border-cyan-400" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-base font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer">
                  {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

{/* PAINEL COMPARATIVO */}
      {latestAssessment && previousAssessment && (
        <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-2xl space-y-4 no-print">
          <h3 className="text-base font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Activity size={20} /> Comparativo de Evolução
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">PESO</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.weight} kg</span>
                {renderDiff(latestAssessment.weight, previousAssessment.weight, 'kg')}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">% GORDURA</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.bf || '---'}%</span>
                {renderDiff(latestAssessment.bf, previousAssessment.bf, '%')}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">VO2 MÁX</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.vo2_max || '---'}</span>
                {renderDiff(latestAssessment.vo2_max, previousAssessment.vo2_max)}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">CIRCUNF. ABDOMINAL</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.abdominal_perimeter || '---'} cm</span>
                {renderDiff(latestAssessment.abdominal_perimeter, previousAssessment.abdominal_perimeter, 'cm')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DAS AVALIAÇÕES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 no-print shadow-xl">
        <h3 className="text-xl font-bold text-white">Histórico do Aluno ({internalAssessments.length})</h3>

        {loading ? (
          <p className="text-slate-400 text-base italic text-center py-8">Carregando histórico...</p>
        ) : internalAssessments.length === 0 ? (
          <p className="text-slate-400 text-base italic text-center py-8">Nenhuma avaliação registrada para este aluno.</p>
        ) : (
          <div className="space-y-4">
            {internalAssessments.map((a) => (
              <div key={a.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition">
                <div>
                  <span className="text-sm text-cyan-400 font-bold uppercase tracking-wider">{a.date}</span>
                  <div className="flex flex-wrap gap-6 mt-2 text-base text-slate-200">
                    <span><strong>Peso:</strong> {a.weight} kg</span>
                    <span><strong>BF:</strong> {a.bf ? `${a.bf}%` : '---'}</span>
                    <span><strong>Circ. Abdominal:</strong> {a.abdominal_perimeter ? `${a.abdominal_perimeter} cm` : '---'}</span>
                  </div>
                </div>

                {!isStudentView && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-slate-400 hover:text-rose-400 text-sm font-semibold p-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={18} /> Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pdf-area, #printable-pdf-area * {
            visibility: visible !important;
          }
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
            background-color: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 99999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

     {/* PAINEL COMPARATIVO */}
      {latestAssessment && previousAssessment && (
        <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-2xl space-y-4 no-print">
          <h3 className="text-base font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Activity size={20} /> Comparativo de Evolução
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">PESO</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.weight} kg</span>
                {renderDiff(latestAssessment.weight, previousAssessment.weight, 'kg')}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">% GORDURA</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.bf || '---'}%</span>
                {renderDiff(latestAssessment.bf, previousAssessment.bf, '%')}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">VO2 MÁX</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.vo2_max || '---'}</span>
                {renderDiff(latestAssessment.vo2_max, previousAssessment.vo2_max)}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase">CIRCUNF. ABDOMINAL</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-white">{latestAssessment.abdominal_perimeter || '---'} cm</span>
                {renderDiff(latestAssessment.abdominal_perimeter, previousAssessment.abdominal_perimeter, 'cm')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DAS AVALIAÇÕES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 no-print shadow-xl">
        <h3 className="text-xl font-bold text-white">Histórico do Aluno ({internalAssessments.length})</h3>

        {loading ? (
          <p className="text-slate-400 text-base italic text-center py-8">Carregando histórico...</p>
        ) : internalAssessments.length === 0 ? (
          <p className="text-slate-400 text-base italic text-center py-8">Nenhuma avaliação registrada para este aluno.</p>
        ) : (
          <div className="space-y-4">
            {internalAssessments.map((a) => (
              <div key={a.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition">
                <div>
                  <span className="text-sm text-cyan-400 font-bold uppercase tracking-wider">{a.date}</span>
                  <div className="flex flex-wrap gap-6 mt-2 text-base text-slate-200">
                    <span><strong>Peso:</strong> {a.weight} kg</span>
                    <span><strong>BF:</strong> {a.bf ? `${a.bf}%` : '---'}</span>
                    <span><strong>Circ. Abdominal:</strong> {a.abdominal_perimeter ? `${a.abdominal_perimeter} cm` : '---'}</span>
                  </div>
                </div>

                {!isStudentView && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-slate-400 hover:text-rose-400 text-sm font-semibold p-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={18} /> Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pdf-area, #printable-pdf-area * {
            visibility: visible !important;
          }
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
            background-color: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 99999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* COMPONENTE EXCLUSIVO DO PDF */}
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
                  Personal Trainer: <span style={{ color: '#0f172a', textTransform: 'capitalize' }}>{personalProfile?.full_name || personalProfile?.name || 'maria joyce'}</span>
                  {personalProfile?.cref ? ` | CREF: ${personalProfile.cref}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#0f172a' }}>
                  <strong>Aluno:</strong> <span style={{ textTransform: 'uppercase', color: '#0891b2', fontWeight: '800' }}>{selectedStudent?.name || selectedStudent?.full_name || 'GABRIEL'}</span>
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
                  Data: {latestAssessment.date}
                </p>
              </div>
            </div>

            {/* CARDS DE RESUMO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #0891b2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Peso Corporal</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.weight} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #0891b2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Gordura (% BF)</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.bf || '---'}{latestAssessment.bf ? ' %' : ''}</p>
              </div>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #10b981', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Massa Magra</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.lean_mass || '---'} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #ef4444', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <p style={{ fontSize: '10px', color: '#0f172a', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Massa Gorda</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>{latestAssessment.fat_mass || '---'} <span style={{ fontSize: '10px' }}>kg</span></p>
              </div>
            </div>

            {/* MEDIDOR DE COMPOSIÇÃO */}
            <div style={{ marginBottom: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>Classificação de Composição Corporal (% BF)</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0891b2', textTransform: 'uppercase' }}>
                  {latestAssessment.bf ? (
                    latestAssessment.bf < 12 ? 'Excelente' :
                    latestAssessment.bf < 18 ? 'Bom' :
                    latestAssessment.bf < 24 ? 'Médio' : 'Ruim'
                  ) : 'Não Informado'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: '#10b981' }}></div>
                <div style={{ background: '#06b6d4' }}></div>
                <div style={{ background: '#f59e0b' }}></div>
                <div style={{ background: '#ef4444' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontSize: '8px', color: '#334155', marginTop: '3px', fontWeight: '800' }}>
                <span>EXCELENTE</span>
                <span>BOM</span>
                <span>MÉDIO</span>
                <span>RUIM</span>
              </div>
            </div>

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

            {/* TESTES FÍSICOS & QUALIFICAÇÃO */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', marginBottom: '5px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Testes Físicos & Qualificação de Desempenho</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                
                {/* Flexão de Braço */}
                {(() => {
                  const pushVal = latestAssessment?.push_ups ?? latestAssessment?.pushups ?? latestAssessment?.flexao ?? latestAssessment?.flexao_braco ?? latestAssessment?.push_ups_count ?? null;
                  const numVal = Number(pushVal);
                  const hasVal = pushVal !== null && pushVal !== undefined && pushVal !== '' && !isNaN(numVal);
                  return (
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <strong>Flexão de Braço:</strong>
                        <span>{hasVal ? `${numVal} rep` : '---'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Classificação:</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: !hasVal ? '#94a3b8' : numVal >= 25 ? '#10b981' : numVal >= 15 ? '#06b6d4' : numVal >= 8 ? '#f59e0b' : '#ef4444' }}>
                          {!hasVal ? '---' : numVal >= 25 ? 'EXCELENTE' : numVal >= 15 ? 'BOM' : numVal >= 8 ? 'MÉDIO' : 'RUIM'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Abdominais */}
                {(() => {
                  const sitVal = latestAssessment?.sit_ups ?? latestAssessment?.situps ?? latestAssessment?.abdominal_test ?? latestAssessment?.abdominais ?? latestAssessment?.abdominal ?? latestAssessment?.abs ?? latestAssessment?.abdominal_reps ?? latestAssessment?.sit_ups_count ?? null;
                  const numVal = Number(sitVal);
                  const hasVal = sitVal !== null && sitVal !== undefined && sitVal !== '' && !isNaN(numVal);
                  return (
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <strong>Abdominais (1 min):</strong>
                        <span>{hasVal ? `${numVal} rep` : '---'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Classificação:</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: !hasVal ? '#94a3b8' : numVal >= 35 ? '#10b981' : numVal >= 25 ? '#06b6d4' : numVal >= 15 ? '#f59e0b' : '#ef4444' }}>
                          {!hasVal ? '---' : numVal >= 35 ? 'EXCELENTE' : numVal >= 25 ? 'BOM' : numVal >= 15 ? 'MÉDIO' : 'RUIM'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Flexibilidade */}
                {(() => {
                  const flexVal = latestAssessment?.flexibility ?? latestAssessment?.wells ?? latestAssessment?.sit_and_reach ?? latestAssessment?.flexibilidade ?? latestAssessment?.wells_flexibility ?? latestAssessment?.flexibility_wells ?? latestAssessment?.banco_wells ?? latestAssessment?.flexibility_cm ?? latestAssessment?.senta_alcanca ?? null;
                  const numVal = Number(flexVal);
                  const hasVal = flexVal !== null && flexVal !== undefined && flexVal !== '' && !isNaN(numVal);
                  return (
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <strong>Flexibilidade (Wells):</strong>
                        <span>{hasVal ? `${numVal} cm` : '---'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Classificação:</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: !hasVal ? '#94a3b8' : numVal >= 34 ? '#10b981' : numVal >= 28 ? '#06b6d4' : numVal >= 20 ? '#f59e0b' : '#ef4444' }}>
                          {!hasVal ? '---' : numVal >= 34 ? 'EXCELENTE' : numVal >= 28 ? 'BOM' : numVal >= 20 ? 'MÉDIO' : 'RUIM'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* VO2 Máx */}
                {(() => {
                  const vo2Val = latestAssessment?.vo2_max ?? latestAssessment?.vo2max ?? latestAssessment?.vo2 ?? latestAssessment?.vo2_estimated ?? null;
                  const numVal = Number(vo2Val);
                  const hasVal = vo2Val !== null && vo2Val !== undefined && vo2Val !== '' && !isNaN(numVal);
                  return (
                    <div style={{ background: '#fafafa', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <strong>VO2 Máx Estimado:</strong>
                        <span>{hasVal ? `${numVal} ml/kg/min` : '---'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Classificação:</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: !hasVal ? '#94a3b8' : numVal >= 45 ? '#10b981' : numVal >= 38 ? '#06b6d4' : numVal >= 30 ? '#f59e0b' : '#ef4444' }}>
                          {!hasVal ? '---' : numVal >= 45 ? 'EXCELENTE' : numVal >= 38 ? 'BOM' : numVal >= 30 ? 'MÉDIO' : 'RUIM'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* OBSERVAÇÕES */}
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
          <p className="no-print">Nenhuma avaliação disponível para gerar o PDF do aluno.</p>
        )}
      </div>
    </div>
  );
}