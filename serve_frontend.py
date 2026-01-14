import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = "frontend-build"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # SPA (Single Page App) Support
        # If file doesn't exist, return index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == "__main__":
    if not os.path.exists(DIRECTORY):
        print(f"Hata: '{DIRECTORY}' klasoru bulunamadi.")
        sys.exit(1)
        
    print(f"Unity Frontend sunucusu baslatiliyor...")
    print(f"Adres: http://localhost:{PORT}")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu durduruluyor.")
