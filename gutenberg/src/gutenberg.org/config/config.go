package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

func init() {
}

type Layout struct {
	Index string
	Page  string
}

type TableOfContentsEntry struct {
	File string `json:"file"`
}

type IndexEntry struct {
	File  string `json:"file"`
	Title string `json:"title"`
}

type HTMLIndex struct {
	Entries []IndexEntry `json:"entries"`
}

type Index struct {
	HTML HTMLIndex
}

type Config struct {
	OutputDirectory     string                 `json:"output_directory"`
	DefaultOutputFormat string                 `json:"default_output_format"`
	TableOfContents     []TableOfContentsEntry `json:"table_of_contents"`
	Layouts             map[string]Layout      `json:"layouts"`
	SourcePath          string                 `json:"source_path"`
	Indexes             map[string]Index       `json:"indexes"`
	Assets              []string               `json:"assets"`
}

func SourcePath(source *string) string {
	// Get the current directory
	pwd, _ := os.Getwd()

	if *source == "" {
		return pwd
	}

	return *source
}

func ConfigFile(sourcePath string, cfgfile *string) string {
	// If no config file set set the default
	if *cfgfile == "" {
		return fmt.Sprintf("%s/config.json", sourcePath)
	}

	return fmt.Sprintf("%s/%s", sourcePath, *cfgfile)
}

func ReadConfigFromFile(cfgfile *string, source *string) (*Config, error) {
	sourcePath := SourcePath(source)
	// Get the config file
	configFile := ConfigFile(sourcePath, cfgfile)
	// Read in the configuration file
	data, err := ioutil.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	// Allocate config
	c := &Config{}
	// Convert bytes to json
	json.Unmarshal(data, c)
	if err != nil {
		return nil, err
	}

	// Return the parsed config file
	return c, nil
}
