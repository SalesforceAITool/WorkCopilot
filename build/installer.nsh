; Extra Start menu entry: opens the app and runs the end-to-end test.
!macro customInstall
  CreateShortCut "$SMPROGRAMS\Work Copilot Self Test.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--self-test" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0
!macroend

!macro customUnInstall
  Delete "$SMPROGRAMS\Work Copilot Self Test.lnk"
!macroend
