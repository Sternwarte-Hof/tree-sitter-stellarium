use tree_sitter::Parser;
use tree_sitter_stellarium::LANGUAGE;

fn parse(text: &str) -> tree_sitter::Tree {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE.into())
        .expect("Error loading Stellarium parser");
    parser.parse(text, None).expect("Parse returned None")
}

#[test]
fn expression_statement_without_semicolon_parses() {
    let tree = parse("core.moveToRaDec()\nLabelMgr.deleteAllLabels();");
    assert!(!tree.root_node().has_error());
}

#[test]
fn assignment_without_semicolon_parses() {
    let tree = parse("var x = 1\nvar y = 2");
    assert!(!tree.root_node().has_error());
}
