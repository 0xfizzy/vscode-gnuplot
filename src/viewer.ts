import * as vscode from 'vscode';
import * as path from 'path';

export class PreviewPanel {
	public static readonly viewType = 'Gnuplot Preview';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _jsdir: string;
	private _disposables: vscode.Disposable[];

	public update(content: string) {
		this._panel.webview.html = content.replace(/EXTGPJS/g,this._jsdir);
		this._panel.reveal(vscode.ViewColumn.Two, true);
	}

	private _createPanel (extensionPath: string) {
		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
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
		return panel;
	}

	private _dispose() {
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	constructor(extensionPath: string, disposables: vscode.Disposable[]) {
		this._panel = this._createPanel(extensionPath);
		this._jsdir = this._panel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'gnuplotjs'))).toString();
		this._disposables = disposables;

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this._dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}
}
