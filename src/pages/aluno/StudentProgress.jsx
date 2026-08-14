import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, TrendingUp, TrendingDown, Minus, Award, Calendar, Weight, Ruler } from 'lucide-react';

export default function StudentProgress({ studentId: propStudentId }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [propStudentId]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // 1. Define o ID do aluno (prop ou usuário logado no Auth)
      let targetStudentId = propStudentId;

      if (!targetStudentId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetStudentId = user?.id;
      }

      if (!targetStudentId) {
        setLoading(false);
        return;
      }

      // 2. Busca o histórico de avaliações no Supabase
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (err) {
      console.error('Erro ao carregar progresso do aluno:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const latest = assessments[0];
  const previous = assessments[1];

  // Função auxiliar para renderizar a diferença entre métricas
  const renderDiff = (current, prev, unit = '') => {
    if (current === undefined || current === null || prev === undefined || prev === null) return null;
    const diff = (parseFloat(current) - parseFloat(prev)).toFixed(1);
    if (diff > 0) {
      return (
        <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
          <TrendingUp size={14} />+{diff}{unit}
        </span>
      );
    } 
    if (diff < 0) {
      return (
        <span className="text-cyan-400 text-xs font-bold flex items-center gap-0.5">
          <TrendingDown size={14} />{diff}{unit}
        </span>
      );
    }
    return (
      <span className="text-slate-500 text-xs font-bold flex items-center gap-0.5">
        <Minus size={14} />0{unit}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-slate-400 gap-2">
        <Activity className="animate-spin text-cyan-400" /> 
        <span>Carregando sua evolução...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-cyan-400" />
          Minha Evolução Física
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Acompanhe seu progresso registrado pelo seu Personal Trainer.
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Award size={48} className="mx-auto text-slate-600" />
          <p className="font-semibold text-base text-slate-300">Nenhuma avaliação cadastrada ainda.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Assim que seu Personal Trainer realizar e registrar sua primeira avaliação física, os dados aparecerão aqui!
          </p>
        </div>
      ) : (
        <>
          {/* CARDS COM MÉTRICAS ATUAIS & COMPARAÇÃO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* CARD PESO */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Peso Atual</span>
                <Weight size={18} className="text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white">{latest?.weight ? `${latest.weight} kg` : '---'}</p>
              {previous && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  {renderDiff(latest?.weight, previous?.weight, 'kg')}
                </div>
              )}
            </div>

            {/* CARD BF (% GORDURA) */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">% Gordura (BF)</span>
                <Activity size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {(latest?.bf ?? latest?.body_fat) ? `${latest.bf ?? latest.body_fat}%` : '---'}
              </p>
              {previous && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  {renderDiff(latest?.bf ?? latest?.body_fat, previous?.bf ?? previous?.body_fat, '%')}
                </div>
              )}
            </div>

            {/* CARD MASSA MAGRA */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Massa Magra</span>
                <Award size={18} className="text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {(latest?.lean_mass ?? latest?.muscle_mass) ? `${latest.lean_mass ?? latest.muscle_mass} kg` : '---'}
              </p>
              {previous && (
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  {renderDiff(latest?.lean_mass ?? latest?.muscle_mass, previous?.lean_mass ?? previous?.muscle_mass, 'kg')}
                </div>
              )}
            </div>

            {/* CARD IMC */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">IMC</span>
                <Ruler size={18} className="text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white">{latest?.imc || '---'}</p>
              <span className="text-[10px] text-slate-500 block mt-1">Índice de Massa Corporal</span>
            </div>
          </div>

          {/* TABELA DE HISTÓRICO DAS AVALIAÇÕES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-cyan-400" /> Histórico de Avaliações
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase">
                    <th className="py-3 px-2">Data</th>
                    <th className="py-3 px-2">Peso</th>
                    <th className="py-3 px-2">% BF</th>
                    <th className="py-3 px-2">Massa Magra</th>
                    <th className="py-3 px-2">Cintura</th>
                    <th className="py-3 px-2">Quadril</th>
                    <th className="py-3 px-2">Braço Dir.</th>
                    <th className="py-3 px-2">IMC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {assessments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3.5 px-2 font-bold text-cyan-400">{item.date || '---'}</td>
                      <td className="py-3.5 px-2 font-bold text-white">{item.weight ? `${item.weight} kg` : '---'}</td>
                      <td className="py-3.5 px-2 font-semibold text-emerald-400">
                        {(item.bf ?? item.body_fat) ? `${item.bf ?? item.body_fat}%` : '---'}
                      </td>
                      <td className="py-3.5 px-2 font-semibold text-blue-400">
                        {(item.lean_mass ?? item.muscle_mass) ? `${item.lean_mass ?? item.muscle_mass} kg` : '---'}
                      </td>
                      <td className="py-3.5 px-2">{item.waist ? `${item.waist} cm` : '---'}</td>
                      <td className="py-3.5 px-2">{item.hip ? `${item.hip} cm` : '---'}</td>
                      <td className="py-3.5 px-2">{(item.arm_right ?? item.arm) ? `${item.arm_right ?? item.arm} cm` : '---'}</td>
                      <td className="py-3.5 px-2 font-mono text-purple-300">{item.imc || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {latest?.notes && (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-cyan-400 uppercase mb-1">Última Observação do Personal:</p>
                <p className="text-xs text-slate-300 italic">{latest.notes}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}