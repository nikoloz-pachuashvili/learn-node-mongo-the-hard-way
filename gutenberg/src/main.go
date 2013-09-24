package main

import (
	"fmt"
	flag "github.com/ogier/pflag"
	// blackfriday "github.com/russross/blackfriday"
	gutenberg "gutenberg.org"
	"gutenberg.org/config"
	"io/ioutil"
	// "log"
	"os"
	"os/exec"
	"strings"
	"time"
)

var (
	// baseUrl = flag.StringP("base-url", "b", "", "hostname (and path) to the root eg. http://spf13.com/")
	cfgfile = flag.String("config", "", "config file (default is path/config.json)")
	// checkMode   = flag.Bool("check", false, "analyze content and provide feedback")
	// draft       = flag.BoolP("build-drafts", "D", false, "include content marked as draft")
	help   = flag.BoolP("help", "h", false, "show this help")
	source = flag.StringP("source", "s", "", "filesystem path to read files relative from")
	// destination = flag.StringP("destination", "d", "", "filesystem path to write files to")
	// verbose     = flag.BoolP("verbose", "v", false, "verbose output")
	// version     = flag.Bool("version", false, "which version of hugo")
	// cpuprofile  = flag.Int("profile", 0, "Number of times to create the site and profile it")
	watchMode = flag.BoolP("watch", "w", false, "watch filesystem for changes and recreate as needed")
	server    = flag.BoolP("server", "S", false, "run a (very) simple web server")
	port      = flag.String("port", "1313", "port to run web server on, default :1313")
	// uglyUrls    = flag.Bool("uglyurls", false, "if true, use /filename.html instead of /filename/")
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
	// fmt.Printf("========================= 0\n")
	flag.Usage = usage
	flag.Parse()
	// fmt.Printf("========================= 1\n")

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
	// if err != nil {
	// 	fmt.Printf("Error:: %v\n", err)
	// 	os.Exit(0)
	// }

	// Go into watch mode
	if *watchMode {
		WatchMode(1000, process, c)
	}
}

func GenerateBook(p *Process, c *config.Config) error {
	for _, page := range c.TableOfContents {
		fmt.Printf("Generate page %s\n", page)

		// Split the file up so we can get the "name"
		fileNameParts := strings.Split(page, ".")
		fileName := strings.Join(fileNameParts[0:(len(fileNameParts)-1)], ".")

		// Read the page into memory
		data, err := ioutil.ReadFile(fmt.Sprintf("%s/%s", p.Source, page))
		if err != nil {
			return err
		}

		// Get the custom Html transformer
		customTransformer := gutenberg.NewCustomHtml()

		// Render the mardown
		html := customTransformer.Transform(data)

		// Let's write the resulting page out
		err = ioutil.WriteFile(fmt.Sprintf("%s/%s.html", c.OutputDirectory, fileName), html, 0755)
		if err != nil {
			return err
		}

		//
		//
		code := "function() {\n" +
			"  var a = 1\n" +
			"}\n"

		html, err = ExecuteSourceHighlight("js", []byte(code), c)
	}

	return nil
}

func ExecuteSourceHighlight(lang string, source []byte, c *config.Config) ([]byte, error) {
	tempFileNameIn := fmt.Sprintf("%s/%s.%s", c.OutputDirectory, "temp", lang)
	tempFileNameOut := fmt.Sprintf("%s/%s.%s", c.OutputDirectory, "temp", "html")

	// Write the file out first
	err := ioutil.WriteFile(tempFileNameIn, source, 0755)
	if err != nil {
		return nil, err
	}

	// Make sure we have the tool available
	_, err = exec.LookPath("source-highlight")
	if err != nil {
		return nil, err
	}

	// Format the code using gnu source-highlight
	cmd := exec.Command("source-highlight",
		"-s",
		lang,
		"-f",
		"html",
		"--input",
		tempFileNameIn,
		"--output",
		tempFileNameOut,
	)
	// Start the command
	err = cmd.Start()
	// Wait for process to finish
	err = cmd.Wait()
	if err != nil {
		return nil, err
	}

	// Read the converted file
	html, err := ioutil.ReadFile(tempFileNameOut)
	if err != nil {
		return nil, err
	}

	return html, nil
}

func WatchMode(delay int64, p *Process, c *config.Config) error {
	go func() {
		for true {
			// Process and generate the book
			err := GenerateBook(p, c)
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
