package main

import (
	"database/sql"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

var db *sql.DB

type Reel struct {
	UUID   uuid.UUID `json:"uuid"`
	Images []string  `json:"images"`
}

func main() {
	// Connect to PostgreSQL
	connStr := "user=postgres host=localhost dbname=postgres password=password port=5432 sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.SetHeader("Access-Control-Allow-Origin", "*"))
	r.Use(middleware.SetHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"))

	// Serve static files
	workDir, _ := os.Getwd()
	filesDir := http.Dir(workDir)
	r.Get("/*", http.FileServer(filesDir).ServeHTTP)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		filePath := path.Join(workDir, "index.html")
		http.ServeFile(w, r, filePath)
	})

	r.Get("/{uuid}", func(w http.ResponseWriter, r *http.Request) {
		uuidStr := chi.URLParam(r, "uuid")
		reel, err := getReelByUUID(uuidStr)
		if err != nil {
			if err == sql.ErrNoRows {
				http.NotFound(w, r)
				return
			}
			http.Error(w, "Failed to retrieve images", http.StatusInternalServerError)
			log.Println(err)
			return
		}
		json.NewEncoder(w).Encode(reel)
	})

	r.Post("/save-reel", func(w http.ResponseWriter, r *http.Request) {
		cssFilePath := path.Join(workDir, "style.css")
		cssContent, err := ioutil.ReadFile(cssFilePath)
		if err != nil {
			http.Error(w, "Failed to read CSS file", http.StatusInternalServerError)
			log.Println(err)
			return
		}

		imageURLs := extractBackgroundImageURLs(string(cssContent))
		if len(imageURLs) == 0 {
			http.Error(w, "No image URLs found", http.StatusInternalServerError)
			log.Println("No image URLs found")
			return
		}

		reel := Reel{
			UUID:   uuid.New(),
			Images: imageURLs,
		}

		err = saveReel(reel)
		if err != nil {
			http.Error(w, "Failed to save images", http.StatusInternalServerError)
			log.Println(err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reel)
	})

	log.Println("Server started on port 8080")
	http.ListenAndServe(":8080", r)
}

func getReelByUUID(uuidStr string) (*Reel, error) {
	query := `
		SELECT images
		FROM image_reels
		WHERE uuid = $1
	`
	row := db.QueryRow(query, uuidStr)

	var images []string
	err := row.Scan(pq.Array(&images))
	if err != nil {
		return nil, err
	}

	reel := &Reel{
		UUID:   uuid.MustParse(uuidStr),
		Images: images,
	}
	return reel, nil
}

func saveReel(reel Reel) error {
	query := `
		INSERT INTO image_reels (uuid, images)
		VALUES ($1, $2)
	`
	_, err := db.Exec(query, reel.UUID.String(), pq.Array(reel.Images))
	return err
}

func extractBackgroundImageURLs(cssContent string) []string {
	var imageURLs []string

	// Split CSS content into lines
	lines := strings.Split(cssContent, "\n")

	// Iterate over lines and extract background image URLs
	for _, line := range lines {
		if strings.Contains(line, "background-image") {
			urlStart := strings.Index(line, "url(")
			if urlStart == -1 {
				continue
			}

			urlStart += 4 // Skip "url("
			urlEnd := strings.Index(line[urlStart:], ")")
			if urlEnd == -1 {
				continue
			}

			urlEnd += urlStart
			url := line[urlStart:urlEnd]

			if strings.HasPrefix(url, "'") && strings.HasSuffix(url, "'") {
				url = url[1 : len(url)-1]
			} else if strings.HasPrefix(url, "\"") && strings.HasSuffix(url, "\"") {
				url = url[1 : len(url)-1]
			}

			imageURLs = append(imageURLs, url)
		}
	}

	return imageURLs
}
