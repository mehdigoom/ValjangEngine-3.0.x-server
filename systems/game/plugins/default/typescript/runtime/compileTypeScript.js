"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function compileTypeScript(sourceFileNames, sourceFiles, libSource, compilerOptions = {}) {
    if (compilerOptions.target == null)
        compilerOptions.target = ts.ScriptTarget.ES5;
    let script = "";
    const files = [];
    const sourceMaps = {};
    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost = {
        getSourceFile: (filename, languageVersion) => {
            if (sourceFiles[filename] != null)
                return ts.createSourceFile(filename, sourceFiles[filename], compilerOptions.target);
            if (filename === "lib.d.ts")
                return ts.createSourceFile(filename, libSource, compilerOptions.target);
            return null;
        },
        readFile: (path, encoding) => {
            if (path === "lib.d.ts")
                return libSource;
            else
                return sourceFiles[path];
        },
        writeFile: (name, text, writeByteOrderMark) => {
            if (name.slice(name.length - 4) === ".map") {
                name = name.slice(0, name.length - 7);
                const sourceMap = JSON.parse(text);
                sourceMap.sourcesContent = [sourceFiles[`${name}.ts`]];
                sourceMaps[name] = sourceMap;
            }
            else {
                const filePath = name.slice(0, name.length - 3);
                const fileName = filePath.slice(filePath.lastIndexOf("/") + 1);
                const sourceMapText = "//" + `# sourceMappingURL=${fileName}.js.map`;
                const sourceMapEmpty = new Array(sourceMapText.length).join(" ");
                text = text.replace(sourceMapText, sourceMapEmpty);
                files.push({ name: filePath, text });
                script += `\n${text}`;
            }
        },
        fileExists: (path) => { return path === "lib.d.ts" || sourceFiles[path] != null; },
        getDefaultLibFileName: () => "lib.d.ts",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => "",
        getNewLine: () => "\n"
    };
    // Create a program from inputs
    const program = ts.createProgram(sourceFileNames, compilerOptions, compilerHost);
    // Query for earyly errors
    let errors = ts.getPreEmitDiagnostics(program);
    if (errors.length > 0) {
        return {
            errors: errors.map((e) => {
                return {
                    file: e.file != null ? e.file.fileName : "internal",
                    position: e.file != null ? e.file.getLineAndCharacterOfPosition(e.start) : { line: 0, character: 0 },
                    length: e.length,
                    message: ts.flattenDiagnosticMessageText(e.messageText, "\n")
                };
            }),
            program, typeChecker: null, script, sourceMaps, files
        };
    }
    // Type check and get semantic errors
    let typeChecker;
    typeChecker = program.getTypeChecker();
    // Generate output
    errors = program.emit().diagnostics;
    return {
        errors: errors.map((e) => {
            return {
                file: e.file.fileName,
                position: e.file.getLineAndCharacterOfPosition(e.start),
                length: e.length,
                message: ts.flattenDiagnosticMessageText(e.messageText, "\n")
            };
        }),
        program, typeChecker, script, sourceMaps, files
    };
}
exports.default = compileTypeScript;
