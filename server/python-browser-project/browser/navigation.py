from PyQt5.QtWidgets import QToolBar, QLineEdit, QAction, QStyle
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QSize

class NavigationBar(QToolBar):
    def __init__(self, browser_window):
        super().__init__()
        self.browser_window = browser_window
        self.setMovable(False)
        self.setIconSize(QSize(24, 24))
        
        # Back Button
        self.back_action = QAction(self.style().standardIcon(QStyle.SP_ArrowBack), "Back", self)
        self.back_action.triggered.connect(self.browser_window.navigate_back)
        self.addAction(self.back_action)
        
        # Forward Button
        self.forward_action = QAction(self.style().standardIcon(QStyle.SP_ArrowForward), "Forward", self)
        self.forward_action.triggered.connect(self.browser_window.navigate_forward)
        self.addAction(self.forward_action)
        
        # Refresh Button
        self.refresh_action = QAction(self.style().standardIcon(QStyle.SP_BrowserReload), "Refresh", self)
        self.refresh_action.triggered.connect(self.browser_window.reload_page)
        self.addAction(self.refresh_action)
        
        # Address Bar
        self.url_bar = QLineEdit()
        self.url_bar.returnPressed.connect(self.navigate_to_url)
        self.addWidget(self.url_bar)
        
    def navigate_to_url(self):
        url = self.url_bar.text()
        self.browser_window.load_url(url)
        
    def update_url(self, qurl):
        self.url_bar.setText(qurl.toString())
        self.url_bar.setCursorPosition(0)
