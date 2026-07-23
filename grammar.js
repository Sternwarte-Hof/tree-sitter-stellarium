/**
 * @file Parser for Stellarium Scripting Engine
 * @author Tobias Feigel <info@feigel.it>
 * @license MIT
 * 
 * Stellarium scripting is based on ECMAScript (JavaScript) via Qt Script Engine.
 * This grammar supports ES5-compatible syntax with Stellarium-specific constructs.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "stellarium",

  externals: $ => [
    $._automatic_semicolon,
  ],

  extras: $ => [
    $.comment,
    /[\s\uFEFF\u2028\u2029\u2060\u200B]/,
  ],

  supertypes: $ => [
    $.statement,
    $.declaration,
    $.expression,
    $.primary_expression,
    $.pattern,
  ],

  inline: $ => [
    $._call_signature,
    $._formal_parameter,
    $._expressions,
    $._semicolon,
    $._identifier,
    $._reserved_identifier,
    $._lhs_expression,
    $._property_name,
    $._destructuring_pattern,
  ],

  precedences: $ => [
    [
      'member',
      'call',
      $.update_expression,
      'unary',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'binary_shift',
      'binary_compare',
      'binary_relation',
      'binary_equality',
      'bitwise_and',
      'bitwise_xor',
      'bitwise_or',
      'logical_and',
      'logical_or',
      'ternary',
      $.sequence_expression,
    ],
    ['assign', $.primary_expression],
    ['member', 'call', 'new', $.expression],
    ['declaration', 'literal'],
    [$.primary_expression, $.statement_block, 'object'],
  ],

  conflicts: $ => [
    [$.primary_expression, $.method_definition],
    [$.primary_expression, $.pattern],
    [$.primary_expression, $.binary_expression],
    [$.primary_expression, $.for_in_statement],
    [$.primary_expression, $.binary_expression, $.for_in_statement],
    [$.array, $.array_pattern],
    [$.array, $.computed_property_name],
    [$.object, $.object_pattern],
    [$.assignment_expression, $.pattern],
    [$.pair, $.sequence_expression],
    [$.if_statement],
  ],

  word: $ => $.identifier,

  rules: {
    program: $ => seq(
      optional($.hash_bang_line),
      repeat($.statement),
    ),

    hash_bang_line: _ => /#!.*/,

    // ============================================
    // STATEMENTS
    // ============================================

    statement: $ => choice(
      $.debugger_statement,
      $.expression_statement,
      $.declaration,
      $.statement_block,
      $.if_statement,
      $.switch_statement,
      $.for_statement,
      $.for_in_statement,
      $.while_statement,
      $.do_statement,
      $.try_statement,
      $.with_statement,
      $.break_statement,
      $.continue_statement,
      $.return_statement,
      $.throw_statement,
      $.empty_statement,
      $.labeled_statement,
    ),

    expression_statement: $ => seq(
      $._expressions,
      $._semicolon,
    ),

    declaration: $ => choice(
      $.function_declaration,
      $.variable_declaration,
    ),

    _variable_declaration: $ => seq(
      field('kind', choice('var', 'let', 'const')),
      commaSep1($.variable_declarator),
    ),

    variable_declaration: $ => seq(
      $._variable_declaration,
      $._semicolon,
    ),

    variable_declarator: $ => seq(
      field('name', choice(
        $.identifier,
        $._destructuring_pattern,
      )),
      optional($._initializer),
    ),

    statement_block: $ => seq(
      '{',
      repeat($.statement),
      '}',
    ),

    else_clause: $ => seq('else', $.statement),

    if_statement: $ => seq(
      'if',
      '(',
      field('condition', $._expressions),
      ')',
      field('consequence', $.statement),
      optional(field('alternative', $.else_clause)),
    ),

    switch_statement: $ => seq(
      'switch',
      '(',
      field('value', $._expressions),
      ')',
      field('body', $.switch_body),
    ),

    switch_body: $ => seq(
      '{',
      repeat(choice($.switch_case, $.switch_default)),
      '}',
    ),

    switch_case: $ => seq(
      'case',
      field('value', $._expressions),
      ':',
      field('body', repeat($.statement)),
    ),

    switch_default: $ => seq(
      'default',
      ':',
      field('body', repeat($.statement)),
    ),

    for_statement: $ => seq(
      'for',
      '(',
      choice(
        // In `for (...)`, variable declarations don't include a trailing semicolon.
        field('initializer', alias($._variable_declaration, $.variable_declaration)),
        field('initializer', optional($._expressions)),
      ),
      ';',
      field('condition', optional($._expressions)),
      ';',
      field('increment', optional($._expressions)),
      ')',
      field('body', $.statement),
    ),

    for_in_statement: $ => seq(
      'for',
      '(',
      choice(
        seq(
          field('kind', choice('var', 'let', 'const')),
          field('left', choice($.identifier, $._destructuring_pattern)),
        ),
        field('left', $._lhs_expression),
      ),
      'in',
      field('right', $._expressions),
      ')',
      field('body', $.statement),
    ),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $._expressions),
      ')',
      field('body', $.statement),
    ),

    do_statement: $ => seq(
      'do',
      field('body', $.statement),
      'while',
      '(',
      field('condition', $._expressions),
      ')',
      $._semicolon,
    ),

    try_statement: $ => seq(
      'try',
      field('body', $.statement_block),
      optional(field('handler', $.catch_clause)),
      optional(field('finalizer', $.finally_clause)),
    ),

    catch_clause: $ => seq(
      'catch',
      optional(seq('(', field('parameter', choice($.identifier, $._destructuring_pattern)), ')')),
      field('body', $.statement_block),
    ),

    finally_clause: $ => seq(
      'finally',
      field('body', $.statement_block),
    ),

    with_statement: $ => seq(
      'with',
      '(',
      field('object', $._expressions),
      ')',
      field('body', $.statement),
    ),

    break_statement: $ => seq(
      'break',
      optional(field('label', alias($.identifier, $.statement_identifier))),
      $._semicolon,
    ),

    continue_statement: $ => seq(
      'continue',
      optional(field('label', alias($.identifier, $.statement_identifier))),
      $._semicolon,
    ),

    debugger_statement: $ => seq(
      'debugger',
      $._semicolon,
    ),

    return_statement: $ => seq(
      'return',
      optional($._expressions),
      $._semicolon,
    ),

    throw_statement: $ => seq(
      'throw',
      $._expressions,
      $._semicolon,
    ),

    empty_statement: _ => ';',

    labeled_statement: $ => prec.dynamic(-1, seq(
      field('label', alias($.identifier, $.statement_identifier)),
      ':',
      field('body', $.statement),
    )),

    parenthesized_expression: $ => seq(
      '(',
      $._expressions,
      ')',
    ),

    // ============================================
    // EXPRESSIONS
    // ============================================

    _expressions: $ => choice(
      $.expression,
      $.sequence_expression,
    ),

    expression: $ => choice(
      $.primary_expression,
      $.assignment_expression,
      $.augmented_assignment_expression,
      $.unary_expression,
      $.binary_expression,
      $.ternary_expression,
      $.update_expression,
      $.new_expression,
    ),

    primary_expression: $ => choice(
      $.subscript_expression,
      $.member_expression,
      $.parenthesized_expression,
      $._identifier,
      alias($._reserved_identifier, $.identifier),
      $.this,
      $.number,
      $.string,
      $.regex,
      $.true,
      $.false,
      $.null,
      $.undefined,
      $.object,
      $.array,
      $.function_expression,
      $.call_expression,
    ),

    object: $ => prec('object', seq(
      '{',
      commaSep(optional(choice(
        $.pair,
        $.spread_element,
        $.method_definition,
        alias(
          choice($.identifier, $._reserved_identifier),
          $.shorthand_property_identifier,
        ),
      ))),
      '}',
    )),

    pair: $ => seq(
      field('key', $._property_name),
      ':',
      field('value', $.expression),
    ),

    method_definition: $ => seq(
      optional('get'),
      optional('set'),
      field('name', $._property_name),
      field('parameters', $.formal_parameters),
      field('body', $.statement_block),
    ),

    array: $ => seq(
      '[',
      commaSep(optional(choice(
        $.expression,
        $.spread_element,
      ))),
      ']',
    ),

    spread_element: $ => seq('...', $.expression),

    function_expression: $ => prec('literal', seq(
      'function',
      field('name', optional($.identifier)),
      $._call_signature,
      field('body', $.statement_block),
    )),

    function_declaration: $ => prec.right('declaration', seq(
      'function',
      field('name', $.identifier),
      $._call_signature,
      field('body', $.statement_block),
      optional($._semicolon),
    )),

    _call_signature: $ => field('parameters', $.formal_parameters),
    _formal_parameter: $ => choice($.pattern, $.assignment_pattern),

    formal_parameters: $ => seq(
      '(',
      optional(seq(
        commaSep1($._formal_parameter),
        optional(','),
      )),
      ')',
    ),

    member_expression: $ => prec('member', seq(
      field('object', choice($.expression, $.primary_expression)),
      '.',
      field('property', alias($.identifier, $.property_identifier)),
    )),

    subscript_expression: $ => prec('member', seq(
      field('object', choice($.expression, $.primary_expression)),
      '[',
      field('index', $._expressions),
      ']',
    )),

    call_expression: $ => prec('call', seq(
      field('function', $.expression),
      field('arguments', $.arguments),
    )),

    arguments: $ => seq(
      '(',
      commaSep(optional(choice($.expression, $.spread_element))),
      ')',
    ),

    new_expression: $ => prec.right('new', seq(
      'new',
      field('constructor', $.primary_expression),
      optional($.arguments),
    )),

    _lhs_expression: $ => choice(
      $.member_expression,
      $.subscript_expression,
      $._identifier,
      alias($._reserved_identifier, $.identifier),
      $._destructuring_pattern,
    ),

    assignment_expression: $ => prec.right('assign', seq(
      field('left', choice($.parenthesized_expression, $._lhs_expression)),
      '=',
      field('right', $.expression),
    )),

    augmented_assignment_expression: $ => prec.right('assign', seq(
      field('left', choice(
        $.member_expression,
        $.subscript_expression,
        alias($._reserved_identifier, $.identifier),
        $.identifier,
      )),
      field('operator', choice('+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '>>=', '>>>=', '<<=')),
      field('right', $.expression),
    )),

    _initializer: $ => seq(
      '=',
      field('value', $.expression),
    ),

    _destructuring_pattern: $ => choice(
      $.object_pattern,
      $.array_pattern,
    ),

    object_pattern: $ => prec('object', seq(
      '{',
      commaSep(optional(choice(
        $.pair_pattern,
        $.assignment_pattern,
        alias(
          choice($.identifier, $._reserved_identifier),
          $.shorthand_property_identifier_pattern,
        ),
      ))),
      '}',
    )),

    pair_pattern: $ => seq(
      field('key', $._property_name),
      ':',
      field('value', choice($.pattern, $.assignment_pattern)),
    ),

    array_pattern: $ => seq(
      '[',
      commaSep(optional(choice(
        $.pattern,
        $.assignment_pattern,
      ))),
      ']',
    ),

    assignment_pattern: $ => seq(
      field('left', $.pattern),
      '=',
      field('right', $.expression),
    ),

    pattern: $ => prec.dynamic(-1, choice(
      $._lhs_expression,
    )),

    ternary_expression: $ => prec.right('ternary', seq(
      field('condition', $.expression),
      '?',
      field('consequence', $.expression),
      ':',
      field('alternative', $.expression),
    )),

    binary_expression: $ => choice(
      ...[
        ['&&', 'logical_and'],
        ['||', 'logical_or'],
        ['>>', 'binary_shift'],
        ['>>>', 'binary_shift'],
        ['<<', 'binary_shift'],
        ['&', 'bitwise_and'],
        ['^', 'bitwise_xor'],
        ['|', 'bitwise_or'],
        ['+', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['%', 'binary_times'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['==', 'binary_equality'],
        ['===', 'binary_equality'],
        ['!=', 'binary_equality'],
        ['!==', 'binary_equality'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
        ['instanceof', 'binary_relation'],
        ['in', 'binary_relation'],
      ].map(([operator, precedence, associativity]) =>
        (associativity === 'right' ? prec.right : prec.left)(precedence, seq(
          field('left', operator === 'in' ? choice($.expression, $.identifier) : $.expression),
          field('operator', operator),
          field('right', $.expression),
        )),
      ),
    ),

    unary_expression: $ => prec.left('unary', seq(
      field('operator', choice('!', '~', '-', '+', 'typeof', 'void', 'delete')),
      field('argument', $.expression),
    )),

    update_expression: $ => prec.left(choice(
      seq(
        field('argument', $.expression),
        field('operator', choice('++', '--')),
      ),
      seq(
        field('operator', choice('++', '--')),
        field('argument', $.expression),
      ),
    )),

    sequence_expression: $ => prec.right(commaSep1($.expression)),

    // ============================================
    // PRIMITIVES & LITERALS
    // ============================================

    string: $ => choice(
      seq(
        '"',
        repeat(choice(
          alias($.unescaped_double_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        '"',
      ),
      seq(
        "'",
        repeat(choice(
          alias($.unescaped_single_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        "'",
      ),
    ),

    unescaped_double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
    unescaped_single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u\{[0-9a-fA-F]+\}/,
        /[\r]?[\n\u2028\u2029]/,
      ),
    )),

    comment: _ => token(choice(
      seq('//', /[^\r\n\u2028\u2029]*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),

    regex: $ => seq(
      '/',
      field('pattern', $.regex_pattern),
      token.immediate(prec(1, '/')),
      optional(field('flags', $.regex_flags)),
    ),

    regex_pattern: _ => token.immediate(prec(-1,
      repeat1(choice(
        seq(
          '[',
          repeat(choice(
            seq('\\', /./),
            /[^\]\n\\]/,
          )),
          ']',
        ),
        seq('\\', /./),
        /[^/\\\[\n]/,
      )),
    )),

    regex_flags: _ => token.immediate(/[gimsuy]+/),

    number: _ => {
      const hexLiteral = seq(
        choice('0x', '0X'),
        /[\da-fA-F](_?[\da-fA-F])*/,
      );
      const decimalDigits = /\d(_?\d)*/;
      const signedInteger = seq(optional(choice('-', '+')), decimalDigits);
      const exponentPart = seq(choice('e', 'E'), signedInteger);
      const binaryLiteral = seq(choice('0b', '0B'), /[0-1](_?[0-1])*/);
      const octalLiteral = seq(choice('0o', '0O'), /[0-7](_?[0-7])*/);

      const decimalIntegerLiteral = choice(
        '0',
        seq(optional('0'), /[1-9]/, optional(seq(optional('_'), decimalDigits))),
      );

      const decimalLiteral = choice(
        seq(decimalIntegerLiteral, '.', optional(decimalDigits), optional(exponentPart)),
        seq('.', decimalDigits, optional(exponentPart)),
        seq(decimalIntegerLiteral, exponentPart),
        decimalDigits,
      );

      return token(choice(
        hexLiteral,
        decimalLiteral,
        binaryLiteral,
        octalLiteral,
      ));
    },

    identifier: _ => /[_$a-zA-Z\u0080-\uffff][_$a-zA-Z0-9\u0080-\uffff]*/,

    _property_name: $ => choice(
      alias(choice($.identifier, $._reserved_identifier), $.property_identifier),
      $.string,
      $.number,
      $.computed_property_name,
    ),

    computed_property_name: $ => seq(
      '[',
      $.expression,
      ']',
    ),

    _reserved_identifier: _ => choice(
      'get',
      'set',
    ),

    _identifier: $ => choice(
      $.undefined,
      $.identifier,
    ),

    this: _ => 'this',
    true: _ => 'true',
    false: _ => 'false',
    null: _ => 'null',
    undefined: _ => 'undefined',

    _semicolon: $ => choice($._automatic_semicolon, ';'),
  },
});

// Helper functions
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
