import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const exercicios = [
  { name: 'Elevação de Joelhos com Puxada de Pernas', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_joelhos_com_puxada_de_pernas.gif' },
  { name: 'Inclinação Lateral com Barra', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/inclinacao_lateral_com_barra.gif' },
  { name: 'Tesoura deitada', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/tesoura_deitada.gif' },
  { name: 'Torção Sentada com Faixa de Resistência', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_sentada_com_faixa_de_resistencia.gif' },
  { name: 'Abdominal na Alavanca', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_na_alavanca.gif' },
  { name: 'Elevação Alternada de Pernas deitado no Chão', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_alternada_de_pernas_deitado_no_chao.gif' },
  { name: 'Meio Abdominal', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/meio_abdominal.gif' },
  { name: 'Toque de Calcanhar', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/toque_de_calcanhar.gif' },
  { name: 'Alpinista', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/alpinista.gif' },
  { name: 'Torção com Faixa Elástica de Resistência', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_com_faixa_elastica_de_resistencia.gif' },
  { name: 'Abdominal infra no solo com flexão de joelho', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_infra_no_solo_com_flexao_de_joelho.gif' },
  { name: 'Elevação de Joelhos na Barra Fixa', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_joelhos_na_barra_fixa.gif' },
  { name: 'Elevação de pernas em suspensión', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_pernas_em_suspension.gif' },
  { name: 'Tesoura de Pernas', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/tesoura_de_pernas.gif' },
  { name: 'Torção com Cabo Sentado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_com_cabo_sentado.gif' },
  { name: 'Abdominal Bicicleta', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_bicicleta.gif' },
  { name: 'Abdominal no Chão', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_no_chao.gif' },
  { name: 'Levantamento de quadril com pernas elevadas em banco inclinado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/levantamento_de_quadril_com_pernas_elevadas_em_banco_inclinado.gif' },
  { name: 'Máquina de Torção Sentada', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/maquina_de_torcao_sentada.gif' },
  { name: 'Prancha Frontal com Elevação de Braço e Perna', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_frontal_com_elevacao_de_braco_e_perna.gif' },
  { name: 'Rolamento com barra em pé', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/rolamento_com_barra_em_pe.gif' },
  { name: 'V-Up com Bola de Estabilidade', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/v-up_com_bola_de_estabilidade.gif' },
  { name: 'Dragon Flag', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/dragon_flag.gif' },
  { name: 'Exercício de vácuo abdominal em quatro apoios', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/exercicio_de_vacuo_abdominal_em_quatro_apoios.gif' },
  { name: 'Extensão com Roda Abdominal', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/extensao_com_roda_abdominal.gif' },
  { name: 'Prancha com Abertura de Pernas - Perna Estendida', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_com_abertura_de_pernas_-_perna_estendida.gif' },
  { name: 'Prancha de frente para a prancha lateral', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_de_frente_para_a_prancha_lateral.gif' },
  { name: 'Prancha Frontal com Elevação de Braço', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_frontal_com_elevacao_de_braco.gif' },
  { name: 'Torção com Tronco Inclinado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_com_tronco_inclinado.gif' },
  { name: 'Prancha com Elevação de Braço e Perna', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_com_elevacao_de_braco_e_perna.gif' },
  { name: 'Prancha com Movimento de Aranha', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_com_movimento_de_aranha.gif' },
  { name: 'Prancha Invertida', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_invertida.gif' },
  { name: 'Prancha joelho ao cotovelo', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_joelho_ao_cotovelo.gif' },
  { name: 'Prancha', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha.gif' },
  { name: 'V-Up', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/v-up.gif' },
  { name: 'Rolamento com barra', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/rolamento_com_barra.gif' },
  { name: 'Besouro Morto com as Mãos no Ar', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/besouro_morto_com_as_maos_no_ar.gif' },
  { name: 'Posição do Barco', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/posicao_do_barco.gif' },
  { name: 'Torção de Alto para Baixo com Cabo em Pé', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_de_alto_para_baixo_com_cabo_em_pe.gif' },
  { name: 'Abdominal com Elevação de Pernas', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_elevacao_de_pernas.gif' },
  { name: 'Abdominal com Peso', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_peso.gif' },
  { name: 'Elevação de Perna e Quadril deitado com Faixa Elástica', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_perna_e_quadril_deitado_com_faixa_elastica.gif' },
  { name: 'Elevação Lateral Alternada com Halteres', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_lateral_alternada_com_halteres.gif' },
  { name: 'Inseto Morto', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/inseto_morto.gif' },
  { name: 'Giro com Barra na Máquina Landmine', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/giro_com_barra_na_maquina_landmine.gif' },
  { name: 'Inclinação Lateral com Halteres', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/inclinacao_lateral_com_halteres.gif' },
  { name: 'Limpador de Para-Brisa na Barra Fixa', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/limpador_de_para-brisa_na_barra_fixa.gif' },
  { name: 'Torção em Pé com Cabo', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_em_pe_com_cabo.gif' },
  { name: 'Abdominal com Giro de Bicicleta', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_giro_de_bicicleta.gif' },
  { name: 'Elevação de Perna na Prancha', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_perna_na_prancha.gif' },
  { name: 'Elevação lateral de joelhos na Barra Fixa', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_lateral_de_joelhos_na_barra_fixa.gif' },
  { name: 'Inclinação Lateral com Peso em Bola de Estabilidade', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/inclinacao_lateral_com_peso_em_bola_de_estabilidade.gif' },
  { name: 'Elevação de Pernas', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_pernas.gif' },
  { name: 'Elevação em V com Halteres', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_em_v_com_halteres.gif' },
  { name: 'Máquina de Abdominais Sentado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/maquina_de_abdominais_sentado.gif' },
  { name: 'Puxada de Pernas Sentado em Banco', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/puxada_de_pernas_sentado_em_banco.gif' },
  { name: 'Abdução de quadril no apoio lateral', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abducao_de_quadril_no_apoio_lateral.gif' },
  { name: 'Elevação de Pernas na máquina', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_pernas_na_maquina.gif' },
  { name: 'Meio Giro', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/meio_giro.gif' },
  { name: 'Pés à Barra', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/pes_a_barra.gif' },
  { name: 'Chutes Alternados Sentados', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/chutes_alternados_sentados.gif' },
  { name: 'Encolhimento Abdominal em Pé com Cabo', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/encolhimento_abdominal_em_pe_com_cabo.gif' },
  { name: 'Toque nos Dedos dos Pés com Giro de Caranguejo', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/toque_nos_dedos_dos_pes_com_giro_de_caranguejo.gif' },
  { name: 'Abdominal Suspenso com Extensão', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_suspenso_com_extensao.gif' },
  { name: 'Prancha Frontal com Peso', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_frontal_com_peso.gif' },
  { name: 'Abdominal Rã', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_ra.gif' },
  { name: 'Chutes no Prancha Invertida', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/chutes_no_prancha_invertida.gif' },
  { name: 'Máquina Abdominal Coaster', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/maquina_abdominal_coaster.gif' },
  { name: 'Prancha lateral com flexão do quadril', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_lateral_com_flexao_do_quadril.gif' },
  { name: 'Prancha Lateral', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/prancha_lateral.gif' },
  { name: 'Abdominal com sobrecarga', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_sobrecarga.gif' },
  { name: 'Arremesso com Torção Russa da Bola com Parceiro', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/arremesso_com_torcao_russa_da_bola_com_parceiro.gif' },
  { name: 'Elevação de Perna na Prancha Lateral', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_de_perna_na_prancha_lateral.gif' },
  { name: 'Flexão de Tronco em T', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/flexao_de_tronco_em_t.gif' },
  { name: 'Abdominal Declinado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_declinado.gif' },
  { name: 'Abdominal lateral no banco inclinado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_lateral_no_banco_inclinado.gif' },
  { name: 'L-Sit', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/l-sit.gif' },
  { name: 'Posição de Canoinha', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/posicao_de_canoinha.gif' },
  { name: 'Torção com Barra Sentado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_com_barra_sentado.gif' },
  { name: 'Abdominal com joelhos dobrados com mãos na nuca', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_joelhos_dobrados_com_maos_na_nuca.gif' },
  { name: 'Abdominal com Bola Medicinal', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_bola_medicinal.gif' },
  { name: 'Elevação Alternada de Pernas', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/elevacao_alternada_de_pernas.gif' },
  { name: 'Abdominal Bicicleta com Gymstick', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_bicicleta_com_gymstick.gif' },
  { name: 'Abdominal com Braços Estendidos', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_bracos_estendidos.gif' },
  { name: 'Escalador Cruzado de Montanha', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/escalador_cruzado_de_montanha.gif' },
  { name: 'Abdominal com joelhos dobrados', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_com_joelhos_dobrados.gif' },
  { name: 'Abdominal de Rã com Bola de Exercícios', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_de_ra_com_bola_de_exercicios.gif' },
  { name: 'Sit-up', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/sit-up.gif' },
  { name: 'Abdominal Cruzado', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_cruzado.gif' },
  { name: 'Abdominal Nadador', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominal_nadador.gif' },
  { name: 'Torção russa', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/torcao_russa.gif' },
  { name: 'Encolhimento de Abdominais de Joelhos com Cabo', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/encolhimento_de_abdominais_de_joelhos_com_cabo.gif' },
  { name: 'Exercício Teaser', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/exercicio_teaser.gif' },
  { name: 'Abdominais', category: 'Abdominais', gif_url: 'https://lpzbvpatmurmslowviau.supabase.co/storage/v1/object/public/exercicios/GIFS_ACADEMIA/GIFS%20ABDOMINAIS/abdominais.gif' }
];

async function cadastrarAbdominais() {
  console.log('Iniciando atualização/cadastro de exercícios de Abdominais...');

  for (const item of exercicios) {
    // Procura se o exercício já existe
    const { data: existente } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', item.name)
      .maybeSingle();

    if (existente) {
      // Se existir, atualiza a categoria e a URL do GIF
      const { error } = await supabase
        .from('exercises')
        .update({ gif_url: item.gif_url, category: item.category })
        .eq('id', existente.id);

      if (error) {
        console.error(`🔴 Erro ao atualizar "${item.name}":`, error.message);
      } else {
        console.log(`🔵 Atualizado com sucesso: "${item.name}"`);
      }
    } else {
      // Se não existir, faz o cadastro novo
      const { error } = await supabase.from('exercises').insert([item]);

      if (error) {
        console.error(`🔴 Erro ao cadastrar "${item.name}":`, error.message);
      } else {
        console.log(`🟢 Cadastrado com sucesso: "${item.name}"`);
      }
    }
  }

  console.log('--- Processo concluído! ---');
}

cadastrarAbdominais();