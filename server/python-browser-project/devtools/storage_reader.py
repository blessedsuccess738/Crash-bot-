class StorageReader:
    def __init__(self, page):
        self.page = page

    def get_cookies(self):
        # Access QWebEngineCookieStore
        pass

    def get_local_storage(self):
        # Run JS: JSON.stringify(localStorage)
        pass
