import * as vscode from "vscode";

const kReservedWords = [
    "AND",  "ANY",  "AS",  "ASC",  "BETWEEN",  "BY",  "CASE",  "CROSS",  "DESC",  "DISTINCT",
    "ELSE",  "END",  "EVERY",  "FALSE",  "FROM",  "GROUP",  "HAVING",  "IN",  "INNER",  "IS",
    "JOIN",  "LEFT",  "LIKE",  "LIMIT",  "MATCH",  "META",  "MISSING",  "NATURAL",  "NOT",
    "NULL",  "MISSING",  "OFFSET",  "ON",  "OR",  "ORDER",  "OUTER",  "REGEX",  "RIGHT",
    "SATISFIES",  "SELECT",  "THEN",  "TRUE",  "USING",  "WHEN",  "WHERE",
    "COLLATE"
];

const kFunctions = [
    "array_avg",  "array_contains",  "array_count",  "array_ifnull",  "array_length",  "array_max",
    "array_min",  "array_of",  "array_sum",
    "greatest",  "least",
    "ifmissing",  "ifnull",  "ifmissingornull",  "missingif",  "nullif",
    "millis_to_str",  "millis_to_utc",  "str_to_millis",  "str_to_utc",
    "abs",  "acos",  "asin",  "atan",  "atan2",  "ceil",  "cos",  "degrees",  "e",  "exp",
    "floor",  "ln",  "log",  "pi",  "power",  "radians",  "round",  "sign",  "sin",  "sqrt",
    "tan",  "trunc",
    "regexp_contains",  "regexp_like",  "regexp_position",  "regexp_replace",
    "contains",  "length",  "lower",  "ltrim",  "rtrim",  "trim",  "upper",
    "isarray",  "isatom",  "isboolean",  "isnumber",  "isobject",  "isstring",  "type",  "toarray",
    "toatom",  "toboolean",  "tonumber",  "toobject",  "tostring",
    "rank",
    "avg",  "count",  "max",  "min",  "sum",
    "prediction",  "euclidean_distance",  "cosine_distance",
];

const kAllCompletions = kReservedWords.map(s => new vscode.CompletionItem(s, vscode.CompletionItemKind.Keyword))
    .concat(kFunctions.map(s => new vscode.CompletionItem(s, vscode.CompletionItemKind.Function)));

export const SqlppProvider = {
    provideCompletionItems,
    resolveCompletionItem
};

export async function resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken)
{
    if(item.kind === vscode.CompletionItemKind.Keyword) {
        return item;
    }

    item.insertText = item.label + "(";
    return item;
}

export async function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position)
    : Promise<vscode.CompletionItem[]>
{
    return shouldProvide(document, position) ?
        provide(document, position) :
        Promise.resolve([]);
}

function shouldProvide(document: vscode.TextDocument, position: vscode.Position) {
    return true;
}

async function provide(document: vscode.TextDocument, position: vscode.Position)
    : Promise<vscode.CompletionItem[]>
{
    return kAllCompletions;
}