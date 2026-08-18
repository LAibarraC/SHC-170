import os
import shutil
import gc
import time
import json
import unicodedata
import re
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update

import models
from validators.archivos import (
    SaveTableHojasRequest, 
    SaveTableRequest, 
    UpdateExcelRequest, 
    AddEditSheetRequest
)

EXCEL_FOLDER = "excels"
os.makedirs(EXCEL_FOLDER, exist_ok=True)

def sanitizar_nombre_carpeta(nombre: str) -> str:
    if not nombre:
        return "desconocido"
    nombre_normalizado = unicodedata.normalize('NFD', nombre)
    nombre_sin_tildes = "".join([c for c in nombre_normalizado if not unicodedata.combining(c)])
    nombre_limpio = re.sub(r'[^a-zA-Z0-9\s_-]', '', nombre_sin_tildes)
    nombre_con_guiones = re.sub(r'[\s_-]+', '_', nombre_limpio)
    res = nombre_con_guiones.strip('_').lower()
    return res if res else "desconocido"

async def obtener_ruta_carpeta(autor: str, visibilidad: str, curso: str, db: AsyncSession) -> str:
    if visibilidad == "privado" and curso:
        clase_id = int(curso) if str(curso).isdigit() else None
        if clase_id:
            result = await db.execute(select(models.Clase).filter(models.Clase.id == clase_id))
            clase = result.scalars().first()
        else:
            result = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
            clase = result.scalars().first()
        
        if clase:
            nombre_sanitizado = sanitizar_nombre_carpeta(clase.nombre)
            carpeta_nombre = f"{nombre_sanitizado}_{clase.id}"
        else:
            nombre_sanitizado = sanitizar_nombre_carpeta(str(curso))
            carpeta_nombre = nombre_sanitizado
        return os.path.join(EXCEL_FOLDER, "_cursos", carpeta_nombre)
    else:
        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        if user:
            nombre_sanitizado = sanitizar_nombre_carpeta(user.nombre)
            carpeta_nombre = f"{nombre_sanitizado}_{user.id}"
        else:
            nombre_sanitizado = sanitizar_nombre_carpeta(autor)
            carpeta_nombre = nombre_sanitizado
        return os.path.join(EXCEL_FOLDER, carpeta_nombre)

async def upload_file_logic(file: UploadFile, autor: str, visibilidad: str, curso: str, db: AsyncSession):
    clase_id = None
    if visibilidad == "privado" and curso:
        clase_id = int(curso) if str(curso).isdigit() else None
        if clase_id:
            result = await db.execute(select(models.Clase).filter(models.Clase.id == clase_id))
            clase = result.scalars().first()
        else:
            result = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
            clase = result.scalars().first()
        if not clase:
            return {"error": "Clase no encontrada"}
        clase_id = clase.id

    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    os.makedirs(target_folder, exist_ok=True)
    file_path = os.path.join(target_folder, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # El tamaño del archivo guardado es la fuente de verdad para la cuota.
    file_size = os.path.getsize(file_path)

    result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
    user = result.scalars().first()
    user_id = user.id if user else 1

    result = await db.execute(select(models.Archivo).filter(
        models.Archivo.nombre_original == file.filename,
        models.Archivo.clase_id == clase_id,
        models.Archivo.usuario_id == user_id
    ))
    existente = result.scalars().first()
    if existente:
        existente.ruta_servidor = file_path.replace("\\", "/")
        existente.size_bytes = file_size
    else:
        db.add(models.Archivo(
            nombre_original=file.filename,
            ruta_servidor=file_path.replace("\\", "/"),
            clase_id=clase_id,
            usuario_id=user_id,
            size_bytes=file_size
        ))
    await db.commit()

    return {"message": f"Archivo subido correctamente a {target_folder}"}

async def list_files_logic(autor: str, visibilidad: str, curso: str, db: AsyncSession):
    files_list = []
    if visibilidad == "privado" and curso:
        clase_id = int(curso) if str(curso).isdigit() else None
        if not clase_id:
            result = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
            clase = result.scalars().first()
            if clase:
                clase_id = clase.id
        if clase_id:
            result = await db.execute(select(models.Archivo).filter(models.Archivo.clase_id == clase_id))
            archivos = result.scalars().all()
            for arc in archivos:
                files_list.append({
                    "filename": arc.nombre_original,
                    "autor": autor,
                    "es_curso": True
                })
            return {"files": files_list}

    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    if os.path.exists(target_folder):
        for fname in os.listdir(target_folder):
            if fname.endswith(".xlsx") or fname.endswith(".xls"):
                files_list.append({
                    "filename": fname, 
                    "autor": autor, 
                    "es_curso": visibilidad == "privado"
                })
    return {"files": files_list}

async def view_excel_logic(filename: str, hoja: int, autor: str, curso: str, db: AsyncSession):
    visibilidad = "privado" if curso else "personal"
    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    file_path = os.path.join(target_folder, filename)
        
    if not os.path.exists(file_path):
        return {"error": "Archivo no encontrado en el servidor"}

    try:
        with pd.ExcelFile(file_path) as xls:
            df = pd.read_excel(xls, sheet_name=hoja)
            df = df.dropna(how="all")
            if df.empty:
                return {"error": "Archivo sin datos detectables"}
            df.columns = [str(c) for c in df.columns]
            df = df.fillna("")
            json_data = df.to_dict(orient="records")
        return json_data
    except Exception as e:
        return {"error": f"Error al leer el Excel: {str(e)}"}

async def get_sheets_logic(filename: str, autor: str, curso: str, db: AsyncSession):
    visibilidad = "privado" if curso else "personal"
    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    file_path = os.path.join(target_folder, filename)

    if not os.path.exists(file_path):
        return {"error": "Archivo no encontrado en el servidor"}

    try:
        xls = pd.ExcelFile(file_path)
        return {"sheets": xls.sheet_names}
    except Exception as e:
        return {"error": f"Error al leer hojas: {str(e)}"}

async def get_download_file_path(filename: str, autor: str, curso: str, db: AsyncSession) -> str:
    visibilidad = "privado" if curso else "personal"
    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    file_path = os.path.join(target_folder, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return file_path

async def delete_file_logic(filename: str, autor: str, curso: str, db: AsyncSession):
    clase_id = None
    if curso:
        clase_id = int(curso) if str(curso).isdigit() else None
        if not clase_id:
            result = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
            clase = result.scalars().first()
            if clase:
                clase_id = clase.id

    visibilidad = "privado" if curso else "personal"
    target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
    file_path = os.path.join(target_folder, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    gc.collect()
    for _ in range(3):
        try:
            os.remove(file_path)
            meta_path = file_path + ".meta"
            if os.path.exists(meta_path):
                os.remove(meta_path)
            
            # --- NUEVA LÓGICA DE ELIMINACIÓN EN BD ---
            result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
            user = result.scalars().first()
            user_id = user.id if user else 1

            if clase_id:
                # Borrar archivo de curso
                await db.execute(delete(models.Archivo).filter(
                    models.Archivo.nombre_original == filename,
                    models.Archivo.clase_id == clase_id
                ))
            else:
                # Borrar archivo personal
                await db.execute(delete(models.Archivo).filter(
                    models.Archivo.nombre_original == filename,
                    models.Archivo.usuario_id == user_id,
                    models.Archivo.clase_id == None
                ))
            await db.commit()
            # ------------------------------------------

            return {"message": f"Archivo {filename} eliminado correctamente"}
        except PermissionError:
            time.sleep(0.3)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=500, detail="Archivo en uso. Intente de nuevo.")

async def save_table_hojas_logic(body: SaveTableHojasRequest, db: AsyncSession):
    try:
        nombre = body.nombre
        autor  = body.autor
        hojas  = body.hojas

        if not hojas:
            return {"error": "No se recibieron hojas para guardar"}

        # Archivo personal
        user_folder = await obtener_ruta_carpeta(autor, "personal", None, db)
        os.makedirs(user_folder, exist_ok=True)

        filepath = os.path.join(user_folder, f"{nombre}.xlsx")
        contador = 1
        while os.path.exists(filepath):
            contador += 1
            filepath = os.path.join(user_folder, f"{nombre}_{contador}.xlsx")

        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            for hoja_data in hojas:
                hoja = hoja_data.dict() if hasattr(hoja_data, "dict") else hoja_data
                nombre_hoja = hoja.get("nombre", "Hoja")[:31]
                datos       = hoja.get("datos", [])
                columnas    = hoja.get("columnas", [])

                if datos:
                    df = pd.DataFrame(datos)
                elif columnas:
                    df = pd.DataFrame(columns=columnas)
                else:
                    df = pd.DataFrame()

                df.to_excel(writer, sheet_name=nombre_hoja, index=False)

        meta_path = filepath + ".meta"
        meta_data = {"filename": os.path.basename(filepath), "author": autor}
        with open(meta_path, "w") as f:
            json.dump(meta_data, f)

        # ---------------------------------------------------------
        # REGISTRAR EL ARCHIVO GENERADO EN LA BASE DE DATOS
        # ---------------------------------------------------------
        # 1. Calcular el peso real del archivo recién creado
        file_size = os.path.getsize(filepath)

        # 2. Buscar al usuario para obtener su ID
        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        user_id = user.id if user else 1 # Fallback por seguridad

        # 3. Guardar el registro
        nuevo_archivo = models.Archivo(
            nombre_original=os.path.basename(filepath),
            ruta_servidor=filepath.replace("\\", "/"),
            clase_id=None, # Es un archivo personal, no pertenece a una clase
            usuario_id=user_id,
            size_bytes=file_size
        )
        db.add(nuevo_archivo)
        await db.commit()
        # ---------------------------------------------------------

        return {"filename": os.path.basename(filepath), "hojas": len(hojas)}
    except Exception as e:
        return {"error": str(e)}


async def save_table_logic(body: SaveTableRequest, db: AsyncSession):
    try:
        nombre = body.nombre
        tabla = body.tabla
        autor = body.autor

        if not tabla:
            return {"error": "No se recibieron datos para la tabla"}

        df = pd.DataFrame(tabla)
        user_folder = await obtener_ruta_carpeta(autor, "personal", None, db)
        os.makedirs(user_folder, exist_ok=True)

        filepath = os.path.join(user_folder, f"{nombre}.xlsx")
        contador = 1
        while os.path.exists(filepath):
            contador += 1
            filepath = os.path.join(user_folder, f"{nombre}_{contador}.xlsx")

        df.to_excel(filepath, index=False, header=True)

        meta_path = filepath + ".meta"
        meta_data = {"filename": os.path.basename(filepath), "author": autor}
        with open(meta_path, "w") as f:
            json.dump(meta_data, f)

        # ---------------------------------------------------------
        # REGISTRAR EL ARCHIVO GENERADO EN LA BASE DE DATOS
        # ---------------------------------------------------------
        file_size = os.path.getsize(filepath)

        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        user_id = user.id if user else 1

        nuevo_archivo = models.Archivo(
            nombre_original=os.path.basename(filepath),
            ruta_servidor=filepath.replace("\\", "/"),
            clase_id=None, # Archivo personal
            usuario_id=user_id,
            size_bytes=file_size
        )
        db.add(nuevo_archivo)
        await db.commit()
        # ---------------------------------------------------------

        return {"filename": os.path.basename(filepath)}
    except Exception as e:
        return {"error": str(e)}

async def create_table_logic(nombre: str, num_columnas: int, num_filas: int, autor: str, db: AsyncSession):
    if not nombre:
        existing_files = [f for f in os.listdir(EXCEL_FOLDER) if f.endswith(".xlsx")]
        nombre = f"Ejemplo {len(existing_files)+1}"

    cols = [f"Col {i+1}" for i in range(num_columnas)]
    df = pd.DataFrame([[0]*num_columnas for _ in range(num_filas)], columns=cols)
    filename = f"{nombre}.xlsx"
    
    if autor:
        user_folder = await obtener_ruta_carpeta(autor, "personal", None, db)
        os.makedirs(user_folder, exist_ok=True)
        file_path = os.path.join(user_folder, filename)
    else:
        file_path = os.path.join(EXCEL_FOLDER, filename)
        
    df.to_excel(file_path, index=False, header=False)

    # --- NUEVO: REGISTRAR EN BD ---
    if autor:
        file_size = os.path.getsize(file_path)
        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        user_id = user.id if user else 1

        nuevo_archivo = models.Archivo(
            nombre_original=filename,
            ruta_servidor=file_path.replace("\\", "/"),
            clase_id=None, 
            usuario_id=user_id,
            size_bytes=file_size
        )
        db.add(nuevo_archivo)
        await db.commit()
    # ------------------------------

    return {"message": "Tabla creada correctamente", "filename": filename}

async def save_table_logic(body: SaveTableRequest, db: AsyncSession):
    try:
        nombre = body.nombre
        tabla = body.tabla
        autor = body.autor

        if not tabla:
            return {"error": "No se recibieron datos para la tabla"}

        df = pd.DataFrame(tabla)
        user_folder = await obtener_ruta_carpeta(autor, "personal", None, db)
        os.makedirs(user_folder, exist_ok=True)

        filepath = os.path.join(user_folder, f"{nombre}.xlsx")
        contador = 1
        while os.path.exists(filepath):
            contador += 1
            filepath = os.path.join(user_folder, f"{nombre}_{contador}.xlsx")

        df.to_excel(filepath, index=False, header=True)

        meta_path = filepath + ".meta"
        meta_data = {"filename": os.path.basename(filepath), "author": autor}
        with open(meta_path, "w") as f:
            json.dump(meta_data, f)

        return {"filename": os.path.basename(filepath)}
    except Exception as e:
        return {"error": str(e)}

async def update_excel_logic(body: UpdateExcelRequest, db: AsyncSession):
    try:
        filename = body.filename
        hoja_index = body.hoja_index
        datos = body.datos
        autor = body.autor
        curso = body.curso
        estrategia_guardado = body.estrategia_guardado

        visibilidad = "privado" if curso else "personal"
        target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
        file_path = os.path.join(target_folder, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
            
        df_nuevo = pd.DataFrame(datos)
        for col in df_nuevo.columns:
            df_nuevo = df_nuevo[df_nuevo[col] != col]

        with pd.ExcelFile(file_path) as xls:
            sheet_names = xls.sheet_names
            nombre_hoja = sheet_names[hoja_index]

        # Guardaremos la respuesta aquí para retornarla al final
        response_data = {}

        if estrategia_guardado == "new_column":
            df_original = pd.read_excel(file_path, sheet_name=nombre_hoja)
            
            df_original_comp = df_original.fillna("")
            df_nuevo_comp = df_nuevo.fillna("")
            
            any_modified = False
            for col in df_original.columns:
                if col in df_nuevo_comp.columns:
                    if not df_original_comp[col].equals(df_nuevo_comp[col]):
                        nombre_nueva_col = f"{col} (Editado)"
                        df_original[nombre_nueva_col] = df_nuevo[col]
                        any_modified = True
            
            for col in df_nuevo.columns:
                if col not in df_original.columns and not col.startswith("__extra_col_"):
                    df_original[col] = df_nuevo[col]
                    any_modified = True
                    
            with pd.ExcelWriter(file_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
                df_original.to_excel(writer, sheet_name=nombre_hoja, index=False, header=True)
            response_data = {"message": "Columna agregada correctamente", "strategy": "new_column"}

        elif estrategia_guardado == "new_sheet":
            edited_sheets = [s for s in sheet_names if s.startswith("Datos_Editados_")]
            indices = []
            for s in edited_sheets:
                try:
                    idx = int(s.replace("Datos_Editados_", ""))
                    indices.append(idx)
                except ValueError:
                    pass
            next_idx = max(indices) + 1 if indices else 1
            new_sheet_name = f"Datos_Editados_{next_idx}"

            with pd.ExcelWriter(file_path, engine='openpyxl', mode='a') as writer:
                df_nuevo.to_excel(writer, sheet_name=new_sheet_name, index=False, header=True)
            response_data = {"message": "Nueva hoja agregada correctamente", "new_sheet": new_sheet_name, "strategy": "new_sheet"}

        else: # "overwrite"
            with pd.ExcelWriter(file_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
                df_nuevo.to_excel(writer, sheet_name=nombre_hoja, index=False, header=True)
            response_data = {"message": "Actualizado correctamente", "strategy": "overwrite"}

        # ---------------------------------------------------------
        # ACTUALIZAR EL PESO EN LA BASE DE DATOS
        # ---------------------------------------------------------
        new_size = os.path.getsize(file_path)

        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        user_id = user.id if user else 1

        clase_id = None
        if curso:
            clase_id = int(curso) if str(curso).isdigit() else None
            if not clase_id:
                result_clase = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
                clase = result_clase.scalars().first()
                if clase:
                    clase_id = clase.id

        if clase_id:
            await db.execute(
                update(models.Archivo)
                .where(models.Archivo.nombre_original == filename, models.Archivo.clase_id == clase_id)
                .values(size_bytes=new_size)
            )
        else:
            await db.execute(
                update(models.Archivo)
                .where(models.Archivo.nombre_original == filename, models.Archivo.usuario_id == user_id, models.Archivo.clase_id == None)
                .values(size_bytes=new_size)
            )
        await db.commit()
        # ---------------------------------------------------------

        return response_data

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def add_edit_sheet_logic(body: AddEditSheetRequest, db: AsyncSession):
    try:
        filename = body.filename
        datos = body.datos
        autor = body.autor
        curso = body.curso

        visibilidad = "privado" if curso else "personal"
        target_folder = await obtener_ruta_carpeta(autor, visibilidad, curso, db)
        file_path = os.path.join(target_folder, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Archivo no encontrado")

        df_nuevo = pd.DataFrame(datos)
        for col in df_nuevo.columns:
            df_nuevo = df_nuevo[df_nuevo[col] != col]

        with pd.ExcelFile(file_path) as xls:
            sheet_names = xls.sheet_names

        edited_sheets = [s for s in sheet_names if s.startswith("Datos_Editados_")]
        indices = []
        for s in edited_sheets:
            try:
                idx = int(s.replace("Datos_Editados_", ""))
                indices.append(idx)
            except ValueError:
                pass
        next_idx = max(indices) + 1 if indices else 1
        new_sheet_name = f"Datos_Editados_{next_idx}"

        with pd.ExcelWriter(file_path, engine='openpyxl', mode='a') as writer:
            df_nuevo.to_excel(writer, sheet_name=new_sheet_name, index=False, header=True)

        # ---------------------------------------------------------
        # ACTUALIZAR EL PESO EN LA BASE DE DATOS
        # ---------------------------------------------------------
        new_size = os.path.getsize(file_path)

        result = await db.execute(select(models.Usuario).filter(models.Usuario.nombre == autor))
        user = result.scalars().first()
        user_id = user.id if user else 1

        clase_id = None
        if curso:
            clase_id = int(curso) if str(curso).isdigit() else None
            if not clase_id:
                result_clase = await db.execute(select(models.Clase).filter(models.Clase.nombre == curso))
                clase = result_clase.scalars().first()
                if clase:
                    clase_id = clase.id

        if clase_id:
            await db.execute(
                update(models.Archivo)
                .where(models.Archivo.nombre_original == filename, models.Archivo.clase_id == clase_id)
                .values(size_bytes=new_size)
            )
        else:
            await db.execute(
                update(models.Archivo)
                .where(models.Archivo.nombre_original == filename, models.Archivo.usuario_id == user_id, models.Archivo.clase_id == None)
                .values(size_bytes=new_size)
            )
        await db.commit()
        # ---------------------------------------------------------

        return {"message": "Hoja agregada correctamente", "new_sheet": new_sheet_name}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar hoja de cambios: {str(e)}")