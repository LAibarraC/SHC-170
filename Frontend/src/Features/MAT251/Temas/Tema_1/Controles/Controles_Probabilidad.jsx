import React from 'react';
import {FONT, FS, RADIUS, labelStyle } from '../../../Principal/Constantes';

export default function ControlesProbabilidad({ variables, varSeleccionada, setVarSeleccionada, cargarVariable, deseleccionarVariable }) {

    const handleSeleccionar = (variable) => {
        if (varSeleccionada && varSeleccionada.nombre === variable.nombre) {
            if (deseleccionarVariable) {
                deseleccionarVariable();
            } else if (setVarSeleccionada) {
                setVarSeleccionada(null);
            }
        } else {
            if (cargarVariable) {
                cargarVariable(variable);
            } else if (setVarSeleccionada) {
                setVarSeleccionada(variable);
            }
        }
    };

    return (
        <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .caja-variable-tema {
                    border: 1px solid var(--primary-color);
                }
                .caja-variable-tema-header {
                    background: var(--primary-color);
                }
                [data-theme='dark'] .caja-variable-tema, .dark .caja-variable-tema, [data-bs-theme='dark'] .caja-variable-tema {
                    border-color: #ff6e00 !important;
                }
                [data-theme='dark'] .caja-variable-tema-header, .dark .caja-variable-tema-header, [data-bs-theme='dark'] .caja-variable-tema-header {
                    background: #ff6e00 !important;
                }
            `}</style>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: RADIUS, padding: '10px', background: 'var(--bg-card)', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: FS.sm, fontWeight: 600 }}>Selecciona una Variable:</h4>
                {variables && variables.filter(v => v.datos && v.datos.length > 0).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', marginBottom: '5px' }}>
                        {variables.filter(v => v.datos && v.datos.length > 0).map((v, i) => {
                            const isSelected = varSeleccionada && varSeleccionada.nombre === v.nombre;
                            return (
                                <div key={i} onClick={() => handleSeleccionar(v)}
                                    style={{ 
                                        padding: '8px 12px', borderRadius: RADIUS, cursor: 'pointer', 
                                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-body)', 
                                        transition: 'all 0.2s',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: FS.sm, color: isSelected ? 'var(--primary-color)' : 'inherit' }}>{v.nombre}</strong>
                                        <div style={{ fontSize: FS.xs, color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {v.datos?.length || 0} datos
                                        </div>
                                    </div>
                                    {v.nombresColumnas && v.nombresColumnas.length > 0 && (
                                        <div style={{ fontSize: '0.70rem', color: isSelected ? 'var(--primary-color)' : 'var(--text-muted)', textAlign: 'right', fontWeight: isSelected ? 600 : 400, opacity: 0.8 }}>
                                            Columnas: {v.nombresColumnas.length}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: FS.sm, margin: '10px 0' }}>No hay variables disponibles con datos.</p>
                )}
            </div>

        </div>
    )
}
