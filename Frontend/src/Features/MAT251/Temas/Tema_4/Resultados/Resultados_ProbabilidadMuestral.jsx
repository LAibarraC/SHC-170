import React from 'react';
import { cardStyle, FS, RADIUS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';

export default function Resultados_ProbabilidadMuestral({ resultados }) {
    if (!resultados || resultados.probFinal === undefined) return null;

    const tieneProbabilidad = true;

    return (
        <div style={{ ...cardStyle, background: 'var(--bg-card)', height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '0 0 15px 0' }}>
                Resultados y Desarrollo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tieneProbabilidad && (
                    <>
                        <div style={{ background: 'var(--header-bg, #f3f4f6)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: FS.sm }}>Estandarización Z y Probabilidad</div>
                            <div className="thin-scrollbar" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                                <Latex formula={resultados.strDesarrollo} />
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', background: 'var(--header-bg, #f3f4f6)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <div style={{ marginBottom: '10px', color: 'var(--text-muted)', fontSize: FS.sm }}>PROBABILIDAD FINAL</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {(resultados.probFinal * 100).toFixed(2)}%
                            </div>
                            <div style={{ fontSize: FS.sm, color: 'var(--text-muted)', marginTop: '5px' }}>
                                ( {resultados.probFinal.toFixed(4)} )
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
