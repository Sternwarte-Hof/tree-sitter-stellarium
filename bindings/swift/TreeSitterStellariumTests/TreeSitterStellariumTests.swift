import XCTest
import SwiftTreeSitter
import TreeSitterStellarium

final class TreeSitterStellariumTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_stellarium())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Stellarium Scripting Engine grammar")
    }
}
