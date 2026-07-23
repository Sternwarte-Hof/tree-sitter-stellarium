# tree-sitter-stellarium

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Stellarium](https://stellarium.org/) scripting language.

## About

Stellarium is a free open source planetarium application. Its scripts are evaluated by one of two Qt ECMAScript engines, depending on how Stellarium was built. This parser enables syntax highlighting, code navigation, and other IDE features for Stellarium scripts (`.ssc` and `.inc` files).

## Features

- Parse compatibility with all 90 scripts and includes in the pinned Stellarium 26.2 corpus
- Portable ECMAScript statement, expression, literal, ASI, and regular-expression forms used by Stellarium scripts
- Stellarium-specific API object highlighting
- Comments (single-line and multi-line)
- All control flow statements (if/else, for, while, switch, try/catch)
- Object and array literals with destructuring
- Function declarations and expressions
- Binary, unary, and ternary operators
- Regular expressions
- Hash-bang line support

The initial `0.1.x` grammar does not yet claim the complete Qt 6.2+
ECMAScript 2016 syntax profile. Its verified compatibility boundary is the
pinned Stellarium 26.2 corpus plus the portable syntax fixtures in this package.

## Installation

### For Zed IDE

Add to your Zed `settings.json`:

```json
{
  "languages": {
    "Stellarium Script": {
      "grammar": "tree-sitter-stellarium",
      "extensions": ["ssc", "inc"]
    }
  }
}
```

### For Neovim

Use with [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter):

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.stellarium = {
  install_info = {
    url = "https://github.com/fits-ki/tree-sitter-stellarium",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "ssc",
}
```

## Development

### Prerequisites

- Node.js
- tree-sitter CLI: `npm install -g tree-sitter-cli`
- A C compiler

### Build

```bash
# Install dependencies
npm install

# Generate parser
tree-sitter generate

# Run tests
tree-sitter test

# Parse a file
tree-sitter parse example.ssc

# Start playground
tree-sitter playground
```

### Project Structure

```
tree-sitter-stellarium/
├── grammar.js           # Grammar definition
├── src/
│   ├── parser.c         # Generated parser
│   ├── node-types.json  # Node type definitions
│   └── grammar.json     # Generated grammar
├── queries/
│   ├── highlights.scm   # Syntax highlighting
│   ├── locals.scm       # Variable scoping
│   ├── folds.scm        # Code folding
│   └── textobjects.scm  # Text objects for navigation
├── test/
│   └── corpus/
│       └── basic.txt    # Test cases
└── bindings/            # Language bindings
    ├── node/            # Node.js
    ├── python/          # Python
    ├── rust/            # Rust
    ├── go/              # Go
    └── swift/           # Swift
```

## Stellarium API Objects

The grammar highlights these built-in Stellarium objects:

### Core
- `core` - Main scripting API (StelMainScriptAPI)

### Display Managers
- `ConstellationMgr`, `AsterismMgr`, `StarMgr`, `NebulaMgr`
- `SolarSystem`, `LandscapeMgr`, `GridLinesMgr`
- `LabelMgr`, `MarkerMgr`, `ScreenImageMgr`
- `StelMovementMgr`, `StelSkyDrawer`, `StelSkyLayerMgr`
- `SpecialMarkersMgr`, `MilkyWay`, `ZodiacalLight`
- `HipsMgr`, `NomenclatureMgr`

### Plugins
- `Oculars`, `Satellites`, `Quasars`, `Pulsars`
- `Exoplanets`, `Observability`, `EquationOfTime`
- `NavStars`, `MeteorShowers`, `ArchaeoLines`
- `Calendars`, `TelescopeControl`

## License

MIT

## References

- [Stellarium Scripting Documentation](https://stellarium.org/doc/head/scripting.html)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [ECMAScript 2016 Specification](https://262.ecma-international.org/7.0/)
