import React from 'react';

export default function LogsTab({ logs = [], theme }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl space-y-6">
      <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-4">
        Histórico de Cargas e Execução dos Treinos
      </h2>

      {logs.length === 0 ? (
        <p className="text-zinc-400 text-sm py-4">Nenhum registro de carga cadastrado até o momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                <span className="font-bold text-cyan-400">{log.student_name}</span>
                <span className="text-xs text-zinc-500">{log.date}</span>
              </div>
              <p className="text-sm text-zinc-300">Exercício: <strong className="text-white">{log.exercise_name}</strong></p>
              <div className="flex gap-4 text-xs text-zinc-400">
                <span>Carga: <strong className="text-cyan-400">{log.weight} kg</strong></span>
                <span>Reps: <strong className="text-white">{log.reps}</strong></span>
              </div>
              {log.notes && <p className="text-xs italic text-zinc-500">"{log.notes}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}