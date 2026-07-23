use tree_sitter::Parser;
use tree_sitter_stellarium::LANGUAGE;

fn parse(text: &str) -> tree_sitter::Tree {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE.into())
        .expect("Error loading Stellarium parser");
    parser.parse(text, None).expect("Parse returned None")
}

fn assert_parses(name: &str, source: &str) {
    let tree = parse(source);
    assert!(
        !tree.root_node().has_error(),
        "{name} must parse without errors:\n{}",
        tree.root_node().to_sexp()
    );
}

#[test]
fn parses_portable_ecmascript_statement_forms() {
    let source = r#"
debugger;
var value = 0;
label: for (var key in {answer: 42}) {
    if (key === "answer") continue label;
    while (value < 3) value++;
    do { value--; } while (value > 0);
    switch (value) {
        case 0: break;
        default: throw new Error("unexpected");
    }
}
try { value = 1; } catch (error) { value = 2; } finally { value = 3; }
with ({value: value}) { value = 4; }
"#;
    assert_parses("portable ECMAScript statements", source);
    assert!(
        parse(source).root_node().to_sexp().contains("(debugger_statement)"),
        "debugger must be represented as a statement, not an identifier expression"
    );
}

#[test]
fn parses_portable_ecmascript_literals_and_accessors() {
    assert_parses(
        "portable ECMAScript literals and accessors",
        r#"
var pattern = /a\/b[0-9]\s+/gi;
var object = {
    default: 1,
    get value() { return this.default; },
    set value(next) { this.default = next; }
};
var sparse = [1,,,3,];
var escaped = "line\\nfeed\\u0021";
"#,
    );
}

#[test]
fn rejects_unambiguously_invalid_syntax() {
    for source in ["var value = ;", "function broken( {", "'unterminated"] {
        let tree = parse(source);
        assert!(
            tree.root_node().has_error(),
            "invalid source must produce a parse error: {source}"
        );
    }
}
