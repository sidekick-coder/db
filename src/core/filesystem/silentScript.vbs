
        Set objShell = CreateObject("WScript.Shell")
        objShell.Run "cmd /c timeout /t 10 && del /f /q E:\weeb\.databases\sauces\data\.db\password", 0, True
    