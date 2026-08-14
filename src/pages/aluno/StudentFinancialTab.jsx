import React from 'react';

const Icone = ({ nome, className = "w-5 h-5" }) => {
  const icones = {
    Check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    Alert: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icones[nome]}
    </svg>
  );
};

export default function StudentFinancialTab({ financialRecords = [], hasPendingPayment, totalPendingAmount }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Minhas Mensalidades</h2>
        <p className="text-xs text-slate-400 mt-1">
          Confira o status de pagamento e o histórico financeiro das suas mensalidades.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Status Geral
          </span>
          <div className="flex items-center gap-2">
            <Icone 
              nome={hasPendingPayment ? 'Alert' : 'Check'} 
              className={`w-5 h-5 ${hasPendingPayment ? 'text-rose-400' : 'text-emerald-400'}`} 
            />
            <p className={`text-lg font-black ${hasPendingPayment ? 'text-rose-400' : 'text-emerald-400'}`}>
              {hasPendingPayment ? 'Em Atraso' : 'Em Dia'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Pendências Totais
          </span>
          <p className="text-lg font-black text-amber-400">
            R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Histórico de Cobranças */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Histórico de Cobranças</h3>
        </div>

        {financialRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhuma cobrança registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {financialRecords.map((record) => {
                  const isPending = record.status === 'pending' || record.status === 'atrasado';
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-semibold text-white">
                        {record.notes || record.description || 'Mensalidade'}
                      </td>
                      <td className="p-4 text-slate-300">
                        {record.due_date
                          ? new Date(`${record.due_date}T00:00:00`).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="p-4 font-bold text-emerald-400">
                        R$ {Number(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                            isPending
                              ? 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                              : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {isPending ? 'Atrasado' : 'Pago'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}