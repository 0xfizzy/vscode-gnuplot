import * as vscode from 'vscode';
import {Extension} from './extension'

export class Watcher implements vscode.Disposable { 
    private _extension: Extension;
    private _watchedFiles: { [file: string]: { lastChange: number; preview: string } } ={};
    private _watcherEvent: vscode.Disposable | undefined;

    private  _config: vscode.WorkspaceConfiguration | undefined;
    private _changeDelay: number = 1000;
    private _changeTimeout: number = 5000;

    public dispose() {
        this._watchedFiles = {};
        this._watcherEvent?.dispose();
        this._watcherEvent = undefined;
    }

    public readConfig() {
        this._config = vscode.workspace.getConfiguration('gnuplot.watcher');
        this._changeDelay = this._config.get('delay') as number;
        this._changeTimeout = this._config.get('timeout') as number;
    }

    public startWatching() {
        this.readConfig();
        if (!this._watcherEvent) {
            this._watcherEvent = vscode.workspace.onDidChangeTextDocument(
                (e: vscode.TextDocumentChangeEvent) => {this.onFileChange(e.document)}
            )	
        }	
    }

    public onFileChange(document: vscode.TextDocument, waitedDelay?: boolean) {

        if( document.languageId != 'gnuplot')  {
            return;
        }

        if (!(document.uri.fsPath in this._watchedFiles)) {
            this._watchedFiles[document.uri.fsPath] = { lastChange: +new Date(), preview:'' };
        }      
        
        if ( +new Date() - this._watchedFiles[document.uri.fsPath].lastChange < this._changeDelay) {
            if (!waitedDelay) {
                this._watchedFiles[document.uri.fsPath].lastChange = +new Date();
                setTimeout( () => { this.onFileChange(document, true)}, this._changeDelay)
            }
            return
        }
        
        this._watchedFiles[document.uri.fsPath].lastChange = +new Date();

        if (+new Date() - this._watchedFiles[document.uri.fsPath].lastChange > this._changeTimeout) {
            return
        }

        document.save();
        this._extension.builder.buildFig(document);
        this._extension.viewer.update(this._extension.builder.getContent());
    }

    public constructor(extension: Extension) {
        this._extension = extension;
        this.readConfig();
    }
}