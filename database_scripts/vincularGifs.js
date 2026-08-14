import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lpzbvpatmurmslowviau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwemJ2cGF0bXVybXNsb3d2aWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjE2MzcsImV4cCI6MjEwMjAzNzYzN30.K-azw09GCdf3zZudV_fbbCS0EgxFhV_dQfzjR9vLiOk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para remover acentos, símbolos e maiúsculas
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '');     // Remove espaços e caracteres especiais
}

async function vincularGifsGerais() {
  console.log('🔍 Buscando GIFs no Storage...');

  // 1. Busca os arquivos do bucket (limit ajustado para pegar todas as subpastas)
  const { data: arquivos, error: errStorage } = await supabase.storage
    .from('exercicios')
    .list('GIFS_ACADEMIA', { limit: 10000, recursive: true });

  if (errStorage) {
    console.error('❌ Erro ao acessar Storage:', errStorage.message);
    return;
  }

  console.log(`📦 Encontrados ${arquivos.length} arquivos no Storage.`);
  console.log('📋 Buscando exercícios no banco de dados...');

  // 2. Busca os exercícios cadastrados
  const { data: exercicios, error: errDb } = await supabase
    .from('exercises')
    .select('id, name, gif_url');

  if (errDb) {
    console.error('❌ Erro ao acessar Banco:', errDb.message);
    return;
  }

  console.log(`🏋️‍♂️ Encontrados ${exercicios.length} exercícios no Banco.\n`);

  let vinculados = 0;

  // 3. Compara e atualiza os links
  for (const ex of exercicios) {
    const nomeExNormalizado = normalizar(ex.name);

    const arquivoEncontrado = arquivos.find((file) => {
      // Ignora registros de diretórios/pastas
      if (!file.name || file.name.endsWith('/')) return false;

      const nomeArquivoNormalizado = normalizar(file.name);
      return (
        nomeArquivoNormalizado.includes(nomeExNormalizado) ||
        (nomeExNormalizado.length > 3 && nomeArquivoNormalizado.includes(nomeExNormalizado.substring(0, 6)))
      );
    });

    if (arquivoEncontrado) {
      // Ajuste no caminho para garantir subpastas como 'GIFS ABDOMINAIS/...'
      const caminhoNoStorage = arquivoEncontrado.name.startsWith('GIFS_ACADEMIA/')
        ? arquivoEncontrado.name
        : `GIFS_ACADEMIA/${arquivoEncontrado.name}`;

      const { data: urlPublica } = supabase.storage
        .from('exercicios')
        .getPublicUrl(caminhoNoStorage);

      const { error: updateErr } = await supabase
        .from('exercises')
        .update({ gif_url: urlPublica.publicUrl })
        .eq('id', ex.id);

      if (updateErr) {
        console.error(`⚠️ Erro ao atualizar ${ex.name}:`, updateErr.message);
      } else {
        console.log(`✅ Vinculado: "${ex.name}" ➔ ${arquivoEncontrado.name}`);
        vinculados++;
      }
    } else {
      console.log(`❌ GIF não encontrado no Storage para: "${ex.name}"`);
    }
  }

  console.log(`\n🎉 Processo finalizado! ${vinculados} exercícios foram atualizados.`);
}

vincularGifsGerais();