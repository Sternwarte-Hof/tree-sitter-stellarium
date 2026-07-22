use std::path::{Path, PathBuf};
use tree_sitter::Parser;
use tree_sitter_stellarium::LANGUAGE;

fn parse(text: &str) -> tree_sitter::Tree {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE.into())
        .expect("Error loading Stellarium parser");
    parser.parse(text, None).expect("Parse returned None")
}

fn corpus_root() -> &'static Path {
    Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap()
}

fn pin_value<'a>(content: &'a str, key: &str) -> &'a str {
    let line = content
        .lines()
        .find(|l| l.trim_start().starts_with(key))
        .unwrap_or_else(|| panic!("pin.toml missing key: {key}"));
    let mut parts = line.splitn(2, '=');
    let _key = parts.next().expect("key");
    let value = parts.next().unwrap_or_else(|| panic!("pin.toml key has no value: {key}")).trim();
    value.trim_matches('"')
}

fn collect_corpus_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let entries = std::fs::read_dir(dir).unwrap_or_else(|e| panic!("read_dir {}: {e}", dir.display()));
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_corpus_files(&path, out);
        } else if path.is_file() {
            let ext = path.extension().and_then(|s| s.to_str());
            if ext == Some("ssc") || ext == Some("inc") {
                out.push(path);
            }
        }
    }
}

#[test]
fn compatibility_corpus_parses_without_errors() {
    let pin_path = corpus_root().join("pins/stellarium/26.2/pin.toml");
    let pin_content = std::fs::read_to_string(&pin_path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", pin_path.display()));
    let expected_count: usize = pin_value(&pin_content, "files")
        .parse()
        .expect("pin corpus file count should be a number");
    let expected_tree = pin_value(&pin_content, "source_tree");

    let scripts_dir = corpus_root().join("scripts");
    assert!(scripts_dir.is_dir(), "scripts/ directory should exist");

    let mut files = Vec::new();
    collect_corpus_files(&scripts_dir, &mut files);
    assert_eq!(
        files.len(),
        expected_count,
        "corpus file count must match the Active Pin Snapshot"
    );
    assert_eq!(
        expected_tree,
        "37781849cb1c0486e2a79c6075d438f05ff1b5ad",
        "corpus source tree must match the pinned tree"
    );

    let mut failures = Vec::new();
    for path in files {
        let source = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
        let tree = parse(&source);
        if tree.root_node().has_error() {
            failures.push(path.strip_prefix(corpus_root()).unwrap().to_path_buf());
        }
    }

    assert!(
        failures.is_empty(),
        "{} corpus file(s) parsed with errors:\n{}",
        failures.len(),
        failures
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join("\n")
    );
}
