import React from 'react';
import katex from 'katex';

// v2 — Tema 2 habilitado
export const FONT = 'system-ui, -apple-system, sans-serif';
export const FS = { xs: '0.75rem', sm: '0.85rem', sx: '0.75rem', base: '0.95rem', md: '1rem', lg: '1.1rem' };
export const RADIUS = '5px';

export const OPERACIONES = [
  {
    tema: 'Tema 1',
    titulo: 'Cálculo de probabilidades e introducción al muestreo',
    operaciones: [
      { value: 'conteo', label: 'Técnicas de Conteo' },
      { value: 'probabilidad', label: 'Cálculo de Probabilidad' },
      { value: 'simulador_total', label: 'Teorema de Probabilidad Total' },
      { value: 'regla_adicion', label: 'Axiomas y Regla de la Adición' },
      { value: 'regla_multiplicacion', label: 'Regla de la Multiplicación' },
    ],
  },
  {
    tema: 'Tema 2',
    titulo: 'Variables aleatorias',
    operaciones: [
      { value: 'dist_discreta', label: 'Variables Aleatorias Discretas' },
      { value: 'dist_continua_v2', label: 'Variable Aleatoria Continua' },
    ],
  },
  {
    tema: 'Tema 3',
    titulo: 'Distribuciones discretas y continuas importantes',
    operaciones: [
      { value: 'modelos_discretos', label: 'Distribuciones Discretas' },
      { value: 'modelos_continuos', label: 'Distribuciones Continuas' }
    ],
  },
  {
    tema: 'Tema 4',
    titulo: 'Distribuciones en el muestreo estadístico',
    operaciones: [
      { value: 'distribuciones_muestrales', label: 'Distribuciones Muestrales' }
    ],
  },
  {
    tema: 'Tema 5',
    titulo: 'Pruebas de hipótesis paramétricas y no paramétricas',
    operaciones: [],
  },
  {
    tema: 'Tema 6',
    titulo: 'Estimación e inferencia estadística',
    operaciones: [],
  },
];

export const filaVacia = (id) => ({ id, valor: '', origen: 'agregado' });

export const cardStyle = { padding: '10px', border: '1px solid var(--border-color)', borderRadius: RADIUS, backgroundColor: 'var(--bg-card)', fontFamily: FONT };
export const labelStyle = { fontSize: FS.sm, fontWeight: 600, fontFamily: FONT, display: 'block', marginBottom: '4px', color: 'var(--primary-color)' };
export const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
export const modalBoxStyle = { background: 'var(--bg-card)', borderRadius: RADIUS, padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: FONT };