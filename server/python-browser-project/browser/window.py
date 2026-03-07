from PyQt5.QtWidgets import QMainWindow, QTabWidget, QWidget, QVBoxLayout, QAction, QMenu
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl, Qt
from browser.engine import BrowserEngine
from browser.navigation import NavigationBar
from utils.config import Config

class BrowserTab(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        self.web_view = QWebEngineView()
        self.engine = BrowserEngine(self.web_view)
        self.web_view.setPage(self.engine)
        
        self.layout.addWidget(self.web_view)
        
    def load_url(self, url):
        if not url.startswith("http"):
            url = "https://" + url
        self.web_view.setUrl(QUrl(url))

class BrowserWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(Config.APP_NAME)
        self.resize(Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT)
        
        self.tabs = QTabWidget()
        self.tabs.setDocumentMode(True)
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self.tab_changed)
        
        self.setCentralWidget(self.tabs)
        
        self.nav_bar = NavigationBar(self)
        self.addToolBar(self.nav_bar)
        
        # New Tab Button
        self.new_tab_action = QAction("New Tab", self)
        self.new_tab_action.setShortcut("Ctrl+T")
        self.new_tab_action.triggered.connect(self.add_new_tab)
        self.addAction(self.new_tab_action)
        
        # DevTools Shortcut
        self.devtools_action = QAction("DevTools", self)
        self.devtools_action.setShortcut("F12")
        self.devtools_action.triggered.connect(self.toggle_devtools)
        self.addAction(self.devtools_action)
        
        # Initial Tab
        self.add_new_tab(Config.DEFAULT_URL, "Home")

    def add_new_tab(self, url=Config.DEFAULT_URL, label="New Tab"):
        tab = BrowserTab()
        index = self.tabs.addTab(tab, label)
        self.tabs.setCurrentIndex(index)
        tab.load_url(url)
        
        # Connect signals
        tab.web_view.urlChanged.connect(lambda qurl, tab=tab: self.update_url_bar(qurl, tab))
        tab.web_view.loadFinished.connect(lambda _, tab=tab: self.update_title(tab))

    def close_tab(self, index):
        if self.tabs.count() < 2:
            return
        self.tabs.removeTab(index)

    def tab_changed(self, index):
        current_tab = self.tabs.widget(index)
        if current_tab:
            self.update_url_bar(current_tab.web_view.url(), current_tab)

    def update_url_bar(self, qurl, tab):
        if tab == self.tabs.currentWidget():
            self.nav_bar.update_url(qurl)

    def update_title(self, tab):
        index = self.tabs.indexOf(tab)
        title = tab.web_view.title()
        self.tabs.setTabText(index, title[:20])

    def navigate_back(self):
        self.tabs.currentWidget().web_view.back()

    def navigate_forward(self):
        self.tabs.currentWidget().web_view.forward()

    def reload_page(self):
        self.tabs.currentWidget().web_view.reload()

    def load_url(self, url):
        self.tabs.currentWidget().load_url(url)

    def toggle_devtools(self):
        # In a real desktop app, this would open a separate window or dock
        print("[DEVTOOLS] Toggled (See console output for logs)")
        # Programmatic access example
        page = self.tabs.currentWidget().web_view.page()
        page.runJavaScript("console.log('DevTools Connected via Python Bridge');")
