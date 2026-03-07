from PyQt5.QtWebEngineWidgets import QWebEnginePage, QWebEngineProfile
from PyQt5.QtCore import QUrl
from utils.config import Config

class BrowserEngine(QWebEnginePage):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.profile = QWebEngineProfile.defaultProfile()
        self.profile.setHttpUserAgent(Config.USER_AGENT)
        
        # Enable developer tools
        self.settings().setAttribute(self.settings().JavascriptEnabled, True)
        self.settings().setAttribute(self.settings().LocalStorageEnabled, True)
        self.settings().setAttribute(self.settings().PluginsEnabled, True)
        self.settings().setAttribute(self.settings().WebGLEnabled, True)
        
        # Hook into console messages
        self.javaScriptConsoleMessage = self.on_console_message

    def on_console_message(self, level, message, line, source):
        print(f"[CONSOLE] {message} ({source}:{line})")

    def load_url(self, url):
        if not url.startswith("http"):
            url = "https://" + url
        self.setUrl(QUrl(url))
