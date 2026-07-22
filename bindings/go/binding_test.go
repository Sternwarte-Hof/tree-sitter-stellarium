package tree_sitter_stellarium_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_stellarium "github.com/fits-ki/tree-sitter-stellarium/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_stellarium.Language())
	if language == nil {
		t.Errorf("Error loading Stellarium Scripting Engine grammar")
	}
}
