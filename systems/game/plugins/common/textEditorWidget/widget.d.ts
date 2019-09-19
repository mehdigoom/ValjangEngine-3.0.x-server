/// <reference path="./operational-transform.d.ts" />
/// <reference types="codemirror" />

interface EditCallback {
  (text: string, origin: string): void;
}
interface SendOperationCallback {
  (operation: OperationData): void;
}

interface TextEditorWidgetOptions {
  extraKeys?: { [name: string]: string|Function };
  editCallback?: EditCallback;
  mode: string;
  sendOperationCallback: SendOperationCallback;
}

declare class TextEditorWidget {
  codeMirrorInstance: CodeMirror.EditorFromTextArea;
  clientId: number;

  constructor(projectClient: SupClient.ProjectClient, clientId: string, textArea: HTMLTextAreaElement, options: TextEditorWidgetOptions);
  setText(text: string): void;
  receiveEditText(operationData: OperationData): void;
  clear(): void;
}
