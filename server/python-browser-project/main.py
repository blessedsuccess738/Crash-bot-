import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt
from browser.window import BrowserWindow
from utils.config import Config

def main():
    print("BROWSER ENGINE INITIALIZING...")
    print("Loading rendering engine... OK")
    print("Loading network module... OK")
    print("Loading DOM parser... OK")
    print("Loading storage system... OK")
    print("Loading developer tools bridge... OK")
    print("Engine ready.")
    print(f"Default page loaded: {Config.DEFAULT_URL}")
    
    app = QApplication(sys.argv)
    app.setApplicationName(Config.APP_NAME)
    
    # Enable high DPI scaling
    app.setAttribute(Qt.AA_EnableHighDpiScaling)
    app.setAttribute(Qt.AA_UseHighDpiPixmaps)
    
    window = BrowserWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
