# Publicar Analyst Adventure en Steam

El juego ya está preparado como aplicación de escritorio (Electron). Esta guía cubre lo que falta
para subirlo a Steam.

## 1. Cuenta de Steamworks

1. Crear una cuenta en <https://partner.steamgames.com> y pagar el **Steam Direct fee** (USD 100 por juego).
2. Completar los datos fiscales y bancarios. Valve tarda unos días en aprobarlos.
3. Crear la aplicación: Steam asigna un **App ID** (por ejemplo `1234560`) y un **Depot ID** por
   sistema operativo (Windows, Linux, macOS).

## 2. Generar la build

En Windows (recomendado para la build de Windows):

```bash
npm ci
npm run dist:win
```

Steam no usa instaladores: se sube la **carpeta** del juego.

| Sistema | Carpeta a subir |
|---------|-----------------|
| Windows | `dist/win-unpacked/` (el ejecutable es `Analyst Adventure.exe`) |
| Linux   | `dist/linux-unpacked/` (el ejecutable es `analyst-adventure`) |
| macOS   | `dist/mac-universal/Analyst Adventure.app` |

También se pueden bajar las builds desde GitHub → **Actions** → la última ejecución de
“Build ejecutables” → **Artifacts**.

## 3. Subir con SteamPipe

1. Descargar el **Steamworks SDK** y usar `sdk/tools/ContentBuilder`.
2. Copiar `dist/win-unpacked/*` a `ContentBuilder/content/windows/`.
3. Crear `scripts/app_build_<AppID>.vdf`:

```vdf
"AppBuild"
{
  "AppID" "<AppID>"
  "Desc" "Analyst Adventure v0.1.0"
  "ContentRoot" "..\content\"
  "BuildOutput" "..\output\"
  "Depots"
  {
    "<DepotID Windows>"
    {
      "FileMapping"
      {
        "LocalPath" "windows\*"
        "DepotPath" "."
        "recursive" "1"
      }
    }
  }
}
```

4. Subir: `builder\steamcmd.exe +login <usuario> +run_app_build ..\scripts\app_build_<AppID>.vdf +quit`
5. En Steamworks → **Installation → General**, configurar la opción de lanzamiento:
   - Ejecutable: `Analyst Adventure.exe`
   - Sistema operativo: Windows

## 4. Steam Cloud (partidas guardadas)

El juego guarda cada ranura de partida en un archivo (`saves/slot1.json` … `slot3.json`), así que se
puede sincronizar con **Steam Auto-Cloud** sin tocar código. En Steamworks → **Steam Cloud**:

| Sistema | Root | Subdirectorio | Patrón |
|---------|------|---------------|--------|
| Windows | `WinAppDataRoaming` | `Analyst Adventure/saves` | `*.json` |
| Linux   | `LinuxXdgConfigHome` | `Analyst Adventure/saves` | `*.json` |
| macOS   | `MacAppSupport` | `Analyst Adventure/saves` | `*.json` |

## 5. Página de la tienda

Valve pide, entre otras cosas: cápsulas (imágenes) en varios tamaños, al menos 5 capturas,
descripción corta y larga, requisitos del sistema y clasificación de contenido. La página tiene que
estar visible como “Próximamente” **al menos 2 semanas** antes del lanzamiento.

Requisitos mínimos orientativos (Electron/Chromium): Windows 10 64 bits, 4 GB de RAM,
500 MB de espacio libre, cualquier GPU con soporte de DirectX 11.

## 6. Pendiente para una integración más profunda (opcional)

- **Logros y overlay de Steam**: se pueden agregar con la librería
  [`steamworks.js`](https://github.com/ceifa/steamworks.js) desde `electron/main.js`.
  Por ejemplo, un logro por cada nivel completado y otro por cada ascenso de rango. Para probarlo fuera de Steam hace falta un
  archivo `steam_appid.txt` con el App ID junto al ejecutable (no se sube a Steam).
- **Firma del ejecutable** (Windows): sin firma, Windows SmartScreen puede mostrar una advertencia
  si alguien ejecuta el `.exe` descargado fuera de Steam. Dentro de Steam no hace falta.
