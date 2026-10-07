@echo off
set "DIR=%~dp0"
set "MAVEN_HOME=%DIR%apache-maven-3.9.9"
"%MAVEN_HOME%\bin\mvn.cmd" %*
