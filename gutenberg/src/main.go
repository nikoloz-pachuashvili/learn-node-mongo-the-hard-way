package main

import (
	"bytes"
	"fmt"
	flag "github.com/ogier/pflag"
	gutenberg "gutenberg.org"
	"gutenberg.org/config"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"text/template"
	"time"
)

var (
	cfgfile   = flag.String("config", "", "config file (default is path/config.json)")
	help      = flag.BoolP("help", "h", false, "show this help")
	source    = flag.StringP("source", "s", "", "filesystem path to read files relative from")
	watchMode = flag.BoolP("watch", "w", false, "watch filesystem for changes and recreate as needed")
	server    = flag.BoolP("server", "S", false, "run a (very) simple web server")
	port      = flag.String("port", "1313", "port to run web server on, default :1313")
	interval  = flag.Int64P("interval", "i", 1000, "pooling interval for watching")
)

type Process struct {
	Done   chan bool
	Source string
}

func usage() {
	PrintErr("usage: gutenberg [flags]", "")
	flag.PrintDefaults()
	os.Exit(0)
}

func main() {
	flag.Usage = usage
	flag.Parse()

	if *help {
		usage()
	}

	// Read the configuration
	c, err := config.ReadConfigFromFile(cfgfile, source)
	if err != nil {
		fmt.Printf("Error:: %v\n", err)
		os.Exit(0)
	}

	// Create a Process
	process := &Process{Done: make(chan bool), Source: *source}

	// Create output directory if it does not exist
	err = os.Mkdir(c.OutputDirectory, 0755)
	// Go into watch mode
	if *watchMode {
		WatchMode(*interval, process, c)
	}
}

type Page struct {
	Page string
}

func BuildContext(html string, c *config.Config) map[string]interface{} {
	// var result map[string]interface{}
	result := make(map[string]interface{})
	result["Page"] = html
	// Let's add all the indexes available
	for name, c := range c.Indexes {
		uppedName := strings.ToUpper((string)([]byte(name)[0:1])) + string([]byte(name)[1:])
		// Add the result
		result[uppedName] = c
	}

	// result := map[string]interface{}
	// return map[string]interface{}
	return result
}

func GenerateBook(p *Process, c *config.Config) error {
	log.Printf("Configuration \n%q\n", c)

	// Read all the layouts for html
	htmlLayouts := c.Layouts["html"]
	pageLayout := htmlLayouts.Page
	fmt.Printf("html layouts %q\n", pageLayout)

	// Read all the pages in
	for _, page := range c.TableOfContents {
		// Get the right location for the page layout file
		pageLayoutFile := fmt.Sprintf("%s/%s", p.Source, pageLayout)
		// Read the page layout file in
		layoutBytes, err := ioutil.ReadFile(pageLayoutFile)
		if err != nil {
			log.Printf("no layout file found for %s\n", pageLayoutFile)
		}

		// Parse the template into an object
		pageTemplate, err := template.New("pageTemplate").Parse(string(layoutBytes))
		if err != nil {
			log.Printf("invalid template found in %s page template file\n", pageLayoutFile)
		}

		fmt.Printf("Generate page %s\n", page)

		// Split the file up so we can get the "name"
		fileNameParts := strings.Split(page.File, ".")
		fileName := strings.Join(fileNameParts[0:(len(fileNameParts)-1)], ".")

		// Read the page
		pageFile := fmt.Sprintf("%s/%s", p.Source, page.File)
		// Get the File info
		// fileInfo, err := os.Stat(pageFile)
		_, err = os.Stat(pageFile)
		if err != nil {
			return err
		}

		// Read the page into memory
		data, err := ioutil.ReadFile(pageFile)
		if err != nil {
			return err
		}

		// Get the custom Html transformer
		customTransformer := gutenberg.NewCustomHtml(c)

		// Render the mardown
		html := customTransformer.Transform(data)

		// Pass to the template if it's defined
		if pageTemplate != nil {
			// var buffer bytes.Buffer
			buffer := bytes.NewBuffer(nil)
			err = pageTemplate.Execute(buffer, BuildContext(string(html), c))
			if err != nil {
				log.Fatalf("Failed to execute template %s\n", pageLayoutFile)
				os.Exit(0)
			}

			// Save the data as the new page
			html = buffer.Bytes()
		}

		// Let's write the resulting page out
		err = ioutil.WriteFile(fmt.Sprintf("%s/%s.html", c.OutputDirectory, fileName), html, 0755)
		if err != nil {
			return err
		}
	}

	return nil
}

func WatchMode(delay int64, p *Process, c *config.Config) error {
	go func() {
		for true {
			// Get the parts of the config file
			sourcePath := config.SourcePath(source)
			// Set the config file name
			configFile := config.ConfigFile(sourcePath, cfgfile)
			// Log the attempt to read the configuration file
			log.Printf("Reading configuration file %s\n", configFile)
			// Read the configuration
			c, err := config.ReadConfigFromFile(cfgfile, source)
			if err != nil {
				fmt.Printf("Error:: %v\n", err)
				p.Done <- true
				break
			}

			// Set the source path
			c.SourcePath = sourcePath

			// Process and generate the book
			log.Printf("Generating Book\n")
			err = GenerateBook(p, c)
			if err != nil {
				fmt.Printf("Error:: %v\n", err)
				p.Done <- true
				break
			}

			// Just sleep a bit
			time.Sleep(time.Duration(delay) * time.Millisecond)
		}
	}()

	// Wait until we are done
	<-p.Done
	// Return from Watch mode
	return nil
}

func PrintErr(str string, a ...interface{}) {
	fmt.Fprintln(os.Stderr, str, a)
}
