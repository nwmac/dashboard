package main

import (
	"crypto/tls"
	"encoding/json"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Common MIME types for web assets
var mimeTypes = map[string]string{
	".html":  "text/html; charset=utf-8",
	".css":   "text/css; charset=utf-8",
	".js":    "application/javascript",
	".mjs":   "application/javascript",
	".json":  "application/json",
	".svg":   "image/svg+xml",
	".png":   "image/png",
	".jpg":   "image/jpeg",
	".jpeg":  "image/jpeg",
	".gif":   "image/gif",
	".ico":   "image/x-icon",
	".woff":  "font/woff",
	".woff2": "font/woff2",
	".ttf":   "font/ttf",
	".eot":   "application/vnd.ms-fontobject",
	".map":   "application/json",
}

// getMimeType returns the MIME type for a file based on its extension
func getMimeType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if mimeType, ok := mimeTypes[ext]; ok {
		return mimeType
	}
	// Fall back to Go's mime package
	if mimeType := mime.TypeByExtension(ext); mimeType != "" {
		return mimeType
	}
	return "application/octet-stream"
}

// RouteHandler handles a specific route
type RouteHandler func(w http.ResponseWriter, r *http.Request)

// Interceptor wraps an http.Handler and intercepts specific routes
type Interceptor struct {
	routes   map[string]RouteHandler
	fallback http.Handler
	uiPath   string

	readyOnce sync.Once
	readyCh   chan struct{}
}

// NewInterceptor creates a new Interceptor that falls back to the given handler
func NewInterceptor(fallback http.Handler) *Interceptor {
	return &Interceptor{
		routes:   make(map[string]RouteHandler),
		fallback: fallback,
		readyCh:  make(chan struct{}),
	}
}

// StartReadinessCheck begins polling the readiness endpoint in the background
func (i *Interceptor) StartReadinessCheck(addr string) {
	go func() {
		client := &http.Client{
			Timeout: 2 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		}
		url := addr + "/check-ready"

		for {
			resp, err := client.Get(url)
			if err == nil {
				resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					log.Println("Backend ready")
					i.readyOnce.Do(func() { close(i.readyCh) })
					return
				}
			}
			time.Sleep(100 * time.Millisecond)
		}
	}()
}

// WaitForReady blocks until the backend is ready
func (i *Interceptor) WaitForReady() {
	<-i.readyCh
}

// Handle registers a handler for a specific path
func (i *Interceptor) Handle(path string, handler RouteHandler) {
	i.routes[path] = handler
}

// SetUIPath sets the path to the UI files directory
func (i *Interceptor) SetUIPath(path string) {
	i.uiPath = path
}

// Regex patterns to match absolute URLs in script src and link href attributes
var (
	scriptSrcRegex = regexp.MustCompile(`(<script[^>]*\ssrc=")(/[^"]+)(")`)
	linkHrefRegex  = regexp.MustCompile(`(<link[^>]*\shref=")(/[^"]+)(")`)
)

// serveUI serves files from the UI directory, falling back to index.html for SPA routing
func (i *Interceptor) serveUI(w http.ResponseWriter, r *http.Request) {
	// Strip the /dashboard prefix to get the file path
	filePath := strings.TrimPrefix(r.URL.Path, "/dashboard")
	if filePath == "" {
		filePath = "/"
	}

	// Construct the full file path
	fullPath := filepath.Join(i.uiPath, filePath)

	log.Printf("Serve dashboard %s\n", fullPath)

	// Check if the file exists and is not a directory
	info, err := os.Stat(fullPath)
	serveIndex := err != nil || info.IsDir()
	if serveIndex {
		// File doesn't exist or is a directory, serve index.html for SPA routing
		fullPath = filepath.Join(i.uiPath, "index.html")
	}

	// For index.html, use the special handler
	if serveIndex || strings.HasSuffix(fullPath, "index.html") {
		i.serveIndexHTML(w, r, fullPath)
		return
	}

	serveFileWithMime(w, fullPath)
}

// serveDashboard serves files from the UI directory for /dashboard paths
func (i *Interceptor) serveDashboard(w http.ResponseWriter, r *http.Request) {
	// Strip the /dashboard prefix to get the file path
	filePath := strings.TrimPrefix(r.URL.Path, "/dashboard")
	if filePath == "" {
		filePath = "/"
	}

	log.Printf("Serve dashboard %s\n", r.URL.Path)
	log.Printf("Serve dashboard %s\n", filePath)

	// Construct the full file path
	fullPath := filepath.Join(i.uiPath, filePath)

	log.Printf("Serve dashboard %s\n", fullPath)

	// Check if the file exists
	info, err := os.Stat(fullPath)
	serveIndex := err != nil || info.IsDir()
	if serveIndex {
		// File doesn't exist or is a directory, serve index.html for SPA routing
		fullPath = filepath.Join(i.uiPath, "index.html")
	}

	// For index.html, rewrite absolute URLs to relative paths
	if serveIndex || strings.HasSuffix(fullPath, "index.html") {
		i.serveIndexHTML(w, r, fullPath)
		return
	}

	serveFileWithMime(w, fullPath)
}

// serveFileWithMime serves a file with the correct MIME type
func serveFileWithMime(w http.ResponseWriter, fullPath string) {
	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", getMimeType(fullPath))
	w.Write(content)
}

// serveIndexHTML reads index.html, rewrites absolute URLs to relative paths, and serves it
func (i *Interceptor) serveIndexHTML(w http.ResponseWriter, r *http.Request, fullPath string) {
	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, "Failed to read index.html", http.StatusInternalServerError)
		return
	}

	// Rewrite absolute URLs to relative paths
	// /path/to/file -> ./dashboard/path/to/file
	html := string(content)
	// html = scriptSrcRegex.ReplaceAllString(html, `${1}./dashboard${2}${3}`)
	// html = linkHrefRegex.ReplaceAllString(html, `${1}./dashboard${2}${3}`)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(html))
}

// isAPIRoute returns true if the path is an API route that should be proxied
func isAPIRoute(path string) bool {
	return strings.HasPrefix(path, "/v1") ||
		strings.HasPrefix(path, "/v1-public") ||
		strings.HasPrefix(path, "/v3") ||
		strings.HasPrefix(path, "/k8s") ||
		strings.HasPrefix(path, "/version")
}

// ServeHTTP implements http.Handler
func (i *Interceptor) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	// Redirect root to /dashboard
	if r.URL.Path == "/" || r.URL.Path == "" {
		http.Redirect(w, r, "/dashboard", http.StatusFound)
		return
	}

	// Check for registered handlers first
	if handler, ok := i.routes[r.URL.Path]; ok {
		handler(w, r)
		return
	}

	// Handle readiness check by rewriting to settings endpoint
	if strings.HasPrefix(r.URL.Path, "/check-ready") {
		var err error
		r.URL, err = url.Parse("/v1/management.cattle.io.settings?exclude=metadata.managedFields")
		if err != nil {
			panic(err)
		}
		i.fallback.ServeHTTP(w, r)
		return
	}

	// For API routes, wait for backend and proxy
	if isAPIRoute(r.URL.Path) {
		i.WaitForReady()
		log.Printf("Received request: %s %s\n", r.Method, r.URL.Path)
		i.fallback.ServeHTTP(w, r)
		return
	}

	log.Printf("Received request: %s %s\n", r.Method, r.URL.Path)
	log.Printf("UI Path: %s\n", i.uiPath)

	// For all other routes, try to serve UI files
	if i.uiPath != "" {
		i.serveUI(w, r)
		return
	}

	// No UI path configured, fall back to proxy
	i.WaitForReady()
	log.Printf("Received request: %s %s\n", r.Method, r.URL.Path)
	i.fallback.ServeHTTP(w, r)
}

// JSON helper to write JSON responses
func JSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// ************************************************************************************************
// *** Custom route handlers below                                                              ***
// ************************************************************************************************

// RegisterRoutes registers all custom route handlers
func RegisterRoutes(i *Interceptor) {
	i.Handle("/rancherversion", handleRancherVersion)
	i.Handle("/v1/uiplugins", handleUIPlugins)
}

func handleRancherVersion(w http.ResponseWriter, r *http.Request) {
	JSON(w, map[string]string{
		"Version": "2.15.3",
		"Prime":   "True",
	})
}

func handleUIPlugins(w http.ResponseWriter, r *http.Request) {
	JSON(w, []string{})
}
