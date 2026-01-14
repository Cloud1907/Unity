Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & "%~dp0start_backend.bat" & chr(34), 0
Set WshShell = Nothing
