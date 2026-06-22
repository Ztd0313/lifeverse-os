@echo off
chcp 65001 >nul 2>&1
title LifeVerse 一键部署

echo.
echo ============================================
echo    LifeVerse 一键部署
echo ============================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 请右键此文件，选择"以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo [1/6] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version') do echo   已安装: %%v
) else (
    echo   正在安装 Node.js 20 LTS...
    echo   下载中，请稍候...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile '%TEMP%\node.msi' -UseBasicParsing"
    echo   安装中...
    msiexec /i "%TEMP%\node.msi" /qn /norestart
    timeout /t 3 /nobreak >nul
    echo   Node.js 安装完成
)

echo.
echo [2/6] 创建项目目录...
if not exist "C:\LifeVerse\uploads" mkdir "C:\LifeVerse\uploads"
echo   目录就绪

echo.
echo [3/6] 写入项目文件...
:: server.js 和 package.json 由 LifeVerse-Deploy.ps1 生成
:: 此 bat 文件只负责环境安装和启动
echo   文件就绪

echo.
echo [4/6] 安装依赖...
cd /d C:\LifeVerse
if not exist "node_modules" (
    call npm install --production
    echo   依赖安装完成
) else (
    echo   依赖已存在
)

echo.
echo [5/6] 配置防火墙...
netsh advfirewall firewall show rule name="LifeVerse-Port-3000" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="LifeVerse-Port-3000" dir=in action=allow protocol=tcp localport=3000
    echo   端口 3000 已开放
) else (
    echo   端口 3000 已开放
)

echo.
echo [6/6] 创建启动快捷方式...
echo @echo off > C:\LifeVerse\start.bat
echo title LifeVerse Server >> C:\LifeVerse\start.bat
echo cd /d C:\LifeVerse >> C:\LifeVerse\start.bat
echo echo. >> C:\LifeVerse\start.bat
echo echo ======================================== >> C:\LifeVerse\start.bat
echo echo   LifeVerse 后端服务器 >> C:\LifeVerse\start.bat
echo echo ======================================== >> C:\LifeVerse\start.bat
echo echo. >> C:\LifeVerse\start.bat
echo node server.js >> C:\LifeVerse\start.bat
echo pause >> C:\LifeVerse\start.bat
echo   启动脚本已创建

echo.
echo ============================================
echo    部署完成！
echo ============================================
echo.
echo 服务地址：
echo   http://120.55.38.135:3000
echo   http://120.55.38.135:3000/api/health
echo.
echo 启动方式：
echo   双击 C:\LifeVerse\start.bat
echo.
echo 是否立即启动服务？
set /p start="输入 Y 启动，其他键退出: "
if /i "%start%"=="Y" (
    echo.
    echo 正在启动 LifeVerse 服务器...
    echo 按 Ctrl+C 可停止
    echo.
    cd /d C:\LifeVerse
    node server.js
)
