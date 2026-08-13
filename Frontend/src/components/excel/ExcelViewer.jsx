import { useState, useEffect } from "react";
// IMPORTAMOS EL MODAL (Ajusta la ruta si está en otra carpeta)
import Modal from "../../utils/Modal";

import "../../styles/components/excel/ExcelViewer.css";

export default function ExcelViewer({ files, onSelect, onDelete, onDownload, rol, esPersonal }) {

  // --- ESTADOS PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // --- ESTADOS PARA BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Cantidad de archivos por página (Cámbialo si deseas)

  // 1. Filtrar archivos según la búsqueda
  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Calcular la paginación
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  // 3. Manejador del buscador
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Si el usuario busca algo, reiniciamos a la primera página
  };

  // 4. Efecto de seguridad por si al eliminar el último archivo de una página, esta se queda vacía
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredFiles.length, currentPage, totalPages]);

  // --- MANEJADORES DE ELIMINACIÓN ---
  const handleDeleteArchivo = (filename) => {
    setFileToDelete(filename);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onDelete(fileToDelete);
    }
    setIsModalOpen(false);
    setFileToDelete(null);
  };

  return (
    <div>
      {/* CABECERA MODERNA */}
      <div className="container_Viewer" style={{ marginBottom: "15px" }}>
        <h4>Archivos Disponibles</h4>
        <span>
          {files.length} {files.length === 1 ? 'archivo total' : 'archivos totales'}
        </span>
      </div>

      {/* BUSCADOR (Solo se muestra si hay archivos cargados) */}
      {files.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Buscar archivo por nombre..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #d1d5db)",
              backgroundColor: "var(--bg-input, #fff)",
              color: "var(--text-main, #333)",
              outline: "none",
              fontSize: "0.95rem"
            }}
          />
        </div>
      )}

      {/* ESTADOS DE LA LISTA */}
      {files.length === 0 ? (
        <div className="container_Viewer_vacio">
          <p>No hay archivos en el servidor.</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="container_Viewer_vacio">
          <p>No se encontraron archivos que coincidan con "{searchTerm}".</p>
        </div>
      ) : (
        <>
          {/* LISTA DE ARCHIVOS PAGINADA */}
          <ul className="container_lista">
            {currentFiles.map((f, index) => (
              <li
                key={index}
                className="container_lista_li"
                onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)"}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"}
              >
                {/* IZQUIERDA: Nombre del archivo */}
                <div className="container_name_file">
                  <p>{f.filename}</p>
                </div>

                {/* DERECHA: Botones de acción */}
                <div className="container_button">
                  <button
                    onClick={() => onSelect(f.filename)}
                    className="container_button_1"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--accent-color)"; e.currentTarget.style.color = "white"; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--accent-color)"; }}
                  >
                    Ver
                  </button>

                  {onDownload && (
                    <button
                      onClick={() => onDownload(f.filename)}
                      className="container_button_download"
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; e.currentTarget.style.color = "white"; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--primary-color)"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Descargar
                    </button>
                  )}

                  {/* Validación de seguridad */}
                  {(esPersonal || ['Docente', 'Administrador'].includes(rol)) && (
                    <button
                      onClick={() => handleDeleteArchivo(f.filename)}
                      className="container_button_2"
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#ef4444"; e.currentTarget.style.color = "white"; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#ef4444"; }}
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* CONTROLES DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  background: currentPage === 1 ? "var(--bg-input, #f3f4f6)" : "transparent",
                  color: currentPage === 1 ? "#9ca3af" : "var(--text-main, #333)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  transition: "all 0.2s"
                }}
              >
                Anterior
              </button>

              <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #6b7280)", fontWeight: "500" }}>
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  background: currentPage === totalPages ? "var(--bg-input, #f3f4f6)" : "transparent",
                  color: currentPage === totalPages ? "#9ca3af" : "var(--text-main, #333)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  transition: "all 0.2s"
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmar eliminación"
        maxWidth="400px"
      >
        <div className="modal_viewer">
          <p>
            ¿Estás seguro de que deseas eliminar permanentemente el archivo <br />
            <strong>"{fileToDelete}"</strong>?
          </p>
        </div>

        <div className="modal_viewer_button">
          <button
            onClick={() => setIsModalOpen(false)}
            className="modal_viewer_button_si"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmDelete}
            className="modal_viewer_button_no "
          >
            Eliminar
          </button>
        </div>
      </Modal>

    </div>
  );
}