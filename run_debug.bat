@echo off
echo Starting debug > debug_output.txt
echo Current Directory: %CD% >> debug_output.txt
where node >> debug_output.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Node not found in PATH >> debug_output.txt
) else (
  echo Node found at: >> debug_output.txt
)
node -v >> debug_output.txt 2>&1
echo Running script... >> debug_output.txt
node scripts/debug_file_read.js >> debug_output.txt 2>&1
echo Finished >> debug_output.txt
