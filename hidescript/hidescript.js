/**
 * 残作業
 * 文字列リテラルのエスケープ処理 \ \" \n 等
 * if / while の条件の型判定（整数型であることのチェック）
 * a["xxx"] = 1; が通る。配列の添字は数値のみ
 * 全体的に void 型のチェックが甘い
 *
 * 改善項目
 * constを実装してもよいのでは?
 *
 * 二項演算子の型のチェックがない … 済
 * コメント … 済
 */
var symNew = 0;
var symVar = 1;
var symNumber = 2;
var symBoolean = 3;
var symString = 4;
var symVoid = 5;
var symFunction = 6;
var symReturn = 7;
var symIf = 8;
var symElse = 9;
var symWhile = 10;
var symDo = 11;
var symBreak = 12;
var symContinue = 13;
var symDummy = 14;
var symDigit = 20;
var symStringLiteral = 21;
var symIdent = 22;
var symComma = 23;
var symSemicolon = 24;
var symColon = 25;
var symAssignment = 26;
var symLambdaOp = 27;
var symMulOp = 30;
var symAddOp = 31;
var symCmpOp = 32;
var symUnaryOp = 33;
var symBitXor = 34;
var symBitAnd = 35;
var symBitOr = 36;
var symLogicalAnd = 37;
var symLogicalOr = 38;
var symLParen = 40;
var symRParen = 41;
var symLCurlyBrace = 42;
var symRCurlyBrace = 43;
var symLBracket = 44;
var symRBracket = 45;
var symEOF = 46;
var keyword = new Array();
var symTable = new Array();
keyword[symNew] = "new";
keyword[symVar] = "var";
keyword[symNumber] = "number";
keyword[symBoolean] = "boolean";
keyword[symString] = "string";
keyword[symVoid] = "void";
keyword[symFunction] = "function";
keyword[symReturn] = "return";
keyword[symIf] = "if";
keyword[symElse] = "else";
keyword[symWhile] = "while";
keyword[symDo] = "do";
keyword[symBreak] = "break";
keyword[symContinue] = "continue";
keyword[symDummy] = "$$dummy";
var keywordStart = symNew;
var keywordEnd = symDummy;
var ch = "";
var srcText;
var symKind;
var operator; // 演算子 ">=" 等
var ident; // 識別子
var digitValue; // 数値
var stringValue; // 文字列リテラル
// 以下は識別子情報
var currentLevel = 0;
var identsName = new Array();
var identsType = new Array();
var identsLevel = new Array();
var nIdents = 0;
var currentFuncType; // 現在の関数の型 s n v のいずれか
/*
 * typeName : n .. number  s .. string   f .. function
 *
 */
function register(varName, typeName, level) {
    identsName[nIdents] = varName;
    identsType[nIdents] = typeName;
    identsLevel[nIdents] = level;
    var retval = nIdents;
    nIdents = nIdents + 1;
    return retval;
}
function registerBuiltinFunction(name, types) {
    register(name, "F" + types, 0);
}
// 以下、組み込み関数の宣言
//
registerBuiltinFunction("basename", "s");
registerBuiltinFunction("_delete", "v");
registerBuiltinFunction("disabledraw", "v");
registerBuiltinFunction("down", "v");
registerBuiltinFunction("enabledraw", "v");
registerBuiltinFunction("endmacro", "v");
registerBuiltinFunction("findhidemaru", "ns");
registerBuiltinFunction("gettext", "snnnn");
registerBuiltinFunction("insert", "vs");
registerBuiltinFunction("macrodir", "s");
registerBuiltinFunction("message", "vs");
registerBuiltinFunction("openfile", "vs");
registerBuiltinFunction("selectall", "v");
registerBuiltinFunction("selendx", "n");
registerBuiltinFunction("selendy", "n");
registerBuiltinFunction("seltopx", "n");
registerBuiltinFunction("seltopy", "n");
registerBuiltinFunction("setactivehidemaru", "vn");
registerBuiltinFunction("str", "sn");
registerBuiltinFunction("tickcount", "n");
registerBuiltinFunction("val", "ns");
registerBuiltinFunction("version", "n");
registerBuiltinFunction("wcsleftstr", "ssn");
registerBuiltinFunction("wcslen", "ns");
registerBuiltinFunction("wcsmidstr", "ssnn");
registerBuiltinFunction("wcsstrrstr", "nss");
function syntaxError(msg) {
    message(msg);
    message(wcsmidstr(srcText, 0, 100));
    symKind = symEOF;
    endmacro();
}
function isAlpha(ch) {
    return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
}
function isAlnum(ch) {
    return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9");
}
function isDigit(ch) {
    return (ch >= "0" && ch <= "9");
}
function nextChar() {
    ch = wcsmidstr(srcText, 0, 1);
    srcText = wcsmidstr(srcText, 1);
    return ch;
}
function nextSym() {
    var oldSym = symKind;
    while (1) {
        while (ch == " " || ch == "\t" || ch == "\r" || ch == "\n") {
            ch = nextChar();
        }
        if (ch == "") {
            symKind = symEOF;
            return;
        }
        if (ch == '/') {
            nextChar();
            if (ch == "/") {
                var term = "";
                do {
                    ch = nextChar();
                    term = term + ch;
                    if (term == "EOF") {
                        symKind = symEOF;
                        return;
                    }
                } while (ch != '\n' && ch != "");
                continue;
            }
            else if (ch == "*") {
                nextChar();
                while (1) {
                    if (ch == "") {
                        syntaxError("コメントが閉じられないままEOFに達しました");
                        return;
                    }
                    else if (ch == '*') {
                        nextChar();
                        if (ch == '/') {
                            nextChar();
                            break;
                        }
                    }
                    else
                        nextChar();
                }
                continue;
            }
            else {
                symKind = symMulOp;
                operator = "/";
                return;
            }
        }
        if (isAlpha(ch) || ch == "_") {
            var s = "";
            do {
                s = s + ch;
                nextChar();
            } while (isAlnum(ch) || ch == "_");
            var i = keywordStart;
            while (i <= keywordEnd) {
                if (keyword[i] == s) {
                    symKind = i;
                    if (symKind == symBoolean)
                        symKind = symNumber;
                    return;
                }
                i = i + 1;
            }
            ident = s;
            symKind = symIdent;
            return;
        }
        if (isDigit(ch)) {
            var digit = "";
            do {
                digit = digit + ch;
                nextChar();
            } while (isDigit(ch));
            digitValue = val(digit);
            symKind = symDigit;
            return;
        }
        if (ch == '\"' || ch == "'") {
            var terminator = ch;
            var stringLiteral = "";
            nextChar();
            while (ch != terminator) {
                stringLiteral = stringLiteral + ch;
                nextChar();
                if (wcslen(ch) == 0) {
                    symKind = symEOF;
                    return;
                }
            }
            nextChar();
            stringValue = stringLiteral;
            symKind = symStringLiteral;
            return;
        }
        if (ch == ',') {
            symKind = symComma;
            nextChar();
            return;
        }
        if (ch == ';') {
            symKind = symSemicolon;
            nextChar();
            return;
        }
        if (ch == ':') {
            symKind = symColon;
            nextChar();
            return;
        }
        if (ch == '=') {
            nextChar();
            if (ch == '=') {
                symKind = symCmpOp;
                operator = "==";
                nextChar();
            }
            else if (ch == '>') {
                symKind = symLambdaOp;
                nextChar();
            }
            else
                symKind = symAssignment;
            return;
        }
        if (ch == '&') {
            nextChar();
            if (ch == '&') {
                symKind = symLogicalAnd;
                operator = "&&";
                nextChar();
            }
            else
                syntaxError("意図しない文字があります");
            return;
        }
        if (ch == '|') {
            nextChar();
            if (ch == '|') {
                symKind = symLogicalOr;
                operator = "||";
                nextChar();
            }
            else
                syntaxError("意図しない文字があります");
            return;
        }
        if (ch == '~') {
            symKind = symUnaryOp;
            operator = '~';
            nextChar();
            return;
        }
        if (ch == '!') {
            ch = nextChar();
            if (ch == '=') {
                symKind = symCmpOp;
                operator = "!=";
                nextChar();
            }
            else {
                symKind = symUnaryOp;
                operator = '!';
            }
            return;
        }
        if (ch == '>') {
            symKind = symCmpOp;
            ch = nextChar();
            if (ch == '=') {
                operator = ">=";
                nextChar();
            }
            else
                operator = ">";
            return;
        }
        if (ch == '<') {
            symKind = symCmpOp;
            ch = nextChar();
            if (ch == '=') {
                operator = "<=";
                nextChar();
            }
            else {
                operator = "<";
            }
            return;
        }
        if (ch == '*' || ch == '%') {
            symKind = symMulOp;
            operator = ch;
            nextChar();
            return;
        }
        if (ch == '+' || ch == '-') {
            symKind = symAddOp;
            operator = ch;
            nextChar();
            return;
        }
        if (ch == '(') {
            symKind = symLParen;
            nextChar();
            return;
        }
        if (ch == ')') {
            symKind = symRParen;
            nextChar();
            return;
        }
        if (ch == '{') {
            symKind = symLCurlyBrace;
            nextChar();
            return;
        }
        if (ch == '}') {
            symKind = symRCurlyBrace;
            nextChar();
            return;
        }
        if (ch == '[') {
            symKind = symLBracket;
            nextChar();
            return;
        }
        if (ch == ']') {
            symKind = symRBracket;
            nextChar();
            return;
        }
        syntaxError("意図しない文字があります");
        return;
    }
}
function initCompiler(text) {
    srcText = text;
    nextChar();
    nextSym();
}
function checkSym(sym, symStr) {
    if (symKind == sym) {
        nextSym();
        return;
    }
    syntaxError(symStr + 'が必要です');
}
function searchIdent(varName) {
    var i = nIdents - 1;
    while (i >= 0) {
        if (identsName[i] == varName)
            return i;
        i = i - 1;
    }
    return -1;
}
function dumpIdents() {
    insert("// --------------------\n");
    var i = 0;
    while (i < nIdents) {
        insert("// " + identsName[i] + ":" + identsType[i] + ":" + str(identsLevel[i]) + "\n");
        i = i + 1;
    }
    insert("// --------------------\n");
}
var tempCode = "";
function genTempCode() {
    if (tempCode > "") {
        insert(tempCode + "\n");
        tempCode = "";
    }
}
function genCode(code) {
    genTempCode();
    insert(code + "\n");
}
function genReturnVar(type) {
    if (type == "s") {
        return "$$return";
    }
    else {
        return "##return";
    }
}
function pushTempCode(code) {
    tempCode = tempCode + code;
}
function popTempCode() {
    var code = tempCode;
    tempCode = "";
    return code;
}
var expression;
var statement;
function genVar(pos) {
    var varType = wcsmidstr(identsType[pos], 0, 1);
    var typeChar = varType;
    var varPrefix = "$";
    var array = 0;
    if (typeChar == "n") {
        varPrefix = "#";
    }
    else if (typeChar == "S") {
        array = 1;
        typeChar = "s";
    }
    else if (typeChar == "N") {
        array = 1;
        typeChar = "n";
        varPrefix = "#";
    }
    var code;
    if (identsLevel[pos] == 0) {
        code = "0" + typeChar + "L" + varPrefix + identsName[pos];
    }
    else if (identsLevel[pos] < 0) {
        code = "0" + typeChar + "L" + varPrefix + varPrefix + str(-identsLevel[pos]);
    }
    else {
        code = "0" + typeChar + "L" + varPrefix + varPrefix + identsName[pos];
    }
    if (array) {
        if (symKind != symLBracket)
            syntaxError("[が必要です");
        while (symKind == symLBracket) {
            nextSym();
            var code2 = expression();
            code = code + "[" + wcsmidstr(code2, 3) + "]"; // todo code2の型チェック
            checkSym(symRBracket, "]");
        }
    }
    return code;
}
var nTempVars = 0;
var nTempLable = 0;
var currentBreakLabel = -1;
var currentContinueLabel = -1;
function getTempLabels(n) {
    var L = nTempLable;
    nTempLable = nTempLable + n;
    return L;
}
function validLabel(n) {
    return n >= 0;
}
// 関数呼び出し用の一時変数を生成する。現状は右辺値のみとする
//
function genTempVar(type) {
    var varname = "_" + str(nTempVars);
    nTempVars = nTempVars + 1;
    if (type == "s") {
        if (currentLevel == 0) {
            return "0sR$" + varname;
        }
        else {
            return "0sR$$" + varname;
        }
    }
    else {
        if (currentLevel == 0) {
            return "0nR#" + varname;
        }
        else {
            return "0nR##" + varname;
        }
    }
}
function variableOrFunctionCall() {
    var pos = searchIdent(ident);
    if (pos < 0) {
        syntaxError(ident + "が見つかりません");
    }
    nextSym();
    var type = wcsmidstr(identsType[pos], 0, 1);
    if (type == "s" || type == "S" || type == "n" || type == "N") {
        return genVar(pos);
    }
    else if (type == "f" || type == "x") {
        if (type == "x" && symKind != symLParen)
            return genVar(pos);
        var funcType = wcsmidstr(identsType[pos], 1, 1);
        var code = "call " + identsName[pos] + " ";
        checkSym(symLParen, '(');
        if (symKind != symRParen) {
            while (1) {
                var codeParam = expression();
                code = code + " " + wcsmidstr(codeParam, 3); // todo 型チェック
                if (symKind != symComma)
                    break;
                code = code + ",";
                nextSym();
            }
        }
        checkSym(symRParen, ')');
        pushTempCode(code + ";");
        var tempVar = genTempVar(funcType);
        pushTempCode(wcsmidstr(tempVar, 3) + "=" + genReturnVar(funcType) + ";");
        return tempVar;
    }
    else if (type == "F") {
        var funcType = wcsmidstr(identsType[pos], 1, 1);
        var code;
        var funcName = identsName[pos];
        if (wcsleftstr(funcName, 1) == "_") {
            funcName = wcsmidstr(funcName, 1);
        }
        if (funcType == "v")
            code = funcName + " ";
        else if (wcslen(identsType[pos]) == 2)
            code = funcName;
        else
            code = identsName[pos] + "(";
        checkSym(symLParen, '(');
        if (symKind != symRParen) {
            while (1) {
                var codeParam = expression();
                code = code + " " + wcsmidstr(codeParam, 3);
                if (symKind != symComma)
                    break;
                code = code + ",";
                nextSym();
            }
        }
        if (funcType != "v" && wcslen(identsType[pos]) != 2)
            code = code + ")";
        checkSym(symRParen, ')');
        return "0" + funcType + "R" + code;
    }
    else {
        syntaxError("不正な識別子です（コンパイラのバグ?）");
    }
}
function factor() {
    if (symKind == symLParen) {
        nextSym();
        var code = expression();
        var priority = wcsmidstr(code, 0, 1);
        checkSym(symRParen, ")");
        return wcsmidstr(code, 0, 2) + "R" + wcsmidstr(code, 3);
    }
    else if (symKind == symIdent) {
        return variableOrFunctionCall();
    }
    else if (symKind == symDigit) {
        var dValue = digitValue;
        nextSym();
        return "0nR" + str(dValue);
    }
    else if (symKind == symStringLiteral) {
        var sValue = stringValue;
        nextSym();
        return '0sR\"' + sValue + '\"';
    }
    else {
        syntaxError("識別子か数値が必要です");
    }
}
function unaryExpression() {
    var ops = "";
    var logicalNot = 0;
    while (symKind == symAddOp || symKind == symUnaryOp) {
        if (operator == '!')
            logicalNot = 1;
        var ops = ops + operator;
        nextSym();
    }
    var code = factor();
    var priority = wcsmidstr(code, 0, 1);
    var type1 = wcsmidstr(code, 1, 1);
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    if (symKind == symUnaryOp && type1 != "n")
        syntaxError("数値型が必要です");
    if (ops != "" && priority > "1")
        code = ops + "(" + code + ")";
    else
        code = ops + code;
    if (logicalNot) {
        // code = "(" + code + ")";
        priority = "5";
    }
    return priority + type1 + LRvalue + code;
}
function term() {
    var code = unaryExpression();
    var priority = wcsmidstr(code, 0, 1);
    var type = wcsmidstr(code, 1, 1);
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    if (symKind == symMulOp) {
        if (type != "n") {
            syntaxError("数値型が必要です");
        }
        if (priority > "2") {
            code = "(" + code + ")";
        }
        priority = "2";
        LRvalue = "R";
    }
    while (symKind == symMulOp) {
        var op = operator;
        nextSym();
        var code2 = unaryExpression();
        if (wcsmidstr(code2, 1, 1) != "n") {
            syntaxError("数値型が必要です");
        }
        if (wcsmidstr(code2, 0, 1) > "2") {
            code = "(" + code + ")";
        }
        code = code + op + wcsmidstr(code2, 3);
    }
    return priority + type + LRvalue + code;
}
function simpleExpression() {
    var code = term();
    var priority = wcsmidstr(code, 0, 1);
    var type = wcsmidstr(code, 1, 1);
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    if (symKind == symAddOp) {
        if (operator == "-" && type != "n") {
            syntaxError("文字列の引き算はできません");
        }
        if (priority > "3") {
            code = "(" + code + ")";
        }
        priority = "3";
        LRvalue = "R";
    }
    while (symKind == symAddOp) {
        var op = operator;
        /***
        if (op == "-" && type == "s") {
            syntaxError("文字列の引き算はできません");
        }
        ***/
        nextSym();
        var code2 = term();
        if (wcsmidstr(code2, 1, 1) != type) {
            syntaxError("文字列と数値の足し算はできません");
        }
        if (wcsmidstr(code2, 0, 1) > "3") {
            code = "(" + code + ")";
        }
        code = code + op + wcsmidstr(code2, 3);
    }
    return priority + type + LRvalue + code;
}
function cmpExpression() {
    var code = simpleExpression();
    var priority = wcsmidstr(code, 0, 1);
    var type1 = wcsmidstr(code, 1, 1);
    var eType = type1;
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    while (symKind == symCmpOp) {
        priority = "4";
        eType = "n"; // 文字列の比較の場合、式の型は数値になるための処理
        LRvalue = "R";
        var op = operator;
        nextSym();
        var code2 = simpleExpression();
        if (wcsmidstr(code2, 1, 1) != type1) {
            syntaxError("文字列と数値の比較はできません");
        }
        code = code + op + wcsmidstr(code2, 3);
    }
    return priority + eType + LRvalue + code;
}
function logicalAnd() {
    var code = cmpExpression();
    var priority = wcsmidstr(code, 0, 1);
    var type1 = wcsmidstr(code, 1, 1);
    var eType = type1;
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    while (symKind == symLogicalAnd) {
        priority = "5";
        LRvalue = "R";
        nextSym();
        var code2 = cmpExpression();
        if (type1 != "n" || wcsmidstr(code2, 1, 1) != "n") {
            syntaxError("文字列の論理ANDはできません");
        }
        code = code + " && " + wcsmidstr(code2, 3);
    }
    return priority + eType + LRvalue + code;
}
expression = function () {
    var code = logicalAnd();
    var priority = wcsmidstr(code, 0, 1);
    var type = wcsmidstr(code, 1, 1);
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    if (symKind == symLogicalOr) {
        if (type != "n") {
            syntaxError("文字列の論理ORはできません");
        }
        if (priority == "5") {
            code = "(" + code + ")";
        }
        priority = "6";
        LRvalue = "R";
    }
    while (symKind == symLogicalOr) {
        nextSym();
        var code2 = logicalAnd();
        var priority2 = wcsmidstr(code2, 0, 1);
        var type2 = wcsmidstr(code2, 1, 1);
        if (type2 != "n") {
            syntaxError("文字列の論理ORはできません");
        }
        code2 = wcsmidstr(code2, 3);
        if (priority2 == "5") {
            code2 = "(" + code2 + ")";
        }
        code = code + " || " + code2;
    }
    return priority + type + LRvalue + code;
};
function parameter(n) {
    var paramName = ident;
    var type = "";
    checkSym(symIdent, "識別子");
    checkSym(symColon, ":");
    if (symKind == symNumber) {
        type = "n";
    }
    else if (symKind == symString) {
        type = "s";
    }
    else {
        syntaxError("型名が必要です");
    }
    register(paramName, type, -n);
    nextSym();
    return type;
}
function parameterList() {
    var n = 1;
    var paramTypes = "";
    while (1) {
        paramTypes = paramTypes + parameter(n);
        if (symKind != symComma)
            break;
        nextSym();
        n = n + 1;
    }
    return paramTypes;
}
function statementList(endSym) {
    while (symKind != endSym) {
        statement();
    }
}
function defFunction(funcName) {
    var funcPos = 0;
    var funcType = "fv";
    var funcTypeFw = "";
    if (currentLevel != 0)
        syntaxError('関数のネストはできません');
    if (funcName == "") {
        checkSym(symIdent, "識別子");
        funcName = ident;
        funcPos = register(funcName, funcType, 0);
    }
    else {
        funcPos = searchIdent(funcName);
        funcTypeFw = identsType[funcPos];
    }
    genCode("goto _end_" + funcName);
    genCode(funcName + ":");
    currentFuncType = "v"; // 関数の戻り値型を指定しない場合のデフォルトはvoidとする
    var saveNIdents = nIdents; // 識別子の個数を保存しておく
    checkSym(symLParen, "(");
    var paramTypes = "";
    if (symKind == symIdent) {
        paramTypes = parameterList();
    }
    checkSym(symRParen, ")");
    if (symKind == symColon) {
        nextSym();
        if (symKind == symVoid) {
            // 何もしない
        }
        else if (symKind == symNumber) {
            funcType = "fn";
            currentFuncType = "n";
        }
        else if (symKind == symString) {
            funcType = "fs";
            currentFuncType = "s";
        }
        else {
            syntaxError("型名が必要です");
        }
        nextSym(); // 型名の読み飛ばし
    }
    funcType = funcType + paramTypes;
    identsType[funcPos] = funcType; // forwardでない場合
    currentLevel = 1; // レベルをローカル（関数の中）とする
    checkSym(symLCurlyBrace, "{");
    statementList(symRCurlyBrace); // 関数の実体
    checkSym(symRCurlyBrace, "}");
    nIdents = saveNIdents; // 識別子の個数を戻す（ローカル変数をテーブルから削除）
    currentLevel = 0; // レベルをグローバルに戻す
    genCode("return;");
    genCode("_end_" + funcName + ":");
}
function assignmentExpression() {
    var code = factor();
    var type1 = wcsmidstr(code, 1, 1);
    var LRvalue = wcsmidstr(code, 2, 1);
    code = wcsmidstr(code, 3);
    if (symKind == symAssignment) {
        if (LRvalue == "R")
            syntaxError("代入文の左辺には左辺値が必要です");
        nextSym();
        if (symKind == symFunction) {
            nextSym();
            defFunction(wcsmidstr(code, 1));
        }
        else {
            var code2 = expression();
            if (wcsmidstr(code2, 1, 1) != type1) {
                syntaxError("文字列と数値の型が異なる代入はできません");
            }
            code = code + "=" + wcsmidstr(code2, 3);
            genCode(code + ";");
        }
    }
    else {
        // ここは単なる関数呼び出しの場合なので、関数呼び出しは tempとして出力されている。戻り値の値は生成する必要はない
        // ↑ この想定は間違いだった。戻り値のない関数呼び出しは違う?
        if (type1 != "v")
            code = "";
        else
            code = code + ";";
        genCode(code);
        var dummy = 1;
    }
    return;
}
function checkType() {
    var typeName;
    if (symKind == symNumber) {
        typeName = "n";
    }
    else {
        typeName = "s";
    }
    nextSym();
    if (symKind == symLBracket) {
        nextSym();
        if (typeName == "n") {
            typeName = "NL";
        }
        else {
            typeName = "SL";
        }
        checkSym(symRBracket, "]");
        if (symKind == symAssignment) {
            nextSym();
            checkSym(symNew, "new");
            checkSym(symIdent, "Array"); // todo "Array" という識別子であることのチェックが漏れている
            checkSym(symLParen, "(");
            checkSym(symRParen, ")");
        }
    }
    else {
        typeName = typeName + "L";
    }
    return typeName;
}
function checkFunction() {
    var paramTypes = "";
    nextSym(); // ( の読み飛ばし
    if (symKind == symIdent) {
        paramTypes = parameterList();
    }
    checkSym(symRParen, ")");
    checkSym(symLambdaOp, "=>");
    var funcType;
    if (symKind == symVoid) {
        funcType = "xv";
    }
    else if (symKind == symNumber) {
        funcType = "xn";
    }
    else if (symKind == symString) {
        funcType = "xs";
    }
    else {
        syntaxError("型名が必要です");
    }
    nextSym(); // 型名の読み飛ばし
    return funcType + paramTypes;
}
function varStatement() {
    checkSym(symIdent, "識別子");
    var varName = ident;
    if (symKind == symColon) {
        nextSym();
        if (symKind == symNumber || symKind == symString) {
            var typeName = checkType();
            register(varName, typeName, currentLevel);
        }
        else if (symKind == symLParen) {
            var typeName = checkFunction();
            register(varName, typeName, currentLevel);
        }
        else {
            syntaxError('型名が必要です');
        }
    }
    else if (symKind == symAssignment) {
        nextSym();
        var code1 = expression();
        typeName = wcsmidstr(code1, 1, 1);
        var pos = register(varName, typeName, currentLevel);
        var code2 = genVar(pos);
        genCode(wcsmidstr(code2, 3) + "=" + wcsmidstr(code1, 3) + ";"); // todo 左辺の型チェックが抜けている
    }
    else {
        syntaxError('式またはコロンが必要です');
    }
}
function getLabel(n) {
    return "_LL" + str(n);
}
function genLabel(n) {
    genCode(getLabel(n) + ":");
}
function ifStatement() {
    checkSym(symLParen, "(");
    var cmpCode = expression();
    checkSym(symRParen, ")");
    genCode("if ( " + wcsmidstr(cmpCode, 3) + ") {");
    var code = statement();
    if (symKind == symElse) {
        nextSym();
        genCode("} else {");
        code = statement();
    }
    genCode("}");
}
function whileStatement() {
    var saveBreakLabel = currentBreakLabel;
    var saveContinueLabel = currentContinueLabel;
    var label = getTempLabels(3);
    currentBreakLabel = label + 2;
    currentContinueLabel = label + 1;
    genCode("goto " + getLabel(currentContinueLabel));
    checkSym(symLParen, "(");
    var cmpCode = expression(); // todo: 式の型をチェックしていない…真偽値を得る関数を作ってもいいかも
    var tempCode = popTempCode();
    checkSym(symRParen, ")");
    genLabel(label); // ループの戻り
    statement();
    genLabel(label + 1); // continue用ラベル
    pushTempCode(tempCode);
    genCode("if (" + wcsmidstr(cmpCode, 3) + ") goto " + getLabel(label));
    genLabel(label + 2); // break用ラベル
    currentBreakLabel = saveBreakLabel;
    currentContinueLabel = saveContinueLabel;
}
function doStatement() {
    var saveBreakLabel = currentBreakLabel;
    var saveContinueLabel = currentContinueLabel;
    var label = getTempLabels(3);
    currentBreakLabel = label + 2;
    currentContinueLabel = label + 1;
    genLabel(label); // ループの戻り
    statement();
    genLabel(label + 1); // continue用ラベル
    checkSym(symWhile, "while");
    checkSym(symLParen, "(");
    var cmpCode = expression(); // todo: 式の型をチェックしていない…真偽値を得る関数を作ってもいいかも
    checkSym(symRParen, ")");
    genCode("if (" + wcsmidstr(cmpCode, 3) + ") goto " + getLabel(label));
    genLabel(label + 2); // break用ラベル
    currentBreakLabel = saveBreakLabel;
    currentContinueLabel = saveContinueLabel;
}
function returnStatement() {
    if (symKind == symSemicolon) {
        if (currentFuncType != "v")
            syntaxError("returnの後に式が必要です");
        genCode("return;");
    }
    else {
        var code = expression();
        genCode("return " + wcsmidstr(code, 3) + ";");
    }
    return;
}
function breakStatement() {
    if (validLabel(currentBreakLabel)) {
        genCode("goto " + getLabel(currentBreakLabel));
    }
    else {
        syntaxError("breakできません");
    }
    return;
}
function continueStatement() {
    if (validLabel(currentContinueLabel)) {
        genCode("goto " + getLabel(currentContinueLabel));
    }
    else {
        syntaxError("continueできません");
    }
    return;
}
statement = function () {
    if (symKind == symVar) {
        nextSym();
        varStatement();
    }
    else if (symKind == symIdent) {
        assignmentExpression();
    }
    else if (symKind == symFunction) {
        nextSym();
        defFunction("");
    }
    else if (symKind == symIf) {
        nextSym();
        ifStatement();
    }
    else if (symKind == symWhile) {
        nextSym();
        whileStatement();
    }
    else if (symKind == symDo) {
        nextSym();
        doStatement();
    }
    else if (symKind == symReturn) {
        nextSym();
        returnStatement();
    }
    else if (symKind == symBreak) {
        nextSym();
        breakStatement();
    }
    else if (symKind == symContinue) {
        nextSym();
        continueStatement();
    }
    else if (symKind == symLCurlyBrace) {
        nextSym();
        // genCode(" { ");              // todo 試験的に削除中 2017/06/18
        statementList(symRCurlyBrace);
        // genCode(" } ");              // todo 試験的に削除中 2017/06/18
        nextSym();
    }
    else {
        syntaxError("予期しない文です");
    }
    if (symKind == symSemicolon)
        nextSym();
};
var outBuffer = "";
function compile(src) {
    initCompiler(src);
    statementList(symEOF);
    insert('// compileAndExecute::Done\n');
    return outBuffer;
}
if (version() > 0) {
    selectall();
    var sx = gettext(seltopx(), seltopy(), selendx(), selendy());
    var filebase = basename();
    if (filebase == "") {
        message("まずセーブして下さい");
        endmacro();
    }
    var pos = wcsstrrstr(filebase, ".");
    filebase = wcsleftstr(filebase, pos) + ".mac";
    var filename = macrodir() + "\\" + filebase;
    var winno = findhidemaru(filename);
    if (winno == -1) {
        openfile(filename);
    }
    else {
        setactivehidemaru(winno);
    }
    selectall();
    insert("コンパイル中…しばらくお待ち下さい");
    selectall();
    disabledraw();
    selectall();
    _delete();
    var t1 = tickcount();
    compile(sx);
    var t2 = tickcount();
    insert("// t1 : " + str(t1) + "  t2 : " + str(t2) + "  diff = " + str(t2 - t1) + "\n");
    enabledraw();
}
//EOF  これ以降は TypeScript + Node.js のコードが自由に書ける
var path = require('path');
var fs = require('fs');
var argv = process.argv;
var srcfile = argv[2]; // ソースファイル名
var ext = path.extname(srcfile);
var fname = path.basename(srcfile, ext);
var outfile = path.format({ dir: macrodir(), name: fname, ext: ".mac" }); // 出力ファイルの組み立て
try {
    var src = fs.readFileSync(srcfile, 'utf8');
    var label = 'compile-time';
    console.time(label);
    var out = compile(src);
    console.timeEnd(label);
    // String.fromCharCode(0xFEFF) はBOM
    fs.writeFileSync(outfile, String.fromCharCode(0xFEFF) + out, 'utf8');
}
catch (err) {
    message(err.message);
}
process.exit(0);
function macrodir() {
    var hidemacrodir = process.env.hidemacrodir; // 秀丸マクロのディレクトリを環境変数から受け取る
    if (typeof hidemacrodir === "undefined") {
        hidemacrodir = "."; // 環境変数が未定義の場合はカレントディレクトリに出力する
    }
    return hidemacrodir;
}
function message(msg) {
    insert(msg + "\n");
}
function wcsmidstr(s, n1, n2) {
    if (n2 === void 0) { n2 = 327670000; }
    return s.substr(n1, n2);
}
function wcsleftstr(s, n1) {
    return s.substr(0, 1);
}
function endmacro() {
    process.exit(1);
}
function str(n) {
    return n.toString();
}
function val(s) {
    return parseInt(s, 10);
}
function wcslen(s) {
    return s.length;
}
function insert(s) {
    outBuffer = outBuffer + s;
    // console.log(s.replace(/\r?\n/g, ""));
}
function wcsstrrstr(a, b) {
    return 0;
} // dummy 実装した方がよい
function version() {
    return 0;
}
function gettext(x1, y1, x2, y2) {
    return "";
} // dummy
function selectall() {
} // dummy
function seltopx() {
    return 0;
} // dummy
function seltopy() {
    return 0;
} // dummy
function selendx() {
    return 0;
} // dummy
function selendy() {
    return 0;
} // dummy
function basename() {
    return "";
} // dummy
function findhidemaru(filename) {
    return 0;
} // dummy
function openfile(filename) {
} // dummy
function setactivehidemaru(winno) {
} // dummy
function _delete() {
} // dummy
function disabledraw() {
} // dummy
function enabledraw() {
} // dummy
function tickcount() {
    return 0;
} // dummy
//# sourceMappingURL=hidescript.js.map