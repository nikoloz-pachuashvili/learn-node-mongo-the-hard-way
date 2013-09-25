package gutenberg

import (
	"bytes"
	blackfriday "github.com/russross/blackfriday"
	"gutenberg.org/config"
	"strings"
	"fmt"
	"io/ioutil"
	"os/exec"
)

type MarkdownTransformer interface {
	Transform([]byte) []byte
}

type CustomMarkdownTransformer struct {
	renderer   blackfriday.Renderer
	extensions int
}

func (p *CustomMarkdownTransformer) Transform(input []byte) []byte {
	return blackfriday.Markdown(input, p.renderer, p.extensions)
}

func NewCustomHtml(c *config.Config) MarkdownTransformer {
	// set up the HTML renderer
	htmlFlags := 0
	htmlFlags |= blackfriday.HTML_USE_XHTML
	htmlFlags |= blackfriday.HTML_USE_SMARTYPANTS
	htmlFlags |= blackfriday.HTML_SMARTYPANTS_FRACTIONS
	htmlFlags |= blackfriday.HTML_SMARTYPANTS_LATEX_DASHES
	htmlFlags |= blackfriday.HTML_SKIP_SCRIPT

	// set up the parser
	extensions := 0
	extensions |= blackfriday.EXTENSION_NO_INTRA_EMPHASIS
	extensions |= blackfriday.EXTENSION_TABLES
	extensions |= blackfriday.EXTENSION_FENCED_CODE
	extensions |= blackfriday.EXTENSION_AUTOLINK
	extensions |= blackfriday.EXTENSION_STRIKETHROUGH
	extensions |= blackfriday.EXTENSION_SPACE_HEADERS

	// Wrap up everything
	htmlRenderer := blackfriday.HtmlRenderer(htmlFlags, "", "")
	customRenderer := &CustomHtml{html: htmlRenderer, config: c}
	return &CustomMarkdownTransformer{renderer: customRenderer, extensions: extensions}
}

type CustomHtml struct {
	html blackfriday.Renderer
	config *config.Config
}

func executeSourceHighlight(lang string, source []byte, c *config.Config) ([]byte, error) {
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

func (p *CustomHtml) BlockCode(out *bytes.Buffer, text []byte, lang string) {
	doubleSpace(out)

	// parse out the language names/classes
	count := 0
	for _, elt := range strings.Fields(lang) {
		if elt[0] == '.' {
			elt = elt[1:]
		}
		if len(elt) == 0 {
			continue
		}
		if count == 0 {
			out.WriteString("<pre><code class=\"")
		} else {
			out.WriteByte(' ')
		}
		attrEscape(out, []byte(elt))
		count++
	}

	if count == 0 {
		out.WriteString("<pre><code>")
	} else {
		out.WriteString("\">")
	}

	if lang == "console" {
		attrEscape(out, text)
	} else {
		html, _ := executeSourceHighlight(lang, text, p.config)		
		out.Write(html)
	}

	out.WriteString("</code></pre>\n")
}

func (p *CustomHtml) BlockQuote(out *bytes.Buffer, text []byte) {
	p.html.BlockQuote(out, text)
}

func (p *CustomHtml) BlockHtml(out *bytes.Buffer, text []byte) {
	p.html.BlockHtml(out, text)
}

func (p *CustomHtml) Header(out *bytes.Buffer, text func() bool, level int) {
	p.html.Header(out, text, level)
}

func (p *CustomHtml) HRule(out *bytes.Buffer) {
	p.html.HRule(out)
}

func (p *CustomHtml) List(out *bytes.Buffer, text func() bool, flags int) {
	p.html.List(out, text, flags)
}

func (p *CustomHtml) ListItem(out *bytes.Buffer, text []byte, flags int) {
	p.html.ListItem(out, text, flags)
}

func (p *CustomHtml) Paragraph(out *bytes.Buffer, text func() bool) {
	p.html.Paragraph(out, text)
}

func (p *CustomHtml) Table(out *bytes.Buffer, header []byte, body []byte, columnData []int) {
	p.html.Table(out, header, body, columnData)
}

func (p *CustomHtml) TableRow(out *bytes.Buffer, text []byte) {
	p.html.TableRow(out, text)
}

func (p *CustomHtml) TableCell(out *bytes.Buffer, text []byte, flags int) {
	p.html.TableCell(out, text, flags)
}

func (p *CustomHtml) Footnotes(out *bytes.Buffer, text func() bool) {
	p.html.Footnotes(out, text)
}

func (p *CustomHtml) FootnoteItem(out *bytes.Buffer, name, text []byte, flags int) {
	p.html.FootnoteItem(out, name, text, flags)
}

// Span-level callbacks
func (p *CustomHtml) AutoLink(out *bytes.Buffer, link []byte, kind int) {
	p.html.AutoLink(out, link, kind)
}

func (p *CustomHtml) CodeSpan(out *bytes.Buffer, text []byte) {
	p.html.CodeSpan(out, text)
}
func (p *CustomHtml) DoubleEmphasis(out *bytes.Buffer, text []byte) {
	p.html.DoubleEmphasis(out, text)
}

func (p *CustomHtml) Emphasis(out *bytes.Buffer, text []byte) {
	p.html.Emphasis(out, text)
}

func (p *CustomHtml) Image(out *bytes.Buffer, link []byte, title []byte, alt []byte) {
	p.html.Image(out, link, title, alt)
}

func (p *CustomHtml) LineBreak(out *bytes.Buffer) {
	p.html.LineBreak(out)
}

func (p *CustomHtml) Link(out *bytes.Buffer, link []byte, title []byte, content []byte) {
	p.html.Link(out, link, title, content)
}

func (p *CustomHtml) RawHtmlTag(out *bytes.Buffer, tag []byte) {
	p.html.RawHtmlTag(out, tag)
}

func (p *CustomHtml) TripleEmphasis(out *bytes.Buffer, text []byte) {
	p.html.TripleEmphasis(out, text)
}

func (p *CustomHtml) StrikeThrough(out *bytes.Buffer, text []byte) {
	p.html.StrikeThrough(out, text)
}

func (p *CustomHtml) FootnoteRef(out *bytes.Buffer, ref []byte, id int) {
	p.html.FootnoteRef(out, ref, id)
}

// Low-level callbacks
func (p *CustomHtml) Entity(out *bytes.Buffer, entity []byte) {
	p.html.Entity(out, entity)
}

func (p *CustomHtml) NormalText(out *bytes.Buffer, text []byte) {
	p.html.NormalText(out, text)
}

// Header and footer
func (p *CustomHtml) DocumentHeader(out *bytes.Buffer) {
	p.html.DocumentHeader(out)
}

func (p *CustomHtml) DocumentFooter(out *bytes.Buffer) {
	p.html.DocumentFooter(out)
}

func attrEscape(out *bytes.Buffer, src []byte) {
	org := 0
	for i, ch := range src {
		// using if statements is a bit faster than a switch statement.
		// as the compiler improves, this should be unnecessary
		// this is only worthwhile because attrEscape is the single
		// largest CPU user in normal use
		if ch == '"' {
			if i > org {
				// copy all the normal characters since the last escape
				out.Write(src[org:i])
			}
			org = i + 1
			out.WriteString("&quot;")
			continue
		}
		if ch == '&' {
			if i > org {
				out.Write(src[org:i])
			}
			org = i + 1
			out.WriteString("&amp;")
			continue
		}
		if ch == '<' {
			if i > org {
				out.Write(src[org:i])
			}
			org = i + 1
			out.WriteString("&lt;")
			continue
		}
		if ch == '>' {
			if i > org {
				out.Write(src[org:i])
			}
			org = i + 1
			out.WriteString("&gt;")
			continue
		}
	}
	if org < len(src) {
		out.Write(src[org:])
	}
}

func doubleSpace(out *bytes.Buffer) {
	if out.Len() > 0 {
		out.WriteByte('\n')
	}
}
