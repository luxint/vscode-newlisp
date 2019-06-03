"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const newlispCommand = 'newlisp';
const terminalName = 'newLISP REPL';
const windows = os.platform() == 'win32';
const pathSeparator = windows ? ';' : ':';
function newlispExists() {
    return process.env['PATH'].split(pathSeparator)
        .some((x) => fs.existsSync(path.resolve(x, newlispCommand + (windows ? '.exe' : ''))));
}
function newREPL() {
    let terminal = vscode.window.createTerminal(terminalName);
    terminal.sendText(newlispCommand + ' -C', true);
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running newLISP REPL...",
        cancellable: false
    }, (progress, token) => {
        var p = new Promise(resolve => {
            setTimeout(() => {
                terminal.show();
                thenFocusTextEditor();
                resolve();
            }, 2000);
        });
        return p;
    });
    return terminal;
}
function getREPL(show) {
    let terminal = vscode.window.terminals.find(x => x._name === terminalName);
    if (terminal == null) {
        newREPL();
        return null;
    }
    if (show)
        terminal.show();
    return terminal;
}
function prep(input) {
    return '\n' + input +'\n\n';
}

function thenFocusTextEditor() {
    setTimeout(() => vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup'), 250);
}
function activate(context) {
    console.log('Extension "vscode-newlisp" is now active!');
    if (!newlispExists()) {
        vscode.window.showErrorMessage('Can\'t find newLISP language on your computer! Check your PATH variable.');
        return;
    }
    context.subscriptions.push(vscode.commands.registerCommand('newlisp.startREPL', () => {
        getREPL(true);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('newlisp.eval', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor == null)
            return;
        let terminal = getREPL(true);
        if (terminal == null)
            return;
        function send(terminal) {
            terminal.sendText(prep(editor.document.getText(editor.selection)), false);
            thenFocusTextEditor();
        }
        if (editor.selection.isEmpty)
            vscode.commands.executeCommand('editor.action.selectToBracket').then(() => send(terminal));
        else
            send(terminal);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('newlisp.evalFile', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor == null)
            return;
        let terminal = getREPL(true);
        if (terminal == null)
            return;
        terminal.sendText('(load ' + '"' + editor.document.fileName + '")',true)
        thenFocusTextEditor();
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
