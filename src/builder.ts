import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import {Extension} from './extension';

export class Builder {

    private _extension: Extension;
    private _diagnosticCollection: vscode.DiagnosticCollection;

    public buildFig(document: vscode.TextDocument) {
        let figBuilder = cp.spawnSync('gnuplot',['-e',this._setTerm(),document.uri.fsPath],{cwd:path.dirname(document.uri.fsPath)});

        this._updateDiagnostic(document, figBuilder.stderr.toString());

        switch (figBuilder.status) {
            case 0    : return figBuilder.stdout.toString();
            case null : vscode.window.showInformationMessage("Too Big"); return '';
            default   : return '';
        }
    }

    private _setTerm() {
        let jsdir = this._extension.viewer.jsdir;
        return `set terminal canvas name 'gp' standalone mousing jsdir '${jsdir}' `
    }

    private _updateDiagnostic(document: vscode.TextDocument, stderr: string) {
        this._diagnosticCollection.clear();
        this._diagnosticCollection.set(document.uri, this._errorParser(document,stderr));
    }
    
    /**
     * ***Pattern 1***********************
     * 
     * set error
     *     ^
     * "file/path" line 7: invalid option
     * 
     * ***Pattern 2***********************
     * 
     * line 5: undefined variable: xy
     * 
     * ***********************************
     */
    private _errorParser(document: vscode.TextDocument, stderr: string) {
        if (stderr === '') {
            return []
        }

        const lineRegExp:    RegExp = /(?<=line )[0-9]+/;
        const messageRegExp: RegExp = /(?<=[0-9]: ).*/;

        let errLine    = Number(lineRegExp.exec(stderr)?.toString()) -1  ?? 0;
        let errMessage = messageRegExp.exec(stderr)?.toString();
        if(!errMessage) {
            errMessage = 'Check chanel output/gnulplot'
            this._extension.logger.addLogMessage(stderr);
            this._extension.logger.showLog()
        }
        let errStart=0, errEnd=1;
        if (stderr.match(/\^/)) {
            let errLines = stderr.split('\n');
            errEnd  = errLines[1].length;
            errStart   = errLines[2].length -2;
        } 
        else {
            let varstr = stderr.match(/(?<=undefined variable: ).*/);
            if(varstr) {
                errStart = document.lineAt(errLine).text.indexOf(varstr.toString());
                errEnd = errStart + varstr.toString.length;
            }
        }

        let errRange = new vscode.Range(errLine, errStart, errLine, errEnd);

        return [{
			message: errMessage,
            range: errRange,
			severity: vscode.DiagnosticSeverity.Error,
			source: 'Gnuplot',
		}]
    }

    public constructor(extension: Extension) {
        this._extension = extension;
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('Gnuplot');
    }

}