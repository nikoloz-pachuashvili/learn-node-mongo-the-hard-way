package template

import (
	"fmt"
	"gutenberg.org/template"
	"os"
	"testing"
)

/**
 * Tests
 **/
func TestSimpleBootUp(t *testing.T) {
	engine := template.NewEngine()
	if engine == nil {
		t.Errorf("Did not manage to create a new engine")
	}

	pwd, err := os.Getwd()
	if err != nil {
		t.Errorf("%q", err)
	}

	fmt.Printf("PWD: [%s]\n", pwd)

	html, err := engine.ConvertFile("../../../book/ex0.mk")
	if err != nil {
		t.Errorf("%q", err)
	}

	fmt.Printf("html = [%s]\n", string(html))
}
