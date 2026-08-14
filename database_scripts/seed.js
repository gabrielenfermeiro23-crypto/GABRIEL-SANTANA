import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante o carregamento do arquivo .env da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncExercises() {
  const dataDir = path.resolve(__dirname, 'data');

  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Diretório de dados não encontrado em: ${dataDir}`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    console.log("⚠️ Nenhum arquivo .json encontrado na pasta database_scripts/data/");
    return;
  }

  console.log(`🚀 Sincronizando exercícios (${files.length} arquivos JSON encontrados)...`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const exercises = JSON.parse(content);

    console.log(`\n📄 Processando: ${file} (${exercises.length} exercícios)`);

    // Atualiza ou insere (upsert) na tabela 'exercises'
const { data, error } = await supabase
  .from('exercises') 
  .upsert(exercises, { onConflict: 'name' });

    if (error) {
      console.error(`❌ Erro ao enviar ${file}:`, error.message);
    } else {
      console.log(`✅ Sucesso! Exercícios de ${file} cadastrados/atualizados.`);
    }
  }

  console.log("\n🎉 Processo concluído!");
}

syncExercises();