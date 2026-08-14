import React from 'react';

export default function MetricsCards({ metrics, theme }) {
  // Garantia de fallback para métricas e conversão segura para números
  const totalStudents = metrics?.totalStudents ?? 0;
  const activeStudents = metrics?.activeStudents ?? 0;
  const pendingPayments = Number(metrics?.pendingPayments ?? 0);
  const monthlyRevenue = Number(metrics?.monthlyRevenue ?? 0);

  const cards = [
    { title: 'Total de Alunos', value: totalStudents, icon: '👥' },
    { title: 'Alunos Ativos', value: activeStudents, icon: '⚡' },
    { title: 'Pendências Financeiras', value: `R$ ${pendingPayments.toFixed(2)}`, icon: '⚠️' },
    { title: 'Faturamento Mensal', value: `R$ ${monthlyRevenue.toFixed(2)}`, icon: '💰' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {cards.map((card, index) => (
        <div 
          key={index} 
          style={{ 
            backgroundColor: theme?.bgCard || '#141414', 
            border: `1px solid ${theme?.border || '#262626'}`, 
            padding: 16, 
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: theme?.textoSecundario || '#a1a1aa' }}>{card.title}</span>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
          </div>
          <strong style={{ fontSize: 22, color: '#fff' }}>{card.value}</strong>
        </div>
      ))}
    </div>
  );
}