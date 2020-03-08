import * as vscode from 'vscode';
import * as path from 'path';
import {Extension} from './extension';

export class Viewer {
	public readonly viewType = 'Gnuplot Preview';
	public jsdir: string = '';
	
	private _extension: Extension;
	private _panel: vscode.WebviewPanel | undefined ;
	private _disposables: vscode.Disposable[] = [];

	public update(content: string) {
		if(this._panel) {
			this._panel.webview.html = content;
			this._panel.reveal(vscode.ViewColumn.Two, true);
		}
	}

	public createViewr(disposables?: vscode.Disposable[]) {
		if(!this._panel) {
			this._disposables = disposables ?? [];
			this._panel = this._createPanel(this._extension.extensionPath);
		}
	}

	private _createPanel (extensionPath: string) {
		const panel = vscode.window.createWebviewPanel(
			this.viewType,
			'Preview',
			{   
				// Create Panel on the other side
				viewColumn: vscode.ViewColumn.Two,
				// Preserve current focus
				preserveFocus: true				
			},
			{
				// Disable javascript in the webview
				enableScripts: true,
				// previewFile Folder
				localResourceRoots: [vscode.Uri.file(extensionPath)]
			}
		);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		panel.onDidDispose(() => this._dispose(), null, this._disposables);

		this.jsdir = panel.webview.asWebviewUri(vscode.Uri.file(path.join(this._extension.extensionPath, 'gnuplotjs'))).toString();

		return panel;
	}

	private _dispose() {
		this._panel?.dispose();
		this._panel = undefined;
		vscode.window.showInformationMessage('Shutdown');

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	public constructor(extension: Extension) {
		this._extension = extension;		
	}
}
