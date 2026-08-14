import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 1. URL do projeto
const SUPABASE_URL = 'https://lpzbvpatmurmslowviau.supabase.co';

// 2. Sua chave service_role aplicada
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwemJ2cGF0bXVybXNsb3d2aWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ2MTYzNywiZXhwIjoyMTAyMDM3NjM3fQ.KAiRVukHmx3GqUNM3p15StLpfwlnebDeXparN7l1yMc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASTA_GIFS_LOCAL = 'C:\\Users\\Gabriel\\Downloads\\GIFS ACADEMIA-20260812T184633Z-1-001\\GIFS ACADEMIA';
const BUCKET_NAME = 'exercicios';

function limparNome(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s._-]/g, '')
    .trim();
}

async function iniciarUpload() {
  console.log('🚀 Iniciando upload automático dos GIFs para o Supabase...\n');

  if (!fs.existsSync(PASTA_GIFS_LOCAL)) {
    console.error(`❌ Pasta não encontrada em: ${PASTA_GIFS_LOCAL}`);
    return;
  }

  try {
    const categorias = fs.readdirSync(PASTA_GIFS_LOCAL);
    let totalEnviados = 0;
    let totalErros = 0;

    for (const categoria of categorias) {
      const caminhoCategoria = path.join(PASTA_GIFS_LOCAL, categoria);

      if (fs.statSync(caminhoCategoria).isDirectory()) {
        const arquivos = fs.readdirSync(caminhoCategoria);
        console.log(`\n📁 Processando categoria: [${categoria}] (${arquivos.length} arquivos)`);

        for (const arquivo of arquivos) {
          if (arquivo.toLowerCase().endsWith('.gif')) {
            const caminhoArquivoLocal = path.join(caminhoCategoria, arquivo);
            const conteudoArquivo = fs.readFileSync(caminhoArquivoLocal);

            const arquivoLimpo = limparNome(arquivo);
            const categoriaLimpa = limparNome(categoria);
            const caminhoNoStorage = `GIFS_ACADEMIA/${categoriaLimpa}/${arquivoLimpo}`;

            const { error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(caminhoNoStorage, conteudoArquivo, {
                contentType: 'image/gif',
                upsert: true
              });

            if (uploadError) {
              console.error(`   ❌ Erro no upload de [${arquivo}]:`, uploadError.message);
              totalErros++;
            } else {
              const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(caminhoNoStorage);

              const gifPublicUrl = publicUrlData.publicUrl;

              const nomeExercicio = arquivo
                .replace(/\.gif$/i, '')
                .replace(/\(\d+\)/g, '')
                .trim();

              const { error: dbError } = await supabase
                .from('exercises')
                .update({ gif_url: gifPublicUrl })
                .ilike('name', `%${nomeExercicio}%`);

              if (dbError) {
                console.log(`   ⚠️ GIF enviado, mas erro ao vincular no banco para "${nomeExercicio}":`, dbError.message);
              } else {
                console.log(`   ✅ Enviado e vinculado: ${arquivoLimpo}`);
              }

              totalEnviados++;
            }
          }
        }
      }
    }

    console.log('\n========================================');
    console.log(`🎉 Processo finalizado!`);
    console.log(`📊 GIFs enviados com sucesso: ${totalEnviados}`);
    if (totalErros > 0) console.log(`⚠️ Falhas no upload: ${totalErros}`);
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Ocorreu um erro inesperado:', err.message);
  }
}

iniciarUpload();