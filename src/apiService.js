// src/services/apiService.js
import { supabase } from './supabaseClient';

// --- MÓDULO DE ALUNOS ---
export async function getStudents() {
  const { data, error } = await supabase.from('students').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function saveStudent(studentData) {
  const { data, error } = await supabase.from('students').upsert(studentData).select();
  if (error) throw error;
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

// --- MÓDULO DE AVALIAÇÕES FÍSICAS ---
export async function getAssessments(studentId = null) {
  let query = supabase.from('assessments').select('*').order('date', { ascending: false });
  if (studentId) query = query.eq('student_id', studentId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function saveAssessment(assessmentPayload) {
  const { data, error } = await supabase.from('assessments').insert([assessmentPayload]).select();
  if (error) throw error;
  return data;
}

export async function deleteAssessment(id) {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw error;
}

// --- MÓDULO DE EXERCÍCIOS ---
export async function getExercises() {
  const { data, error } = await supabase.from('exercises').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function saveExercise(exerciseData) {
  const { data, error } = await supabase.from('exercises').insert([exerciseData]).select();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id) {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}