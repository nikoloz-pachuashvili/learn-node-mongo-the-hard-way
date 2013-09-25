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

type Config struct {
	OutputDirectory     string            `json:"output_directory"`
	DefaultOutputFormat string            `json:"default_output_format"`
	TableOfContents     []string          `json:"table_of_contents"`
	Layouts             map[string]Layout `json:"layouts"`
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
	// // Get the current directory
	// pwd, _ := os.Getwd()

	// if *source == "" {
	// 	sourcePath = pwd
	// } else {
	// 	sourcePath = *source
	// }

	sourcePath := SourcePath(source)
	// fmt.Printf("pwd = %s\n", pwd)
	// fmt.Printf("cfgfile = %s\n", *cfgfile)
	// fmt.Printf("configFile = %s\n", configFile)
	// fmt.Printf("source = %s\n", *source)
	// fmt.Printf("sourcePath = %s\n", sourcePath)
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
