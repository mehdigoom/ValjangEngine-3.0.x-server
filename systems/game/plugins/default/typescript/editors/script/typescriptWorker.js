"use strict";
/// <reference path="../../../../../../../SupClient/typings/fuzzy.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const fuzzy = require("fuzzy");
let scripts;
let compilerOptions = { target: ts.ScriptTarget.ES5 };
let host = {
    getScriptFileNames: () => scripts.fileNames,
    getScriptVersion: (fileName) => scripts.files[fileName].version,
    getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(scripts.files[fileName].text),
    getCurrentDirectory: () => "",
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: () => "lib.d.ts"
};
let service;
onmessage = (event) => {
    if (event.data.type !== "setup" && service == null)
        return;
    switch (event.data.type) {
        case "setup":
            scripts = { fileNames: event.data.fileNames, files: event.data.files };
            service = ts.createLanguageService(host, ts.createDocumentRegistry());
            break;
        case "updateFile":
            let script = scripts.files[event.data.fileName];
            script.text = event.data.text;
            script.version = event.data.version;
            break;
        case "addFile":
            scripts.fileNames.splice(event.data.index, 0, event.data.fileName);
            scripts.files[event.data.fileName] = event.data.file;
            break;
        case "removeFile":
            scripts.fileNames.splice(scripts.fileNames.indexOf(event.data.fileName), 1);
            delete scripts.files[event.data.fileName];
            break;
        case "checkForErrors":
            let tsErrors;
            try {
                tsErrors = ts.getPreEmitDiagnostics(service.getProgram());
            }
            catch (e) {
                postMessage({ type: "errors", errors: [{ file: "", position: { line: 0, character: 1 }, length: 0, message: e.message }] });
                return;
            }
            const errors = tsErrors.map((e) => {
                return {
                    file: e.file.fileName, length: e.length,
                    message: ts.flattenDiagnosticMessageText(e.messageText, "\n"),
                    position: e.file.getLineAndCharacterOfPosition(e.start)
                };
            });
            postMessage({ type: "errors", errors });
            break;
        case "getCompletionAt":
            const list = [];
            if (event.data.tokenString !== "" && event.data.tokenString !== ";") {
                const completions = service.getCompletionsAtPosition(event.data.name, event.data.start);
                if (completions != null) {
                    const rawList = [];
                    for (const completion of completions.entries)
                        rawList.push(completion.name);
                    rawList.sort();
                    event.data.tokenString = (event.data.tokenString !== ".") ? event.data.tokenString : "";
                    const results = fuzzy.filter(event.data.tokenString, rawList);
                    let exactStartIndex = 0;
                    for (let index = 0; index < results.length; index++) {
                        const result = results[index];
                        const text = result.original;
                        if (text.slice(0, event.data.tokenString.length) === event.data.tokenString) {
                            results.splice(index, 1);
                            results.splice(exactStartIndex, 0, result);
                            exactStartIndex++;
                        }
                    }
                    for (const result of results) {
                        const details = service.getCompletionEntryDetails(event.data.name, event.data.start, result.original);
                        const kind = details.kind;
                        let info = "";
                        if (["class", "module", "namespace", "interface", "keyword"].indexOf(kind) === -1)
                            info = ts.displayPartsToString(details.displayParts);
                        list.push({ text: result.original, kind, name: details.name, info });
                    }
                }
            }
            postMessage({ type: "completion", list });
            break;
        case "getQuickInfoAt":
            const info = service.getQuickInfoAtPosition(event.data.name, event.data.start);
            if (info != null)
                postMessage({ type: "quickInfo", text: ts.displayPartsToString(info.displayParts) });
            break;
        case "getParameterHintAt":
            let texts;
            let selectedItemIndex;
            let selectedArgumentIndex;
            const help = service.getSignatureHelpItems(event.data.name, event.data.start);
            if (help != null) {
                texts = [];
                selectedItemIndex = help.selectedItemIndex;
                selectedArgumentIndex = help.argumentIndex;
                for (const item of help.items) {
                    const prefix = ts.displayPartsToString(item.prefixDisplayParts);
                    const parameters = item.parameters.map((parameter) => ts.displayPartsToString(parameter.displayParts));
                    const suffix = ts.displayPartsToString(item.suffixDisplayParts);
                    texts.push({ prefix, parameters, suffix });
                }
            }
            postMessage({ type: "parameterHint", texts, selectedItemIndex, selectedArgumentIndex });
            break;
        case "getDefinitionAt":
            const definitions = service.getDefinitionAtPosition(event.data.name, event.data.start);
            if (definitions == null)
                return;
            const definition = definitions[0];
            if (definition.fileName === "lib.d.ts") {
                // TODO: open the API browser at the proper page
            }
            else {
                const file = scripts.files[definition.fileName].text;
                const textParts = file.split("\n");
                let line = 0;
                let position = 0;
                while (position + textParts[line].length <= definition.textSpan.start) {
                    position += textParts[line].length + 1;
                    line += 1;
                }
                const fileName = definition.fileName.slice(0, definition.fileName.length - 3);
                postMessage({ type: "definition", fileName, line, ch: definition.textSpan.start - position });
            }
            break;
        default:
            throw new Error(`Unexpected message type: ${event.data.type}`);
    }
};
