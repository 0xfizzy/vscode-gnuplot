import * as vscode from 'vscode';
import * as cp from 'child_process'
import {Extension} from './extension'

export class Builder {

    private _extension: Extension;
    private _diagnosticCollection: vscode.DiagnosticCollection;
    private _content: string = 'No output now';

    public getContent() {
        return this._content;
    }

    public buildFig(document: vscode.TextDocument) {
        let figBuilder = cp.spawnSync('gnuplot',['-e',this._setTerm(),document.uri.fsPath]);

        vscode.window.showInformationMessage('123');

        switch (figBuilder.status) {
            case 0    : this._content =  figBuilder.stdout.toString();  break;
            case null : vscode.window.showInformationMessage("Too Big");   break;
            default   : break;
        }
        
        this._extension.logger.addLogMessage(figBuilder.stderr.toString());
        this._updateDiagnostic(document, figBuilder.stderr.toString())

    }

    private _setTerm() {
        let jsdir = this._extension.viewer.jsdir;
        return `set terminal canvas name 'gp' standalone mousing jsdir '${jsdir}' `
    }

    private _updateDiagnostic(document: vscode.TextDocument, stderr: string) {
        this._diagnosticCollection.clear();
        this._diagnosticCollection.set(document.uri, this._errorParser(stderr));
    }
    
    //
    private _errorParser(stderr: string) {
        if (stderr == '') {
            return []
        }

        const lineRegExp:    RegExp = /(?<=line )[0-9]+/;
        const messageRegExp: RegExp = /(?<=[0-9]: ).*/;

        let errLines = stderr.split('\n');

        let length  = errLines[1].length;
        let start   = errLines[2].length -1;
        let line    = Number(lineRegExp.exec(errLines[3])?.toString())  ?? 1;
        let message = messageRegExp.exec(errLines[3])?.toString() ?? 'Parse Failed, Check Output/Gnuplot';

        return [{
			message: message,
			range: new vscode.Range(new vscode.Position(line-1, start-1), new vscode.Position(line-1, length-1)),
			severity: vscode.DiagnosticSeverity.Error,
			source: 'Gnuplot',
		}]
    }

    public constructor(extension: Extension) {
        this._extension = extension;
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('Gnuplot');
    }

}