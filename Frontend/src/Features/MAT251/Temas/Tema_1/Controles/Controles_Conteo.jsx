import React from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';

import { IconoCalculadora, IconoAlerta } from '../../../../../ui/iconos';

export default function ControlesConteo({ 
    n, setN, r, setR, ajustar, ejecutar, 
    customElementsInput, setCustomElementsInput, parsedElements,
    tipoElementos, setTipoElementos
}) {
    return (
        <>
            <div style={{ ...cardStyle, marginBottom: '15px' }}>
                <label style={{ ...labelStyle }}>Valores:</label>
                {[{ label: 'Total (n):', val: n, setVal: setN }, { label: 'Muestra (r):', val: r, setVal: setR }].map(({ label, val, setVal }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                        <label style={{ fontSize: FS.sm, fontFamily: FONT, width: '85px', flexShrink: 0, margin: 0 }}>{label}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <button className="btn-icon" onClick={() => ajustar(setVal, val, '-')} style={{ width: '32px', padding: '4px', borderRadius: RADIUS, fontSize: FS.md }}>−</button>
                            <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="container_cal_input" style={{ textAlign: 'center', flex: 1, borderRadius: RADIUS, fontSize: FS.base }} />
                            <button className="btn-icon" onClick={() => ajustar(setVal, val, '+')} style={{ width: '32px', padding: '4px', borderRadius: RADIUS, fontSize: FS.md }}>+</button>
                        </div>
                    </div>
                ))}

                <div style={{ marginTop: '15px' }}>
                    <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tipo de Elementos:</label>
                    <select 
                        value={tipoElementos} 
                        onChange={(e) => setTipoElementos(e.target.value)} 
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: RADIUS, 
                            fontSize: FS.sm, 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: 'var(--bg-input)', 
                            color: 'var(--text-main)', 
                            outline: 'none',
                            marginBottom: '10px'
                        }}
                    >
                        <option value="letras">A, B, C...</option>
                        <option value="numeros">1, 2, 3...</option>
                        <option value="personalizado">Elementos personalizados</option>
                    </select>

                    {tipoElementos === 'personalizado' && (
                        <>
                            <input 
                                type="text" 
                                value={customElementsInput} 
                                onChange={(e) => setCustomElementsInput(e.target.value)} 
                                placeholder="Ej. perro, gato, loro"
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    borderRadius: RADIUS, 
                                    fontSize: FS.sm, 
                                    border: '1px solid var(--border-color)', 
                                    backgroundColor: 'var(--bg-input)', 
                                    color: 'var(--text-main)', 
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }} 
                            />
                            {customElementsInput.trim() && parsedElements.length !== (parseInt(n) || 0) && (
                                <div style={{ color: '#d97706', fontSize: '0.75rem', marginTop: '6px', fontWeight: 500, lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <IconoAlerta width="14" height="14" style={{ flexShrink: 0 }} />
                                    <span>Ingresaste {parsedElements.length} elementos para un total n = {n}. Se autocompletará o truncará al calcular.</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <button onClick={ejecutar} className="button_calcular btn-icon" style={{ width: 'fit-content', alignSelf: 'center', padding: '6px 20px', borderRadius: RADIUS, fontSize: FS.md, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconoCalculadora />
                CALCULAR
            </button>
        </>
    )
}