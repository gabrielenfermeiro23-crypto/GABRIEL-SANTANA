import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lpzbvpatmurmslowviau.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C6JkEkXUun53gwdBipx69Q_aRzbh6rx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const exerciciosFuncional = [
  "Tríceps Testa com Faixa Elástica",
  "Extensão de Tríceps Acima da Cabeça com Gymstick",
  "Extensão De Perna Reta",
  "Elevação de Panturrilha em Uma Perna",
  "Flexão de Braço no Bosu",
  "Saltos com Joelhos Altos",
  "Flexão de Braço com Uma Perna",
  "Saltos em tesoura",
  "Elevação Pélvica Declinado",
  "Rosca martelo com faixa de resistência",
  "Flexão com Rotação",
  "Elevação com Giro do Cotovelo Oposto para o Joelho",
  "Stiff com Elástico de Resistência",
  "Elevação de Perna Única com Equilíbrio e Rosca de Biceps",
  "Mergulho reverso",
  "Extensão de tríceps com elástico na posição horizontal",
  "Corrida com Elevação dos Joelhos",
  "Corda de batalha",
  "Escalador de Montanha",
  "Elevação de Panturrilha com Faixa Elástica de Resistência",
  "Andar de Bicicleta ao Ar Livre",
  "Elevação da Perna em Pé com Faixa Elástica de Resistência",
  "Passo Invertido com Elevação do Joelho",
  "Salto para Caixa 2 para 1",
  "Saltos Pliométricos em Zigue-Zague",
  "Swimming",
  "Extensão De Glúteo Em Pé",
  "Flexão de Braço com Bola de Estabilidade",
  "Minhoca",
  "Extensão de Tríceps com Faixa Elástica",
  "Flexão cobra",
  "Superman",
  "Inclinação Pélvica",
  "Glúteo Coice com Pernas Flexionada com Faixa",
  "Hiperextensão Reversa com Faixa de Resistência",
  "Extensão de Quadril no Banco",
  "Rastejo de Urso",
  "Wall Sit com Inclinação de Tronco",
  "Glúteo Coice com Gymstick",
  "Nave Seal Burpee",
  "Flexão de Pernas com Faixa Elástica",
  "Rosca de bíceps unilateral com faixa de resistência",
  "Corrida Estacionária",
  "Puxar com Faixa Elástica",
  "Glúteo Coice em Pé com Faixa Elástica",
  "Extensão de Tríceps com Faixas Elásticas",
  "Ponte de Glúteos",
  "Salto em Agachamento com Joelhos Flexionados",
  "Corrida com Salto",
  "Extensão de Pernas com Faixa Elástica Sentado",
  "Elevação lateral de braços",
  "Step com elástico",
  "Crucifixo invertido com gymstick para deltoides posterior",
  "Elevação Lateral de Perna com Faixa Elástica Deitado de Lado",
  "Rolamento na bola suíça",
  "Flexão de Perna com Halteres em Decúbito Dorsal",
  "Lançamento de Bola Medicinal deitado",
  "Remada sentada com faixa",
  "Tesoura de Braços",
  "Boxe Sombra",
  "Salto com Joelhos Flexionados",
  "Passo de Esqui",
  "Socos",
  "Soco direto de direita",
  "Avanço com Joelho Elevado em Caminhada",
  "Subida no Step com Elevação de Joelhos",
  "Salto em Distância",
  "Salto em Uma Perna para a Frente",
  "Snap Jumps",
  "Caminhada Rápida",
  "Remada com banda de resistência curvada para deltoides posterior",
  "Tríceps Francês com Faixa Elástica Acima da Cabeça",
  "Tríceps Francês em Pé com Gymstick"
];

function normalizarParaStorage(nome) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();
}

async function cadastrarFuncional() {
  console.log(`🚀 Processando ${exerciciosFuncional.length} exercícios de Treinamento Funcional...\n`);

  let atualizados = 0;
  let inseridos = 0;

  for (const nome of exerciciosFuncional) {
    const nomeLimpoStorage = normalizarParaStorage(nome);
    const gifUrl = `${SUPABASE_URL}/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20TREINAMENTO%20FUNCIONAL/${nomeLimpoStorage}.gif`;

    // Procura se o exercício já existe no banco
    const { data: existente } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', nome)
      .maybeSingle();

    if (existente) {
      // Se existir, atualiza gif_url e category
      const { error } = await supabase
        .from('exercises')
        .update({
          category: 'Funcional',
          gif_url: gifUrl
        })
        .eq('id', existente.id);

      if (error) {
        console.error(`🔴 Erro ao atualizar "${nome}":`, error.message);
      } else {
        console.log(`🔵 Atualizado: "${nome}"`);
        atualizados++;
      }
    } else {
      // Se não existir, cadastra novo
      const { error } = await supabase
        .from('exercises')
        .insert([{
          name: nome,
          category: 'Funcional',
          gif_url: gifUrl
        }]);

      if (error) {
        console.error(`🔴 Erro ao cadastrar "${nome}":`, error.message);
      } else {
        console.log(`🟢 Cadastrado: "${nome}"`);
        inseridos++;
      }
    }
  }

  console.log(`\n🎉 Processo concluído!`);
  console.log(`   - Novost cadastrados: ${inseridos}`);
  console.log(`   - Atualizados: ${atualizados}`);
}

cadastrarFuncional();