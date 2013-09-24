package template

import (
	"github.com/russross/blackfriday"
	"io/ioutil"
)

type Engine struct {
}

func NewEngine() *Engine {
	return &Engine{}
}

func (p *Engine) ConvertFile(file string) ([]byte, error) {
	bytes, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}

	// Render the template
	output := blackfriday.MarkdownCommon(bytes)

	// blackfriday.
	return output, nil
}
