@echo off
title Iniciando LectoIA Pro...
chcp 65001 >nul
echo ===================================================
echo        INICIANDO LECTOIA PRO GENERADOR
echo ===================================================
echo.
echo Levantando el servidor de desarrollo...
echo Por favor, espera un par de segundos.
echo.

REM Iniciar el servidor de desarrollo en segundo plano
start /b npm run dev

REM Esperar 3 segundos para que el puerto este activo
timeout /t 3 /nobreak >nul

REM Abrir automaticamente el navegador predeterminado
start http://localhost:5173/

echo.
echo ===================================================
echo   El generador ya se abrio en tu navegador!
echo ===================================================
echo.
echo * Nota: Deja esta ventana abierta mientras uses la aplicacion.
echo * Cuando termines de trabajar, puedes cerrarla normalmente.
echo.
echo Presiona cualquier tecla para salir de esta ventana...
pause >nul
