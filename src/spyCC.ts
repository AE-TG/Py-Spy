import * as vscode from 'vscode';
import * as spyUI from './spyUI';
import { PythonShell } from 'python-shell'

export function getComplexity(highlight: spyUI.spyDeco, cancel: vscode.CancellationToken) {
    return new vscode.Hover("blablabla", highlight[1]);
}
